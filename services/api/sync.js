import axios from "axios";
import { API_URL } from "../../config/config";
import initDB from "../../database/database";

let syncInterval;

export const syncAttendance = async () => {
  const dbInstance = await initDB();
  if (!dbInstance) {
    throw new Error("Failed to initialize database.");
  }

  const attendanceRecords = await dbInstance.getAllAsync(
    "SELECT * FROM attendance",
  );

  if (attendanceRecords.length === 0) {
    return { success: true, message: "No attendance records to sync." };
  }

  const cleanedAttendanceData = attendanceRecords.map((record) => {
    const cleaned = {
      event_date_id: record.event_date_id,
      student_id_number: record.student_id_number,
      am_in: record.am_in || null,
      am_out: record.am_out || null,
      pm_in: record.pm_in || null,
      pm_out: record.pm_out || null,
    };
    Object.keys(cleaned).forEach((key) => {
      if (cleaned[key] === null) delete cleaned[key];
    });
    return cleaned;
  });

  const response = await axios.post(`${API_URL}/api/attendance/sync`, {
    attendanceData: cleanedAttendanceData,
  });

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Failed to sync attendance with the backend.",
    );
  }

  const { synced_count, failed_count, failed_records, synced_records } =
    response.data.data || {};

  if (Array.isArray(synced_records) && synced_records.length > 0) {
    for (const record of synced_records) {
      await dbInstance.runAsync(
        "DELETE FROM attendance WHERE event_date_id = ? AND student_id_number = ?",
        [record.event_date_id, record.student_id_number],
      );
    }
  }

  return {
    success: true,
    message: "Attendance synced successfully.",
    syncedCount: synced_count,
    failedCount: failed_count,
    failedRecords: failed_records,
  };
};

export const startSync = async () => {
  if (syncInterval) return;

  try {
    await syncAttendance();
  } catch {}

  syncInterval = setInterval(async () => {
    try {
      await syncAttendance();
    } catch {}
  }, 30000);
};

export const stopSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};
