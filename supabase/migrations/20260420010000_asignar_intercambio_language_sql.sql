-- ============================================
-- RPC asignar_intercambio — v4.11
-- Reescrito como LANGUAGE sql (sin DECLARE/BEGIN/END) por quirk del Supabase
-- SQL Editor con plpgsql + DECLARE. Semánticamente equivalente al original
-- de v4.5 pero con dos cambios:
--
-- 1. Filtro c.estado ampliado de 'abierta' a IN ('abierta', 'activa')
--    para que campañas que pasaron por Pausar → Activar (quedan en 'activa'
--    según sección 5D) vuelvan a aparecer en la cola.
-- 2. LANGUAGE sql: control flow expresado como (a) guardrails inline en el
--    WHERE del INSERT — si fallan, INSERT no agrega nada — y (b) CASE en el
--    SELECT final que escoge el mensaje de retorno según el estado.
--
-- FOR UPDATE OF c SKIP LOCKED preservado dentro del CTE locked_disponibles
-- para mantener la concurrencia segura.
-- ============================================

CREATE OR REPLACE FUNCTION asignar_intercambio(p_comentarista_id UUID)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
  DELETE FROM reservas_intercambio WHERE expires_at < now();

  WITH locked_disponibles AS (
    SELECT c.id AS campana_id
    FROM campanas c
    INNER JOIN videos v ON v.id = c.video_id
    WHERE c.estado IN ('abierta', 'activa')
      AND c.intercambios_completados < 10
      AND v.usuario_id <> p_comentarista_id
      AND NOT EXISTS (
        SELECT 1 FROM intercambios i
        WHERE i.campana_id = c.id AND i.comentarista_id = p_comentarista_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM intercambios i2
        INNER JOIN campanas c2 ON c2.id = i2.campana_id
        WHERE c2.video_id = v.id AND i2.comentarista_id = p_comentarista_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM reservas_intercambio r
        WHERE r.campana_id = c.id AND r.expires_at > now()
      )
      AND EXISTS (
        SELECT 1 FROM videos
        WHERE usuario_id = p_comentarista_id AND estado = 'activo'
      )
      AND (
        SELECT COUNT(*) FROM intercambios
        WHERE comentarista_id = p_comentarista_id AND estado = 'pendiente'
      ) < 3
      AND NOT EXISTS (
        SELECT 1 FROM reservas_intercambio
        WHERE comentarista_id = p_comentarista_id AND expires_at > now()
      )
    ORDER BY c.created_at ASC
    LIMIT 2
    FOR UPDATE OF c SKIP LOCKED
  )
  INSERT INTO reservas_intercambio (campana_id, comentarista_id, expires_at)
  SELECT campana_id, p_comentarista_id, now() + interval '5 minutes'
  FROM locked_disponibles;

  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM videos
      WHERE usuario_id = p_comentarista_id AND estado = 'activo'
    ) THEN
      json_build_object(
        'ok', false,
        'error', 'USUARIO_SIN_VIDEO_ACTIVO',
        'mensaje', 'Debes registrar al menos un video activo antes de participar en intercambios.'
      )
    WHEN (
      SELECT COUNT(*) FROM intercambios
      WHERE comentarista_id = p_comentarista_id AND estado = 'pendiente'
    ) >= 3 THEN
      json_build_object(
        'ok', false,
        'error', 'LIMITE_PENDIENTES_ALCANZADO',
        'mensaje', 'Tienes 3 intercambios pendientes. Espera a que se resuelva al menos uno.'
      )
    WHEN NOT EXISTS (
      SELECT 1 FROM reservas_intercambio
      WHERE comentarista_id = p_comentarista_id AND expires_at > now()
    ) THEN
      json_build_object(
        'ok', false,
        'error', 'COLA_VACIA',
        'mensaje', 'No hay videos disponibles en la cola en este momento.'
      )
    ELSE
      json_build_object(
        'ok', true,
        'videos', (
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
          )
          FROM reservas_intercambio r
          INNER JOIN campanas c ON c.id = r.campana_id
          INNER JOIN videos v ON v.id = c.video_id
          INNER JOIN usuarios u ON u.id = v.usuario_id
          WHERE r.comentarista_id = p_comentarista_id
            AND r.expires_at > now()
        )
      )
  END;
$fn$;

GRANT EXECUTE ON FUNCTION asignar_intercambio(UUID) TO authenticated;
