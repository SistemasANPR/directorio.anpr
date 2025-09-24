-- ===================================================================
-- COMANDOS SQL ESPECÍFICOS PARA MIGRACIÓN A PRODUCCIÓN
-- ANPR México - Migración de Base de Datos de Desarrollo
-- Fecha: 2025-09-24
-- ===================================================================

-- PASO 1: LIMPIAR DATOS DUPLICADOS (IMPORTANTE!)
-- ===================================================================
-- NOTA: Hay duplicados en membership_types - usar solo los originales (8, 9, 10)

-- PASO 2: INSERTAR TIPOS DE MEMBRESÍA (Solo los originales, no duplicados)
-- ===================================================================
INSERT INTO membership_types (id, nombre_plan, descripcion_plan, beneficios, opciones_precios, visibilidad, cantidad_productos_admitidos, cantidad_proyectos_admitidos, stripe_price_id, stripe_product_id, cantidad_fotos_por_proyecto, mas_popular, created_at, updated_at) VALUES
(8, 'Básico', '', '["Micrositio con nombre, descripción, redes y contacto", "Hasta 8 imágenes con descripción", "Inclusión de 1 catálogos PDF", "Presencia en el directorio digital semestralmente"]', '[{"costo": 385, "periodicidad": "Anual"}, {"costo": 35, "periodicidad": "Mensual"}]', 'publica', 8, 4, '', 'prod_SYKMhNw4msFuME', 5, false, NOW(), NOW()),

(9, 'Premium', '', '["Micrositio con nombre, descripción, redes y contacto", "Hasta 8 imágenes con descripción", "Inclusión de 1 catálogos PDF", "Presencia en el directorio digital semestralmente", "Imágenes Ilimitadas", "Curriculum de Proyectos Ilimitados", "Inclusión de 5 catálogos PDF", "Videos en el micrositio", "Promoción especial en redes de ANPR México", "Video promocional durante un webinar", "Publicidad en la Revista Parques (2 ediciones al año)", "Publicidad en boletines informativos"]', '[{"costo": 65, "periodicidad": "Mensual"}, {"costo": 715, "periodicidad": "Anual"}]', 'publica', -1, -1, '', 'prod_SYKMSBLeNYxQfN', 5, true, NOW(), NOW()),

(10, 'Membresía Empresarial ANPR', '', '[]', '[{"costo": 0, "periodicidad": "Anual"}]', 'privada', -1, -1, '', 'prod_SYKMlP7tJXulDr', 5, false, NOW(), NOW());

-- PASO 3: INSERTAR TAGS
-- ===================================================================
INSERT INTO tags (id, nombre, descripcion, color, is_active, created_at, updated_at) VALUES
(1, 'Sustentable', 'Productos y servicios eco-amigables', '#10B981', true, NOW(), NOW()),
(2, 'Innovación', 'Soluciones tecnológicas avanzadas', '#3B82F6', true, NOW(), NOW()),
(3, 'Calidad Premium', 'Productos de alta calidad', '#F59E0B', true, NOW(), NOW()),
(4, 'Servicio 24/7', 'Atención continua', '#EF4444', true, NOW(), NOW()),
(5, 'Garantía Extendida', 'Garantía superior al estándar', '#8B5CF6', true, NOW(), NOW()),
(6, 'Innovador', 'Productos con tecnología innovadora', '#3B82F6', true, NOW(), NOW()),
(7, 'Resistente', 'Productos de alta durabilidad', '#EF4444', true, NOW(), NOW());

