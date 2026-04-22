-- ============================================
-- Agrega parámetro max_videos_activos a configuracion.
-- Representa el cap de videos activos simultáneos por usuario
-- (hoy hardcodeado como MAX_VIDEOS_ACTIVOS = 2 en
-- src/app/api/videos/registrar/route.ts).
-- ============================================

INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES
    ('max_videos_activos', '2', 'integer',
     'Máximo de videos activos simultáneos por usuario')
ON CONFLICT (clave) DO NOTHING;
