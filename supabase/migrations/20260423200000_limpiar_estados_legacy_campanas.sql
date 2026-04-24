-- ============================================
-- Limpieza completa de estados legacy 'completada' / 'calificada'
--
-- En el modelo v2 (PROYECTO.md v4.6+) las campañas solo tienen estados
-- vivos ('abierta', 'activa', 'pausada') o terminan como 'finalizada'.
-- Los estados legacy 'completada' y 'calificada' venían del modelo v1
-- (cerraban al llegar a 10 intercambios) y ya no se producen:
--   - No hay lógica en código ni RPCs que transicione a 'completada'.
--   - El único branch que transicionaba 'completada' → 'calificada' vivía
--     en /api/intercambios/calificar y era inalcanzable.
--
-- Migración:
-- 1. Defensivo: mapear cualquier fila residual a 'finalizada'. El
--    closed_at de esas filas ya está poblado por la lógica v1 de
--    auto-cierre, así que no hay que tocarlo.
-- 2. Contraer el CHECK a los 4 estados reales del modelo v2.
--
-- La dualidad 'abierta' ↔ 'activa' se deja intacta a propósito — la
-- migración correspondiente fue diferida por la nota de la migración
-- 20260419200000 ("Deuda: migrar 'abierta' → 'activa' cuando se aborde
-- campañas-por-tiempo").
-- ============================================

-- 1. Defensivo: migrar cualquier fila residual. Si la DB está limpia
-- esto afectará 0 filas.
UPDATE campanas
SET estado = 'finalizada'
WHERE estado IN ('completada', 'calificada');

-- 2. Contraer el CHECK. El DROP + ADD replica el patrón de
-- 20260419200000_expand_campanas_estado.sql.
ALTER TABLE campanas DROP CONSTRAINT IF EXISTS campanas_estado_check;

ALTER TABLE campanas ADD CONSTRAINT campanas_estado_check
  CHECK (estado IN ('abierta', 'activa', 'pausada', 'finalizada'));
