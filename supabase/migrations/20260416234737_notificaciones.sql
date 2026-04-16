-- ============================================
-- Sistema de notificaciones
-- ============================================

CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN (
        'intercambio_verificado',
        'intercambio_pendiente',
        'intercambio_recibido',
        'campana_completa',
        'video_suspendido'
    )),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT false,
    url_destino TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida);

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificaciones_select_own" ON notificaciones
    FOR SELECT USING (
        usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "notificaciones_update_own" ON notificaciones
    FOR UPDATE USING (
        usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
