import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function formatDateForMySQL(dateStr) {
  if (!dateStr) return 'NULL';
  // Remove quotes and convert ISO format to MySQL format
  const clean = String(dateStr).replace(/"/g, '');
  if (clean.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return "'" + clean.slice(0, 19).replace('T', ' ') + "'";
  }
  return "'" + clean + "'";
}

function escapeValue(v, columnName) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return String(v);
  
  // Handle dates
  if (v instanceof Date) {
    return "'" + v.toISOString().slice(0, 19).replace('T', ' ') + "'";
  }
  
  // Check if column is a date column
  const dateColumns = ['created_at', 'updated_at', 'fecha_creacion', 'fecha_aprobacion', 'last_sync', 'fecha_inicio', 'fecha_finalizacion'];
  if (dateColumns.includes(columnName)) {
    return formatDateForMySQL(v);
  }
  
  if (typeof v === 'object') {
    // For JSON fields, ensure proper format
    const jsonStr = JSON.stringify(v);
    return "'" + jsonStr.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
  }
  
  // Regular string - escape properly
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
}

async function exportData() {
  const client = await pool.connect();
  
  try {
    // Order matters for foreign keys
    const tables = [
      'categories', 'tags', 'membership_types', 'users',
      'certificates', 'roles', 'system_settings',
      'integration_settings', 'pdf_settings', 'email_configuration',
      'email_templates', 'stripe_configuration', 'frontend_configuration',
      'companies', 'opinions', 'membership_payments', 'projects', 'company_locations'
    ];
    
    let output = '-- ANPR México - Data Export for MySQL (v2)\n';
    output += '-- Generated: ' + new Date().toISOString() + '\n\n';
    output += 'SET FOREIGN_KEY_CHECKS = 0;\n';
    output += 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n\n';
    
    for (const table of tables) {
      try {
        const result = await client.query('SELECT * FROM ' + table);
        
        if (result.rows.length > 0) {
          output += '-- Table: ' + table + '\n';
          output += 'DELETE FROM \`' + table + '\`;\n';
          
          for (const row of result.rows) {
            const columns = Object.keys(row).map(k => '\`' + k + '\`').join(', ');
            const values = Object.entries(row).map(([key, val]) => escapeValue(val, key)).join(', ');
            
            output += 'INSERT INTO \`' + table + '\` (' + columns + ') VALUES (' + values + ');\n';
          }
          output += '\n';
        }
      } catch (e) {
        // Table might not exist, skip it
      }
    }
    
    output += 'SET FOREIGN_KEY_CHECKS = 1;\n';
    
    console.log(output);
  } finally {
    client.release();
    await pool.end();
  }
}

exportData().catch(console.error);
