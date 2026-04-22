-- ============================================
-- Crédito por calificar (modelo v2, PROYECTO.md v4.7)
-- El creador que califica un comentario recibido gana +1 crédito.
-- Incentivo para calificar rápido (alinea con regla 6.2 de pausa por
-- inactividad de calificación > 72h).
--
-- 1. Seed creditos_por_calificar = 1 en configuracion
-- 2. RPC aplicar_credito_calificacion(p_usuario_id UUID):
--    - Suma el valor de configuracion.creditos_por_calificar (fallback 1)
--    - Si el saldo venía de 0 → reactiva las campañas pausadas del usuario
--    - Retorna JSON con saldo nuevo y si hubo reactivación
-- ============================================

-- 1. Agregar parámetro creditos_por_calificar
INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES
    ('creditos_por_calificar', '1', 'integer',
     'Créditos que gana el creador al calificar un comentario recibido')
ON CONFLICT (clave) DO NOTHING;

-- 2. RPC aplicar_credito_calificacion
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
BEGIN
  -- Leer valor de configuracion; fallback 1 si no existe.
  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'creditos_por_calificar'),
    1
  ) INTO v_creditos;

  -- Saldo antes de sumar
  SELECT saldo_creditos
  INTO v_saldo_antes
  FROM usuarios
  WHERE id = p_usuario_id;

  -- Sumar
  UPDATE usuarios
  SET saldo_creditos = saldo_creditos + v_creditos
  WHERE id = p_usuario_id
  RETURNING saldo_creditos INTO v_saldo_nuevo;

  -- Si venía de 0 → reactivar campañas pausadas del usuario
  IF v_saldo_antes = 0 THEN
    UPDATE campanas c
    SET estado = 'activa'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = p_usuario_id
      AND c.estado = 'pausada';
  END IF;

  RETURN json_build_object(
    'ok', true,
    'saldo_nuevo', v_saldo_nuevo,
    'campana_reactivada', v_saldo_antes = 0
  );
END;
$$;
