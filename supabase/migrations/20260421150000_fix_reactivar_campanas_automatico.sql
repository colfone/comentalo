-- ============================================
-- RPC aplicar_creditos_intercambio — v3
-- Agrega reactivación automática de campañas del comentarista cuando su
-- saldo sube de 0 a 1. Semántica del modelo de créditos:
--   - Comentarista gana +1 crédito al verificar un comentario (techo 10)
--   - Creador del video comentado pierde 1 crédito (piso 0)
--   - Creador a 0 → pausa TODAS sus campañas activas/abiertas (v2)
--   - Comentarista sube de 0 → reactiva sus campañas pausadas (v3, nuevo)
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
  v_saldo_comentarista_antes INTEGER;
  v_saldo_creador INTEGER;
BEGIN
  -- Leer saldo del comentarista ANTES de sumar
  SELECT saldo_creditos
  INTO v_saldo_comentarista_antes
  FROM usuarios
  WHERE id = p_comentarista_id;

  -- Sumar 1 al comentarista (techo 10)
  UPDATE usuarios
  SET saldo_creditos = LEAST(saldo_creditos + 1, 10)
  WHERE id = p_comentarista_id;

  -- Si el comentarista estaba en 0 → reactivar sus campañas pausadas
  IF v_saldo_comentarista_antes = 0 THEN
    UPDATE campanas c
    SET estado = 'activa'
    FROM videos v
    WHERE c.video_id = v.id
      AND v.usuario_id = p_comentarista_id
      AND c.estado = 'pausada';
  END IF;

  -- Restar 1 al creador (piso 0)
  UPDATE usuarios
  SET saldo_creditos = GREATEST(saldo_creditos - 1, 0)
  WHERE id = p_creador_id
  RETURNING saldo_creditos INTO v_saldo_creador;

  -- Si creador llegó a 0 → pausar todas sus campañas activas/abiertas
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
    'campana_pausada', v_saldo_creador = 0,
    'campana_reactivada', v_saldo_comentarista_antes = 0
  );
END;
$$;
