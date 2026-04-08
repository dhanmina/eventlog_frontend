import { Platform } from "react-native";
import { getDatabase } from "../database";
import { ensureUserExists } from "./users";

export const storeEvent = async (event) => {
  if (Platform.OS === "web")
    return { success: false, error: "Web platform not supported" };

  try {
    if (!event || typeof event !== "object" || !event.event_id)
      return { success: false, error: "Invalid event object provided" };

    if (event.status !== "Approved" && event.status !== "Archived")
      return { success: true, skipped: true };

    const db = await getDatabase();
    if (!db) return { success: false, error: "Failed to initialize database" };

    await ensureUserExists(db, event.created_by_id, event.created_by);
    await ensureUserExists(db, event.approved_by_id, event.approved_by);

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
      JSON.stringify(event.block_ids || []),
    ];

    await db.execAsync("BEGIN TRANSACTION");
    try {
      const existing = await db.getFirstAsync(
        "SELECT id FROM events WHERE id = ?",
        [event.event_id],
      );

      if (existing) {
        await db.runAsync(
          `UPDATE events SET
             event_name = ?, venue = ?, description = ?,
             created_by_id = ?, created_by = ?, status = ?,
             am_in = ?, am_out = ?, pm_in = ?, pm_out = ?,
             scan_personnel = ?, approved_by = ?, approved_by_id = ?,
             duration = ?, block_ids = ?
           WHERE id = ?`,
          [...eventParams, event.event_id],
        );
      } else {
        await db.runAsync(
          `INSERT INTO events
             (id, event_name, venue, description, created_by_id, created_by, status,
              am_in, am_out, pm_in, pm_out, scan_personnel, approved_by, approved_by_id,
              duration, block_ids)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [event.event_id, ...eventParams],
        );
      }

      if (event.event_dates && event.event_date_ids) {
        const datesArray = Array.isArray(event.event_dates)
          ? event.event_dates
          : event.event_dates.split(",").map((d) => d.trim());

        const dateIdsArray = Array.isArray(event.event_date_ids)
          ? event.event_date_ids.map(String)
          : JSON.parse(event.event_date_ids || "[]").map(String);

        if (datesArray.length > 0 && datesArray.length === dateIdsArray.length) {
          await db.runAsync("DELETE FROM event_dates WHERE event_id = ?", [
            event.event_id,
          ]);
          for (let i = 0; i < datesArray.length; i++) {
            await db.runAsync(
              "INSERT INTO event_dates (id, event_id, event_date) VALUES (?, ?, ?)",
              [dateIdsArray[i], event.event_id, datesArray[i]],
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

export const cleanupOutdatedEvents = async (allApiEventIds = []) => {
  if (Platform.OS === "web")
    return { success: false, error: "Web platform not supported" };

  if (!allApiEventIds || allApiEventIds.length === 0)
    return { success: true, skipped: true };

  try {
    const db = await getDatabase();
    if (!db) return { success: false, error: "Failed to initialize database" };

    const storedEvents = await db.getAllAsync("SELECT id FROM events");
    const idsToDelete = storedEvents
      .map((e) => e.id.toString())
      .filter((id) => !allApiEventIds.includes(parseInt(id)));

    if (idsToDelete.length > 0) {
      const placeholders = idsToDelete.map(() => "?").join(",");
      await db.runAsync(
        `DELETE FROM event_dates WHERE event_id IN (${placeholders})`,
        idsToDelete,
      );
      await db.runAsync(
        `DELETE FROM events WHERE id IN (${placeholders})`,
        idsToDelete,
      );
    }

    return { success: true, deletedCount: idsToDelete.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteStoredEvent = async (eventId) => {
  if (Platform.OS === "web") return { success: true };
  try {
    const db = await getDatabase();
    if (!db) return { success: false };
    await db.runAsync("DELETE FROM event_dates WHERE event_id = ?", [eventId]);
    await db.runAsync("DELETE FROM events WHERE id = ?", [eventId]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getStoredEvents = async () => {
  if (Platform.OS === "web") return [];

  try {
    const db = await getDatabase();
    if (!db) return [];

    const events = await db.getAllAsync(
      `SELECT
         event.id AS event_id, event.event_name, event.venue, event.description,
         event.scan_personnel, event.status, event.created_by_id, event.created_by,
         event.approved_by_id, event.approved_by,
         event.am_in, event.am_out, event.pm_in, event.pm_out,
         event.duration, event.block_ids
       FROM events event
       WHERE event.status = ?`,
      ["Approved"],
    );
    if (!events.length) return [];

    const eventIds = events.map((e) => e.event_id);
    const eventDates = await db.getAllAsync(
      `SELECT event_id, event_date, id AS event_date_id
       FROM event_dates
       WHERE event_id IN (${eventIds.join(",")})`,
    );

    const datesMap = {};
    for (const { event_id, event_date, event_date_id } of eventDates) {
      if (!datesMap[event_id])
        datesMap[event_id] = { event_dates: [], event_date_ids: [] };
      datesMap[event_id].event_dates.push(event_date);
      datesMap[event_id].event_date_ids.push(event_date_id);
    }

    for (const event of events) {
      const dates = datesMap[event.event_id] || {
        event_dates: [],
        event_date_ids: [],
      };
      event.event_dates = dates.event_dates;
      event.event_date_ids = dates.event_date_ids;
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
