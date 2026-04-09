import api from "./client";

export const fetchEvents = async (params = {}) => {
  const res = await api.get("/events", { params });
  if (!res.data.success) throw new Error("Failed to fetch events");
  return res.data;
};

export const fetchEventById = async (id) => {
  const res = await api.get(`/events/${id}`);
  if (!res.data.success) throw new Error("Failed to fetch event");
  return res.data.event;
};

export const addEvent = async (data) => {
  const res = await api.post("/events/admin", data);
  if (!res.data.success) throw new Error("Failed to add event");
  return res.data;
};

export const updateEvent = async (id, data) => {
  const res = await api.put(`/events/admin/${id}`, data);
  if (!res.data.success) throw new Error(res.data.message || "Update failed");
  return res.data;
};

export const deleteEvent = async (id) => {
  const res = await api.delete(`/events/admin/${id}`);
  if (!res.data.success) throw new Error("Failed to delete event");
  return true;
};

export const approveEvent = async (id, adminIdNumber) => {
  const res = await api.patch(`/events/admin/${id}/status`, { admin_id_number: adminIdNumber });
  if (!res.data.success) throw new Error("Failed to approve event");
  return res.data;
};

export const fetchApprovedOngoing = async () => {
  const res = await api.get("/events", { params: { status: "ongoing" } });
  if (!res.data.success) throw new Error("Failed to fetch ongoing events");
  return res.data;
};

export const fetchUpcomingEvents = async (blockId) => {
  const res = await api.get("/events/upcoming", { params: blockId ? { block_id: blockId } : {} });
  if (!res.data.success) throw new Error("Failed to fetch upcoming events");
  return res.data;
};
