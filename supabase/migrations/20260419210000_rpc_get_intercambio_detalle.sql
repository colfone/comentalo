-- ============================================
-- RPC get_intercambio_detalle — lee intercambio del comentarista autenticado
-- junto con video y creador, bypasseando RLS con SECURITY DEFINER.
--
-- Contexto: las policies campanas_select_creador / videos_select_own /
-- usuarios_select_own solo permiten ver esos rows al DUEÑO del video.
-- El comentarista que participa en un intercambio también necesita ver
-- video + creador para renderizar el detalle, pero no es dueño de nada.
-- En lugar de ampliar RLS (policies recursivas, riesgo de performance),
-- esta RPC actúa como vista privilegiada filtrada por auth.uid().
-- ============================================

CREATE OR REPLACE FUNCTION get_intercambio_detalle(p_campana_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comentarista_id UUID;
  v_result JSON;
BEGIN
  -- Derivar comentarista_id desde la sesión — impide que un cliente pase
  -- el id de otro usuario para leer intercambios ajenos.
  SELECT id INTO v_comentarista_id
  FROM usuarios
  WHERE auth_id = auth.uid();

  IF v_comentarista_id IS NULL THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'NO_AUTENTICADO',
      'mensaje', 'Usuario no autenticado.'
    );
  END IF;

  SELECT json_build_object(
    'ok', true,
    'intercambio', json_build_object(
      'id', i.id,
      'texto_comentario', i.texto_comentario,
      'estado', i.estado,
      'timestamp_copia', i.timestamp_copia
    ),
    'video', json_build_object(
      'id', v.id,
      'youtube_video_id', v.youtube_video_id,
      'titulo', v.titulo,
      'descripcion', v.descripcion,
      'tipo_intercambio', v.tipo_intercambio,
      'tono', v.tono,
      'duracion_segundos', v.duracion_segundos,
      'vistas', v.vistas
    ),
    'creador', json_build_object(
      'id', u.id,
      'nombre', u.nombre,
      'avatar_url', u.avatar_url,
      'canal_url', u.canal_url,
      'suscriptores_al_registro', u.suscriptores_al_registro
    )
  )
  INTO v_result
  FROM intercambios i
  INNER JOIN campanas c ON c.id = i.campana_id
  INNER JOIN videos v ON v.id = c.video_id
  INNER JOIN usuarios u ON u.id = v.usuario_id
  WHERE i.comentarista_id = v_comentarista_id
    AND i.campana_id = p_campana_id
  ORDER BY i.created_at DESC
  LIMIT 1;

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'NO_ENCONTRADO',
      'mensaje', 'No encontramos un intercambio activo para esta campaña.'
    );
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_intercambio_detalle(UUID) TO authenticated;
