-- ============================================
-- RPC get_mis_intercambios_comentarista — v4.11
-- Lista los intercambios del comentarista autenticado con video + creador
-- embedded. Bypasea RLS vía SECURITY DEFINER — mismo patrón que
-- get_intercambio_detalle, por la misma razón: las policies de
-- campanas/videos/usuarios solo permiten ver esos rows al dueño del video,
-- y los joins !inner desde el frontend del comentarista colapsaban todo
-- el row cuando RLS ocultaba el embed.
-- ============================================

CREATE OR REPLACE FUNCTION get_mis_intercambios_comentarista()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
  WITH mis_intercambios AS (
    SELECT i.id, i.campana_id, i.texto_comentario, i.estado, i.created_at,
           v.id AS video_id, v.youtube_video_id, v.titulo, v.duracion_segundos,
           u.id AS creador_id, u.nombre AS creador_nombre, u.avatar_url AS creador_avatar
    FROM intercambios i
    INNER JOIN campanas c ON c.id = i.campana_id
    INNER JOIN videos v ON v.id = c.video_id
    INNER JOIN usuarios u ON u.id = v.usuario_id
    WHERE i.comentarista_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid())
      AND i.estado IN ('pendiente', 'verificado')
    ORDER BY i.created_at DESC
    LIMIT 100
  )
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', id,
        'campana_id', campana_id,
        'texto_comentario', texto_comentario,
        'estado', estado,
        'created_at', created_at,
        'video', json_build_object(
          'id', video_id,
          'youtube_video_id', youtube_video_id,
          'titulo', titulo,
          'duracion_segundos', duracion_segundos
        ),
        'creador', json_build_object(
          'id', creador_id,
          'nombre', creador_nombre,
          'avatar_url', creador_avatar
        )
      )
    ),
    '[]'::json
  )
  FROM mis_intercambios;
$fn$;

GRANT EXECUTE ON FUNCTION get_mis_intercambios_comentarista() TO authenticated;
