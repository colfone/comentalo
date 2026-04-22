-- ============================================
-- Costo de crear campaña (modelo v2, PROYECTO.md v4.7)
-- Trigger BEFORE INSERT ON campanas que descuenta costo_campana_creditos
-- al dueño del video. Lee el costo de configuracion; fallback 30.
-- Si el usuario no tiene saldo suficiente → aborta el INSERT con EXCEPTION.
-- Si el saldo post-descuento queda en 0 → pausa la campaña recién creada
-- y todas las campañas activas/abiertas previas del usuario (semántica v2,
-- consistente con aplicar_creditos_intercambio).
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

  -- Si saldo queda en 0 → pausar campañas previas + la recién creada.
  -- NEW.estado cubre la fila que está siendo insertada (aún no persiste),
  -- el UPDATE cubre las campañas que ya existen en 'activa'/'abierta'.
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

DROP TRIGGER IF EXISTS trg_costo_crear_campana ON campanas;

CREATE TRIGGER trg_costo_crear_campana
  BEFORE INSERT ON campanas
  FOR EACH ROW
  EXECUTE FUNCTION descontar_costo_crear_campana();
