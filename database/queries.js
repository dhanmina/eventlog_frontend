import { Platform } from "react-native";
import initDB from "./database";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeUser = async (user) => {
  if (Platform.OS !== "web") {
    try {
      const dbInstance = await initDB();
      if (!dbInstance) return;

      const insertQuery = `
        INSERT OR REPLACE INTO users (
          id_number, first_name, middle_name, last_name, suffix, email, role_id, role_name,
          block_id, block_name, department_id, department_name, department_code,
          course_id, course_name, course_code, year_level_id, year_level_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await dbInstance.runAsync(insertQuery, [
        user.id_number,
        user.first_name,
        user.middle_name || null,
        user.last_name,
        user.suffix || null,
        user.email,
        user.role_id,
        user.role_name,
        user.block_id || null,
        user.block_name || null,
        user.department_id || null,
        user.department_code || null,
        user.department_name || null,
        user.course_id || null,
        user.course_name || null,
        user.course_code || null,
        user.year_level_id || null,
        user.year_level_name || null,
      ]);
    } catch {}
  }
};

export const clearAllTablesData = async () => {
  if (Platform.OS !== "web") {
    try {
      const dbInstance = await initDB();
      if (!dbInstance) return;

      await dbInstance.execAsync("PRAGMA foreign_keys = OFF");
      await dbInstance.execAsync("DELETE FROM attendance;");
      await dbInstance.execAsync("DELETE FROM records;");
      await dbInstance.execAsync("DELETE FROM event_dates;");
      await dbInstance.execAsync("DELETE FROM events;");
      await dbInstance.execAsync("DELETE FROM users;");
      await dbInstance.execAsync("PRAGMA foreign_keys = ON");
    } catch {}
  }
};

export const getRoleID = async () => {
  if (Platform.OS !== "web") {
    try {
      const idNumber = await AsyncStorage.getItem("id_number");
      if (!idNumber) return null;

      const dbInstance = await initDB();
      if (!dbInstance) return null;

      const result = await dbInstance.getFirstAsync(
        "SELECT role_id FROM users WHERE id_number = ?",
        [idNumber]
      );
      return result?.role_id;
    } catch {
      return null;
    }
  } else {
    return null;
  }
};

export const getStoredUser = async () => {
  if (Platform.OS !== "web") {
    try {
      const idNumber = await AsyncStorage.getItem("id_number");
      if (!idNumber) return null;

      const dbInstance = await initDB();
      if (!dbInstance) return null;

      const result = await dbInstance.getFirstAsync(
        "SELECT id_number, first_name, middle_name, last_name, suffix, email, role_id, role_name, block_id, block_name, department_id, department_name, department_code, course_id, course_name, year_level_id, year_level_name, course_code FROM users WHERE id_number = ?",
        [idNumber]
      );

      return result;
    } catch {
      return null;
    }
  } else {
    return null;
  }
};

export const storeEvent = async (event, allApiEventIds = []) => {
  if (Platform.OS === "web")
    return { success: false, error: "Web platform not supported" };

  try {
    if (!event || typeof event !== "object" || !event.event_id) {
      return { success: false, error: "Invalid event object provided" };
    }

    if (event.status !== "Approved" && event.status !== "Archived") return { success: true, skipped: true };

    const db = await initDB();
    if (!db) return { success: false, error: "Failed to initialize database" };

    const ensureUserExists = async (userId, fullName) => {
      if (!userId) return;
      const existingUser = await db.getFirstAsync(
        "SELECT id_number FROM users WHERE id_number = ?",
        [userId]
      );
      if (!existingUser) {
        const [firstName, ...rest] = fullName?.split(" ") || ["N/A"];
        const lastName = rest.join(" ") || "N/A";
        await db.runAsync(
          `INSERT INTO users (id_number, first_name, last_name, role_id, role_name) VALUES (?, ?, ?, ?, ?)`,
          [userId, firstName, lastName, 1, "User"]
        );
      }
    };

    await ensureUserExists(event.created_by_id, event.created_by);
    await ensureUserExists(event.approved_by_id, event.approved_by);

    await db.execAsync("BEGIN TRANSACTION");
    try {
      const existingEvent = await db.getFirstAsync(
        "SELECT id FROM events WHERE id = ?",
        [event.event_id]
      );

      let blockIds = event.block_ids;
      if (typeof blockIds === "string") {
        try { blockIds = JSON.parse(blockIds); } catch { blockIds = []; }
      }
      if (!Array.isArray(blockIds)) blockIds = [];

      const eventParams = [
        event.event_name || null,
        event.venue || null,
        event.description || null,
        event.created_by_id || null,
        event.created_by || null,
        event.status || null,
        event.am_in || null,
        event.am_out || null,
        event.pm_in || null,
        event.pm_out || null,
        event.scan_personnel || null,
        event.approved_by || null,
        event.approved_by_id || null,
        event.duration || null,
        JSON.stringify(blockIds),
      ];

      if (existingEvent) {
        await db.runAsync(
          `UPDATE events SET
           event_name = ?, venue = ?, description = ?, created_by_id = ?, created_by = ?,
           status = ?, am_in = ?, am_out = ?, pm_in = ?, pm_out = ?, scan_personnel = ?,
           approved_by = ?, approved_by_id = ?, duration = ?, block_ids = ?
         WHERE id = ?`,
          [...eventParams, event.event_id]
        );
      } else {
        await db.runAsync(
          `INSERT INTO events
           (id, event_name, venue, description, created_by_id, created_by, status,
           am_in, am_out, pm_in, pm_out, scan_personnel, approved_by, approved_by_id, duration, block_ids)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [event.event_id, ...eventParams]
        );
      }

      if (event.event_dates && event.event_date_ids) {
        let eventDatesArray = Array.isArray(event.event_dates)
          ? event.event_dates
          : event.event_dates?.split(",").map((d) => d.trim()) || [];

        let eventDateIdsArray = Array.isArray(event.event_date_ids)
          ? event.event_date_ids.map(String)
          : JSON.parse(event.event_date_ids || "[]").map(String);

        if (
          eventDatesArray.length > 0 &&
          eventDatesArray.length === eventDateIdsArray.length
        ) {
          await db.runAsync("DELETE FROM event_dates WHERE event_id = ?", [
            event.event_id,
          ]);

          for (let i = 0; i < eventDatesArray.length; i++) {
            await db.runAsync(
              "INSERT INTO event_dates (id, event_id, event_date) VALUES (?, ?, ?)",
              [eventDateIdsArray[i], event.event_id, eventDatesArray[i]]
            );
          }
        }
      }

      await db.execAsync("COMMIT");
      return { success: true };
    } catch (err) {
      await db.execAsync("ROLLBACK");
      throw err;
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || error.toString(),
      eventId: event?.event_id,
      eventName: event?.event_name,
    };
  }
};

