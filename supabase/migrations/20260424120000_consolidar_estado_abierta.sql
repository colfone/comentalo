-- ============================================
-- Consolidación 'abierta' → 'activa' en campanas.estado
--
-- La dualidad 'abierta' ↔ 'activa' venía del modelo v1 (PROYECTO.md ≤ v4.1,
-- "abierta" = campaña recién creada antes de llegar a 10 intercambios). En el
-- modelo v2 (PROYECTO.md v4.7, vigente) el único estado vivo es 'activa', con
-- pausada/finalizada como estados derivados. La deuda quedó marcada en la
-- migración 20260419200000_expand_campanas_estado.sql y se difirió hasta
-- ahora.
--
-- Precondiciones verificadas antes de escribir esta migración:
--   - 0 filas en campanas con estado='abierta' en producción (count realizado
--     el 24 abril 2026).
--   - 0 UPDATEs a estado='abierta' en supabase/migrations/ (0 RPCs/triggers
--     escriben ese valor).
--   - Los RPCs vivos mencionan 'abierta' solo en clausulas IN (...) de SELECT,
--     lo que tras esta migración queda como dead code inofensivo. Esos
--     SELECTs se limpian en una migración posterior.
--
-- Cambios:
-- 1. UPDATE defensivo: cualquier fila residual con estado='abierta' migra a
--    'activa'. Esperado 0 filas afectadas.
-- 2. DROP + ADD del CHECK constraint, contrayendo el dominio a
--    ('activa', 'pausada', 'finalizada').
-- 3. ALTER COLUMN DEFAULT de 'abierta' a 'activa' para proteger INSERTs
--    que no especifiquen estado.
-- ============================================

-- 1. Defensivo: migrar cualquier fila residual.
UPDATE campanas
SET estado = 'activa'
WHERE estado = 'abierta';

-- 2. Contraer el CHECK. Patrón DROP IF EXISTS + ADD replica
-- 20260419200000 y 20260423200000.
ALTER TABLE campanas DROP CONSTRAINT IF EXISTS campanas_estado_check;

ALTER TABLE campanas ADD CONSTRAINT campanas_estado_check
  CHECK (estado IN ('activa', 'pausada', 'finalizada'));

-- 3. Actualizar DEFAULT. Sin esto, un INSERT que omita estado insertaría
-- 'abierta' y reventaría contra el CHECK nuevo.
ALTER TABLE campanas ALTER COLUMN estado SET DEFAULT 'activa';
