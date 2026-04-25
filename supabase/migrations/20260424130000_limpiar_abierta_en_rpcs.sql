-- ============================================
-- Limpieza de referencias muertas a 'abierta' en RPCs/triggers vivos
--
-- Tras la consolidación v4.38 (migración 20260424120000) el CHECK de
-- campanas.estado ya no admite 'abierta', pero 5 funciones siguen
-- mencionándolo en cláusulas IN (...) de SELECT/UPDATE. Es dead code
-- inofensivo (el CHECK lo previene) pero genera ruido semántico al
-- leer el código.
--
-- Esta migración re-emite las 5 funciones con CREATE OR REPLACE, idénticas
-- a las vivas hoy salvo la cláusula de filtro:
--   - IN ('abierta', 'activa')        → = 'activa'
--   - IN ('activa', 'abierta')        → = 'activa'
--   - IN ('abierta', 'activa', 'pausada') → IN ('activa', 'pausada')
--
-- Funciones tocadas:
-- 1. asignar_intercambio               (última def: 20260424110000)
-- 2. descontar_costo_crear_campana     (última def: 20260423180000)
-- 3. aplicar_creditos_intercambio      (última def: 20260423180000)
-- 4. cerrar_campanas_vencidas          (última def: 20260422180000)
-- 5. pausar_por_inactividad_calificacion (última def: 20260422200000)
--
-- Sin cambios de lógica de negocio. Los triggers (trg_costo_crear_campana
-- y el pg_cron jobs asociados) no necesitan re-crearse porque referencian
-- las funciones por nombre y CREATE OR REPLACE actualiza el cuerpo sin
-- invalidar los bindings.
-- ============================================


-- ============================================
-- 1. asignar_intercambio
-- ============================================
CREATE OR REPLACE FUNCTION asignar_intercambio(p_comentarista_id UUID)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
  DELETE FROM reservas_intercambio WHERE expires_at < now();

  WITH locked_disponibles AS (
    SELECT c.id AS campana_id
    FROM campanas c
    INNER JOIN videos v ON v.id = c.video_id
    WHERE c.estado = 'activa'
      AND EXISTS (
        SELECT 1 FROM usuarios
        WHERE id = p_comentarista_id AND estado = 'activo'
      )
      AND c.intercambios_completados < 10
      AND v.usuario_id <> p_comentarista_id
      AND NOT EXISTS (
        SELECT 1 FROM intercambios i
        WHERE i.campana_id = c.id AND i.comentarista_id = p_comentarista_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM intercambios i2
        INNER JOIN campanas c2 ON c2.id = i2.campana_id
        WHERE c2.video_id = v.id AND i2.comentarista_id = p_comentarista_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM reservas_intercambio r
        WHERE r.campana_id = c.id AND r.expires_at > now()
      )
      AND EXISTS (
        SELECT 1 FROM videos
        WHERE usuario_id = p_comentarista_id AND estado = 'activo'
      )
      AND (
        SELECT COUNT(*) FROM intercambios
        WHERE comentarista_id = p_comentarista_id AND estado = 'pendiente'
      ) < 3
      AND NOT EXISTS (
        SELECT 1 FROM reservas_intercambio
        WHERE comentarista_id = p_comentarista_id AND expires_at > now()
      )
    ORDER BY c.created_at ASC
    LIMIT 2
    FOR UPDATE OF c SKIP LOCKED
  )
  INSERT INTO reservas_intercambio (campana_id, comentarista_id, expires_at)
  SELECT campana_id, p_comentarista_id, now() + interval '2 minutes'
  FROM locked_disponibles;

  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = p_comentarista_id AND estado = 'activo'
    ) THEN
      json_build_object(
        'ok', false,
        'error', 'USUARIO_NO_ACTIVO',
        'mensaje', 'Tu cuenta no está activa.'
      )
    WHEN NOT EXISTS (
      SELECT 1 FROM videos
      WHERE usuario_id = p_comentarista_id AND estado = 'activo'
    ) THEN
      json_build_object(
        'ok', false,
        'error', 'USUARIO_SIN_VIDEO_ACTIVO',
        'mensaje', 'Debes registrar al menos un video activo antes de participar en intercambios.'
      )
    WHEN (
      SELECT COUNT(*) FROM intercambios
      WHERE comentarista_id = p_comentarista_id AND estado = 'pendiente'
    ) >= 3 THEN
      json_build_object(
        'ok', false,
        'error', 'LIMITE_PENDIENTES_ALCANZADO',
        'mensaje', 'Tienes 3 intercambios pendientes. Espera a que se resuelva al menos uno.'
      )
    WHEN NOT EXISTS (
      SELECT 1 FROM reservas_intercambio
      WHERE comentarista_id = p_comentarista_id AND expires_at > now()
    ) THEN
      json_build_object(
        'ok', false,
        'error', 'COLA_VACIA',
        'mensaje', 'No hay videos disponibles en la cola en este momento.'
      )
    ELSE
      json_build_object(
        'ok', true,
        'videos', (
          SELECT json_agg(
            json_build_object(
              'reserva_id', r.id,
              'campana_id', r.campana_id,
              'video_id', v.id,
              'youtube_video_id', v.youtube_video_id,
              'titulo', v.titulo,
              'descripcion', v.descripcion,
              'tipo_intercambio', v.tipo_intercambio,
              'tono', v.tono,
              'duracion_segundos', v.duracion_segundos,
              'vistas', v.vistas,
              'expires_at', r.expires_at,
              'creador', json_build_object(
                'nombre', u.nombre,
                'avatar_url', u.avatar_url,
                'canal_url', u.canal_url
              )
            )
            ORDER BY r.created_at ASC
          )
          FROM reservas_intercambio r
          INNER JOIN campanas c ON c.id = r.campana_id
          INNER JOIN videos v ON v.id = c.video_id
          INNER JOIN usuarios u ON u.id = v.usuario_id
          WHERE r.comentarista_id = p_comentarista_id
            AND r.expires_at > now()
        )
      )
  END;
