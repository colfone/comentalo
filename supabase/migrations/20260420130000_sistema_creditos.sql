-- Agregar columna saldo_creditos a usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS saldo_creditos INTEGER NOT NULL DEFAULT 0;

-- Constraint: saldo entre 0 y 10
ALTER TABLE usuarios
ADD CONSTRAINT usuarios_saldo_creditos_check
CHECK (saldo_creditos >= 0 AND saldo_creditos <= 10);

-- Índice para queries de saldo
CREATE INDEX IF NOT EXISTS idx_usuarios_saldo_creditos
ON usuarios(saldo_creditos);
