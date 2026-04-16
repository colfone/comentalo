-- ============================================
-- Sesion 4 — Cache de videos de YouTube por usuario
-- Evita llamadas repetidas a YouTube API search.list
-- TTL: 60 minutos (expires_at)
-- ============================================

CREATE TABLE cache_videos_youtube (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    videos JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '60 minutes'),
    UNIQUE (usuario_id)
);

CREATE INDEX idx_cache_videos_usuario_id ON cache_videos_youtube(usuario_id);
CREATE INDEX idx_cache_videos_expires_at ON cache_videos_youtube(expires_at);

-- RLS: cada usuario solo accede a su propio cache
ALTER TABLE cache_videos_youtube ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cache_videos_select_own" ON cache_videos_youtube
    FOR SELECT USING (auth.uid() = (
        SELECT auth_id FROM usuarios WHERE id = usuario_id
    ));

CREATE POLICY "cache_videos_insert_own" ON cache_videos_youtube
    FOR INSERT WITH CHECK (auth.uid() = (
        SELECT auth_id FROM usuarios WHERE id = usuario_id
    ));

CREATE POLICY "cache_videos_update_own" ON cache_videos_youtube
    FOR UPDATE USING (auth.uid() = (
        SELECT auth_id FROM usuarios WHERE id = usuario_id
    ));

CREATE POLICY "cache_videos_delete_own" ON cache_videos_youtube
    FOR DELETE USING (auth.uid() = (
        SELECT auth_id FROM usuarios WHERE id = usuario_id
    ));
