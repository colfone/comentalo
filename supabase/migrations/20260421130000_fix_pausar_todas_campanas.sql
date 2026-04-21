-- ============================================
-- RPC aplicar_creditos_intercambio — v2
-- Único cambio vs 20260420140000_rpc_aplicar_creditos.sql: al llegar el
-- saldo del creador a 0, pausar TODAS sus campañas activas/abiertas (no
-- sólo la que disparó el intercambio). Mantiene el invariante "creador
-- sin créditos no sigue ofreciendo videos en la cola" cuando tiene
-- múltiples campañas simultáneas.
-- Aplicada en producción via SQL Editor el 21 de abril de 2026.
-- ============================================

CREATE OR REPLACE FUNCTION aplicar_creditos_intercambio(
  p_comentarista_id UUID,
  p_creador_id UUID,
  p_campana_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_saldo_creador INTEGER;
BEGIN
  UPDATE usuarios
  SET saldo_creditos = LEAST(saldo_creditos + 1, 10)
  WHERE id = p_comentarista_id;

  UPDATE usuarios
  SET saldo_creditos = GREATEST(saldo_creditos - 1, 0)
  WHERE id = p_creador_id
  RETURNING saldo_creditos INTO v_saldo_creador;

  IF v_saldo_creador = 0 THEN
    UPDATE campanas c
    SET estado = 'pausada'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = p_creador_id
      AND c.estado IN ('activa', 'abierta');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'saldo_creador', v_saldo_creador,
    'campana_pausada', v_saldo_creador = 0
  );
END;
$$;
