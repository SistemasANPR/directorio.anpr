import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { roles } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import ws from 'ws';

// Configure WebSocket for Neon
if (typeof WebSocket === 'undefined') {
  global.WebSocket = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const defaultRoles = [
  {
    nombre: 'Administrador',
    descripcion: 'Acceso completo al sistema con todos los permisos administrativos',
    permisos: [
      'gestionar_empresas',
      'gestionar_usuarios',
      'gestionar_roles',
      'gestionar_categorias',
      'gestionar_membresias',
      'gestionar_certificados',
      'moderar_opiniones',
      'moderar_proyectos',
      'ver_estadisticas',
      'configurar_sistema'
    ],
    esRolSistema: true
  },
  {
    nombre: 'Representante',
    descripcion: 'Representante de empresa con permisos para gestionar información empresarial',
    permisos: [
      'gestionar_empresa_propia',
      'gestionar_proyectos_propios',
      'ver_opiniones_empresa',
      'responder_opiniones'
    ],
    esRolSistema: true
  }
];

async function seedDefaultRoles() {
  console.log('🌱 Seeding default roles...');

  try {
    for (const roleData of defaultRoles) {
      // Check if role already exists
      const existingRole = await db.select()
        .from(roles)
        .where(eq(roles.nombre, roleData.nombre))
        .limit(1);

      if (existingRole.length === 0) {
        // Create new role
        await db.insert(roles).values(roleData);
        console.log(`✅ Created role: ${roleData.nombre}`);
      } else {
        // Update existing role to ensure it's marked as system role
        await db.update(roles)
          .set({ 
            esRolSistema: true,
            permisos: roleData.permisos,
            descripcion: roleData.descripcion
          })
          .where(eq(roles.nombre, roleData.nombre));
        console.log(`🔄 Updated role: ${roleData.nombre}`);
      }
    }

    console.log('✅ Default roles seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed function
seedDefaultRoles().catch(console.error);