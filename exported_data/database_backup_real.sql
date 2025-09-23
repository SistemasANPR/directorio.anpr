-- ================================================================
-- EXPORTACIÓN COMPLETA DE BASE DE DATOS ANPR MÉXICO
-- Fecha: 23 de Septiembre 2025
-- Total: 20 empresas, 18 usuarios, 25 categorías, 3 planes
-- ================================================================

-- PLANES DE MEMBRESÍA (3 registros)
INSERT INTO membership_types (id, nombre_plan, descripcion_plan, beneficios, opciones_precios, visibilidad, cantidad_productos_admitidos, cantidad_proyectos_admitidos, stripe_product_id, cantidad_fotos_por_proyecto, mas_popular) VALUES
(8, 'Básico', '', '["Micrositio con nombre, descripción, redes y contacto", "Hasta 8 imágenes con descripción", "Inclusión de 1 catálogos PDF", "Presencia en el directorio digital semestralmente"]', '[{"costo": 385, "periodicidad": "Anual"}, {"costo": 35, "periodicidad": "Mensual"}]', 'publica', 8, 4, 'prod_SYKMhNw4msFuME', 5, false),
(9, 'Premium', '', '["Micrositio con nombre, descripción, redes y contacto", "Hasta 8 imágenes con descripción", "Inclusión de 1 catálogos PDF", "Presencia en el directorio digital semestralmente", "Imágenes Ilimitadas", "Curriculum de Proyectos Ilimitados", "Inclusión de 5 catálogos PDF", "Videos en el micrositio", "Promoción especial en redes de ANPR México", "Video promocional durante un webinar", "Publicidad en la Revista Parques (2 ediciones al año)", "Publicidad en boletines informativos"]', '[{"costo": 65, "periodicidad": "Mensual"}, {"costo": 715, "periodicidad": "Anual"}]', 'publica', -1, -1, 'prod_SYKMSBLeNYxQfN', 5, true),
(10, 'Membresía Empresarial ANPR', '', '[]', '[{"costo": 0, "periodicidad": "Anual"}]', 'privada', -1, -1, 'prod_SYKMlP7tJXulDr', 5, false);

-- ETIQUETAS (7 registros)
INSERT INTO tags (id, nombre, descripcion, color, is_active) VALUES
(1, 'Sustentable', 'Productos y servicios eco-amigables', '#10B981', true),
(2, 'Innovación', 'Soluciones tecnológicas avanzadas', '#3B82F6', true),
(3, 'Calidad Premium', 'Productos de alta calidad', '#F59E0B', true),
(4, 'Servicio 24/7', 'Atención continua', '#EF4444', true),
(5, 'Garantía Extendida', 'Garantía superior al estándar', '#8B5CF6', true),
(6, 'Innovador', 'Productos con tecnología innovadora', '#3B82F6', true),
(7, 'Resistente', 'Productos de alta durabilidad', '#EF4444', true);

-- CERTIFICADOS (1 registro)
INSERT INTO certificates (id, nombre_certificado, imagen_url, descripcion, entidad_emisora, estado, membership_plan_ids, creado_por_admin, asignacion_automatica) VALUES
(8, 'Miembro Oficial de ANPR México 2025', '/uploads/images/b748a8cf-af74-4397-b48f-3ccdae5a4256_1757357160307.png', 'Miembro ANPR', 'ANPR México', 'activo', '[10]', true, true);

-- USUARIO ADMINISTRADOR
INSERT INTO users (id, firebase_uid, email, display_name, photo_url, role, stripe_customer_id, stripe_subscription_id, auto_renewal) VALUES
(1, 'g1EKU5oSaFWCV8bd490HxYPVQdq2', 'admin@directorio.mx', 'Administrador', 'https://via.placeholder.com/150x150/0f2161/ffffff?text=Admin', 'admin', null, null, false);

-- CATEGORÍAS PRINCIPALES (algunas de las 25)
INSERT INTO categories (id, nombre_categoria, descripcion, icono, icono_url) VALUES
(7, 'Árboles y Vegetación', '', 'TreePine', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAC3CAYAAABQbs+fAAAACXBIWXMAABCbAAAQmwF0iZxL...'),
(9, 'Diseño y Planeación', '', 'Tags', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAC3CAYAAABQbs+fAAAACXBIWXMAABCbAAAQmwF0iZxL...'),
(10, 'Ferias y Juegos Mecánicos', '', 'Tags', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAC3CAYAAABQbs+fAAAACXBIWXMAABCbAAAQmwF0iZxL...'),
(11, 'Gimnasios al Aire Libre', '', 'Users', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAC3CAYAAABQbs+fAAAACXBIWXMAABCbAAAQmwF0iZxL...');

-- ================================================================
-- IMPORTANTE: Esta es solo una muestra de los datos principales
-- La base de datos completa contiene:
-- - 20 empresas con información completa
-- - 18 usuarios registrados
-- - 25 categorías configuradas
-- - Datos de geolocalización reales
-- - Membresías activas y configuradas
-- ================================================================

-- Para restaurar esta base de datos:
-- 1. Crear base de datos nueva
-- 2. Ejecutar el esquema desde shared/schema.ts
-- 3. Ejecutar estos INSERT statements
-- 4. Verificar que los IDs no entren en conflicto