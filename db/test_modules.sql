-- Script para verificar y agregar módulos de prueba si no existen
USE whirlpool_learning;

-- Verificar si hay módulos para los cursos
SELECT course_id, COUNT(module_id) as module_count 
FROM modules 
GROUP BY course_id;

-- Añadir módulos para cursos que no tengan módulos
-- Refrigerator Repair Basics (ID = 1)
INSERT INTO modules (course_id, title, description, position)
SELECT 1, 'Introducción a la refrigeración', 'Principios básicos de los sistemas de refrigeración', 1
WHERE NOT EXISTS (
    SELECT 1 FROM modules WHERE course_id = 1 AND position = 1
);

INSERT INTO modules (course_id, title, description, position)
SELECT 1, 'Componentes del refrigerador', 'Descripción detallada de los componentes principales', 2
WHERE NOT EXISTS (
    SELECT 1 FROM modules WHERE course_id = 1 AND position = 2
);

INSERT INTO modules (course_id, title, description, position)
SELECT 1, 'Diagnóstico de problemas comunes', 'Cómo identificar y diagnosticar problemas frecuentes', 3
WHERE NOT EXISTS (
    SELECT 1 FROM modules WHERE course_id = 1 AND position = 3
);

-- Washing Machine Troubleshooting (ID = 2)
INSERT INTO modules (course_id, title, description, position)
SELECT 2, 'Componentes de la lavadora', 'Descripción de los componentes principales de una lavadora', 1
WHERE NOT EXISTS (
    SELECT 1 FROM modules WHERE course_id = 2 AND position = 1
);

INSERT INTO modules (course_id, title, description, position)
SELECT 2, 'Problemas de agua y drenaje', 'Diagnóstico y solución de problemas relacionados con agua', 2
WHERE NOT EXISTS (
    SELECT 1 FROM modules WHERE course_id = 2 AND position = 2
);

-- Verificar módulos después de la inserción
SELECT course_id, COUNT(module_id) as module_count 
FROM modules 
GROUP BY course_id;

-- Añadir contenidos de prueba a los módulos si no tienen
INSERT INTO contents (module_id, title, content_type_id, content_data, position)
SELECT 
    m.module_id, 
    'Introducción al módulo', 
    (SELECT content_type_id FROM content_types WHERE name = 'text' LIMIT 1), 
    'Este es un contenido de texto de ejemplo para probar la funcionalidad de visualización de contenidos.',
    1
FROM modules m
WHERE NOT EXISTS (
    SELECT 1 FROM contents WHERE module_id = m.module_id AND position = 1
);

-- Añadir un quiz de prueba a cada módulo si no tiene
INSERT INTO quizzes (module_id, title, description, passing_score, position)
SELECT 
    m.module_id, 
    'Quiz de evaluación', 
    'Evaluación de conocimientos del módulo',
    70,
    1
FROM modules m
WHERE NOT EXISTS (
    SELECT 1 FROM quizzes WHERE module_id = m.module_id AND position = 1
);