export const cleanupOutdatedEvents = async (allApiEventIds = [], force = false) => {
  if (Platform.OS === "web")
    return { success: false, error: "Web platform not supported" };

  try {
    const db = await initDB();
    if (!db) return { success: false, error: "Failed to initialize database" };

    if (!allApiEventIds || allApiEventIds.length === 0) {
      if (!force) return { success: true, skipped: true };
      await db.runAsync("DELETE FROM event_dates");
      await db.runAsync("DELETE FROM events");
      return { success: true, cleared: true };
    }

    const storedEvents = await db.getAllAsync("SELECT id FROM events");
    const storedEventIds = storedEvents.map((e) => e.id.toString());
    const idsToDelete = storedEventIds.filter(
      (id) => !allApiEventIds.includes(parseInt(id))
    );

    if (idsToDelete.length > 0) {
      const placeholders = idsToDelete.map(() => "?").join(",");
      await db.runAsync(
        `DELETE FROM event_dates WHERE event_id IN (${placeholders})`,
        idsToDelete
      );
      await db.runAsync(
        `DELETE FROM events WHERE id IN (${placeholders})`,
        idsToDelete
      );
    }

    return { success: true, deletedCount: idsToDelete.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getStoredEvents = async () => {
  if (Platform.OS === "web") return [];

  try {
    const db = await initDB();
    if (!db) return [];

    const eventsQuery = `
      SELECT
        event.id AS event_id,
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
        event.block_ids
      FROM events event
      WHERE event.status = ?
    `;
    const events = await db.getAllAsync(eventsQuery, ["Approved"]);
    if (!events.length) return [];

    const eventIds = events.map((e) => e.event_id);
    let eventDatesMap = {};
    if (eventIds.length) {
      const eventDatesQuery = `
        SELECT event_id, event_date, id AS event_date_id
        FROM event_dates
        WHERE event_id IN (${eventIds.join(",")})
      `;
      const eventDates = await db.getAllAsync(eventDatesQuery);

      for (const { event_id, event_date, event_date_id } of eventDates) {
        if (!eventDatesMap[event_id])
          eventDatesMap[event_id] = { event_dates: [], event_date_ids: [] };
        eventDatesMap[event_id].event_dates.push(event_date);
        eventDatesMap[event_id].event_date_ids.push(event_date_id);
      }
    }

    for (const event of events) {
      const eventData = eventDatesMap[event.event_id] || {
        event_dates: [],
        event_date_ids: [],
      };
      event.event_dates = eventData.event_dates;
      event.event_date_ids = eventData.event_date_ids;

      try {
        event.eventBlocks = Array.isArray(event.block_ids)
          ? event.block_ids.map(String)
          : JSON.parse(event.block_ids || "[]").map(String);
      } catch {
        event.eventBlocks = [];
      }
    }

    return events;
  } catch {
    return [];
  }
};

export const logAttendance = async (attendanceData) => {
  if (Platform.OS !== "web") {
    const dbInstance = await initDB();
    if (!dbInstance) return;

    const existingRecord = await dbInstance.getFirstAsync(
      "SELECT * FROM attendance WHERE event_date_id = ? AND student_id_number = ?",
      [attendanceData.event_date_id, attendanceData.student_id_number]
    );

    const typeColumn = attendanceData.type.toLowerCase();
    const currentTime = new Date().toTimeString().slice(0, 8);

    if (existingRecord) {
      if (existingRecord[typeColumn])
        throw new Error(
          `Attendance for ${attendanceData.type} has already been logged.`
        );
      await dbInstance.runAsync(
        `UPDATE attendance SET ${typeColumn} = ? WHERE event_date_id = ? AND student_id_number = ?`,
        [currentTime, attendanceData.event_date_id, attendanceData.student_id_number]
      );
    } else {
      await dbInstance.runAsync(
        `INSERT INTO attendance (event_date_id, student_id_number, ${typeColumn}) VALUES (?, ?, ?)`,
        [attendanceData.event_date_id, attendanceData.student_id_number, currentTime]
      );
    }
  }
};

export const isAlreadyLogged = async (
  event_date_id,
  student_id_number,
  type
) => {
  if (Platform.OS !== "web") {
    try {
      const dbInstance = await initDB();
      if (!dbInstance) return false;

      const typeColumn = type.toLowerCase();
      const existingRecord = await dbInstance.getFirstAsync(
        "SELECT * FROM attendance WHERE event_date_id = ? AND student_id_number = ?",
        [event_date_id, student_id_number]
      );

      return existingRecord?.[typeColumn] || false;
    } catch {
      return false;
    }
  }
};
