-- ============================================
-- Estado de usuario para moderación admin
--
-- Agrega tres columnas a la tabla usuarios:
--   - estado: 'activo' (default), 'suspendido', 'baneado', 'eliminado'
--   - estado_hasta: fecha de expiración para suspensiones temporales
--   - estado_motivo: razón textual del cambio de estado
--
-- Semántica de cada estado:
--   activo      → usuario normal, sin restricciones
--   suspendido  → bloqueo temporal; estado_hasta define cuándo expira
--   baneado     → bloqueo permanente; estado_hasta típicamente NULL
--   eliminado   → soft-delete; estado_hasta típicamente NULL
--
-- NOTA: esta migración solo agrega el schema. La lógica de enforcement
-- (bloquear login/acciones para suspendidos/baneados, auto-expiración
-- de suspensiones temporales, filtrado de queries, etc.) va en migraciones
-- y código subsiguientes.
-- ============================================

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'activo'
  CHECK (estado IN ('activo', 'suspendido', 'baneado', 'eliminado'));

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS estado_hasta TIMESTAMPTZ;

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS estado_motivo TEXT;

-- Índice parcial para queries de moderación (listar no-activos)
CREATE INDEX IF NOT EXISTS idx_usuarios_estado_no_activo
ON usuarios(estado)
WHERE estado != 'activo';
