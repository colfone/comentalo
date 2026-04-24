-- ============================================
-- Auto-expiración de suspensiones temporales
--
-- Pasa usuarios de estado='suspendido' a 'activo' cuando estado_hasta venció.
-- Limpia estado_motivo y estado_hasta para dejar la fila como un activo normal.
--
-- Solo toca suspensiones CON fecha límite — suspensiones indefinidas
-- (estado_hasta IS NULL) requieren reactivación manual desde el panel admin.
--
-- Schedule: pg_cron cada hora en el minuto 0 (misma cadencia que
-- pausar-por-inactividad-calificacion).
-- ============================================

CREATE OR REPLACE FUNCTION expire_suspensiones_temporales()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expiradas INTEGER;
BEGIN
  WITH reactivadas AS (
    UPDATE usuarios
    SET estado = 'activo',
        estado_motivo = NULL,
        estado_hasta = NULL
    WHERE estado = 'suspendido'
      AND estado_hasta IS NOT NULL
      AND estado_hasta < now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_expiradas FROM reactivadas;

  RETURN json_build_object(
    'ok', true,
    'expiradas', v_expiradas
  );
END;
$$;

-- pg_cron: cada hora en el minuto 0.
-- cron.schedule es idempotente por jobname en pg_cron 1.5+ (Supabase).
SELECT cron.schedule(
  'expire-suspensiones-temporales',
  '0 * * * *',
  $$SELECT expire_suspensiones_temporales()$$
);
