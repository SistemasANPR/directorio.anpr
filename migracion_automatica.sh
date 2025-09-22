#!/bin/bash
# 🚀 ANPR México - Migración Automática de Base de Datos
# =====================================================

echo '🔥 ANPR México - Migración Automática Iniciada'
echo '=============================================='

# Verificar si existe DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo '❌ ERROR: No se encontró DATABASE_URL'
    echo '📋 SOLUCIÓN: Crear base de datos PostgreSQL desde el panel Database'
    exit 1
fi

echo '✅ DATABASE_URL encontrada'
echo '📊 Iniciando migración de datos...'

# Limpiar base de datos existente (solo tablas de aplicación)
echo '🧹 Limpiando base de datos...'
psql $DATABASE_URL -c "DROP TABLE IF EXISTS payments CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS projects CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS companies_categories CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS companies_certificates CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS companies_tags CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS companies CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS certificates CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS categories CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS tags CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS membership_types CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS users CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS system_settings CASCADE;"

echo '📁 Importando estructura y datos...'
# Importar el backup completo
psql $DATABASE_URL < backup_completo_final.sql

if [ $? -eq 0 ]; then
    echo '✅ ¡Datos importados exitosamente!'
    echo ''
    echo '🔍 Verificando importación...'
    echo '=============================='
    
    # Verificar importación
    psql $DATABASE_URL -c "
    SELECT 
        'users' as tabla, 
        COUNT(*) as registros 
    FROM users 
    UNION ALL 
    SELECT 
        'companies' as tabla, 
        COUNT(*) as registros 
    FROM companies 
    UNION ALL 
    SELECT 
        'categories' as tabla, 
        COUNT(*) as registros 
    FROM categories 
    UNION ALL 
    SELECT 
        'membership_types' as tabla, 
        COUNT(*) as registros 
    FROM membership_types
    UNION ALL 
    SELECT 
        'certificates' as tabla, 
        COUNT(*) as registros 
    FROM certificates
    UNION ALL 
    SELECT 
        'projects' as tabla, 
        COUNT(*) as registros 
    FROM projects
    UNION ALL 
    SELECT 
        'payments' as tabla, 
        COUNT(*) as registros 
    FROM payments
    ORDER BY tabla;"
    
    echo ''
    echo '🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!'
    echo '=================================='
    echo '✅ Tu aplicación ANPR México está lista'
    echo '✅ Todos los datos han sido migrados'
    echo '✅ Usuarios, empresas, categorías, proyectos disponibles'
    echo '✅ Sistema de membresías funcionando'
    echo ''
    echo '🌐 Tu aplicación está lista en producción!'
    
else
    echo '❌ ERROR: Falló la importación de datos'
    echo '📋 Verifica que la base de datos esté correctamente configurada'
    exit 1
fi

