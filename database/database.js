import { Platform } from "react-native";
let SQLite;
let db;
let isInitializing = false;

if (Platform.OS !== "web") {
  SQLite = require("expo-sqlite");
}

const createTables = async (database) => {
  await database.execAsync(`PRAGMA journal_mode = WAL;`);
  await database.execAsync(`PRAGMA foreign_keys = ON;`);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id_number TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      middle_name TEXT,
      last_name TEXT NOT NULL,
      suffix TEXT,
      email TEXT UNIQUE,
      role_id INTEGER NOT NULL,
      role_name TEXT NOT NULL,
      block_id INTEGER,
      block_name TEXT,
      department_id INTEGER,
      department_name TEXT,
      department_code TEXT,
      course_id INTEGER,
      course_name TEXT,
      course_code TEXT,
      year_level_id INTEGER,
      year_level_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      venue TEXT NOT NULL,
      description TEXT,
      scan_personnel TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_by_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      approved_by_id TEXT,
      approved_by TEXT,
      am_in TIME,
      am_out TIME,
      pm_in TIME,
      pm_out TIME,
      duration INTEGER,
      block_ids TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by_id) REFERENCES users (id_number),
      FOREIGN KEY (approved_by_id) REFERENCES users (id_number)
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS event_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      event_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_date_id INTEGER NOT NULL,
      student_id_number TEXT NOT NULL,
      am_in TEXT,
      am_out TEXT,
      pm_in TEXT,
      pm_out TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_date_id, student_id_number)
    );
  `);

  try {
    const tableInfo = await database.getFirstAsync(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='attendance'",
    );
    if (tableInfo?.sql && !tableInfo.sql.includes("UNIQUE")) {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS attendance_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_date_id INTEGER NOT NULL,
          student_id_number TEXT NOT NULL,
          am_in TEXT,
          am_out TEXT,
          pm_in TEXT,
          pm_out TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(event_date_id, student_id_number)
        );
        INSERT OR IGNORE INTO attendance_new
          (id, event_date_id, student_id_number, am_in, am_out, pm_in, pm_out, created_at)
          SELECT id, event_date_id, student_id_number, am_in, am_out, pm_in, pm_out, created_at
          FROM attendance;
        DROP TABLE attendance;
        ALTER TABLE attendance_new RENAME TO attendance;
      `);
    }
  } catch {}

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      event_name TEXT NOT NULL,
      event_date DATE NOT NULL,
      student_id_number TEXT NOT NULL,
      am_in_time DATETIME,
      am_out_time DATETIME,
      pm_in_time DATETIME,
      pm_out_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events (id),
      FOREIGN KEY (student_id_number) REFERENCES users (id_number),
      UNIQUE(event_id, event_date, student_id_number)
    );
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
    CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by_id);
    CREATE INDEX IF NOT EXISTS idx_event_dates_event_id ON event_dates(event_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_event_date ON attendance(event_date_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id_number);
    CREATE INDEX IF NOT EXISTS idx_records_event_date ON records(event_id, event_date);
  `);
};

const validateDatabaseConnection = async (database) => {
  try {
    await database.execAsync("SELECT 1");
    await database.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' LIMIT 1",
    );
    return true;
  } catch {
    return false;
  }
};

const closeDatabase = async () => {
  if (db) {
    try {
      await db.closeAsync();
    } catch {}
    db = null;
  }
};

const initDB = async () => {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return null;
  if (isInitializing) {
    let attempts = 0;
    while (isInitializing && attempts < 50) {
      await new Promise((r) => setTimeout(r, 100));
      attempts++;
    }
    return db;
  }
  try {
    isInitializing = true;
    if (db) {
      const valid = await validateDatabaseConnection(db);
      if (valid) return db;
      await closeDatabase();
    }
    const newDb = await SQLite.openDatabaseAsync("eventlog.db");
    if (!(await validateDatabaseConnection(newDb))) {
      await newDb.closeAsync();
      throw new Error("New database validation failed");
    }
    await createTables(newDb);
    db = newDb;
    return db;
  } catch {
    await closeDatabase();
    await SQLite.deleteDatabaseAsync("eventlog.db");
    const freshDb = await SQLite.openDatabaseAsync("eventlog.db");
    await createTables(freshDb);
    db = freshDb;
    return db;
  } finally {
    isInitializing = false;
  }
};

export const getDatabase = async () => {
  if (!db) return await initDB();
  if (!(await validateDatabaseConnection(db))) return await initDB();
  return db;
};

let initPromise = null;
export const ensureInitialized = async () => {
  if (!initPromise) initPromise = initDB();
  return await initPromise;
};

if (Platform.OS === "android" || Platform.OS === "ios") {
  ensureInitialized().catch(() => {});
}

export default initDB;

