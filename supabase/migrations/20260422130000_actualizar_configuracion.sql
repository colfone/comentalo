-- ============================================
-- Actualizar tabla configuracion al modelo v2
-- 1. Eliminar parámetros obsoletos del modelo v1
-- 2. Agregar parámetros del modelo de créditos v2 (PROYECTO.md v4.7)
--    + 2 parámetros de moderación de campañas por inactividad de calificación.
-- Mientras los RPCs/endpoints no lean de esta tabla, los valores acá
-- son documentación — editarlos desde /admin/configuracion no cambia
-- el comportamiento del sistema.
-- ============================================

-- 1. Eliminar parámetros obsoletos (modelo v1)
DELETE FROM configuracion
WHERE clave IN (
    'intercambios_por_campana',
    'limite_pendientes_comentarista',
    'saldo_creditos_max'
);

-- 2. Agregar parámetros del modelo de créditos v2 + moderación calificación
INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES
    ('creditos_bienvenida', '60', 'integer',
     'Créditos que recibe un usuario nuevo al registrarse'),
    ('costo_campana_creditos', '30', 'integer',
     'Créditos que cuesta abrir una campaña'),
    ('creditos_por_comentar', '1', 'integer',
     'Créditos ganados por cada comentario verificado dado'),
    ('horas_limite_calificacion', '72', 'integer',
     'Horas máximas sin calificar antes de pausar campaña del creador'),
    ('max_sin_calificar', '3', 'integer',
     'Máximo de comentarios verificados sin calificar antes de pausar campaña')
ON CONFLICT (clave) DO NOTHING;
