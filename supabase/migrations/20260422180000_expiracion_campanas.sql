-- ============================================
-- Expiración de campañas a los 30 días (modelo v2, PROYECTO.md v4.7)
-- 1. Columna campanas.expires_at TIMESTAMPTZ (nullable)
-- 2. Backfill: campañas abierta/activa/pausada existentes → created_at + 30 días
-- 3. SET DEFAULT (now() + interval '30 days') para INSERTs futuros
-- 4. Index parcial sobre expires_at NOT NULL
-- 5. RPC cerrar_campanas_vencidas() → finalizada + closed_at = now()
-- 6. pg_cron job diario a las 03:00 UTC
--
-- Orden importa: el DEFAULT se setea DESPUÉS del backfill para que las
-- campañas no-vivas (completada/calificada/finalizada) queden con
-- expires_at = NULL y nunca disparen el cron. Si agregáramos DEFAULT
-- directamente en ADD COLUMN, todas las filas existentes (incluyendo
-- terminales) recibirían el mismo now()+30d evaluado al momento del ALTER.
-- ============================================

-- 1. Columna expires_at (sin DEFAULT todavía)
ALTER TABLE campanas
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Backfill para campañas vivas
UPDATE campanas
SET expires_at = created_at + interval '30 days'
WHERE expires_at IS NULL
  AND estado IN ('abierta', 'activa', 'pausada');

-- 3. Ahora sí, DEFAULT para inserts futuros
ALTER TABLE campanas
ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

-- 4. Index parcial para el escaneo del cron
CREATE INDEX IF NOT EXISTS idx_campanas_expires_at
ON campanas(expires_at)
WHERE expires_at IS NOT NULL;

-- 5. RPC cerrar_campanas_vencidas
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
      AND estado IN ('abierta', 'activa', 'pausada')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_cerradas FROM actualizadas;

  RETURN json_build_object(
    'ok', true,
    'cerradas', v_cerradas
  );
END;
$$;

-- 6. pg_cron job diario a las 03:00 UTC.
-- cron.schedule(jobname, ...) es idempotente en pg_cron 1.5+: si el
-- job con ese nombre ya existe, se actualiza en vez de fallar.
SELECT cron.schedule(
  'cerrar-campanas-vencidas',
  '0 3 * * *',
  $$SELECT cerrar_campanas_vencidas()$$
);
