-- ============================================
-- Panel de administración — setup inicial
-- 1. Columna es_admin en usuarios
-- 2. Tabla configuracion (parámetros editables del sistema)
-- 3. Seed de parámetros con los valores actuales del código
-- 4. Marca colfone@gmail.com como admin
-- ============================================

-- 1. Columna es_admin
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS es_admin BOOLEAN NOT NULL DEFAULT false;

-- Índice parcial: sólo indexa la minoría admin (más barato que full index).
CREATE INDEX IF NOT EXISTS idx_usuarios_es_admin
ON usuarios(es_admin)
WHERE es_admin = true;

-- 2. Tabla configuracion — parámetros del sistema editables desde /admin
CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('integer', 'text', 'boolean', 'numeric')),
    descripcion TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES usuarios(id)
);

-- RLS: bloquear acceso directo desde clientes; /api/admin usa service_role.
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- 3. Seed con valores actualmente hardcodeados en RPCs/código.
INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES
    ('saldo_creditos_max', '10', 'integer',
     'Tope superior del saldo de créditos por usuario'),
    ('intercambios_por_campana', '10', 'integer',
     'Comentarios verificados que cierran una campaña'),
    ('reserva_ttl_minutos', '2', 'integer',
     'Duración de una reserva de intercambio antes de liberarse'),
    ('limite_pendientes_comentarista', '3', 'integer',
     'Tope de intercambios en estado pendiente por comentarista'),
    ('videos_por_asignacion', '2', 'integer',
     'Videos reservados por llamada a asignar_intercambio'),
    ('vistas_minimas_registro_video', '10', 'integer',
     'Vistas mínimas para registrar un video'),
    ('duracion_campana_dias', '30', 'integer',
     'Duración máxima de una campaña abierta antes de auto-cierre')
ON CONFLICT (clave) DO NOTHING;

-- 4. Marcar colfone@gmail.com como admin (idempotente, no-op si no existe aún).
UPDATE usuarios
SET es_admin = true
WHERE email = 'colfone@gmail.com';
