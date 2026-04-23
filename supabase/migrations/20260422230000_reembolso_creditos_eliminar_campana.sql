-- ============================================
-- Reembolso de créditos al eliminar campaña (modelo v2)
-- Regla:
--   intercambios_completados = 0 → devolver costo_campana_creditos + DELETE campaña
--   intercambios_completados >= 1 → bloquea (coherente con regla vigente del
--   endpoint /api/campanas/eliminar desde v4.10: solo eliminable si 0 comentarios)
--
-- Todo atómico en una sola statement (CTE con UPDATE + DELETE). El endpoint
-- de Next debería pasar a llamar este RPC en vez de hacer DELETE directo.
--
-- Lee costo_campana_creditos de configuracion con fallback 30.
-- ============================================

CREATE OR REPLACE FUNCTION eliminar_campana_con_reembolso(
  p_campana_id UUID,
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
  -- Verificar ownership y estado de la campaña
  campana AS (
    SELECT
      c.id,
      c.intercambios_completados,
      c.estado,
      v.usuario_id AS creador_id
    FROM campanas c
    JOIN videos v ON v.id = c.video_id
    WHERE c.id = p_campana_id
      AND v.usuario_id = p_usuario_id
  ),
  -- Leer costo desde configuracion con fallback 30
  config AS (
    SELECT COALESCE(
      (SELECT valor::INTEGER FROM configuracion WHERE clave = 'costo_campana_creditos'),
      30
    ) AS costo
  ),
  -- Validaciones
  validacion AS (
    SELECT
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM campana) THEN 'no_encontrada'
        WHEN (SELECT estado FROM campana) = 'finalizada' THEN 'estado_invalido'
        WHEN (SELECT intercambios_completados FROM campana) > 0 THEN 'tiene_comentarios'
        ELSE 'ok'
      END AS resultado
  ),
  -- Aplicar reembolso si corresponde
  reembolso AS (
    UPDATE usuarios
    SET saldo_creditos = saldo_creditos + (SELECT costo FROM config)
    WHERE id = p_usuario_id
      AND (SELECT resultado FROM validacion) = 'ok'
    RETURNING saldo_creditos
  ),
  -- Eliminar la campaña si corresponde
  eliminacion AS (
    DELETE FROM campanas
    WHERE id = p_campana_id
      AND (SELECT resultado FROM validacion) = 'ok'
    RETURNING id
  )
  SELECT
    CASE (SELECT resultado FROM validacion)
      WHEN 'ok' THEN json_build_object(
        'ok', true,
        'reembolso', (SELECT costo FROM config),
        'saldo_nuevo', (SELECT saldo_creditos FROM reembolso)
      )
      WHEN 'tiene_comentarios' THEN json_build_object(
        'ok', false,
        'error', 'tiene_comentarios',
        'mensaje', 'Esta campaña ya recibió comentarios y no puede eliminarse.'
      )
      WHEN 'estado_invalido' THEN json_build_object(
        'ok', false,
        'error', 'estado_invalido',
        'mensaje', 'Las campañas finalizadas no se pueden eliminar.'
      )
      ELSE json_build_object(
        'ok', false,
        'error', 'no_encontrada',
        'mensaje', 'Campaña no encontrada o no tienes permiso.'
      )
    END AS result;
$$;
