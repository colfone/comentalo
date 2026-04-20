-- ============================================
-- Campo canal_verificado en usuarios
-- Activa el modal de verificación obligatoria en el dashboard.
-- Usuarios existentes quedan en false para forzarlos a confirmar
-- su canal una vez con el nuevo flujo (2 min por usuario, one-shot).
-- Si prefieres eximir a los usuarios legacy, ejecuta después:
--   UPDATE usuarios SET canal_verificado = true WHERE canal_youtube_id IS NOT NULL;
-- ============================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS canal_verificado BOOLEAN NOT NULL DEFAULT false;