$fn$;

GRANT EXECUTE ON FUNCTION asignar_intercambio(UUID) TO authenticated;


-- ============================================
-- 2. descontar_costo_crear_campana (trigger trg_costo_crear_campana)
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
  SELECT usuario_id
  INTO v_usuario_id
  FROM videos
  WHERE id = NEW.video_id;

  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'costo_campana_creditos'),
    30
  ) INTO v_costo;

  SELECT saldo_creditos
  INTO v_saldo
  FROM usuarios
  WHERE id = v_usuario_id;

  IF v_saldo < v_costo THEN
    RAISE EXCEPTION 'Créditos insuficientes para abrir campaña: necesitas % créditos, tenés %.', v_costo, v_saldo;
  END IF;

  UPDATE usuarios
  SET saldo_creditos = saldo_creditos - v_costo
  WHERE id = v_usuario_id
  RETURNING saldo_creditos INTO v_saldo_despues;

  INSERT INTO movimientos_creditos (
    usuario_id, monto, saldo_anterior, saldo_nuevo, origen, motivo, admin_id
  ) VALUES (
    v_usuario_id, -v_costo, v_saldo, v_saldo_despues, 'crear_campana', NULL, NULL
  );

  IF v_saldo_despues = 0 THEN
    NEW.estado := 'pausada';

    UPDATE campanas c
    SET estado = 'pausada'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = v_usuario_id
      AND c.estado = 'activa';
  END IF;

  RETURN NEW;
END;
$$;


-- ============================================
-- 3. aplicar_creditos_intercambio
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
  SELECT saldo_creditos
  INTO v_saldo_comentarista_antes
  FROM usuarios
  WHERE id = p_comentarista_id;

  UPDATE usuarios
  SET saldo_creditos = saldo_creditos + 1
  WHERE id = p_comentarista_id
  RETURNING saldo_creditos INTO v_saldo_comentarista_nuevo;

  INSERT INTO movimientos_creditos (
    usuario_id, monto, saldo_anterior, saldo_nuevo, origen, motivo, admin_id
  ) VALUES (
    p_comentarista_id, 1, v_saldo_comentarista_antes, v_saldo_comentarista_nuevo,
    'comentar', NULL, NULL
  );

  IF v_saldo_comentarista_antes = 0 THEN
    UPDATE campanas c
    SET estado = 'activa'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = p_comentarista_id
      AND c.estado = 'pausada';
  END IF;

  SELECT saldo_creditos
  INTO v_saldo_creador_antes
  FROM usuarios
  WHERE id = p_creador_id;

  UPDATE usuarios
  SET saldo_creditos = GREATEST(saldo_creditos - 1, 0)
  WHERE id = p_creador_id
  RETURNING saldo_creditos INTO v_saldo_creador;

  IF v_saldo_creador <> v_saldo_creador_antes THEN
    INSERT INTO movimientos_creditos (
      usuario_id, monto, saldo_anterior, saldo_nuevo, origen, motivo, admin_id
    ) VALUES (
      p_creador_id, v_saldo_creador - v_saldo_creador_antes,
      v_saldo_creador_antes, v_saldo_creador, 'comentar', NULL, NULL
    );
  END IF;

  IF v_saldo_creador = 0 THEN
    UPDATE campanas c
    SET estado = 'pausada'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = p_creador_id
      AND c.estado = 'activa';
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
-- 4. cerrar_campanas_vencidas
-- ============================================
CREATE OR REPLACE FUNCTION cerrar_campanas_vencidas()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cerradas INTEGER;
BEGIN
  WITH actualizadas AS (
    UPDATE campanas
    SET estado = 'finalizada',
        closed_at = now()
    WHERE expires_at IS NOT NULL
      AND expires_at <= now()
      AND estado IN ('activa', 'pausada')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_cerradas FROM actualizadas;

  RETURN json_build_object(
    'ok', true,
    'cerradas', v_cerradas
  );
END;
$$;


-- ============================================
-- 5. pausar_por_inactividad_calificacion
-- ============================================
CREATE OR REPLACE FUNCTION pausar_por_inactividad_calificacion()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_sin_calificar INTEGER;
  v_horas_limite INTEGER;
  v_usuarios_afectados INTEGER;
  v_campanas_pausadas INTEGER;
BEGIN
  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'max_sin_calificar'),
    3
  ) INTO v_max_sin_calificar;

  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'horas_limite_calificacion'),
    72
  ) INTO v_horas_limite;

  WITH creadores_morosos AS (
    SELECT v.usuario_id
    FROM intercambios i
    INNER JOIN campanas c ON c.id = i.campana_id
    INNER JOIN videos v ON v.id = c.video_id
    WHERE i.estado = 'verificado'
      AND i.estrellas IS NULL
      AND i.timestamp_copia <= now() - make_interval(hours => v_horas_limite)
    GROUP BY v.usuario_id
    HAVING COUNT(*) >= v_max_sin_calificar
  ),
  pausadas AS (
    UPDATE campanas c
    SET estado = 'pausada'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id IN (SELECT usuario_id FROM creadores_morosos)
      AND c.estado = 'activa'
    RETURNING c.id
  )
  SELECT
    (SELECT COUNT(*) FROM creadores_morosos),
    (SELECT COUNT(*) FROM pausadas)
  INTO v_usuarios_afectados, v_campanas_pausadas;

  RETURN json_build_object(
    'ok', true,
    'usuarios_afectados', v_usuarios_afectados,
    'campanas_pausadas', v_campanas_pausadas
  );
END;
$$;
