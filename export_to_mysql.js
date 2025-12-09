const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function exportData() {
  const client = await pool.connect();
  
  try {
    // Get all tables data
    const tables = [
      'users', 'categories', 'tags', 'membership_types', 'companies', 
      'certificates', 'roles', 'opinions', 'membership_payments',
      'system_settings', 'projects', 'company_locations',
      'integration_settings', 'pdf_settings', 'email_configuration',
      'email_templates', 'stripe_configuration', 'frontend_configuration'
    ];
    
    let output = '-- ANPR México - Data Export for MySQL\n';
    output += '-- Generated: ' + new Date().toISOString() + '\n\n';
    output += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT * FROM ${table}`);
        
        if (result.rows.length > 0) {
          output += `-- Table: ${table}\n`;
          
          for (const row of result.rows) {
            const columns = Object.keys(row).map(k => '`' + k + '`').join(', ');
            const values = Object.values(row).map(v => {
              if (v === null) return 'NULL';
              if (typeof v === 'boolean') return v ? '1' : '0';
              if (typeof v === 'object') return "'" + JSON.stringify(v).replace(/'/g, "''") + "'";
              if (v instanceof Date) return "'" + v.toISOString().slice(0, 19).replace('T', ' ') + "'";
              return "'" + String(v).replace(/'/g, "''") + "'";
            }).join(', ');
            
            output += `INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`;
          }
          output += '\n';
        }
      } catch (e) {
        output += `-- Table ${table} not found or empty\n\n`;
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
