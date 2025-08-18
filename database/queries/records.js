import { Platform } from "react-native";
import initDB from "../database";

export const saveRecords = async (records) => {
  if (Platform.OS === "web") {
    return { success: false, message: "This function is not supported on web." };
  }

  let dbInstance = null;

  try {
    dbInstance = await initDB();
    if (!dbInstance) throw new Error("Database initialization failed.");

    await dbInstance.runAsync("DELETE FROM records");

    const insertQuery = `
      INSERT OR IGNORE INTO records (
        event_id, event_name, event_date, am_in, am_out, pm_in, pm_out
      ) VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    await dbInstance.runAsync("BEGIN TRANSACTION");

    for (const record of records) {
      const { event_id, event_name, attendance } = record;
      if (!event_id || !event_name || !attendance || !Array.isArray(attendance)) continue;

      const attendanceMap = attendance[0];
      if (!attendanceMap || typeof attendanceMap !== "object") continue;

      for (const [event_date, attendanceData] of Object.entries(attendanceMap)) {
        const { am_in, am_out, pm_in, pm_out } = attendanceData;
        if (!event_id || !event_name || !event_date) continue;

        await dbInstance.runAsync(insertQuery, [
          event_id,
          event_name,
          event_date,
          !!am_in,
          !!am_out,
          !!pm_in,
          !!pm_out,
        ]);
      }
    }

    await dbInstance.runAsync("COMMIT");
    return { success: true, message: "Records saved successfully." };
  } catch (error) {
    if (dbInstance) {
      try {
        await dbInstance.runAsync("ROLLBACK");
      } catch {}
    }
    throw error;
  } finally {
    if (dbInstance && typeof dbInstance.close === "function") {
      try { await dbInstance.close(); } catch {}
    }
  }
};

export const getStoredRecords = async () => {
  if (Platform.OS === "web") {
    return { success: false, message: "This function is not supported on web." };
  }

  let dbInstance = null;

  try {
    dbInstance = await initDB();
    if (!dbInstance) throw new Error("Database initialization failed.");

    const query = `
      SELECT
        event_id,
        event_name,
        event_date,
        am_in,
        am_out,
        pm_in,
        pm_out
      FROM records;
    `;

    const records = await dbInstance.getAllAsync(query);

    const formattedRecords = records.map((record) => ({
      event_id: record.event_id,
      event_name: record.event_name,
      event_date: record.event_date,
      am_in: !!record.am_in,
      am_out: !!record.am_out,
      pm_in: !!record.pm_in,
      pm_out: !!record.pm_out,
    }));

    return { success: true, data: formattedRecords };
  } catch (error) {
    throw error;
  } finally {
    if (dbInstance && typeof dbInstance.close === "function") {
      try { await dbInstance.close(); } catch {}
    }
  }
};
