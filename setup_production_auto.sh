#!/bin/bash
# 🔥 SCRIPT AUTOMÁTICO DE MIGRACIÓN PARA PRODUCCIÓN
# ===============================================

echo '🚀 ANPR México - Configuración Automática de Producción'
echo '======================================================'

# Verificar que estamos en producción
if [ -z "$DATABASE_URL" ]; then
    echo '❌ Este script solo funciona en producción (necesita DATABASE_URL)'
    echo ''
    echo 'PARA DESARROLLO:'
    echo '1. La base de datos local ya está configurada'
    echo '2. Este script es solo para producción'
    exit 1
fi

echo '✅ Entorno de producción detectado'
echo '📊 Configurando base de datos automáticamente...'

# Ejecutar migración completa
psql $DATABASE_URL < backup_completo_final.sql

if [ $? -eq 0 ]; then
    echo ''
    echo '🎉 ¡CONFIGURACIÓN COMPLETADA!'
    echo '============================'
    echo '✅ Base de datos migrada exitosamente'
    echo '✅ Planes de membresía disponibles'
    echo '✅ Empresas y usuarios importados'
    echo '✅ Sistema completamente funcional'
    echo ''
    echo '🌐 Tu aplicación ANPR México está lista!'
    echo '📱 Accede desde tu dominio .replit.app'
    
    # Verificar datos principales
    echo ''
    echo '📊 RESUMEN DE DATOS:'
    psql $DATABASE_URL -c "
    SELECT 'Planes Públicos' as item, COUNT(*) as cantidad FROM membership_types WHERE visibilidad = 'publica'
    UNION ALL
    SELECT 'Empresas' as item, COUNT(*) as cantidad FROM companies
    UNION ALL  
    SELECT 'Usuarios' as item, COUNT(*) as cantidad FROM users
    ORDER BY item;"
    
else
    echo '❌ Error en la configuración'
    echo 'Revisa que el archivo backup_completo_final.sql esté presente'
    exit 1
fi