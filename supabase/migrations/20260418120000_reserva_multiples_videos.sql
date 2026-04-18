-- ============================================
-- Reserva temporal de 2 videos simultaneos
-- PROYECTO.md seccion 5B.1 (v4.2)
-- ============================================
-- El comentarista recibe 2 videos simultaneamente y elige cual comentar.
-- Los videos se reservan por 5 minutos. Si no elige, se liberan automaticamente.
-- El intercambio solo se crea al confirmar la eleccion.
-- ============================================

-- --- Tabla de reservas (TTL 5 min) ---

CREATE TABLE IF NOT EXISTS reservas_intercambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campana_id UUID NOT NULL REFERENCES campanas(id) ON DELETE CASCADE,
    comentarista_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservas_expires_at ON reservas_intercambio(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservas_comentarista_id ON reservas_intercambio(comentarista_id);
CREATE INDEX IF NOT EXISTS idx_reservas_campana_id ON reservas_intercambio(campana_id);

ALTER TABLE reservas_intercambio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reservas_select_own ON reservas_intercambio;
CREATE POLICY reservas_select_own ON reservas_intercambio
    FOR SELECT
    USING (
        comentarista_id IN (
            SELECT id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

-- --- RPC asignar_intercambio: ahora devuelve hasta 2 videos reservados ---

CREATE OR REPLACE FUNCTION asignar_intercambio(p_comentarista_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pendientes INTEGER;
    v_tiene_video_activo BOOLEAN;
    v_existing JSON;
    v_result JSON;
BEGIN
    -- Limpieza global de reservas expiradas
    DELETE FROM reservas_intercambio WHERE expires_at < now();

    -- Guardrail 4C.1: usuario debe tener video activo
    SELECT EXISTS (
        SELECT 1 FROM videos
        WHERE usuario_id = p_comentarista_id
          AND estado = 'activo'
    ) INTO v_tiene_video_activo;

    IF NOT v_tiene_video_activo THEN
        RETURN json_build_object(
            'ok', false,
            'error', 'USUARIO_SIN_VIDEO_ACTIVO',
            'mensaje', 'Debes registrar al menos un video activo antes de participar en intercambios.'
        );
    END IF;

    -- Guardrail 4C.3b: max 3 intercambios pendientes
    SELECT COUNT(*) INTO v_pendientes
    FROM intercambios
    WHERE comentarista_id = p_comentarista_id
      AND estado = 'pendiente';

    IF v_pendientes >= 3 THEN
        RETURN json_build_object(
            'ok', false,
            'error', 'LIMITE_PENDIENTES_ALCANZADO',
            'mensaje', 'Tienes 3 intercambios pendientes. Espera a que se resuelva al menos uno.'
        );
    END IF;

    -- Si el usuario ya tiene reservas activas, devolverlas (idempotente en reload)
    SELECT json_agg(
        json_build_object(
            'reserva_id', r.id,
            'campana_id', r.campana_id,
            'video_id', v.id,
            'youtube_video_id', v.youtube_video_id,
            'titulo', v.titulo,
            'descripcion', v.descripcion,
            'tipo_intercambio', v.tipo_intercambio,
            'tono', v.tono,
            'duracion_segundos', v.duracion_segundos,
            'vistas', v.vistas,
            'expires_at', r.expires_at,
            'creador', json_build_object(
                'nombre', u.nombre,
                'avatar_url', u.avatar_url,
                'canal_url', u.canal_url
            )
        )
        ORDER BY r.created_at ASC
    ) INTO v_existing
    FROM reservas_intercambio r
    INNER JOIN campanas c ON c.id = r.campana_id
    INNER JOIN videos v ON v.id = c.video_id
    INNER JOIN usuarios u ON u.id = v.usuario_id
    WHERE r.comentarista_id = p_comentarista_id
      AND r.expires_at > now();

    IF v_existing IS NOT NULL AND json_array_length(v_existing) > 0 THEN
        RETURN json_build_object(
            'ok', true,
            'videos', v_existing
        );
    END IF;

    -- Reservar hasta 2 nuevos con SELECT FOR UPDATE SKIP LOCKED (FIFO 5B.5)
    WITH disponibles AS (
        SELECT c.id AS campana_id
        FROM campanas c
        INNER JOIN videos v ON v.id = c.video_id
        WHERE c.estado = 'abierta'
          AND c.intercambios_completados < 10
          AND v.usuario_id <> p_comentarista_id
          -- No repetir campana ya comentada (5B.3)
          AND NOT EXISTS (
              SELECT 1 FROM intercambios i
              WHERE i.campana_id = c.id
                AND i.comentarista_id = p_comentarista_id
          )
          -- No repetir video ya comentado en otra campana (5B.3)
          AND NOT EXISTS (
              SELECT 1 FROM intercambios i2
              INNER JOIN campanas c2 ON c2.id = i2.campana_id
              WHERE c2.video_id = v.id
                AND i2.comentarista_id = p_comentarista_id
          )
          -- No duplicar reserva activa de otro usuario
          AND NOT EXISTS (
              SELECT 1 FROM reservas_intercambio r
              WHERE r.campana_id = c.id
                AND r.expires_at > now()
          )
        ORDER BY c.created_at ASC
        LIMIT 2
        FOR UPDATE OF c SKIP LOCKED
    )
    INSERT INTO reservas_intercambio (campana_id, comentarista_id, expires_at)
    SELECT campana_id, p_comentarista_id, now() + interval '5 minutes'
    FROM disponibles;

    -- Devolver las reservas recien creadas con data completa
    SELECT json_agg(
        json_build_object(
            'reserva_id', r.id,
            'campana_id', r.campana_id,
            'video_id', v.id,
            'youtube_video_id', v.youtube_video_id,
            'titulo', v.titulo,
            'descripcion', v.descripcion,
            'tipo_intercambio', v.tipo_intercambio,
            'tono', v.tono,
            'duracion_segundos', v.duracion_segundos,
            'vistas', v.vistas,
            'expires_at', r.expires_at,
            'creador', json_build_object(
                'nombre', u.nombre,
                'avatar_url', u.avatar_url,
                'canal_url', u.canal_url
            )
        )
        ORDER BY r.created_at ASC
    ) INTO v_result
    FROM reservas_intercambio r
    INNER JOIN campanas c ON c.id = r.campana_id
    INNER JOIN videos v ON v.id = c.video_id
    INNER JOIN usuarios u ON u.id = v.usuario_id
    WHERE r.comentarista_id = p_comentarista_id
      AND r.expires_at > now();

    IF v_result IS NULL OR json_array_length(v_result) = 0 THEN
        RETURN json_build_object(
            'ok', false,
            'error', 'COLA_VACIA',
            'mensaje', 'No hay videos disponibles en la cola en este momento.'
        );
    END IF;

    RETURN json_build_object(
        'ok', true,
        'videos', v_result
    );
END;
$$;

-- --- RPC confirmar_intercambio: crea intercambio y libera las otras reservas ---

CREATE OR REPLACE FUNCTION confirmar_intercambio(
    p_comentarista_id UUID,
    p_campana_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_campana_id UUID;
    v_video_id UUID;
    v_intercambio_id UUID;
BEGIN
    -- Validar reserva vigente del usuario para esa campana
    SELECT r.campana_id, c.video_id
    INTO v_campana_id, v_video_id
    FROM reservas_intercambio r
    INNER JOIN campanas c ON c.id = r.campana_id
    WHERE r.comentarista_id = p_comentarista_id
      AND r.campana_id = p_campana_id
      AND r.expires_at > now();

    IF v_campana_id IS NULL THEN
        RETURN json_build_object(
            'ok', false,
            'error', 'RESERVA_EXPIRADA',
            'mensaje', 'La reserva expiro. Vuelve a solicitar videos.'
        );
    END IF;

    -- Crear el intercambio en estado pendiente
    INSERT INTO intercambios (campana_id, comentarista_id, texto_comentario, estado)
    VALUES (v_campana_id, p_comentarista_id, '', 'pendiente')
    RETURNING id INTO v_intercambio_id;

    -- Liberar todas las reservas del usuario (la confirmada y la alternativa)
    DELETE FROM reservas_intercambio WHERE comentarista_id = p_comentarista_id;

    RETURN json_build_object(
        'ok', true,
        'intercambio_id', v_intercambio_id,
        'campana_id', v_campana_id,
        'video_id', v_video_id
    );
END;
$$;
