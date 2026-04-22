-- ============================================
-- Créditos de bienvenida (modelo v2, PROYECTO.md v4.7)
-- 1. Dropea trigger + función del modelo v1 (1 crédito al crear primera campaña)
-- 2. Crea nuevo trigger AFTER INSERT ON usuarios que otorga créditos_bienvenida
--    leyendo el valor de configuracion.clave = 'creditos_bienvenida'. Fallback 60.
-- ============================================

-- 1. Remover lógica v1: crédito inicial al crear primera campaña
DROP TRIGGER IF EXISTS trg_credito_inicial_campana ON campanas;
DROP FUNCTION IF EXISTS otorgar_credito_inicial_campana();

-- 2. Nueva función + trigger: créditos de bienvenida al registrarse
CREATE OR REPLACE FUNCTION otorgar_creditos_bienvenida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creditos INTEGER;
BEGIN
  -- Defensivo: si ya tiene saldo (p.ej. por un seed), no sobrescribir.
  IF NEW.saldo_creditos <> 0 THEN
    RETURN NEW;
  END IF;

  -- Leer valor de configuracion; fallback 60 si no existe.
  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracion WHERE clave = 'creditos_bienvenida'),
    60
  ) INTO v_creditos;

  UPDATE usuarios
  SET saldo_creditos = v_creditos
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_creditos_bienvenida ON usuarios;

CREATE TRIGGER trg_creditos_bienvenida
  AFTER INSERT ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION otorgar_creditos_bienvenida();
