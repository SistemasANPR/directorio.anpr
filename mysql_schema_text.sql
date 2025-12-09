-- ANPR México - Schema para MySQL (Hostinger)
-- Ejecutar este archivo en phpMyAdmin o MySQL Workbench

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `firebase_uid` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `display_name` VARCHAR(255),
  `photo_url` TEXT,
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  `temp_password` VARCHAR(255),
  `require_password_change` TINYINT(1) NOT NULL DEFAULT 0,
  `stripe_customer_id` VARCHAR(255),
  `stripe_subscription_id` VARCHAR(255),
  `auto_renewal` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_categoria` VARCHAR(255) NOT NULL,
  `descripcion` TEXT,
  `icono` VARCHAR(100) DEFAULT 'Tag',
  `icono_url` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de tags
CREATE TABLE IF NOT EXISTS `tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL UNIQUE,
  `descripcion` TEXT,
  `color` VARCHAR(20) DEFAULT '#3B82F6',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de tipos de membresía
CREATE TABLE IF NOT EXISTS `membership_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_plan` VARCHAR(255) NOT NULL,
  `descripcion_plan` TEXT,
  `opciones_precios` TEXT,
  `beneficios` TEXT,
  `visibilidad` VARCHAR(50) NOT NULL DEFAULT 'publica',
  `stripe_price_id` VARCHAR(255),
  `stripe_product_id` VARCHAR(255),
  `cantidad_productos_admitidos` INT DEFAULT 0,
  `cantidad_proyectos_admitidos` INT DEFAULT 0,
  `cantidad_fotos_por_proyecto` INT DEFAULT 5,
  `mas_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de empresas
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_empresa` VARCHAR(255) NOT NULL,
  `logotipo_url` TEXT,
  `foto_portada_url` TEXT,
  `telefono1` VARCHAR(50),
  `telefono2` VARCHAR(50),
  `email1` VARCHAR(255) NOT NULL,
  `email2` VARCHAR(255),
  `direccion_fisica` TEXT NOT NULL,
  `ubicacion_geografica` TEXT,
  `representantes_ventas` TEXT,
  `descripcion_empresa` TEXT,
  `galeria_productos_urls` TEXT,
  `categories_ids` TEXT,
  `redes_sociales` TEXT,
  `catalogo_digital_url` TEXT,
  `videos_urls` TEXT,
  `membership_type_id` INT,
  `sitio_web` VARCHAR(500),
  `certificate_ids` TEXT,
  `tag_ids` TEXT,
  `membership_periodicidad` VARCHAR(20),
  `forma_pago` VARCHAR(50),
  `fecha_inicio_membresia` VARCHAR(20),
  `fecha_fin_membresia` VARCHAR(20),
  `notas_membresia` TEXT,
  `user_id` INT,
  `estado` VARCHAR(50) NOT NULL DEFAULT 'activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de certificados
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_certificado` VARCHAR(255) NOT NULL,
  `imagen_url` TEXT NOT NULL,
  `descripcion` TEXT,
  `fecha_emision` VARCHAR(20),
  `fecha_vencimiento` VARCHAR(20),
  `entidad_emisora` VARCHAR(255),
  `estado` VARCHAR(50) NOT NULL DEFAULT 'activo',
  `asignacion_automatica` TINYINT(1) NOT NULL DEFAULT 0,
  `membership_plan_ids` TEXT,
  `creado_por_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL UNIQUE,
  `descripcion` TEXT,
  `permisos` TEXT,
  `es_rol_sistema` TINYINT(1) NOT NULL DEFAULT 0,
  `estado` VARCHAR(50) NOT NULL DEFAULT 'activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de opiniones
