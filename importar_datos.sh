#!/bin/bash
# Script de importación para ANPR México
# =====================================

echo '🚀 Iniciando migración de base de datos ANPR México...'
echo '📊 Importando estructura y datos...'

# Importar el backup completo
psql $DATABASE_URL < backup_completo_final.sql

echo '✅ Datos importados exitosamente!'
echo '🔍 Verificando importación...'

# Verificar tablas principales
psql $DATABASE_URL -c "SELECT 'users' as tabla, COUNT(*) as registros FROM users 
UNION ALL SELECT 'companies' as tabla, COUNT(*) as registros FROM companies 
UNION ALL SELECT 'categories' as tabla, COUNT(*) as registros FROM categories 
UNION ALL SELECT 'membership_types' as tabla, COUNT(*) as registros FROM membership_types 
ORDER BY tabla;"

echo '🎉 ¡Migración completada!'
echo '💼 Tu aplicación ANPR México está lista en producción!'

