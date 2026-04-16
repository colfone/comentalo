-- ============================================
-- Migrar Exponential Backoff de Vercel Cron a pg_cron de Supabase.
-- Basado en PROYECTO.md seccion 6F.1
-- ============================================

-- 1. Habilitar pg_cron (ejecuta en schema cron creado automaticamente por Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 2. Permitir que pg_cron ejecute funciones en el schema public
GRANT USAGE ON SCHEMA public TO postgres;

-- 3. Programar el job cada 5 minutos
SELECT cron.schedule(
    'procesar-verificaciones-pendientes',
    '*/5 * * * *',
    $$SELECT procesar_verificaciones_pendientes()$$
);
