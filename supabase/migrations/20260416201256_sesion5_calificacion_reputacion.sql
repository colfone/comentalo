-- ============================================
-- Sesion 5 — Calificacion y reputacion
-- Auto-calificacion a 72h, calculo de reputacion
-- ============================================

-- RPC: auto_calificar_intercambios_vencidos
-- Intercambios verificados sin calificacion despues de 72 horas
-- se autocalifican como 'positiva' (seccion 6.2)
CREATE OR REPLACE FUNCTION auto_calificar_intercambios_vencidos()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE intercambios
    SET calificacion = 'positiva'
    WHERE estado = 'verificado'
      AND calificacion IS NULL
      AND created_at <= now() - interval '72 hours';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN json_build_object(
        'ok', true,
        'autocalificados', v_count
    );
END;
$$;

-- pg_cron job: auto-calificar cada hora
SELECT cron.schedule(
    'auto-calificar-intercambios-vencidos',
    '0 * * * *',
    'SELECT auto_calificar_intercambios_vencidos()'
);

-- RPC: calcular_reputacion
-- Calcula el % de calificaciones positivas de un comentarista
-- y actualiza su campo reputacion en la tabla usuarios.
-- Solo aplica consecuencias si tiene >= 20 intercambios calificados (seccion 6.3)
CREATE OR REPLACE FUNCTION calcular_reputacion(p_comentarista_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER;
    v_positivas INTEGER;
    v_porcentaje NUMERIC(5,2);
    v_nivel TEXT;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE calificacion IS NOT NULL),
        COUNT(*) FILTER (WHERE calificacion = 'positiva')
    INTO v_total, v_positivas
    FROM intercambios
    WHERE comentarista_id = p_comentarista_id
      AND estado = 'verificado'
      AND calificacion IS NOT NULL;

    IF v_total = 0 THEN
        RETURN json_build_object(
            'ok', true,
            'total_calificados', 0,
            'porcentaje', 100.00,
            'nivel', 'verde',
            'activo', false
        );
    END IF;

    v_porcentaje := (v_positivas::NUMERIC / v_total::NUMERIC) * 100;

    -- Determinar nivel (seccion 6.3)
    IF v_porcentaje >= 80 THEN
        v_nivel := 'verde';
    ELSIF v_porcentaje >= 60 THEN
        v_nivel := 'amarillo';
    ELSIF v_porcentaje >= 40 THEN
        v_nivel := 'naranja';
    ELSE
        v_nivel := 'rojo';
    END IF;

    -- Actualizar reputacion en usuarios
    UPDATE usuarios
    SET reputacion = v_porcentaje
    WHERE id = p_comentarista_id;

    RETURN json_build_object(
        'ok', true,
        'total_calificados', v_total,
        'porcentaje', v_porcentaje,
        'nivel', v_nivel,
        'activo', v_total >= 20
    );
END;
$$;
