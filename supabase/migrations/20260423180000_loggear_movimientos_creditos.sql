-- ============================================
-- Loggear movimientos de créditos en los 4 orígenes automáticos
--
-- Hasta ahora movimientos_creditos (migración 20260422240000) solo se
-- populaba desde ajustar_creditos_admin con origen='ajuste_admin'. Los
-- otros 4 origins del CHECK ('bienvenida', 'crear_campana', 'comentar',
-- 'calificar') quedaban sin audit trail.
--
-- Esta migración re-crea las 4 funciones correspondientes agregando
-- INSERT INTO movimientos_creditos en cada cambio de saldo_creditos.
-- No hay cambios de lógica de negocio — solo auditoría.
--
-- Convenciones:
--   - motivo = NULL para los 4 origins automáticos (el origen ya clasifica)
--   - admin_id = NULL (ninguno de estos es iniciado por un admin)
--   - Guarda IF delta <> 0 en el movimiento del creador dentro de
--     aplicar_creditos_intercambio para no loggear no-ops cuando el
--     piso 0 del GREATEST impide el descuento.
-- ============================================


-- ============================================
-- 1. otorgar_creditos_bienvenida (trigger trg_creditos_bienvenida)
--    Base: 20260422150000_trigger_creditos_bienvenida.sql
-- ============================================
CREATE OR REPLACE FUNCTION otorgar_creditos_bienvenida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creditos INTEGER;
BEGIN
  -- Defensivo: si ya tiene saldo (p.ej. por un seed), no sobrescribir.
  IF NEW.saldo_creditos <> 0 THEN
    RETURN NEW;
  END IF;

  -- Leer valor de configuracion; fallback 60 si no existe.
  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'creditos_bienvenida'),
    60
  ) INTO v_creditos;

  UPDATE usuarios
  SET saldo_creditos = v_creditos
  WHERE id = NEW.id;

  -- Log del movimiento. saldo_anterior = 0 (garantizado por el guard).
  INSERT INTO movimientos_creditos (
    usuario_id, monto, saldo_anterior, saldo_nuevo, origen, motivo, admin_id
  ) VALUES (
    NEW.id, v_creditos, 0, v_creditos, 'bienvenida', NULL, NULL
  );

  RETURN NEW;
END;
$$;


-- ============================================
-- 2. descontar_costo_crear_campana (trigger trg_costo_crear_campana)
--    Base: 20260422160000_costo_crear_campana.sql
-- ============================================
CREATE OR REPLACE FUNCTION descontar_costo_crear_campana()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id UUID;
  v_saldo INTEGER;
  v_costo INTEGER;
  v_saldo_despues INTEGER;
BEGIN
  -- Resolver dueño del video de la campaña
  SELECT usuario_id
  INTO v_usuario_id
  FROM videos
  WHERE id = NEW.video_id;

  -- Leer costo de configuracion; fallback 30 si no existe.
  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'costo_campana_creditos'),
    30
  ) INTO v_costo;

  -- Leer saldo actual del usuario
  SELECT saldo_creditos
  INTO v_saldo
  FROM usuarios
  WHERE id = v_usuario_id;

  IF v_saldo < v_costo THEN
    RAISE EXCEPTION 'Créditos insuficientes para abrir campaña: necesitas % créditos, tenés %.', v_costo, v_saldo;
  END IF;

  -- Descontar y capturar saldo resultante
  UPDATE usuarios
  SET saldo_creditos = saldo_creditos - v_costo
  WHERE id = v_usuario_id
  RETURNING saldo_creditos INTO v_saldo_despues;

  -- Log del movimiento (monto negativo)
  INSERT INTO movimientos_creditos (
    usuario_id, monto, saldo_anterior, saldo_nuevo, origen, motivo, admin_id
  ) VALUES (
    v_usuario_id, -v_costo, v_saldo, v_saldo_despues, 'crear_campana', NULL, NULL
  );

  -- Si saldo queda en 0 → pausar campañas previas + la recién creada.
  IF v_saldo_despues = 0 THEN
    NEW.estado := 'pausada';

    UPDATE campanas c
    SET estado = 'pausada'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = v_usuario_id
      AND c.estado IN ('activa', 'abierta');
  END IF;

  RETURN NEW;
END;
$$;