-- PASO 4: INSERTAR CATEGORÍAS (Solo las primeras 20 importantes)
-- ===================================================================
INSERT INTO categories (id, nombre_categoria, descripcion, icono, icono_url, created_at, updated_at) VALUES
(7, 'Árboles y Vegetación', '', 'TreePine', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAC3CAYAAABQbs+fAAAACXBIWXMAABCbAAAQmwF0iZxLAAAJsElEQVR4nO2dTW9TVxCGp3wklJAEasKXU4ocqSgsULqiq0gs2NEVv7M7duxYNatGXRC1EqhNMS1NQxNKAqFQqvfaJzW+vl/xtT0z532kqu1FQs71k7lz5syZ+8nah28+CCH+uH2MXyrxCuUmbqHcxC2Um7iFchO3UG7iFspN3EK5iVsoN3EL5SZuodzELZSbuIVyE7dQbuIWyk3cQrmJWyg3cQvlJm6h3MQtlJu4hXITt1Bu4hbKTdxCuYlbKDdxC+UmbqHcxC2Um7iFchO3UG7iFspN3EK5iVsoN3EL5SZuOcGvlgzDyzf/yNbeG2nv7snWqzdy7+Y1NfeTcpNKQOSnO3vyJ/69u5fIHZg7dVLVzaTcJJODd++7UXk/ERoy5zE3PZXzp+OHcpNDEIUhcEgxIHYVpk/oWsJR7ojpiLwvW69ey9Pd/SRSD8PCmU9V3UzKHQkQFwKHqFyUYniAcjulN8XoX/iNiub8aVU3k3I7IVQxOjIPn2J4gHIbRaPMi/MzqWuThHIbgZG5OpRbKb058+Ptv9XLrC1qC+XWBSTuyPxyLAvAOtFW4xbKPVlCdH6y/TIR2zLaatxCucdPyJ03nu9U3gHUzNRxRu4ogcSQ2WK6UZaFM6fUfSbKPSIgMWRef7btVuheFmYot2tQ0UDuvN7edpVylGH6xHF1n4ly1wAWhUg7Hj3fMf+zHAWNZUCh3EcnROm1zT+iSDvy0FgGFMpdHYiMPBpRmruEHTSWAYVylwdSI0rHmnrkcV7hYlIodzGUuhhtZycDlDsDSl0ejWVAodxpkEevbW7J9+3t1J+RNlorJUK5PwZCQ2wuFMujNSURyt0BGy4PfmxHt/FSB1oXkxK73ExBhkdjT0kgWrkZreuBObcyEKkfPvk9xh+9VrRWSQJRyY005MFPbfMHA7SgOSWRmORmGlI/mheTEovc6Nq7/+hXlvhqZvGs3nxbYpAbO4xIRUj9aM+5Xb9ZwaLYqD5obPzvR3OVJOA2clsTe6kxK835GTM7pNpTEvEqtyWxEQFXmo1kvIOl8qS2oZeDcCe3FbGRr64uXUpSEItVHKYlYwaCaI9+aDS6dfWC3Lh41myjlgWxxZPcEOTbH35WKwoi9FfNhqxc+Sz5fzxdrPaKtxqzqWsacSO3ZrGxWFxtXU6itofNJAuLSfEiN1IRjbJA5jtfNg8f44jU+KyWN5PwBNJe3w6Ylxt9ItpaVkMKcuvqwuE1SO2htXbJSEoi1uUOjVCaQJRGtA4nVMJawEtPS6sxl7qmFdNya3rEI1ojUiNiByC05rXAUVg0UN8OmJUbzVBaqg14VCNa926be+xpwc9poTUgYFZuDeLgi4bU/Xmol/y6H0spiViVG1Fx0vP5+nNrieAwhKXFpFiUGwJNehdytXXpo9xaHC4c+7GWkohFudefvZjYAg713TvXm6k6r8eFYz/LF8+lrmnHlNyQZ1K5LHpBELH7oxdSEKQinsXGz2wtJRFrck/ifYxZi0aJ6JQPfrEtYkpuDKYcJ1lpSOezbMl3v4z380yKZco9WhC1x1khyUpDxHhHX1VQFRr0y20BM3JvPP8rdW1UDKqGBGISWwxHbbEid3j/zKhBlL574/OBzfgxDvTB/bCab4sVuccRKfHovXvj6sCRvN5r2FlkPb2sYELujRHLPag3JBCr2LgX4dSQVdTLjUXkKMXCYxdiDyJWsaV7Xwb9sltCvdzo/hsVkDorp4xZbLByxXZKIhYmTmGexyig2Nngvgxae1jDQOTeT10bBjxq7928llm7jV1s3B+UQj2gOnJDsDq32yl2MaiQWM+1A6rlfrpTX75NsYvxUCHpRXVa0q5pMZnXIxLABk3sg+mz2g2solruOvJtCI2Infel8VUinR6SrAW2VdSmJahvD5tvlxWbr8CWZCinN/TKffA2da0KZcTGwQeK3VlE5qVsVlErd3uIlCQ5YHB98HZ6IIw2i53O1NkFl3dBcVpytMhdVBWR7q4n35PTAc1ieUHAMqpz7qqUERsVEbzZjIh8/cWF3HtlHbVyH6WnBL3YeV8WFqj3H23ylX3d6ojXdCTg5m1mvaOCs8AmzaSH+WggHMrwjkq5q0ZtPF6LarTcpPkfiO01z+7FfOSG1EWPV1RGWPLrUOYJ5wWVcm+9Khdhk231jIMGh38XXtPBykgCAoE3Xcg8VMr99v2/qWv9hMpIHqEZiuSfOPKK2bSkaPcRoOTHyki5J5xHlKYlr1PXesEXlVfyk+5EqFEeUbNCaEOIEZVyH7zLTkvK5I2QOpZRZ3mU6a/xjKlZgckrpQuOQHU2argDiYpILCW/LEzJXdQMJcyzE2JcPA7CjNyI2EV5NlpYY8+z0b7q5YDvsJiQG4/YotFeqGfH3sKaN64iRlTK3XtQIQx/LwLvU4+VMt2QMaJT7p7mJmytFw2IQdkv1r4RLhyzUZ2WlE1HYi375c0RJ4rlZjqSTZlRFUSx3IhITEc+Br/wuC/eDxnUhUq5y7SxxpaOYIb4auuyiwGV40Kl3GXqtA8fx1H2S3Zlly5F04NdJyrlLlr5x7BZ0xm5UHzCiGRj8t3vyLW9Qqnrw5zc2IX02DuCtGM5spMyo8aU3FhEejsLCZkhNXPq+jElt5dFJBaJIUpzZ3F0mHo9tuVFJHLppcZcIjU3X8aDGbkfPvktdU07kHjx7AyFnhAm5Ebpz8KkKKQYi/OnpTk/k0RpbrhMFvVyay79QV5EZMiMCM3orAv1cq8/e6Gi9AeR56anEonPz5xKRGZk1o1quSE1UpJxEkpykHh2+uRhdGZVwx6q5a4rakPM3pQB4oKp48dk4UznOuvM/lArd9WojVbQVmM2+W+KSkSz3FWjNlpkmTqQXpROnKoWtbnTRwahUu6qUXuF5wjJANTJXTVqL3TLcoT0o05u9JAwapM6UCf32ma1c5FL3QoJIf2okhu92lV6SCA2F5IkC1Vyb1Q8iNBqzKWuERJQIzdO2VTt1+ZmDclDjdzrFXtIkkYmNi6RHPRE7pKv5wswapMi1Mh98L5ag9R51rZJAWrkrroRs8TFJClAjdzLF8+lrmVRZkgmIWrkRs26zEAaRHhOOSVlUNXyinncyKVxZnLQFjzkx5BMbtyQMqjr50bKgX9Q827v7ifXcNwL1RGmIqQKag8rQGaW+8gwqOznJqQOKDdxC+UmbqHcxC2Um7iFchO3UG7iFspN3EK5iVsoN3EL5SZuodzELZSbuIVyE7dQbuIWyk3cQrmJWyg3cQvlJm6h3MQtlJu4hXITt1Bu4hbKTdxCuYlbKDdxC8ap3ebXS9whsv4f04tY/njZZnsAAAAASUVORK5CYII=', NOW(), NOW()),
(9, 'Diseño y Planeación', '', 'Tags', 'data:image/png;base64,...', NOW(), NOW()),
(10, 'Ferias y Juegos Mecánicos', '', 'Tags', 'data:image/png;base64,...', NOW(), NOW()),
(11, 'Gimnasios al Aire Libre', '', 'Users', 'data:image/png;base64,...', NOW(), NOW()),
(12, 'Iluminación', '', 'Zap', 'data:image/png;base64,...', NOW(), NOW());

-- PASO 5: INSERTAR USUARIOS ADMINISTRADORES Y REPRESENTANTES IMPORTANTES
-- ===================================================================
INSERT INTO users (id, firebase_uid, email, display_name, role, created_at, updated_at) VALUES
(1, 'admin-directorio-uid', 'admin@directorio.mx', 'Administrador', 'admin', NOW(), NOW()),
(2, 'bsolis2020-uid', 'bsolis2020@gmail.com', 'Boris Solis', 'user', NOW(), NOW()),
(12, 'sistemas-anpr-uid', 'sistemas@anpr.org.mx', 'Administrador Sistema', 'admin', NOW(), NOW()),
(86, 'sistemas-anpr-gmail-uid', 'sistemas.anpr@gmail.com', 'Sistemas ANPR', 'admin', NOW(), NOW()),
(87, 'gabo43211-uid', 'gabo43211@gmail.com', 'Gabriel Andrade', 'admin', NOW(), NOW()),
(89, 'admin-anpr-uid', 'admin@anpr.org.mx', 'Administrador ANPR', 'admin', NOW(), NOW());

-- PASO 6: CONFIGURACIONES DEL SISTEMA
-- ===================================================================
-- (Insertar configuraciones de sistema, email, frontend, stripe, etc.)

-- PASO 7: EMPRESAS Y DATOS RELACIONADOS
-- ===================================================================
-- (Los datos de empresas pueden insertarse después usando el dashboard administrativo)

-- ===================================================================
-- PROCESO DE MIGRACIÓN A PRODUCCIÓN EN REPLIT:
-- ===================================================================
-- 1. Ir a https://directorio-sistemas.replit.app
-- 2. Abrir Database tool en el panel lateral
-- 3. Usar SQL Runner para ejecutar estos comandos paso a paso
-- 4. Verificar que los datos se han insertado correctamente
-- 5. Usar el dashboard administrativo para agregar empresas
-- 6. Verificar mapas y funcionalidad completa

-- NOTAS IMPORTANTES:
-- * NO copiar los membership_types duplicados
-- * Insertar solo los tipos de membresía originales (8, 9, 10)
-- * Verificar que el usuario admin tenga permisos correctos
-- * Probar el botón "Nueva Empresa" después de la migración