CREATE TABLE IF NOT EXISTS `opinions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT,
  `user_id` INT,
  `tipo` VARCHAR(50) NOT NULL DEFAULT 'empresa',
  `nombre` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `cargo` VARCHAR(255),
  `calificacion` INT NOT NULL,
  `comentario` TEXT NOT NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `estado` VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  `fecha_aprobacion` TIMESTAMP NULL,
  `aprobado_por` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`aprobado_por`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pagos de membresía
CREATE TABLE IF NOT EXISTS `membership_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `company_id` INT NOT NULL,
  `membership_type_id` INT NOT NULL,
  `stripe_payment_intent_id` VARCHAR(255) NOT NULL UNIQUE,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'usd',
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `site_name` VARCHAR(255) NOT NULL DEFAULT 'Directorio Industrial',
  `site_description` TEXT,
  `logo_url` TEXT,
  `favicon_url` TEXT,
  `primary_color` VARCHAR(20) NOT NULL DEFAULT '#2563eb',
  `secondary_color` VARCHAR(20) NOT NULL DEFAULT '#f97316',
  `accent_color` VARCHAR(20) NOT NULL DEFAULT '#10b981',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `currency_symbol` VARCHAR(10) NOT NULL DEFAULT '$',
  `language` VARCHAR(10) NOT NULL DEFAULT 'es',
  `timezone` VARCHAR(100) NOT NULL DEFAULT 'America/Mexico_City',
  `contact_email` VARCHAR(255),
  `contact_phone` VARCHAR(50),
  `address` TEXT,
  `social_media` TEXT,
  `seo_settings` TEXT,
  `email_settings` TEXT,
  `notification_emails` TEXT,
  `payment_settings` TEXT,
  `maintenance_mode` TINYINT(1) NOT NULL DEFAULT 0,
  `registration_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `max_file_size` INT NOT NULL DEFAULT 10485760,
  `allowed_file_types` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `nombre_proyecto` VARCHAR(255) NOT NULL,
  `descripcion_proyecto` TEXT,
  `category_id` INT,
  `fecha_inicio` DATE,
  `fecha_finalizacion` DATE,
  `ubicacion_pais` VARCHAR(100),
  `ubicacion_estado` VARCHAR(100),
  `ubicacion_ciudad` VARCHAR(100),
  `cliente_contratante` VARCHAR(255),
  `area_superficie` VARCHAR(100),
  `servicios_productos` TEXT,
  `galeria_imagenes` TEXT,
  `video_url` TEXT,
  `estado` VARCHAR(50) DEFAULT 'borrador',
  `estado_moderacion` VARCHAR(50) DEFAULT 'pendiente',
  `vistas` INT DEFAULT 0,
  `consultas` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de ubicaciones de empresas
CREATE TABLE IF NOT EXISTS `company_locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `lat` DOUBLE NOT NULL,
  `lng` DOUBLE NOT NULL,
  `address` TEXT NOT NULL,
  `country` VARCHAR(100),
  `state` VARCHAR(100),
  `city` VARCHAR(100),
  `is_principal` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración de integraciones
