import api from "./client";

export const fetchAttendanceSummaryOfEvent = async (eventId) => {
  if (!eventId) throw new Error("Missing required parameter: eventId");
  const res = await api.get("/attendance/event/summary", { params: { event_id: eventId }, timeout: 10000 });
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to fetch attendance summary");
  return res.data;
};

export const fetchAttendanceSummaryPerBlock = async (eventId, blockId, attendanceFilter = "all") => {
  if (!eventId || !blockId) throw new Error("Missing required parameters");
  const res = await api.get("/attendance/summary", { params: { event_id: eventId, block_id: blockId, attendanceFilter } });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch attendance summary");
  return res.data;
};

export const getStudentAttSummary = async (eventId, studentId) => {
  if (!eventId || !studentId) throw new Error("Missing required parameters");
  const res = await api.get("/attendance/student/summary", { params: { event_id: eventId, student_id: studentId } });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch student summary");
  return res.data;
};

export const fetchUserOngoingEvents = async (idNumber, page = 1, limit = 10, search = "") => {
  if (!idNumber) throw new Error("Missing required parameter: idNumber");
  const res = await api.get("/attendance/user/events/ongoing", { params: { id_number: idNumber, page, limit, search } });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch user events");
  return res.data;
};

export const fetchUserPastEvents = async (idNumber, page = 1, limit = 10, search = "") => {
  if (!idNumber) throw new Error("Missing required parameter: idNumber");
  const res = await api.get("/attendance/user/events/past", { params: { id_number: idNumber, page, limit, search } });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch user events");
  return res.data;
};

export const fetchBlocksOfEvents = async (eventId, filters = {}) => {
  if (!eventId) throw new Error("Missing required parameter: eventId");
  const res = await api.get("/attendance/events/blocks", { params: { event_id: eventId, ...filters } });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch blocks");
  return res.data;
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
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch student attendance");
  return res.data;
};

export const syncAttendance = async (data) => {
  const res = await api.post("/attendance/sync", data);
  if (!res.data.success) throw new Error(res.data.message || "Failed to sync attendance");
  return res.data;
};

export const fetchAllPastEvents = async (page = 1, limit = 10, search = "") => {
  const res = await api.get("/attendance/admin/events/past", { params: { page, limit, search } });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch past events");
  return res.data;
};

export const fetchAllOngoingEvents = async (page = 1, limit = 10, search = "") => {
  const res = await api.get("/attendance/admin/events/ongoing", { params: { page, limit, search } });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch ongoing events");
  return res.data;
};

let syncInterval = null;

export const stopSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};
