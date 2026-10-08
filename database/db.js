const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'nagar_connect.db');
const SCHEMA_PATH = path.join(__dirname, 'schema', 'schema.sql');

let dbInstance = null;
let SQL = null;

// Initialize the SQLite database
async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(filebuffer);
  } else {
    dbInstance = new SQL.Database();
    // Run schema
    if (fs.existsSync(SCHEMA_PATH)) {
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
      dbInstance.run(schemaSql);
      saveDb();
    }
  }

  return dbInstance;
}

// Persist the in-memory SQLite state to disk
function saveDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save database to disk:', err);
  }
}

// Helper: Run a SELECT query and return an array of objects
async function query(sql, params = []) {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: Run a SELECT query and return the first row or null
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: Run an INSERT, UPDATE, or DELETE query and auto-persist
async function run(sql, params = []) {
  const db = await getDb();
  db.run(sql, params);
  saveDb();
  return { success: true };
}

// Helper: Execute raw multi-statement SQL
async function exec(sql) {
  const db = await getDb();
  db.run(sql);
  saveDb();
  return { success: true };
}

module.exports = {
  getDb,
  saveDb,
  query,
  queryOne,
  run,
  exec,
  DB_PATH
};
