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
      event_date_id INTEGER,
      student_id_number TEXT,
      event_name TEXT,
      am_in TEXT,
      am_out TEXT,
      pm_in TEXT,
      pm_out TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

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
      "SELECT name FROM sqlite_master WHERE type='table' LIMIT 1"
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

export const insertUserIfMissing = async (user) => {
  const dbInstance = await getDatabase();
  await dbInstance.runAsync(
    `INSERT OR IGNORE INTO users (id_number, first_name, last_name, role_id, role_name) VALUES (?, ?, ?, ?, ?)`,
    [
      user.id_number,
      user.first_name,
      user.last_name,
      user.role_id || 1,
      user.role_name || "User",
    ]
  );
};

export const storeEvent = async (event) => {
  const dbInstance = await getDatabase();
  await insertUserIfMissing({
    id_number: event.created_by_id,
    first_name: event.created_by.split(" ")[0],
    last_name: event.created_by.split(" ")[1] || "",
  });
  if (event.approved_by_id) {
    await insertUserIfMissing({
      id_number: event.approved_by_id,
      first_name: event.approved_by.split(" ")[0],
      last_name: event.approved_by.split(" ")[1] || "",
    });
  }
  const blockIdsText = Array.isArray(event.block_ids)
    ? JSON.stringify(event.block_ids)
    : event.block_ids || "";
  await dbInstance.runAsync(
    `INSERT INTO events (event_name, venue, description, scan_personnel, status, created_by_id, created_by, approved_by_id, approved_by, am_in, am_out, pm_in, pm_out, duration, block_ids)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.event_name,
      event.venue,
      event.description,
      event.scan_personnel,
      event.status,
      event.created_by_id,
      event.created_by,
      event.approved_by_id,
      event.approved_by,
      event.am_in,
      event.am_out,
      event.pm_in,
      event.pm_out,
      event.duration,
      blockIdsText,
    ]
  );
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
