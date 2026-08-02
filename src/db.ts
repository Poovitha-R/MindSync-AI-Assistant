import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('mindmate.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL, -- 'child' or 'adult'
    mindset TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    difficulty TEXT, -- 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'
    mood_match TEXT, -- e.g., 'Tired', 'Focused'
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS mood_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    mood TEXT NOT NULL,
    intensity INTEGER NOT NULL,
    journal TEXT,
    stress INTEGER,
    happiness INTEGER,
    focus INTEGER,
    distraction_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS fatigue_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    work_duration INTEGER NOT NULL,
    fatigue_level TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS distraction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    app_name TEXT NOT NULL,
    time_spent INTEGER NOT NULL,
    distraction_level TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS task_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    recommended_task TEXT NOT NULL,
    reason TEXT NOT NULL
  );
`);

// Migration: Add missing columns to mood_logs if they don't exist
const columns = db.prepare("PRAGMA table_info(mood_logs)").all() as any[];
const columnNames = columns.map(c => c.name);

if (!columnNames.includes('stress')) {
  db.exec("ALTER TABLE mood_logs ADD COLUMN stress INTEGER DEFAULT 0");
}
if (!columnNames.includes('happiness')) {
  db.exec("ALTER TABLE mood_logs ADD COLUMN happiness INTEGER DEFAULT 0");
}
if (!columnNames.includes('focus')) {
  db.exec("ALTER TABLE mood_logs ADD COLUMN focus INTEGER DEFAULT 0");
}
if (!columnNames.includes('distraction_count')) {
  db.exec("ALTER TABLE mood_logs ADD COLUMN distraction_count INTEGER DEFAULT 0");
}

// Migration for users table
const userColumns = db.prepare("PRAGMA table_info(users)").all() as any[];
const userColumnNames = userColumns.map(c => c.name);
if (!userColumnNames.includes('mindset')) {
  db.exec("ALTER TABLE users ADD COLUMN mindset TEXT");
}

// Migration for tasks table
const taskColumns = db.prepare("PRAGMA table_info(tasks)").all() as any[];
const taskColumnNames = taskColumns.map(c => c.name);
if (!taskColumnNames.includes('difficulty')) {
  db.exec("ALTER TABLE tasks ADD COLUMN difficulty TEXT");
}
if (!taskColumnNames.includes('mood_match')) {
  db.exec("ALTER TABLE tasks ADD COLUMN mood_match TEXT");
}
if (!taskColumnNames.includes('status')) {
  db.exec("ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'pending'");
}

export default db;
