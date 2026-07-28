const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Tengeneza au fungua database
const DB_PATH = path.join(__dirname, 'smartfishhub.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Hitilafu ya database:', err.message);
  } else {
    console.log('Database imefunguliwa vizuri!');
  }
});

// Tengeneza majedwali yote
db.serialize(() => {

  // JEDWALI 1 — Mabwawa (Ponds)
  db.run(`CREATE TABLE IF NOT EXISTS ponds (
    pond_id INTEGER PRIMARY KEY AUTOINCREMENT,
    jina TEXT NOT NULL,
    aina TEXT DEFAULT 'pond',
    idadi_samaki INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // JEDWALI 2 — Rekodi za Kulisha
  db.run(`CREATE TABLE IF NOT EXISTS feeding_logs (
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
  )`);

  // JEDWALI 3 — Rekodi za Maji
  db.run(`CREATE TABLE IF NOT EXISTS water_logs (
    water_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pond_id INTEGER DEFAULT 1,
    joto REAL,
    do_mg REAL,
    ph REAL,
    hali_joto TEXT,
    hali_do TEXT,
    ushauri TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    jina TEXT NOT NULL,
    simu TEXT UNIQUE NOT NULL,
    nywila TEXT NOT NULL,
    role TEXT DEFAULT 'mfugaji',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('Majedwali yote yameundwa!');
});

module.exports = db;