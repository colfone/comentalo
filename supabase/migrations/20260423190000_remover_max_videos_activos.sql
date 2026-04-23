-- ============================================
-- Remover parámetro max_videos_activos de configuracion
--
-- En el modelo v2 (PROYECTO.md v4.7) el único limitador para abrir
-- campañas es el saldo de créditos. El cap de 2 videos activos
-- simultáneos quedó obsoleto y ya no se lee desde ningún endpoint.
--
-- Esta migración borra la fila de configuracion para que no siga
-- apareciendo como parámetro editable en /admin/configuracion.
--
-- La migración original (20260422190000_add_max_videos_activos.sql)
-- se mantiene en el repo como referencia histórica.
-- ============================================

DELETE FROM configuracion WHERE clave = 'max_videos_activos';
