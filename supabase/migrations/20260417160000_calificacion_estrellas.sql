-- ============================================
-- Calificacion por estrellas (1-5)
-- Reemplaza el sistema binario positiva/negativa
-- ============================================

-- 1) Agregar columna estrellas
ALTER TABLE intercambios
    ADD COLUMN IF NOT EXISTS estrellas INTEGER
    CHECK (estrellas IS NULL OR (estrellas >= 1 AND estrellas <= 5));

-- 2) Backfill: positiva -> 5, negativa -> 1
UPDATE intercambios SET estrellas = 5
    WHERE calificacion = 'positiva' AND estrellas IS NULL;

UPDATE intercambios SET estrellas = 1
    WHERE calificacion = 'negativa' AND estrellas IS NULL;

-- 3) Relajar el CHECK de calificacion para aceptar 'neutral' (estrellas = 3)
DO $$
DECLARE
    cname TEXT;
BEGIN
    SELECT conname INTO cname
    FROM pg_constraint
    WHERE conrelid = 'intercambios'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%calificacion%'
    LIMIT 1;

    IF cname IS NOT NULL THEN
        EXECUTE 'ALTER TABLE intercambios DROP CONSTRAINT ' || quote_ident(cname);
    END IF;
END $$;

ALTER TABLE intercambios
    ADD CONSTRAINT intercambios_calificacion_check
    CHECK (calificacion IS NULL OR calificacion IN ('positiva', 'negativa', 'neutral'));

-- 4) Auto-calificacion a 72h -> ahora usa estrellas=5 (equivalente a la "positiva" autocalificada)
CREATE OR REPLACE FUNCTION auto_calificar_intercambios_vencidos()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE intercambios
    SET estrellas = 5,
        calificacion = 'positiva'
    WHERE estado = 'verificado'
      AND estrellas IS NULL
      AND created_at <= now() - interval '72 hours';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN json_build_object(
        'ok', true,
        'autocalificados', v_count
    );
END;
$$;

-- 5) calcular_reputacion: promedio de estrellas
--    Niveles: 4.0-5.0 verde, 3.0-3.9 amarillo, 2.0-2.9 naranja, <2.0 rojo
--    activo cuando total_calificados >= 20
--    usuarios.reputacion se almacena como promedio * 20 (mantiene rango 0-100 para compat)
CREATE OR REPLACE FUNCTION calcular_reputacion(p_comentarista_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER;
    v_promedio NUMERIC(3,2);
    v_porcentaje NUMERIC(5,2);
    v_nivel TEXT;
BEGIN
    SELECT
        COUNT(*),
        AVG(estrellas)::NUMERIC(3,2)
    INTO v_total, v_promedio
    FROM intercambios
    WHERE comentarista_id = p_comentarista_id
      AND estado = 'verificado'
      AND estrellas IS NOT NULL;

    IF v_total = 0 THEN
        RETURN json_build_object(
            'ok', true,
            'total_calificados', 0,
            'promedio_estrellas', 5.00,
            'porcentaje', 100.00,
            'nivel', 'verde',
            'activo', false
        );
    END IF;

    v_porcentaje := (v_promedio * 20);

    IF v_promedio >= 4.0 THEN
        v_nivel := 'verde';
    ELSIF v_promedio >= 3.0 THEN
        v_nivel := 'amarillo';
    ELSIF v_promedio >= 2.0 THEN
        v_nivel := 'naranja';
    ELSE
        v_nivel := 'rojo';
    END IF;

    UPDATE usuarios
    SET reputacion = v_porcentaje
    WHERE id = p_comentarista_id;

    RETURN json_build_object(
        'ok', true,
        'total_calificados', v_total,
        'promedio_estrellas', v_promedio,
        'porcentaje', v_porcentaje,
        'nivel', v_nivel,
        'activo', v_total >= 20
    );
END;
$$;
