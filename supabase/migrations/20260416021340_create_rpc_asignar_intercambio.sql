-- ============================================
-- RPC: asignar_intercambio
-- Asigna el siguiente video disponible en la cola al comentarista.
-- Basado en PROYECTO.md secciones 6F.2, 5B.5, 5B.3, 4C.3b
-- ============================================

CREATE OR REPLACE FUNCTION asignar_intercambio(p_comentarista_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pendientes INTEGER;
    v_tiene_video_activo BOOLEAN;
    v_campana RECORD;
    v_intercambio_id UUID;
BEGIN
    -- -----------------------------------------------
    -- Guardrail 4C.1: El usuario debe tener al menos
    -- 1 video activo para poder participar
    -- -----------------------------------------------
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

    -- -----------------------------------------------
    -- Guardrail 4C.3b: Maximo 3 intercambios pendientes
    -- simultaneos por usuario
    -- -----------------------------------------------
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

    -- -----------------------------------------------
    -- 6F.2 + 5B.5: SELECT FOR UPDATE SKIP LOCKED
    -- Cola FIFO — campana abierta mas antigua primero.
    -- Excluye videos propios (5B.3) y videos ya comentados (5B.3).
    -- -----------------------------------------------
    SELECT c.id AS campana_id,
           c.video_id,
           v.usuario_id AS creador_id
    INTO v_campana
    FROM campanas c
    INNER JOIN videos v ON v.id = c.video_id
    WHERE c.estado = 'abierta'
      AND c.intercambios_completados < 10
      -- No asignar al creador su propio video
      AND v.usuario_id <> p_comentarista_id
      -- No asignar un video que ya comento este usuario
      AND NOT EXISTS (
          SELECT 1 FROM intercambios i
          WHERE i.campana_id = c.id
            AND i.comentarista_id = p_comentarista_id
      )
      AND NOT EXISTS (
          SELECT 1 FROM intercambios i2
          INNER JOIN campanas c2 ON c2.id = i2.campana_id
          WHERE c2.video_id = v.id
            AND i2.comentarista_id = p_comentarista_id
      )
    ORDER BY c.created_at ASC
    LIMIT 1
    FOR UPDATE OF c SKIP LOCKED;

    -- No hay videos disponibles en la cola
    IF v_campana IS NULL THEN
        RETURN json_build_object(
            'ok', false,
            'error', 'COLA_VACIA',
            'mensaje', 'No hay videos disponibles en la cola en este momento.'
        );
    END IF;

    -- -----------------------------------------------
    -- Crear el intercambio en estado pendiente
    -- -----------------------------------------------
    INSERT INTO intercambios (
        campana_id,
        comentarista_id,
        texto_comentario,
        estado
    ) VALUES (
        v_campana.campana_id,
        p_comentarista_id,
        '',
        'pendiente'
    )
    RETURNING id INTO v_intercambio_id;

    RETURN json_build_object(
        'ok', true,
        'intercambio_id', v_intercambio_id,
        'campana_id', v_campana.campana_id,
        'video_id', v_campana.video_id
    );
END;
$$;
