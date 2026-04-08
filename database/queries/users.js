import { Platform } from "react-native";
import { getDatabase } from "../database";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ensureUserExists = async (db, userId, fullName) => {
  if (!userId) return;
  const existing = await db.getFirstAsync(
    "SELECT id_number FROM users WHERE id_number = ?",
    [userId],
  );
  if (!existing) {
    const [firstName, ...rest] = fullName?.split(" ") || ["N/A"];
    const lastName = rest.join(" ") || "N/A";
    await db.runAsync(
      `INSERT INTO users (id_number, first_name, last_name, role_id, role_name)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, firstName, lastName, 1, "User"],
    );
  }
};

export const storeUser = async (user) => {
  if (Platform.OS === "web") return;
  try {
    const db = await getDatabase();
    if (!db) return;
    await db.runAsync(
      `INSERT OR REPLACE INTO users (
         id_number, first_name, middle_name, last_name, suffix, email,
         role_id, role_name, block_id, block_name,
         department_id, department_name, department_code,
         course_id, course_name, course_code, year_level_id, year_level_name
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        user.department_name || null,
        user.department_code || null,
        user.course_id || null,
        user.course_name || null,
        user.course_code || null,
        user.year_level_id || null,
        user.year_level_name || null,
      ],
    );
  } catch {}
};

export const getStoredUser = async () => {
  if (Platform.OS !== "web") {
    try {
      const idNumber = await AsyncStorage.getItem("id_number");
      if (!idNumber) return null;
      const db = await getDatabase();
      if (!db) return null;
      return await db.getFirstAsync(
        `SELECT id_number, first_name, middle_name, last_name, suffix, email,
                role_id, role_name, block_id, block_name,
                department_id, department_name, department_code,
                course_id, course_name, course_code, year_level_id, year_level_name
         FROM users WHERE id_number = ?`,
        [idNumber],
      );
    } catch {
      return null;
    }
  } else {
    try {
      const idNumber = await AsyncStorage.getItem("id_number");
      if (!idNumber) return null;
      const [email, roleId, fullName] = await Promise.all([
        AsyncStorage.getItem("email"),
        AsyncStorage.getItem("role_id"),
        AsyncStorage.getItem("full_name"),
      ]);
      return {
        id_number: idNumber,
        email,
        role_id: roleId ? parseInt(roleId, 10) : null,
        full_name: fullName || null,
      };
    } catch {
      return null;
    }
  }
};

export const getRoleID = async () => {
  if (Platform.OS === "web") return null;
  try {
    const idNumber = await AsyncStorage.getItem("id_number");
    if (!idNumber) return null;
    const db = await getDatabase();
    if (!db) return null;
    const result = await db.getFirstAsync(
      "SELECT role_id FROM users WHERE id_number = ?",
      [idNumber],
    );
    return result?.role_id ?? null;
  } catch {
    return null;
  }
};

export const clearAllTablesData = async () => {
  if (Platform.OS === "web") return;
  try {
    const db = await getDatabase();
    if (!db) return;
    await db.execAsync("PRAGMA foreign_keys = OFF");
    await db.execAsync(
      "DELETE FROM attendance; DELETE FROM records; DELETE FROM event_dates; DELETE FROM events; DELETE FROM users;",
    );
    await db.execAsync("PRAGMA foreign_keys = ON");
  } catch {}
};
