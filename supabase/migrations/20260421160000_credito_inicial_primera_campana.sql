-- ============================================
-- Crédito inicial al crear primera campaña
-- Trigger AFTER INSERT en campanas: si es la primera campaña del usuario
-- (ninguna previa sobre cualquiera de sus videos) y su saldo_creditos está
-- en 0, le otorga 1 crédito. Desbloquea el ecosistema — permite que su
-- primera campaña reciba un intercambio verificado antes de pausarse.
--
-- Corre sin importar qué endpoint insertó la campaña (/api/videos/registrar
-- al crear primer video con 10+ vistas, o /api/campanas/lanzar al lanzar
-- campaña manualmente). Idempotente: sólo dispara cuando ambas condiciones
-- se cumplen, así que re-inserts o inserts subsecuentes no otorgan más.
--
-- Aplicada en producción via SQL Editor el 21 de abril de 2026.
-- ============================================

CREATE OR REPLACE FUNCTION otorgar_credito_inicial_campana()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id UUID;
  v_campanas_previas INTEGER;
  v_saldo INTEGER;
BEGIN
  -- Obtener el dueño del video de la campaña recién insertada
  SELECT usuario_id
  INTO v_usuario_id
  FROM videos
  WHERE id = NEW.video_id;

  -- Contar campañas previas del usuario (excluyendo la recién insertada)
  SELECT COUNT(*)
  INTO v_campanas_previas
  FROM campanas c
  INNER JOIN videos v ON v.id = c.video_id
  WHERE v.usuario_id = v_usuario_id
    AND c.id <> NEW.id;

  -- Obtener saldo actual del usuario
  SELECT saldo_creditos
  INTO v_saldo
  FROM usuarios
  WHERE id = v_usuario_id;

  -- Sólo otorgar si es la primera campaña Y saldo actual es 0
  IF v_campanas_previas = 0 AND v_saldo = 0 THEN
    UPDATE usuarios
    SET saldo_creditos = 1
    WHERE id = v_usuario_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credito_inicial_campana ON campanas;

CREATE TRIGGER trg_credito_inicial_campana
  AFTER INSERT ON campanas
  FOR EACH ROW
  EXECUTE FUNCTION otorgar_credito_inicial_campana();
