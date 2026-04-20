-- ============================================
-- Expandir CHECK de campanas.estado según sección 5D de PROYECTO.md.
-- Vocabulario antiguo (abierta/completada/calificada) se mantiene para no
-- romper campañas existentes ni el código que las crea.
-- Vocabulario nuevo (activa/pausada/finalizada) es el usado por los
-- endpoints Pausar/Finalizar/Activar/Eliminar.
-- Deuda: migrar 'abierta' → 'activa' cuando se aborde campañas-por-tiempo.
-- ============================================

ALTER TABLE campanas DROP CONSTRAINT IF EXISTS campanas_estado_check;

ALTER TABLE campanas ADD CONSTRAINT campanas_estado_check
  CHECK (estado IN ('abierta', 'completada', 'calificada', 'activa', 'pausada', 'finalizada'));
