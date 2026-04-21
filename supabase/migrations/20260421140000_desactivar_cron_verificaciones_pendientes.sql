-- Desactivar pg_cron procesar-verificaciones-pendientes
-- Desde v4.12 el intercambio se crea SOLO al verificar exitosamente.
-- Ya no existe estado pendiente ni cola de reintentos con Exponential Backoff.
-- La tabla verificaciones_pendientes queda en el esquema pero sin uso activo.
-- Aplicado en producción via SQL Editor el 21 de abril de 2026.

SELECT cron.unschedule('procesar-verificaciones-pendientes');
