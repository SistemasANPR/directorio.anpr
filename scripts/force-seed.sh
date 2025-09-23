#!/bin/bash
# 🚀 SCRIPT PARA FORZAR EL SEEDING DE LA BASE DE DATOS

echo "🌱 Iniciando seeding forzado de ANPR México..."

# Verificar que existe DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no está configurada"
    exit 1
fi

echo "✅ DATABASE_URL configurada"

# Ejecutar seeding via API
echo "📡 Ejecutando seeding vía API..."
curl -X POST "${REPLIT_APP_URL:-http://localhost:5000}/api/seed" \
  -H "Content-Type: application/json" \
  -H "X-Seed-Token: anpr_seed_2025" \
  --max-time 60

echo ""
echo "✅ Seeding completado"

# Verificar estado
echo "📊 Verificando estado de la base de datos..."
curl -s "${REPLIT_APP_URL:-http://localhost:5000}/api/seed/status" | jq '.'

echo ""
echo "🎉 ¡Proceso terminado!"