-- ============================================
-- RPC: procesar_verificaciones_pendientes
-- Exponential Backoff para intercambios retenidos por YouTube.
-- Basado en PROYECTO.md secciones 6F.1 y 6E.1
-- ============================================

CREATE OR REPLACE FUNCTION procesar_verificaciones_pendientes()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_registro RECORD;
    v_procesados INTEGER := 0;
    v_marcados_revision INTEGER := 0;
    v_reprogramados INTEGER := 0;
BEGIN
    -- Procesar maximo 50 por corrida para proteger cuota de API (6E.1)
    FOR v_registro IN
        SELECT vp.id,
               vp.intercambio_id,
               vp.intentos
        FROM verificaciones_pendientes vp
        WHERE vp.proximo_intento_at <= NOW()
        ORDER BY vp.proximo_intento_at ASC
        LIMIT 50
        FOR UPDATE OF vp SKIP LOCKED
    LOOP
        v_procesados := v_procesados + 1;

        IF v_registro.intentos >= 4 THEN
            -- Intento 5+: marcar para revision manual del equipo
            UPDATE verificaciones_pendientes
            SET intentos = v_registro.intentos + 1,
                proximo_intento_at = 'infinity'::timestamptz
            WHERE id = v_registro.id;

            UPDATE intercambios
            SET estado = 'rechazado'
            WHERE id = v_registro.intercambio_id;

            v_marcados_revision := v_marcados_revision + 1;
        ELSE
            -- Reprogramar segun tabla de Exponential Backoff (6E.1):
            -- intento 1 → +30 min, 2 → +2h, 3 → +8h, 4 → +24h
            UPDATE verificaciones_pendientes
            SET intentos = v_registro.intentos + 1,
                proximo_intento_at = NOW() + CASE v_registro.intentos
                    WHEN 0 THEN INTERVAL '30 minutes'
                    WHEN 1 THEN INTERVAL '2 hours'
                    WHEN 2 THEN INTERVAL '8 hours'
                    WHEN 3 THEN INTERVAL '24 hours'
                END
            WHERE id = v_registro.id;

            v_reprogramados := v_reprogramados + 1;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'ok', true,
        'procesados', v_procesados,
        'reprogramados', v_reprogramados,
        'marcados_revision', v_marcados_revision
    );
END;
$$;
