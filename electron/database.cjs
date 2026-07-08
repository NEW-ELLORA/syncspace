const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db = null;
let dbPath = '';

async function initDb() {
  const SQL = await initSqlJs();
  dbPath = path.join(app.getPath('userData'), 'productivity_data.db');

  // Load existing database if it exists
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL;');
  createTables();
  saveDb(); // Persist after creating tables
  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      due_datetime TEXT,
      recurrence_rule TEXT,
      priority TEXT DEFAULT 'medium',
      category TEXT DEFAULT 'Personal',
      is_completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT NOT NULL,
      location TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      note TEXT,
      date TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      linked_type TEXT,
      linked_id TEXT,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'idea',
      priority TEXT DEFAULT 'medium',
      links TEXT,
      tags TEXT,
      deadline TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS shopping_list (
      id TEXT PRIMARY KEY,
      item TEXT NOT NULL,
      estimated_cost REAL DEFAULT 0,
      category TEXT DEFAULT 'General',
      is_purchased INTEGER DEFAULT 0,
      occasion TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS budget_config (
      id TEXT PRIMARY KEY,
      starting_balance REAL DEFAULT 0,
      monthly_savings_goal REAL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      platform TEXT,
      status TEXT DEFAULT 'queued',
      priority TEXT DEFAULT 'medium',
      progress_percent REAL DEFAULT 0,
      estimated_hours REAL DEFAULT 0,
      link TEXT,
      why_tag TEXT,
      started_at TEXT,
      completed_at TEXT,
      certificate_path TEXT,
      linked_project_id TEXT,
      linked_note_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS study_log (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      date TEXT NOT NULL,
      minutes_studied INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // Migrations for existing tables
  try { db.run("ALTER TABLE projects ADD COLUMN checklists TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE projects ADD COLUMN time_in_stage_since TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE transactions ADD COLUMN recurrence_rule TEXT;"); } catch (e) {}
}

function saveDb() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

module.exports = { initDb, getDb, saveDb };
