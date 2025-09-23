#!/usr/bin/env tsx
// 🚀 SCRIPT DE POBLADO DIRECTO DE BASE DE DATOS
// Ejecuta: npx tsx scripts/populate-database.ts

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { SEED_DATA } from '../server/seed-data.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no encontrada');
  process.exit(1);
}

console.log('🚀 Iniciando poblado directo de base de datos...');

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function populateDatabase() {
  try {
    // Limpiar datos existentes (solo si es necesario)
    console.log('🗑️ Limpiando datos existentes...');
    
    await sql`DELETE FROM companies WHERE id > 0`;
    await sql`DELETE FROM categories WHERE id > 0`;
    await sql`DELETE FROM membership_types WHERE id > 0`;
    await sql`DELETE FROM users WHERE id > 0`;
    await sql`DELETE FROM tags WHERE id > 0`;
    await sql`DELETE FROM certificates WHERE id > 0`;
    
    console.log('✅ Datos existentes eliminados');

    // Poblar planes de membresía
    console.log('📋 Poblando planes de membresía...');
    for (const plan of SEED_DATA.membershipTypes) {
      await sql`
        INSERT INTO membership_types (
          nombre_plan, descripcion_plan, beneficios, opciones_precios,
          visibilidad, stripe_product_id, cantidad_productos_admitidos,
          cantidad_proyectos_admitidos, cantidad_fotos_por_proyecto, mas_popular
        ) VALUES (
          ${plan.nombrePlan}, ${plan.descripcionPlan}, ${JSON.stringify(plan.beneficios)}, 
          ${JSON.stringify(plan.opcionesPrecios)}, ${plan.visibilidad}, ${plan.stripeProductId},
          ${plan.cantidadProductosAdmitidos}, ${plan.cantidadProyectosAdmitidos}, 
          ${plan.cantidadFotosPorProyecto}, ${plan.masPopular}
        )
      `;
    }
    console.log(`✅ ${SEED_DATA.membershipTypes.length} planes de membresía creados`);

    // Poblar categorías
    console.log('📂 Poblando categorías...');
    for (const category of SEED_DATA.categories) {
      await sql`
        INSERT INTO categories (nombre_categoria, descripcion, icono, icono_url)
        VALUES (${category.nombreCategoria}, ${category.descripcion}, ${category.icono}, ${category.iconoUrl})
      `;
    }
    console.log(`✅ ${SEED_DATA.categories.length} categorías creadas`);

    // Poblar etiquetas
    console.log('🏷️ Poblando etiquetas...');
    for (const tag of SEED_DATA.tags) {
      await sql`
        INSERT INTO tags (nombre, descripcion, color, is_active)
        VALUES (${tag.nombre}, ${tag.descripcion}, ${tag.color}, ${tag.isActive})
      `;
    }
    console.log(`✅ ${SEED_DATA.tags.length} etiquetas creadas`);

    // Poblar certificados
    console.log('🎓 Poblando certificados...');
    for (const cert of SEED_DATA.certificates) {
      await sql`
        INSERT INTO certificates (
          nombre_certificado, descripcion, imagen_url, fecha_emision,
          fecha_vencimiento, entidad_emisora, estado, asignacion_automatica,
          membership_plan_ids, creado_por_admin
        ) VALUES (
          ${cert.nombreCertificado}, ${cert.descripcion}, ${cert.imagenUrl},
          ${cert.fechaEmision}, ${cert.fechaVencimiento}, ${cert.entidadEmisora},
          ${cert.estado}, ${cert.asignacionAutomatica}, ${JSON.stringify(cert.membershipPlanIds)},
          ${cert.creadoPorAdmin}
        )
      `;
    }
    console.log(`✅ ${SEED_DATA.certificates.length} certificados creados`);

    // Poblar usuarios
    console.log('👥 Poblando usuarios...');
    for (const user of SEED_DATA.users) {
      await sql`
        INSERT INTO users (
          firebase_uid, email, display_name, photo_url, role,
          stripe_customer_id, stripe_subscription_id, auto_renewal
        ) VALUES (
          ${user.firebaseUid}, ${user.email}, ${user.displayName}, ${user.photoUrl},
          ${user.role}, ${user.stripeCustomerId}, ${user.stripeSubscriptionId}, ${user.autoRenewal}
        )
      `;
    }
    console.log(`✅ ${SEED_DATA.users.length} usuarios creados`);

    // Poblar empresas
    console.log('🏢 Poblando empresas...');
    for (const company of SEED_DATA.companies) {
      await sql`
        INSERT INTO companies (
          nombre_empresa, logotipo_url, telefono1, telefono2, email1, email2,
          direccion_fisica, ubicacion_geografica, representantes_ventas,
          descripcion_empresa, galeria_productos_urls, categories_ids,
          redes_sociales, catalogo_digital_url, videos_urls, membership_type_id,
          sitio_web, certificate_ids, tag_ids, membership_periodicidad,
          forma_pago, fecha_inicio_membresia, fecha_fin_membresia,
          notas_membresia, user_id, estado
        ) VALUES (
          ${company.nombreEmpresa}, ${company.logotipoUrl}, ${company.telefono1}, 
          ${company.telefono2}, ${company.email1}, ${company.email2},
          ${company.direccionFisica}, ${JSON.stringify(company.ubicacionGeografica)},
          ${JSON.stringify(company.representantesVentas)}, ${company.descripcionEmpresa},
          ${JSON.stringify(company.galeriaProductosUrls)}, ${JSON.stringify(company.categoriesIds)},
          ${JSON.stringify(company.redesSociales)}, ${company.catalogoDigitalUrl},
          ${JSON.stringify(company.videosUrls)}, ${company.membershipTypeId},
          ${company.sitioWeb}, ${JSON.stringify(company.certificateIds)},
          ${JSON.stringify(company.tagIds)}, ${company.membershipPeriodicidad},
          ${company.formaPago}, ${company.fechaInicioMembresia}, ${company.fechaFinMembresia},
          ${company.notasMembresia}, ${company.userId}, ${company.estado}
        )
      `;
    }
    console.log(`✅ ${SEED_DATA.companies.length} empresas creadas`);

    console.log('🎉 ¡Base de datos poblada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - ${SEED_DATA.membershipTypes.length} planes de membresía`);
    console.log(`   - ${SEED_DATA.categories.length} categorías`);
    console.log(`   - ${SEED_DATA.tags.length} etiquetas`);
    console.log(`   - ${SEED_DATA.certificates.length} certificados`);
    console.log(`   - ${SEED_DATA.users.length} usuarios`);
    console.log(`   - ${SEED_DATA.companies.length} empresas`);

  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
    process.exit(1);
  }
}

populateDatabase();