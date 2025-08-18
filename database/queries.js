import { Platform } from "react-native";
import initDB from "./database";
import AsyncStorage from "@react-native-async-storage/async-storage";
let isTransactionInProgress = false;

export const storeUser = async (user) => {
  if (Platform.OS !== "web") {
    try {
      const dbInstance = await initDB();
      if (!dbInstance) {
        return;
      }

      const insertQuery = `
        INSERT OR REPLACE INTO users (
          id_number,
          first_name,
          middle_name,
          last_name,
          suffix,
          email,
          role_id,
          role_name,
          block_id,
          block_name,
          department_id,
          department_name,
          department_code,
          course_id,
          course_name,
          course_code,
          year_level_id,
          year_level_name
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
    } catch (error) {
      console.error("Error storing user", error);
    }
  }
};

export const clearAllTablesData = async () => {
  if (Platform.OS !== "web") {
    try {
      const dbInstance = await initDB();
      if (!dbInstance) {
        return;
      }


      await dbInstance.execAsync("PRAGMA foreign_keys = OFF");


      await dbInstance.execAsync("DELETE FROM attendance;");
      await dbInstance.execAsync("DELETE FROM records;");
      await dbInstance.execAsync("DELETE FROM event_dates;");
      await dbInstance.execAsync("DELETE FROM events;");
      await dbInstance.execAsync("DELETE FROM users;");

      await dbInstance.execAsync("PRAGMA foreign_keys = ON");

    } catch (error) {
      console.error("Error clearing all tables data:", error);
    }
  }
};


export const getRoleID = async () => {
  if (Platform.OS !== "web") {
    try {
      const idNumber = await AsyncStorage.getItem("id_number");
      if (!idNumber) {
        return null;
      }

      const dbInstance = await initDB();
      if (!dbInstance) {
        return null;
      }

      const result = await dbInstance.getFirstAsync(
        "SELECT role_id FROM users WHERE id_number = ?",
        [idNumber]
      );
      return result?.role_id;
    } catch (error) {
      console.error("Error getting role ID:", error);
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

      if (!idNumber) {
        return null;
      }

      const dbInstance = await initDB();
      if (!dbInstance) {
        return null;
      }

      const result = await dbInstance.getFirstAsync(
        "SELECT id_number, first_name, middle_name, last_name, suffix, email, role_id, role_name, block_id, block_name, department_id, department_name, department_code, course_id, course_name, year_level_id, year_level_name, course_code FROM users WHERE id_number = ?",
        [idNumber]
      );

      return result;
    } catch (error) {
      console.error("Error getting stored user:", error);
      return null;
    }
  } else {
    return null;
  }
};

export const storeEvent = async (event, allApiEventIds = []) => {
  if (Platform.OS === "web") {
    return { success: false, error: "Web platform not supported" };
  }

  try {
    if (!event || typeof event !== "object") {
      return { success: false, error: "Invalid event object provided" };
    }

    if (!Array.isArray(allApiEventIds)) {
      return { success: false, error: "allApiEventIds must be an array" };
    }

    if (!event.event_id) {
      return { success: false, error: "Event ID is required" };
    }

    if (event.status !== "Approved") {
      return { success: true, skipped: true };
    }

    const db = await initDB();
    if (!db) {
      return { success: false, error: "Failed to initialize database" };
    }

    if (!allApiEventIds || allApiEventIds.length === 0) {
      await db.runAsync("DELETE FROM event_dates");
      await db.runAsync("DELETE FROM events");
      return { success: true, cleared: true };
    }

    const existingEvent = await db.getFirstAsync(
      "SELECT id FROM events WHERE id = ?",
      [event.event_id]
    );

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
    ];

    if (existingEvent) {
      await db.runAsync(
        `UPDATE events SET
         event_name = ?, venue = ?, description = ?, created_by_id = ?, created_by = ?,
         status = ?, am_in = ?, am_out = ?, pm_in = ?, pm_out = ?, scan_personnel = ?,
         approved_by = ?, approved_by_id = ?, duration = ?
       WHERE id = ?`,
        [...eventParams, event.event_id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO events
         (id, event_name, venue, description, created_by_id, created_by, status,
         am_in, am_out, pm_in, pm_out, scan_personnel, approved_by, approved_by_id, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [event.event_id, ...eventParams]
      );
    }

    if (event.event_dates && event.event_date_ids) {
      let eventDatesArray = [];
      let eventDateIdsArray = [];

      if (Array.isArray(event.event_dates)) {
        eventDatesArray = event.event_dates;
      } else if (
        typeof event.event_dates === "string" &&
        event.event_dates.trim() !== ""
      ) {
        eventDatesArray = event.event_dates
          .split(",")
          .map((date) => date.trim());
      }

      if (Array.isArray(event.event_date_ids)) {
        eventDateIdsArray = event.event_date_ids.map((id) => String(id));
      } else if (
        typeof event.event_date_ids === "string" &&
        event.event_date_ids.trim() !== ""
      ) {
        try {
          const parsed = JSON.parse(event.event_date_ids);
          eventDateIdsArray = Array.isArray(parsed)
            ? parsed.map((id) => String(id))
            : [];
        } catch {
          eventDateIdsArray = [];
        }
      }

      if (
        eventDatesArray.length > 0 &&
        eventDatesArray.length === eventDateIdsArray.length
      ) {
        await db.runAsync("DELETE FROM event_dates WHERE event_id = ?", [
          event.event_id,
        ]);

        let successfulInserts = 0;
        for (let i = 0; i < eventDatesArray.length; i++) {
          const eventDate = eventDatesArray[i];
          const eventDateId = eventDateIdsArray[i];

          try {
            await db.runAsync(
              "INSERT INTO event_dates (id, event_id, event_date) VALUES (?, ?, ?)",
              [eventDateId, event.event_id, eventDate]
            );
            successfulInserts++;
          } catch {}
        }
      }
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error.message || error.toString();
    return {
      success: false,
      error: errorMessage,
      eventId: event?.event_id,
      eventName: event?.event_name,
    };
  }
}


export const cleanupOutdatedEvents = async (allApiEventIds = []) => {
  if (Platform.OS === "web") {
    return { success: false, error: "Web platform not supported" };
  }

  try {
    const db = await initDB();
    if (!db) {
      return { success: false, error: "Failed to initialize database" };
    }

    if (!allApiEventIds || allApiEventIds.length === 0) {
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
  if (Platform.OS === "web") return null;

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
        event.duration
      FROM events event
      WHERE event.status = ?
    `;
    const events = await db.getAllAsync(eventsQuery, ["Approved"]);

    if (!events.length) return [];

    const eventIds = events.map((e) => e.event_id);

    if (eventIds.length) {
      const eventDatesQuery = `
        SELECT event_id, event_date, id AS event_date_id
        FROM event_dates
        WHERE event_id IN (${eventIds.join(",")})
      `;
      const eventDates = await db.getAllAsync(eventDatesQuery);

      const eventDatesMap = {};
      for (const { event_id, event_date, event_date_id } of eventDates) {
        if (!eventDatesMap[event_id]) {
          eventDatesMap[event_id] = {
            event_dates: [],
            event_date_ids: [],
          };
        }
        eventDatesMap[event_id].event_dates.push(event_date);
        eventDatesMap[event_id].event_date_ids.push(event_date_id);
      }

      for (const event of events) {
        const eventData = eventDatesMap[event.event_id] || {
          event_dates: [],
          event_date_ids: [],
        };
        event.event_dates = eventData.event_dates;
        event.event_date_ids = eventData.event_date_ids;
      }
    }

    return events;
  } catch (error) {
    console.error("[GET STORED EVENTS] Error fetching events:", error.message);
    return [];
  }
};

export const clearEventsTable = async () => {
  try {
    const db = await initDB();
    if (!db) {
      console.error("[CLEAR EVENTS TABLE] Database connection failed.");
      return;
    }

    await db.runAsync("DELETE FROM event_dates");
    await db.runAsync("DELETE FROM events");
  } catch (error) {
    console.error("[CLEAR EVENTS TABLE] Error clearing tables:", error);
  }
};

export const logAttendance = async (attendanceData) => {
  if (Platform.OS !== "web") {
    try {
      const dbInstance = await initDB();
      if (!dbInstance) return;

      await dbInstance.runAsync(`
        CREATE TABLE IF NOT EXISTS attendance (
          event_date_id INTEGER PRIMARY KEY,
          student_id_number INTEGER NOT NULL,
          am_in BOOLEAN DEFAULT FALSE,
          am_out BOOLEAN DEFAULT FALSE,
          pm_in BOOLEAN DEFAULT FALSE,
          pm_out BOOLEAN DEFAULT FALSE
        )
      `);

      const existingRecord = await dbInstance.getFirstAsync(
        "SELECT * FROM attendance WHERE event_date_id = ? AND student_id_number = ?",
        [attendanceData.event_date_id, attendanceData.student_id_number]
      );

      const typeColumn = attendanceData.type.toLowerCase();
      const typeDescriptions = {
        AM_IN: "Morning Time In",
        AM_OUT: "Morning Time Out",
        PM_IN: "Afternoon Time In",
        PM_OUT: "Afternoon Time Out",
      };
      const typeDescription = typeDescriptions[attendanceData.type];

      if (existingRecord) {
        if (existingRecord[typeColumn]) {
          throw new Error(
            `Attendance for ${typeDescription} has already been logged.`
          );
        }
        const updateQuery = `
          UPDATE attendance
          SET ${typeColumn} = TRUE
          WHERE event_date_id = ? AND student_id_number = ?
        `;
        await dbInstance.runAsync(updateQuery, [
          attendanceData.event_date_id,
          attendanceData.student_id_number,
        ]);
      } else {
        const insertQuery = `
          INSERT INTO attendance (event_date_id, student_id_number, ${typeColumn})
          VALUES (?, ?, TRUE)
        `;
        await dbInstance.runAsync(insertQuery, [
          attendanceData.event_date_id,
          attendanceData.student_id_number,
        ]);
      }
    } catch (error) {
      throw error;
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

      if (existingRecord && existingRecord[typeColumn]) {
        return true;
      }

      return false;
    } catch (error) {
      console.error(
        "[IS ALREADY LOGGED] Error checking attendance:",
        error.message
      );
      return false;
    }
  }
};
