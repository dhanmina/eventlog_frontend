import { Platform } from "react-native";
import { getDatabase } from "../database";

const formatTimestamp = () => {
  const now = new Date();
  return [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join(":");
};

export const logAttendance = async (attendanceData) => {
  if (Platform.OS === "web") return;

  const db = await getDatabase();
  if (!db) return;

  const { event_date_id, student_id_number, type } = attendanceData;
  const typeColumn = type.toLowerCase();
  const timestamp = formatTimestamp();

  const existing = await db.getFirstAsync(
    "SELECT * FROM attendance WHERE event_date_id = ? AND student_id_number = ?",
    [event_date_id, student_id_number],
  );

  if (existing) {
    if (existing[typeColumn])
      throw new Error(`Attendance for ${type} has already been logged.`);
    await db.runAsync(
      `UPDATE attendance SET ${typeColumn} = ? WHERE event_date_id = ? AND student_id_number = ?`,
      [timestamp, event_date_id, student_id_number],
    );
  } else {
    await db.runAsync(
      `INSERT INTO attendance (event_date_id, student_id_number, ${typeColumn}) VALUES (?, ?, ?)`,
      [event_date_id, student_id_number, timestamp],
    );
  }
};

export const isAlreadyLogged = async (event_date_id, student_id_number, type) => {
  if (Platform.OS === "web") return false;
  try {
    const db = await getDatabase();
    if (!db) return false;
    const existing = await db.getFirstAsync(
      "SELECT * FROM attendance WHERE event_date_id = ? AND student_id_number = ?",
      [event_date_id, student_id_number],
    );
    return existing?.[type.toLowerCase()] || false;
  } catch {
    return false;
  }
};
