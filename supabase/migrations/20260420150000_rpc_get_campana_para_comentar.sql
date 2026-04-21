-- RPC get_campana_para_comentar
-- Retorna datos completos de una campaña para el flujo del comentarista
-- Aplicada en producción via SQL Editor el 20 de abril de 2026

CREATE OR REPLACE FUNCTION get_campana_para_comentar(
  p_campana_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'ok', true,
    'campana_id', c.id,
    'estado', c.estado,
    'video', json_build_object(
      'id', v.id,
      'youtube_video_id', v.youtube_video_id,
      'titulo', v.titulo,
      'descripcion', v.descripcion,
      'tipo_intercambio', v.tipo_intercambio,
      'tono', v.tono,
      'vistas', v.vistas,
      'duracion_segundos', v.duracion_segundos
    ),
    'creador', json_build_object(
      'id', u.id,
      'nombre', u.nombre,
      'canal_url', u.canal_url,
      'avatar_url', u.avatar_url,
      'suscriptores_al_registro', u.suscriptores_al_registro
    )
  )
  INTO v_result
  FROM campanas c
  JOIN videos v ON v.id = c.video_id
  JOIN usuarios u ON u.id = v.usuario_id
  WHERE c.id = p_campana_id;

  IF v_result IS NULL THEN
    RETURN json_build_object('ok', false, 'mensaje', 'Campaña no encontrada');
  END IF;

  RETURN v_result;
END;
$$;
