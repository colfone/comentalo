-- ============================================
-- Remover techo de 10 créditos del modelo v1 → modelo v2 (PROYECTO.md v4.7)
-- 1. CHECK constraint en usuarios.saldo_creditos relajado a sólo >= 0
-- 2. RPC aplicar_creditos_intercambio: se elimina LEAST(saldo_creditos + 1, 10)
--    → el comentarista gana +1 sin techo
-- Los demás comportamientos (reactivación/pausa de campañas) no cambian.
-- ============================================

-- 1. Reemplazar CHECK: era (>= 0 AND <= 10), queda sólo (>= 0)
ALTER TABLE usuarios
  DROP CONSTRAINT IF EXISTS usuarios_saldo_creditos_check;

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_saldo_creditos_check
  CHECK (saldo_creditos >= 0);

-- 2. Reescribir RPC sin el LEAST. Idéntico a la v3 (migración
--    20260421150000_fix_reactivar_campanas_automatico.sql) salvo la línea
--    del UPDATE del comentarista.
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

  -- Sumar 1 al comentarista (sin techo — modelo v2)
  UPDATE usuarios
  SET saldo_creditos = saldo_creditos + 1
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
