import { Platform } from "react-native";
import { getDatabase } from "../database";

export const saveRecords = async (records) => {
  if (Platform.OS === "web") {
    return { success: false, message: "This function is not supported on web." };
  }

  const db = await getDatabase();
  if (!db) throw new Error("Database initialization failed.");

  await db.execAsync("BEGIN TRANSACTION");
  try {
    await db.runAsync("DELETE FROM records");

    for (const record of records) {
      const { event_id, event_name, attendance } = record;
      if (!event_id || !event_name || !Array.isArray(attendance)) continue;

      const attendanceMap = attendance[0];
      if (!attendanceMap || typeof attendanceMap !== "object") continue;

      for (const [event_date, data] of Object.entries(attendanceMap)) {
        const { student_id_number, am_in, am_out, pm_in, pm_out } = data;
        if (!event_date || !student_id_number) continue;

        await db.runAsync(
          `INSERT OR IGNORE INTO records
             (event_id, event_name, event_date, student_id_number,
              am_in_time, am_out_time, pm_in_time, pm_out_time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            event_id,
            event_name,
            event_date,
            student_id_number,
            am_in || null,
            am_out || null,
            pm_in || null,
            pm_out || null,
          ],
        );
      }
    }

    await db.execAsync("COMMIT");
    return { success: true, message: "Records saved successfully." };
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
};

export const getStoredRecords = async () => {
  if (Platform.OS === "web") {
    return { success: false, message: "This function is not supported on web." };
  }

  const db = await getDatabase();
  if (!db) throw new Error("Database initialization failed.");

  const records = await db.getAllAsync(
    `SELECT event_id, event_name, event_date, student_id_number,
            am_in_time, am_out_time, pm_in_time, pm_out_time
     FROM records`,
  );

  return {
    success: true,
    data: records.map((r) => ({
      event_id: r.event_id,
      event_name: r.event_name,
      event_date: r.event_date,
      student_id_number: r.student_id_number,
      am_in: !!r.am_in_time,
      am_out: !!r.am_out_time,
      pm_in: !!r.pm_in_time,
      pm_out: !!r.pm_out_time,
    })),
  };
};
