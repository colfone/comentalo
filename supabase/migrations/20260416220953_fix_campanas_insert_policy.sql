-- ============================================
-- Fix: agregar INSERT y UPDATE policies en campanas
-- Sin estas policies, las inserciones via user auth client
-- eran bloqueadas silenciosamente por RLS.
-- ============================================

CREATE POLICY "campanas_insert_creador" ON campanas
    FOR INSERT
    WITH CHECK (
        video_id IN (
            SELECT v.id FROM videos v
            INNER JOIN usuarios u ON u.id = v.usuario_id
            WHERE u.auth_id = auth.uid()
        )
    );

CREATE POLICY "campanas_update_creador" ON campanas
    FOR UPDATE
    USING (
        video_id IN (
            SELECT v.id FROM videos v
            INNER JOIN usuarios u ON u.id = v.usuario_id
            WHERE u.auth_id = auth.uid()
        )
    );
