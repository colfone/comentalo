-- ============================================
-- Ajuste manual de créditos desde panel admin (modelo v2)
--
-- 1. Tabla movimientos_creditos — audit trail de todos los cambios de saldo.
--    Por ahora solo se popula desde 'ajuste_admin'. Los origins 'bienvenida',
--    'crear_campana', 'comentar', 'calificar' están en el CHECK ready para
--    cuando los triggers/RPCs correspondientes empiecen a loggear.
--
-- 2. RPC ajustar_creditos_admin — atomic UPDATE + INSERT en la misma
--    transacción. Row lock (FOR UPDATE) previene race entre admins.
-- ============================================

-- 1. Tabla movimientos_creditos
CREATE TABLE IF NOT EXISTS movimientos_creditos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    monto INTEGER NOT NULL,
    saldo_anterior INTEGER NOT NULL,
    saldo_nuevo INTEGER NOT NULL,
    origen TEXT NOT NULL CHECK (origen IN (
        'ajuste_admin',
        'bienvenida',
        'crear_campana',
        'comentar',
        'calificar'
    )),
    motivo TEXT,
    admin_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_creditos_usuario
ON movimientos_creditos(usuario_id, created_at DESC);

-- RLS: sin políticas para clientes. service_role bypasea.
-- Cuando se implemente extracto público, agregar policy SELECT own.
ALTER TABLE movimientos_creditos ENABLE ROW LEVEL SECURITY;

-- 2. RPC ajustar_creditos_admin
CREATE OR REPLACE FUNCTION ajustar_creditos_admin(
  p_usuario_id UUID,
  p_monto INTEGER,
  p_admin_id UUID,
  p_motivo TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo_anterior INTEGER;
  v_saldo_nuevo INTEGER;
BEGIN
  -- Validar monto ≠ 0
  IF p_monto = 0 THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'monto_invalido',
      'mensaje', 'El monto debe ser distinto de 0.'
    );
  END IF;

  -- Leer saldo actual con row lock (evita race entre dos admins)
  SELECT saldo_creditos
  INTO v_saldo_anterior
  FROM usuarios
  WHERE id = p_usuario_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'no_encontrado',
      'mensaje', 'Usuario no encontrado.'
    );
  END IF;

  -- Validar que el saldo resultante no quede negativo
  IF v_saldo_anterior + p_monto < 0 THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'saldo_insuficiente',
      'mensaje', 'El ajuste dejaría el saldo en negativo.'
    );
  END IF;

  v_saldo_nuevo := v_saldo_anterior + p_monto;

  -- Aplicar cambio
  UPDATE usuarios
  SET saldo_creditos = v_saldo_nuevo
  WHERE id = p_usuario_id;

  -- Log del movimiento para audit trail / extracto futuro
  INSERT INTO movimientos_creditos (
    usuario_id, monto, saldo_anterior, saldo_nuevo, origen, motivo, admin_id
  ) VALUES (
    p_usuario_id, p_monto, v_saldo_anterior, v_saldo_nuevo,
    'ajuste_admin', p_motivo, p_admin_id
  );

  RETURN json_build_object(
    'ok', true,
    'saldo_anterior', v_saldo_anterior,
    'saldo_nuevo', v_saldo_nuevo
  );
END;
$$;
