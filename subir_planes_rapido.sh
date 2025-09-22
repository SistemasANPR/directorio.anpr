#!/bin/bash
# 🚀 ANPR México - Migración RÁPIDA de Planes de Membresía
# ========================================================

echo '🚀 SUBIENDO PLANES DE MEMBRESÍA A TU APP PÚBLICA...'
echo '================================================='

# Verificar DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo '❌ ERROR: No se encontró DATABASE_URL'
    echo '📋 SOLUCIÓN: Crear base de datos PostgreSQL en el panel Database'
    exit 1
fi

echo '✅ Conectando a base de datos de producción...'

# Crear tabla membership_types si no existe
echo '📋 Creando estructura de planes...'
psql $DATABASE_URL -c "
CREATE TABLE IF NOT EXISTS membership_types (
    id SERIAL PRIMARY KEY,
    nombre_plan TEXT NOT NULL,
    descripcion_plan TEXT,
    opciones_precios JSONB,
    beneficios JSONB,
    visibilidad TEXT DEFAULT 'publica',
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    cantidad_productos_admitidos INTEGER DEFAULT 5,
    cantidad_proyectos_admitidos INTEGER DEFAULT 3,
    cantidad_fotos_por_proyecto INTEGER DEFAULT 5,
    mas_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);"

# Limpiar planes existentes
echo '🧹 Limpiando planes anteriores...'
psql $DATABASE_URL -c "DELETE FROM membership_types;"

# Insertar planes desde desarrollo
echo '📦 Insertando planes de membresía...'
psql $DATABASE_URL -c "
INSERT INTO membership_types (id, nombre_plan, descripcion_plan, opciones_precios, beneficios, visibilidad, stripe_price_id, stripe_product_id, cantidad_productos_admitidos, cantidad_proyectos_admitidos, cantidad_fotos_por_proyecto, mas_popular, created_at, updated_at) VALUES
(8, 'Básico', '', '[{\"costo\": 385, \"periodicidad\": \"Anual\"}, {\"costo\": 35, \"periodicidad\": \"Mensual\"}]', '[\"Micrositio con nombre, descripción, redes y contacto\", \"Hasta 8 imágenes con descripción\", \"Inclusión de 1 catálogos PDF\", \"Presencia en el directorio digital semestralmente\"]', 'publica', NULL, 'prod_SYKMSBLeNYxQfQ', 5, 3, 5, false, '2025-06-02 17:18:34.587', '2025-06-02 17:18:34.587'),
(9, 'Premium', '', '[{\"costo\": 65, \"periodicidad\": \"Mensual\"}, {\"costo\": 715, \"periodicidad\": \"Anual\"}]', '[\"Micrositio con nombre, descripción, redes y contacto\", \"Hasta 8 imágenes con descripción\", \"Inclusión de 1 catálogos PDF\", \"Presencia en el directorio digital semestralmente\", \"Imágenes Ilimitadas\", \"Curriculum de Proyectos Ilimitados\", \"Inclusión de 5 catálogos PDF\", \"Videos en el micrositio\", \"Promoción especial en redes de ANPR México\", \"Video promocional durante un webinar\", \"Publicidad en la Revista Parques (2 ediciones al año)\", \"Publicidad en boletines informativos\"]', 'publica', NULL, 'prod_SYKMSBLeNYxQfN', -1, -1, 5, true, '2025-06-02 17:18:34.587', '2025-06-02 17:18:34.587'),
(10, 'Membresía Empresarial ANPR', '', '[{\"costo\": 0, \"periodicidad\": \"Anual\"}]', '[]', 'privada', NULL, NULL, 10, 5, 10, false, '2025-06-02 17:18:34.587', '2025-06-02 17:18:34.587');

-- Actualizar secuencia
SELECT setval('membership_types_id_seq', (SELECT MAX(id) FROM membership_types));
"

if [ $? -eq 0 ]; then
    echo ''
    echo '✅ ¡PLANES SUBIDOS EXITOSAMENTE!'
    echo '================================'
    
    # Verificar que se subieron
    echo '🔍 Verificando planes cargados:'
    psql $DATABASE_URL -c "
    SELECT 
        id,
        nombre_plan,
        visibilidad,
        CASE 
            WHEN mas_popular THEN '⭐ POPULAR'
            ELSE ''
        END as destacado
    FROM membership_types 
    ORDER BY id;"
    
    echo ''
    echo '🎉 ¡PERFECTO! YA PUEDES VER LOS PLANES EN TU APP'
    echo '✅ Plan Básico: $35/mes - $385/año'
    echo '✅ Plan Premium: $65/mes - $715/año (Popular)'
    echo '✅ Membresía Empresarial: Gratuita'
    echo ''
    echo '🌐 Recarga tu página /planes para verlos!'
    
else
    echo '❌ ERROR: No se pudieron subir los planes'
    exit 1
fi

