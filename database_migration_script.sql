-- ===================================================================
-- ANPR México - Script de Migración de Base de Datos a Producción
-- Fecha: 2025-09-24
-- Descripción: Exportación de datos de desarrollo para importar en producción
-- ===================================================================

-- IMPORTANTE: Ejecutar estos comandos en el siguiente orden:
-- 1. Primero crear las tablas con el schema actual
-- 2. Luego insertar los datos en este orden específico

-- ===================================================================
-- 1. LIMPIEZA INICIAL (Solo si es necesario)
-- ===================================================================
-- TRUNCATE TABLE opinions CASCADE;
-- TRUNCATE TABLE membership_payments CASCADE;
-- TRUNCATE TABLE projects CASCADE;
-- TRUNCATE TABLE companies CASCADE;
-- TRUNCATE TABLE certificates CASCADE;
-- TRUNCATE TABLE tags CASCADE;
-- TRUNCATE TABLE categories CASCADE;
-- TRUNCATE TABLE membership_types CASCADE;
-- TRUNCATE TABLE users CASCADE;
-- TRUNCATE TABLE roles CASCADE;

-- ===================================================================
-- 2. ROLES (Insertar primero - sistema de permisos)
-- ===================================================================
INSERT INTO roles (id, nombre, descripcion, permisos, es_rol_sistema, estado, created_at, updated_at) VALUES
(1, 'admin', 'Administrador del sistema', '["all"]', true, 'activo', NOW(), NOW()),
(2, 'representante', 'Representante de empresa', '["company_edit", "company_view"]', true, 'activo', NOW(), NOW());

-- ===================================================================
-- 3. USUARIOS ADMINISTRADORES (Solo los esenciales)
-- ===================================================================
INSERT INTO users (id, firebase_uid, email, display_name, role, created_at, updated_at) VALUES
(1, 'admin-directorio-uid', 'admin@directorio.mx', 'Administrador', 'admin', NOW(), NOW()),
(12, 'sistemas-anpr-uid', 'sistemas@anpr.org.mx', 'Administrador Sistema', 'admin', NOW(), NOW()),
(86, 'sistemas-anpr-gmail-uid', 'sistemas.anpr@gmail.com', 'Sistemas ANPR', 'admin', NOW(), NOW()),
(87, 'gabo43211-uid', 'gabo43211@gmail.com', 'Gabriel Andrade', 'admin', NOW(), NOW()),
(89, 'admin-anpr-uid', 'admin@anpr.org.mx', 'Administrador ANPR', 'admin', NOW(), NOW());

-- ===================================================================
-- 4. CONFIGURACIONES DEL SISTEMA
-- ===================================================================
INSERT INTO system_settings (configuracion, estado, created_at, updated_at) 
SELECT configuracion, estado, created_at, updated_at FROM system_settings WHERE id = 1;

INSERT INTO email_configuration (smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active, created_at, updated_at)
SELECT smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active, created_at, updated_at FROM email_configuration WHERE id = 1;

INSERT INTO frontend_configuration (configuracion, created_at, updated_at)
SELECT configuracion, created_at, updated_at FROM frontend_configuration WHERE id = 1;

INSERT INTO stripe_configuration (publishable_key, webhook_secret, is_active, created_at, updated_at)
SELECT publishable_key, webhook_secret, is_active, created_at, updated_at FROM stripe_configuration WHERE id = 1;

INSERT INTO integration_settings (configuracion, created_at, updated_at)
SELECT configuracion, created_at, updated_at FROM integration_settings WHERE id = 1;

INSERT INTO pdf_settings (configuracion, created_at, updated_at)
SELECT configuracion, created_at, updated_at FROM pdf_settings WHERE id = 1;

-- ===================================================================
-- 5. TIPOS DE MEMBRESÍA
-- ===================================================================
-- (Insertar manualmente desde la consulta que haremos después)

-- ===================================================================
-- 6. CATEGORÍAS
-- ===================================================================
-- (Insertar manualmente desde la consulta que haremos después)

-- ===================================================================
-- 7. TAGS
-- ===================================================================
-- (Insertar manualmente desde la consulta que haremos después)

-- ===================================================================
-- 8. CERTIFICADOS
-- ===================================================================
-- (Insertar manualmente desde la consulta que haremos después)

-- ===================================================================
-- 9. EMPRESAS Y DATOS RELACIONADOS
-- ===================================================================
-- (Se insertarán después de obtener los datos)

-- ===================================================================
-- COMANDOS PARA EXPORTAR DATOS (Ejecutar en desarrollo)
-- ===================================================================

-- Obtener tipos de membresía:
-- SELECT * FROM membership_types ORDER BY id;

-- Obtener categorías:
-- SELECT * FROM categories ORDER BY id;

-- Obtener tags:
-- SELECT * FROM tags ORDER BY id;

-- Obtener certificados:
-- SELECT * FROM certificates ORDER BY id;

-- Obtener empresas:
-- SELECT * FROM companies ORDER BY id;

-- Obtener usuarios representantes:
-- SELECT * FROM users WHERE role = 'representante' ORDER BY id;

-- Obtener opiniones:
-- SELECT * FROM opinions ORDER BY id;

-- Obtener proyectos:
-- SELECT * FROM projects ORDER BY id;