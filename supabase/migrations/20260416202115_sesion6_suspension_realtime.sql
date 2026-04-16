-- ============================================
-- Sesion 6 — Suspension reincidencia + Realtime en campanas/videos
-- ============================================

-- Track suspension count for reincidence rule (seccion 6D.6)
ALTER TABLE videos ADD COLUMN suspensiones_count INTEGER NOT NULL DEFAULT 0;

-- Enable Realtime on campanas and videos so dashboard updates live
ALTER PUBLICATION supabase_realtime ADD TABLE campanas;
ALTER PUBLICATION supabase_realtime ADD TABLE videos;

-- RLS on campanas for Realtime
ALTER TABLE campanas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campanas_select_creador" ON campanas
    FOR SELECT
    USING (
        video_id IN (
            SELECT v.id FROM videos v
            INNER JOIN usuarios u ON u.id = v.usuario_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- RLS on videos for Realtime
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos_select_own" ON videos
    FOR SELECT
    USING (
        usuario_id IN (
            SELECT id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "videos_insert_own" ON videos
    FOR INSERT
    WITH CHECK (
        usuario_id IN (
            SELECT id FROM usuarios WHERE auth_id = auth.uid()
        )
    );
