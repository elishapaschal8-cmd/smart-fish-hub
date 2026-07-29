const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'smartfishhub.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    jina TEXT NOT NULL,
    simu TEXT UNIQUE NOT NULL,
    nywila TEXT NOT NULL,
    role TEXT DEFAULT 'mfugaji',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feeding_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pond_id INTEGER DEFAULT 1,
    idadi INTEGER,
    abw_gramu REAL,
    joto REAL,
    do_mg REAL,
    feed_response TEXT,
    biomass_kg REAL,
    target_feed_kg REAL,
    adjusted_feed_kg REAL,
    environmental_multiplier REAL,
    confidence INTEGER,
    category TEXT,
    sababu TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS water_logs (
    water_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pond_id INTEGER DEFAULT 1,
    joto REAL,
    do_mg REAL,
    ph REAL,
    hali_joto TEXT,
    hali_do TEXT,
    ushauri TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('Database imefunguliwa vizuri!');

module.exports = db;