import api, { requireSuccess, withArrayField } from "./client";

const withEventList = (responseData) =>
  withArrayField(responseData, "events", ["data"]);

export const fetchEvents = async (params = {}) => {
  const res = await api.get("/events", { params });
  return withEventList(requireSuccess(res, "Failed to fetch events"));
};

export const fetchEditableEvents = async (params = {}) => {
  const res = await api.get("/events/editable", { params });
  return withEventList(requireSuccess(res, "Failed to fetch editable events"));
};

export const fetchEventById = async (id) => {
  const res = await api.get(`/events/${id}`);
  return requireSuccess(res, "Failed to fetch event").event;
};

export const addEvent = async (data) => {
  const res = await api.post("/events/admin", data);
  return requireSuccess(res, "Failed to add event");
};

export const updateEvent = async (id, data) => {
  const res = await api.put(`/events/admin/${id}`, data);
  return requireSuccess(res, "Update failed", { preferServerMessage: true });
};

export const deleteEvent = async (id) => {
  const res = await api.delete(`/events/admin/${id}`);
  requireSuccess(res, "Failed to delete event");
  return true;
};

export const approveEvent = async (id, adminIdNumber) => {
  const res = await api.patch(`/events/admin/${id}/status`, { admin_id_number: adminIdNumber });
  return requireSuccess(res, "Failed to approve event");
};

export const fetchApprovedOngoing = async () => {
  const res = await api.get("/events", { params: { status: "ongoing" } });
  return withEventList(requireSuccess(res, "Failed to fetch ongoing events"));
};

export const fetchUpcomingEvents = async (blockId) => {
  const res = await api.get("/events/upcoming", { params: blockId ? { block_id: blockId } : {} });
  return withEventList(requireSuccess(res, "Failed to fetch upcoming events"));
};
