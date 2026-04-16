-- ============================================
-- Verificacion de canal por codigo en descripcion
-- Reemplaza el flujo OAuth youtube.readonly
-- ============================================

CREATE TABLE verificaciones_canal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    canal_youtube_id TEXT NOT NULL,
    canal_data JSONB NOT NULL,
    verificado BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_verificaciones_canal_auth_id ON verificaciones_canal(auth_id);
CREATE INDEX idx_verificaciones_canal_codigo ON verificaciones_canal(codigo);

ALTER TABLE verificaciones_canal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verificaciones_canal_select_own" ON verificaciones_canal
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "verificaciones_canal_insert_own" ON verificaciones_canal
    FOR INSERT WITH CHECK (auth.uid() = auth_id);
