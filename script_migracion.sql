-- Script de migración para ANPR México
-- Creado: Mon Sep 22 10:00:44 PM UTC 2025
-- Base de datos: PostgreSQL
-- =========================================

-- 1. Crear extensiones necesarias si no existen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Configurar zona horaria
SET timezone = 'America/Mexico_City';

-- 3. Importar estructura y datos
\i backup_completo_final.sql

-- 4. Verificar importación
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Contar registros principales
SELECT 'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'companies' as tabla, COUNT(*) as registros FROM companies
UNION ALL  
SELECT 'categories' as tabla, COUNT(*) as registros FROM categories
UNION ALL
SELECT 'membership_types' as tabla, COUNT(*) as registros FROM membership_types
ORDER BY tabla;
