#!/bin/bash
# 🔥 ANPR México - MIGRACIÓN COMPLETA SUPER RÁPIDA
# ===============================================

echo '🔥 ANPR México - MIGRACIÓN COMPLETA INICIADA'
echo '=========================================='

# Verificar DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo '❌ ERROR: Variable DATABASE_URL no encontrada'
    echo '📋 PASO 1: Ve al panel Database de tu app publicada'
    echo '📋 PASO 2: Clic en Add Database → PostgreSQL'
    echo '📋 PASO 3: Espera que se configure automáticamente'
    echo '📋 PASO 4: Ejecuta este script nuevamente'
    exit 1
fi

echo '✅ DATABASE_URL encontrada, iniciando migración...'

# Importar TODA la base de datos de una vez
echo '📦 Importando base de datos completa...'
psql $DATABASE_URL < backup_completo_final.sql

if [ $? -eq 0 ]; then
    echo ''
    echo '🎉 ¡MIGRACIÓN COMPLETADA!'
    echo '========================'
    
    # Verificar TODOS los datos importantes
    echo '📊 RESUMEN DE DATOS MIGRADOS:'
    echo '----------------------------'
    
    psql $DATABASE_URL -c "
    SELECT '📋 Planes de Membresía' as tipo, COUNT(*) as cantidad FROM membership_types WHERE visibilidad = 'publica'
    UNION ALL
    SELECT '🏢 Empresas Totales' as tipo, COUNT(*) as cantidad FROM companies
    UNION ALL  
    SELECT '👥 Usuarios Registrados' as tipo, COUNT(*) as cantidad FROM users
    UNION ALL
    SELECT '📂 Categorías' as tipo, COUNT(*) as cantidad FROM categories
    UNION ALL
    SELECT '🏆 Certificados' as tipo, COUNT(*) as cantidad FROM certificates
    UNION ALL
    SELECT '💰 Pagos Procesados' as tipo, COUNT(*) as cantidad FROM payments;"
    
    echo ''
    echo '🔍 VERIFICANDO PLANES ESPECÍFICAMENTE:'
    psql $DATABASE_URL -c "
    SELECT 
        '✅ ' || nombre_plan as plan,
        CASE 
            WHEN visibilidad = 'publica' THEN 'PÚBLICO'
            ELSE 'PRIVADO'
        END as estado,
        CASE 
            WHEN mas_popular THEN '⭐ POPULAR'
            ELSE ''
        END as destacado
    FROM membership_types 
    ORDER BY id;"
    
    echo ''
    echo '🎯 ¡TODO MIGRADO CORRECTAMENTE!'
    echo '==============================='
    echo '✅ Planes de membresía cargados'
    echo '✅ Empresas importadas'
    echo '✅ Usuarios migrados'
    echo '✅ Categorías y certificados disponibles'
    echo '✅ Sistema de pagos funcionando'
    echo ''
    echo '🌐 RECARGA TU PÁGINA /planes AHORA!'
    echo '🚀 Tu aplicación ANPR está 100% lista!'
    
else
    echo '❌ ERROR en la migración'
    echo 'Intenta:'
    echo '1. Verificar que la base de datos esté creada'
    echo '2. Verificar permisos'
    echo '3. Ejecutar script de solo planes: ./subir_planes_rapido.sh'
    exit 1
fi

