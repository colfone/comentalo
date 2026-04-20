-- RPC atómica para aplicar créditos al verificar un intercambio
-- Comentarista: +1 (techo 10), Creador: -1 (piso 0), pausa campaña si creador queda en 0
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
    UPDATE campanas
    SET estado = 'pausada'
    WHERE id = p_campana_id
      AND estado IN ('activa', 'abierta');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'saldo_creador', v_saldo_creador,
    'campana_pausada', v_saldo_creador = 0
  );
END;
$$;
