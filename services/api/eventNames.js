import api from "./client";

export const fetchEventNames = async () => {
  const res = await api.get("/event-names");
  if (!res.data.success) throw new Error("Failed to fetch event names");
  return res.data.eventNames.map((e) => ({
    label: e.name || e.event_name,
    value: e.id || e.event_name_id,
    status: e.status,
  }));
};

export const fetchEventNameById = async (id) => {
  const res = await api.get(`/event-names/${id}`);
  if (!res.data.success) throw new Error("Failed to fetch event name");
  return res.data;
};

export const addEventName = async (name) => {
  const res = await api.post("/event-names", { name });
  if (!res.data.success) throw new Error("Failed to add event name");
  return res.data.eventName;
};

export const editEventName = async (id, data) => {
  const res = await api.put(`/event-names/${id}`, data);
  if (!res.data.success) throw new Error("Failed to update event name");
  return res.data.eventName;
};

export const deleteEventName = async (id) => {
  const res = await api.delete(`/event-names/${id}`);
  if (!res.data.success) throw new Error("Failed to delete event name");
  return true;
};