import axios from "axios";
import { API_URL } from "../../config/config";
import initDB from "../../database/database";
import { getStoredEvents } from "../../database/queries";
import moment from "moment";

let syncInterval;

export const syncAttendance = async () => {
  let dbInstance;
  try {
    dbInstance = await initDB();
    if (!dbInstance) {
      throw new Error("Failed to initialize database.");
    }

    const attendanceRecords = await dbInstance.getAllAsync(
      "SELECT * FROM attendance"
    );

    if (attendanceRecords.length === 0) {
      return { success: true, message: "No attendance records to sync." };
    }

    const events = await getStoredEvents();
    const currentDate = moment().format("YYYY-MM-DD");

    const shouldClearAttendance = events.every((event) => {
      const eventDates = event.event_dates || [];
      return eventDates.every((eventDate) =>
        moment(eventDate).isBefore(currentDate)
      );
    });

    const cleanedAttendanceData = attendanceRecords.map((record) => {
      const cleanedRecord = {
        event_date_id: record.event_date_id,
        student_id_number: record.student_id_number,
        am_in: record.am_in || null,
        am_out: record.am_out || null,
        pm_in: record.pm_in || null,
        pm_out: record.pm_out || null,
      };

      Object.keys(cleanedRecord).forEach((key) => {
        if (cleanedRecord[key] === null) {
          delete cleanedRecord[key];
        }
      });

      return cleanedRecord;
    });

    const response = await axios.post(`${API_URL}/api/attendance/sync`, {
      attendanceData: cleanedAttendanceData,
    });

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Failed to sync attendance with the backend."
      );
    }

    const { synced_count, failed_count, failed_records } =
      response.data.data || {};

    if (shouldClearAttendance) {
      await dbInstance.runAsync("DELETE FROM attendance");
    }

    return {
      success: true,
      message: "Attendance synced successfully.",
      syncedCount: synced_count,
      failedCount: failed_count,
      failedRecords: failed_records,
    };
  } catch (error) {
    if (error.response) {
      const errorMessage =
        error.response.data?.message || "Server error during sync";
      throw new Error(`Sync failed: ${errorMessage}`);
    } else if (error.request) {
      throw new Error("Network error: Unable to connect to server");
    } else {
      throw new Error(`Sync error: ${error.message}`);
    }
  } finally {
    if (dbInstance && typeof dbInstance.close === "function") {
      try {
        await dbInstance.close();
      } catch {}
    }
  }
};

export const startSync = async () => {
  if (syncInterval) {
    return;
  }

  syncInterval = setInterval(async () => {
    try {
      await syncAttendance();
    } catch (error) {}
  }, 30000);
};

export const stopSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};
