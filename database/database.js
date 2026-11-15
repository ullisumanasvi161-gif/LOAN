const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to SQLite database file
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'labkit.db');

// Initialize database connection
const db = new Database(dbPath);

// Enable SQLite foreign key enforcement
db.pragma('foreign_keys = ON');

// Initialize database schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

module.exports = db;
