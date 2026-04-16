-- ============================================
-- Comentalo MVP — Esquema inicial de base de datos
-- Basado en PROYECTO.md seccion 6F.5
-- ============================================

-- 1. usuarios — Identidad permanente del creador
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canal_youtube_id TEXT NOT NULL UNIQUE,
    canal_url TEXT NOT NULL,
    suscriptores_al_registro INTEGER NOT NULL DEFAULT 0,
    antiguedad DATE NOT NULL,
    reputacion NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. videos — Videos registrados en la plataforma
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    youtube_video_id TEXT NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    vistas INTEGER NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido', 'completado')),
    intercambios_disponibles INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. campanas — Ciclos de 10 intercambios por video
CREATE TABLE campanas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'completada', 'calificada')),
    intercambios_completados INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ
);

-- 4. intercambios — Cada intercambio individual dentro de una campana
CREATE TABLE intercambios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campana_id UUID NOT NULL REFERENCES campanas(id) ON DELETE CASCADE,
    comentarista_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    texto_comentario TEXT NOT NULL,
    timestamp_copia TIMESTAMPTZ NOT NULL DEFAULT now(),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'verificado', 'rechazado')),
    calificacion TEXT CHECK (calificacion IN ('positiva', 'negativa')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. verificaciones_pendientes — Cola de reintentos con Exponential Backoff
CREATE TABLE verificaciones_pendientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intercambio_id UUID NOT NULL REFERENCES intercambios(id) ON DELETE CASCADE,
    proximo_intento_at TIMESTAMPTZ NOT NULL,
    intentos INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices para queries frecuentes
CREATE INDEX idx_videos_usuario_id ON videos(usuario_id);
CREATE INDEX idx_videos_estado ON videos(estado);
CREATE INDEX idx_campanas_video_id ON campanas(video_id);
CREATE INDEX idx_campanas_estado ON campanas(estado);
CREATE INDEX idx_intercambios_campana_id ON intercambios(campana_id);
CREATE INDEX idx_intercambios_comentarista_id ON intercambios(comentarista_id);
CREATE INDEX idx_intercambios_estado ON intercambios(estado);
CREATE INDEX idx_verificaciones_proximo_intento ON verificaciones_pendientes(proximo_intento_at);
