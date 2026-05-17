import { Platform } from "react-native";
import api, { getArrayField, requireSuccess, withArrayField } from "./client";
import { getDatabase } from "../../database/database";

const withAttendanceDataArray = (responseData, fieldName, fallbackFieldNames = []) => ({
  ...responseData,
  data: {
    ...(responseData.data || {}),
    [fieldName]: getArrayField(responseData.data || {}, [
      fieldName,
      ...fallbackFieldNames,
    ]),
  },
});

const withAttendanceEventList = (responseData) =>
  withArrayField(responseData, "events", ["data"]);

const withEventBlocks = (responseData) =>
  withAttendanceDataArray(responseData, "blocks");

const withStudents = (responseData) =>
  withAttendanceDataArray(responseData, "students");

const withAttendanceSummary = (responseData) =>
  withAttendanceDataArray(responseData, "attendance_summary");

const withEventSummary = (responseData) => ({
  ...responseData,
  data: {
    ...(responseData.data || {}),
    departments: getArrayField(responseData.data || {}, "departments"),
    year_levels: getArrayField(responseData.data || {}, "year_levels"),
    blocks: getArrayField(responseData.data || {}, "blocks"),
    students: getArrayField(responseData.data || {}, "students"),
    department_ids: getArrayField(responseData.data || {}, "department_ids"),
    year_level_ids: getArrayField(responseData.data || {}, "year_level_ids"),
    block_ids: getArrayField(responseData.data || {}, "block_ids"),
  },
});

const withSyncData = (responseData) => ({
  ...responseData,
  data: {
    ...(responseData.data || {}),
    synced_records: getArrayField(responseData.data || {}, "synced_records"),
    failed_records: getArrayField(responseData.data || {}, "failed_records"),
  },
});

export const fetchAttendanceSummaryOfEvent = async (eventId) => {
  if (!eventId) throw new Error("Missing required parameter: eventId");
  const res = await api.get("/attendance/event/summary", { params: { event_id: eventId }, timeout: 10000 });
  return withEventSummary(requireSuccess(res, "Failed to fetch attendance summary"));
};

export const fetchAttendanceSummaryPerBlock = async (eventId, blockId, attendanceFilter = "all") => {
  if (!eventId || !blockId) throw new Error("Missing required parameters");
  const res = await api.get("/attendance/summary", { params: { event_id: eventId, block_id: blockId, attendanceFilter } });
  return withAttendanceSummary(requireSuccess(res, "Failed to fetch attendance summary"));
};

export const getStudentAttSummary = async (eventId, studentId) => {
  if (!eventId || !studentId) throw new Error("Missing required parameters");
  const res = await api.get("/attendance/student/summary", { params: { event_id: eventId, student_id: studentId } });
  return requireSuccess(res, "Failed to fetch student summary");
};

export const fetchUserOngoingEvents = async (idNumber, page = 1, limit = 10, search = "") => {
  if (!idNumber) throw new Error("Missing required parameter: idNumber");
  const res = await api.get("/attendance/user/events/ongoing", { params: { id_number: idNumber, page, limit, search } });
  return withAttendanceEventList(requireSuccess(res, "Failed to fetch user events"));
};

export const fetchUserPastEvents = async (idNumber, page = 1, limit = 10, search = "") => {
  if (!idNumber) throw new Error("Missing required parameter: idNumber");
  const res = await api.get("/attendance/user/events/past", { params: { id_number: idNumber, page, limit, search } });
  return withAttendanceEventList(requireSuccess(res, "Failed to fetch user events"));
};

export const fetchBlocksOfEvents = async (eventId, filters = {}) => {
  if (!eventId) throw new Error("Missing required parameter: eventId");
  const res = await api.get("/attendance/events/blocks", { params: { event_id: eventId, ...filters } });
  return withEventBlocks(requireSuccess(res, "Failed to fetch blocks"));
};

export const fetchStudentAttendanceByEventAndBlock = async (eventId, blockId, searchQuery = "") => {
  if (!eventId || !blockId) throw new Error("Missing required parameters");
  const res = await api.get("/attendance/events/blocks/students", {
    params: {
      event_id: eventId,
      block_id: blockId,
      search_query: searchQuery || undefined,
    },
  });
  return withStudents(requireSuccess(res, "Failed to fetch student attendance"));
};

export const syncAttendance = async (data) => {
  const res = await api.post("/attendance/sync", data);
  return withSyncData(requireSuccess(res, "Failed to sync attendance"));
};

export const performSync = async () => {
  if (Platform.OS === "web") return;
  try {
    const db = await getDatabase();
    if (!db) return;

    const records = await db.getAllAsync("SELECT * FROM attendance");
    if (!records || records.length === 0) return;

    const attendanceData = records.map((r) => ({
      event_date_id: r.event_date_id,
      student_id_number: r.student_id_number,
      am_in: r.am_in || null,
      am_out: r.am_out || null,
      pm_in: r.pm_in || null,
      pm_out: r.pm_out || null,
    }));

    const res = await api.post("/attendance/sync", { attendanceData });
    if (!res.data?.success) return;

    const synced = res.data.data?.synced_records || [];
    for (const record of synced) {
      await db.runAsync(
        "DELETE FROM attendance WHERE event_date_id = ? AND student_id_number = ?",
        [record.event_date_id, record.student_id_number]
      );
    }
  } catch (err) {
    console.warn("[sync]", err.message);
  }
};

export const fetchAllPastEvents = async (page = 1, limit = 10, search = "") => {
  const res = await api.get("/attendance/admin/events/past", { params: { page, limit, search } });
  return withAttendanceEventList(requireSuccess(res, "Failed to fetch past events"));
};

export const fetchAllOngoingEvents = async (page = 1, limit = 10, search = "") => {
  const res = await api.get("/attendance/admin/events/ongoing", { params: { page, limit, search } });
  return withAttendanceEventList(requireSuccess(res, "Failed to fetch ongoing events"));
};

let syncInterval = null;

export const startSync = () => {
  performSync();
  syncInterval = setInterval(performSync, 30000);
};

export const stopSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};