CREATE TABLE IF NOT EXISTS `integration_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `wordpress_url` TEXT,
  `api_key` TEXT,
  `api_secret` TEXT,
  `auth_method` VARCHAR(50) DEFAULT 'rest',
  `sync_enabled` TINYINT(1) DEFAULT 0,
  `sync_frequency` VARCHAR(50) DEFAULT 'daily',
  `memberpress_enabled` TINYINT(1) DEFAULT 0,
  `allowed_roles` TEXT,
  `last_sync` TIMESTAMP NULL,
  `sync_status` VARCHAR(50) DEFAULT 'never',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración de PDF
CREATE TABLE IF NOT EXISTS `pdf_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_name` VARCHAR(255) NOT NULL DEFAULT 'ANPR México',
  `company_subtitle` TEXT,
  `logo_url` TEXT,
  `website_url` VARCHAR(255) DEFAULT 'www.anpr.org.mx',
  `primary_color` VARCHAR(20) NOT NULL DEFAULT '#bcce16',
  `secondary_color` VARCHAR(20) NOT NULL DEFAULT '#2d3748',
  `accent_color` VARCHAR(20) NOT NULL DEFAULT '#f7fafc',
  `text_color` VARCHAR(20) NOT NULL DEFAULT '#000000',
  `subtitle_color` VARCHAR(20) NOT NULL DEFAULT '#505050',
  `header_height` INT NOT NULL DEFAULT 30,
  `font_size` INT NOT NULL DEFAULT 10,
  `title_font_size` INT NOT NULL DEFAULT 22,
  `show_logo` TINYINT(1) NOT NULL DEFAULT 1,
  `show_website` TINYINT(1) NOT NULL DEFAULT 1,
  `show_address` TINYINT(1) NOT NULL DEFAULT 1,
  `footer_text` TEXT,
  `address` TEXT,
  `phone` VARCHAR(50),
  `email` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración de email
CREATE TABLE IF NOT EXISTS `email_configuration` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider` VARCHAR(100) NOT NULL,
  `from_email` VARCHAR(255) NOT NULL,
  `from_name` VARCHAR(255) NOT NULL,
  `smtp_host` VARCHAR(255) NOT NULL,
  `smtp_port` INT NOT NULL,
  `encryption` VARCHAR(50) NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `test_email` VARCHAR(255),
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de plantillas de email
CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(100) NOT NULL UNIQUE,
  `subject` VARCHAR(500) NOT NULL,
  `html_content` TEXT NOT NULL,
  `variables` TEXT,
  `notification_timing` TEXT,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración de Stripe
CREATE TABLE IF NOT EXISTS `stripe_configuration` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `public_key` TEXT NOT NULL,
  `secret_key` TEXT NOT NULL,
  `webhook_secret` TEXT,
  `environment` VARCHAR(20) NOT NULL DEFAULT 'test',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración del frontend
CREATE TABLE IF NOT EXISTS `frontend_configuration` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `header_background_color` VARCHAR(20) DEFAULT '#ffffff',
  `header_background_image` TEXT,
  `header_text_color` VARCHAR(20) DEFAULT '#000000',
  `logo_url` TEXT,
  `logo_alt_text` VARCHAR(255) DEFAULT 'Logo',
  `site_name` VARCHAR(255) DEFAULT 'Directorio de Proveedores',
  `site_slogan` TEXT,
  `menu_items` TEXT,
  `menu_style` VARCHAR(50) DEFAULT 'horizontal',
  `menu_background_color` VARCHAR(20) DEFAULT '#ffffff',
  `menu_text_color` VARCHAR(20) DEFAULT '#000000',
  `menu_hover_color` VARCHAR(20) DEFAULT '#3B82F6',
  `show_login_button` TINYINT(1) DEFAULT 1,
  `show_register_button` TINYINT(1) DEFAULT 1,
  `footer_background_color` VARCHAR(20) DEFAULT '#1e3a8a',
  `footer_text_color` VARCHAR(20) DEFAULT '#ffffff',
  `footer_background_image` TEXT,
  `show_footer_logo` TINYINT(1) DEFAULT 1,
  `company_name` VARCHAR(255) DEFAULT 'ANPR México',
  `contact_phone` VARCHAR(50),
  `contact_email` VARCHAR(255),
  `contact_address` TEXT,
  `contact_hours` VARCHAR(255),
  `social_media_config` TEXT,
  `footer_sections` TEXT,
  `copyright_text` VARCHAR(255) DEFAULT '© 2025 Todos los derechos reservados',
  `privacy_policy_url` VARCHAR(500) DEFAULT '/privacy',
  `terms_of_service_url` VARCHAR(500) DEFAULT '/terms',
  `primary_color` VARCHAR(20) DEFAULT '#3B82F6',
  `secondary_color` VARCHAR(20) DEFAULT '#10B981',
  `accent_color` VARCHAR(20) DEFAULT '#F59E0B',
  `font_family` VARCHAR(100) DEFAULT 'Inter',
  `border_radius` VARCHAR(20) DEFAULT '8px',
  `custom_css` TEXT,
  `custom_head` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Fin del schema
