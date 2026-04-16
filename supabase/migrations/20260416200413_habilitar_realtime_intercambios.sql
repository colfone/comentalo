-- ============================================
-- Sesion 4 Bloque 3 — Habilitar Realtime en intercambios
-- Permite que el frontend se suscriba a cambios de estado
-- del intercambio en tiempo real (seccion 6F.3)
-- ============================================

-- Habilitar replicacion para Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE intercambios;

-- RLS en intercambios para que Realtime filtre correctamente
ALTER TABLE intercambios ENABLE ROW LEVEL SECURITY;

-- El comentarista puede ver sus propios intercambios
CREATE POLICY "intercambios_select_comentarista" ON intercambios
    FOR SELECT
    USING (
        comentarista_id IN (
            SELECT id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

-- El creador del video puede ver intercambios de sus campanas
CREATE POLICY "intercambios_select_creador" ON intercambios
    FOR SELECT
    USING (
        campana_id IN (
            SELECT c.id FROM campanas c
            INNER JOIN videos v ON v.id = c.video_id
            INNER JOIN usuarios u ON u.id = v.usuario_id
            WHERE u.auth_id = auth.uid()
        )
    );
