// ============================================================
// NAGAR CONNECT - DATABASE CONNECTION (SQLite via node:sqlite)
// ============================================================

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'nagar.sqlite');
const db = new DatabaseSync(dbPath);

// Enable foreign key constraints and WAL mode for high concurrent performance
try {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
} catch (e) {
  console.warn('SQLite PRAGMA warning:', e.message);
}

module.exports = {
  db,
  
  // Execute a multi-statement DDL/SQL string
  exec(sql) {
    return db.exec(sql);
  },

  // Query returning all rows
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  // Query returning a single row
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },

  // Execute INSERT / UPDATE / DELETE
  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  // Run within a transaction
  transaction(fn) {
    db.exec('BEGIN TRANSACTION;');
    try {
      const result = fn();
      db.exec('COMMIT;');
      return result;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
};
