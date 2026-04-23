-- ============================================
-- Reactivación automática por calificación (modelo v2, PROYECTO.md v4.8)
--
-- Extiende aplicar_credito_calificacion con una segunda vía de reactivación:
-- si el creador ahora tiene < max_sin_calificar comentarios verificados sin
-- calificar CON timestamp_copia > horas_limite_calificacion, reactiva todas
-- sus campañas pausadas.
--
-- El filtro por edad es intencional para mantener simetría con el RPC
-- pausar_por_inactividad_calificacion (migración 20260422200000): si el cron
-- pausa contando solo los "viejos" (>72h), la reactivación usa el mismo
-- criterio para que ambas reglas converjan.
--
-- Dos vías de reactivación independientes (pueden darse ambas en la misma llamada):
--   1. Por saldo: si saldo venía de 0 (existente, de migración 20260422170000).
--   2. Por calificación: si old_unrated_count < max_sin_calificar (nueva).
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