-- ============================================
-- 3. aplicar_creditos_intercambio
--    Base: 20260422140000_remover_techo_creditos.sql
--    Cambios: captura v_saldo_comentarista_nuevo via RETURNING; lee
--    v_saldo_creador_antes antes del UPDATE. Dos INSERTs en
--    movimientos_creditos (uno por lado); el del creador guardado tras
--    IF delta <> 0 para evitar loggear no-ops del piso GREATEST.
-- ============================================
CREATE OR REPLACE FUNCTION aplicar_creditos_intercambio(
  p_comentarista_id UUID,
  p_creador_id UUID,
  p_campana_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_saldo_comentarista_antes INTEGER;
  v_saldo_comentarista_nuevo INTEGER;
  v_saldo_creador_antes INTEGER;
  v_saldo_creador INTEGER;
BEGIN
  -- Leer saldo del comentarista ANTES de sumar
  SELECT saldo_creditos
  INTO v_saldo_comentarista_antes
  FROM usuarios
  WHERE id = p_comentarista_id;

  -- Sumar 1 al comentarista (sin techo — modelo v2)
  UPDATE usuarios
  SET saldo_creditos = saldo_creditos + 1
  WHERE id = p_comentarista_id
  RETURNING saldo_creditos INTO v_saldo_comentarista_nuevo;

  -- Log del movimiento del comentarista
  INSERT INTO movimientos_creditos (
    usuario_id, monto, saldo_anterior, saldo_nuevo, origen, motivo, admin_id
  ) VALUES (
    p_comentarista_id, 1, v_saldo_comentarista_antes, v_saldo_comentarista_nuevo,
    'comentar', NULL, NULL
  );

  -- Si el comentarista estaba en 0 → reactivar sus campañas pausadas
  IF v_saldo_comentarista_antes = 0 THEN
    UPDATE campanas c
    SET estado = 'activa'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = p_comentarista_id
      AND c.estado = 'pausada';
  END IF;

  -- Leer saldo del creador ANTES de restar
  SELECT saldo_creditos
  INTO v_saldo_creador_antes
  FROM usuarios
  WHERE id = p_creador_id;

  -- Restar 1 al creador (piso 0)
  UPDATE usuarios
  SET saldo_creditos = GREATEST(saldo_creditos - 1, 0)
  WHERE id = p_creador_id
  RETURNING saldo_creditos INTO v_saldo_creador;

  -- Log del movimiento del creador solo si hubo cambio real (el piso 0
  -- del GREATEST puede convertir la resta en no-op si ya estaba en 0).
  IF v_saldo_creador <> v_saldo_creador_antes THEN
    INSERT INTO movimientos_creditos (
      usuario_id, monto, saldo_anterior, saldo_nuevo, origen, motivo, admin_id
    ) VALUES (
      p_creador_id, v_saldo_creador - v_saldo_creador_antes,
      v_saldo_creador_antes, v_saldo_creador, 'comentar', NULL, NULL
    );
  END IF;

  -- Si creador llegó a 0 → pausar todas sus campañas activas/abiertas
  IF v_saldo_creador = 0 THEN
    UPDATE campanas c
    SET estado = 'pausada'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = p_creador_id
      AND c.estado IN ('activa', 'abierta');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'saldo_creador', v_saldo_creador,
    'campana_pausada', v_saldo_creador = 0,
    'campana_reactivada', v_saldo_comentarista_antes = 0
  );
END;
$$;


-- ============================================
-- 4. aplicar_credito_calificacion
--    Base: 20260422210000_reactivar_por_calificacion.sql
-- ============================================
CREATE OR REPLACE FUNCTION aplicar_credito_calificacion(
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo_antes INTEGER;
  v_creditos INTEGER;
  v_saldo_nuevo INTEGER;
  v_max_sin_calificar INTEGER;
  v_horas_limite INTEGER;
  v_unrated_viejos INTEGER;
  v_reactivada_por_saldo BOOLEAN := false;
  v_reactivada_por_calificacion BOOLEAN := false;
BEGIN
  -- Leer creditos_por_calificar (fallback 1)
  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'creditos_por_calificar'),
    1
  ) INTO v_creditos;

  -- Saldo antes de sumar
  SELECT saldo_creditos
  INTO v_saldo_antes
  FROM usuarios
  WHERE id = p_usuario_id;

  -- Sumar crédito
  UPDATE usuarios
  SET saldo_creditos = saldo_creditos + v_creditos
  WHERE id = p_usuario_id
  RETURNING saldo_creditos INTO v_saldo_nuevo;

  -- Log del movimiento
  INSERT INTO movimientos_creditos (
    usuario_id, monto, saldo_anterior, saldo_nuevo, origen, motivo, admin_id
  ) VALUES (
    p_usuario_id, v_creditos, v_saldo_antes, v_saldo_nuevo, 'calificar', NULL, NULL
  );

  -- Vía 1: reactivación por saldo (si venía de 0)
  IF v_saldo_antes = 0 THEN
    UPDATE campanas c
    SET estado = 'activa'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = p_usuario_id
      AND c.estado = 'pausada';
    v_reactivada_por_saldo := true;
  END IF;

  -- Vía 2: reactivación por calificación. Contamos los viejos (> horas_limite)
  -- para alinear con el criterio del cron de pausa.
  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'max_sin_calificar'),
    3
  ) INTO v_max_sin_calificar;

  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'horas_limite_calificacion'),
    72
  ) INTO v_horas_limite;

  SELECT COUNT(*)
  INTO v_unrated_viejos
  FROM intercambios i
  INNER JOIN campanas c ON c.id = i.campana_id
  INNER JOIN videos v ON v.id = c.video_id
  WHERE v.usuario_id = p_usuario_id
    AND i.estado = 'verificado'
    AND i.estrellas IS NULL
    AND i.timestamp_copia <= now() - make_interval(hours => v_horas_limite);

  IF v_unrated_viejos < v_max_sin_calificar THEN
    UPDATE campanas c
    SET estado = 'activa'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = p_usuario_id
      AND c.estado = 'pausada';
    v_reactivada_por_calificacion := true;
  END IF;

  RETURN json_build_object(
    'ok', true,
    'saldo_nuevo', v_saldo_nuevo,
    'campana_reactivada', v_reactivada_por_saldo OR v_reactivada_por_calificacion,
    'reactivada_por_saldo', v_reactivada_por_saldo,
    'reactivada_por_calificacion', v_reactivada_por_calificacion
  );
END;
$$;
