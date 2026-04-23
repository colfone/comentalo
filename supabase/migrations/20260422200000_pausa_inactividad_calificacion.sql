-- ============================================
-- Pausa automática por inactividad de calificación (modelo v2, PROYECTO.md v4.8)
--
-- Si un creador acumula >= max_sin_calificar comentarios verificados sin
-- calificar cuyo timestamp_copia es más viejo que horas_limite_calificacion,
-- se pausan todas sus campañas activas/abiertas.
--
-- Parámetros leídos de tabla configuracion con fallback:
--   max_sin_calificar          → 3
--   horas_limite_calificacion  → 72
--
-- Schedule: pg_cron cada hora en el minuto 0.
--
-- NOTA: esta migración solo pausa. La reactivación automática al calificar
-- (cuando el creador baja del threshold) va en una migración siguiente que
-- extiende aplicar_credito_calificacion.
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
  -- Leer parámetros de configuracion (fallbacks defensivos)
  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'max_sin_calificar'),
    3
  ) INTO v_max_sin_calificar;

  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'horas_limite_calificacion'),
    72
  ) INTO v_horas_limite;

  -- Detectar + pausar en la misma query: las CTEs con UPDATE se evalúan eagerly.
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
      AND c.estado IN ('activa', 'abierta')
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

-- pg_cron: cada hora en el minuto 0.
-- cron.schedule es idempotente por jobname en pg_cron 1.5+ (Supabase).
SELECT cron.schedule(
  'pausar-por-inactividad-calificacion',
  '0 * * * *',
  $$SELECT pausar_por_inactividad_calificacion()$$
);
