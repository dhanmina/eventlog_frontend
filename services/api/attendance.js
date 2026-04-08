import api from "./client";

export const fetchAttendanceSummaryOfEvent = async (eventId) => {
  if (!eventId) throw new Error("Missing required parameter: eventId");
  const res = await api.post("/attendance/event/summary", { event_id: eventId }, { timeout: 10000 });
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to fetch attendance summary");
  return res.data;
};

export const fetchAttendanceSummaryPerBlock = async (eventId, blockId, attendanceFilter = "all") => {
  if (!eventId || !blockId) throw new Error("Missing required parameters");
  const res = await api.post("/attendance", { event_id: eventId, block_id: blockId, attendanceFilter });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch attendance summary");
  return res.data;
};

export const getStudentAttSummary = async (eventId, studentId) => {
  if (!eventId || !studentId) throw new Error("Missing required parameters");
  const res = await api.post("/attendance/student/summary", { event_id: eventId, student_id: studentId });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch student summary");
  return res.data;
};

export const fetchUserOngoingEvents = async (idNumber, page = 1, limit = 10, search = "") => {
  if (!idNumber) throw new Error("Missing required parameter: idNumber");
  const res = await api.post("/attendance/user/ongoing/events", { id_number: idNumber, page, limit, search });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch user events");
  return res.data;
};

export const fetchUserPastEvents = async (idNumber, page = 1, limit = 10, search = "") => {
  if (!idNumber) throw new Error("Missing required parameter: idNumber");
  const res = await api.post("/attendance/user/past/events", { id_number: idNumber, page, limit, search });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch user events");
  return res.data;
};

export const fetchBlocksOfEvents = async (eventId, filters = {}) => {
  if (!eventId) throw new Error("Missing required parameter: eventId");
  const res = await api.post("/attendance/events/blocks", { event_id: eventId, ...filters });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch blocks");
  return res.data;
};

export const fetchStudentAttendanceByEventAndBlock = async (eventId, blockId, searchQuery = "") => {
  if (!eventId || !blockId) throw new Error("Missing required parameters");
  const res = await api.post("/attendance/events/block/students", {
    event_id: eventId,
    block_id: blockId,
    search_query: searchQuery || undefined,
  });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch student attendance");
  return res.data;
};

export const syncAttendance = async (data) => {
  const res = await api.post("/attendance/sync", data);
  if (!res.data.success) throw new Error(res.data.message || "Failed to sync attendance");
  return res.data;
};