-- ============================================
-- Sesion 4 — Flujo del intercambio
-- Columnas adicionales para registro de video
-- y calculo de tiempo minimo (seccion 5.3, 5.4)
-- ============================================

-- Tabla videos: campos del formulario de registro (seccion 5.3)
ALTER TABLE videos ADD COLUMN descripcion TEXT;
ALTER TABLE videos ADD COLUMN tipo_intercambio TEXT CHECK (tipo_intercambio IN ('opinion', 'pregunta', 'experiencia'));
ALTER TABLE videos ADD COLUMN tono TEXT CHECK (tono IN ('casual', 'entusiasta', 'reflexivo'));
ALTER TABLE videos ADD COLUMN duracion_segundos INTEGER;

-- Tabla intercambios: duracion del video al momento de copiar (seccion 5.4)
-- Se usa para calcular el tiempo minimo entre Copiar y Ya publique
ALTER TABLE intercambios ADD COLUMN duracion_video_segundos INTEGER;
