// ============================================================
// NAGAR CONNECT - DATABASE INITIALIZATION & MIGRATIONS RUNNER
// ============================================================

const fs = require('fs');
const path = require('path');
const db = require('../../backend/config/db');

function runMigrations() {
  console.log('🏛️ NAGAR CONNECT: Initializing database schema...');
  
  const schemaDir = path.resolve(__dirname, '../schema');
  const schemaFiles = [
    '01_foundation.sql',
    '02_citizen.sql',
    '03_officer.sql'
  ];

  for (const file of schemaFiles) {
    const filePath = path.join(schemaDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`Executing schema: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      db.exec(sql);
    } else {
      console.warn(`Warning: Schema file not found: ${filePath}`);
    }
  }

  console.log(' Database schemas created successfully.');
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
