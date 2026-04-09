import api from "./client";

export const fetchEventNames = async () => {
  const res = await api.get("/event-names", { params: { limit: 100 } });
  if (!res.data.success) throw new Error("Failed to fetch event names");
  return (res.data.data || []).map((e) => ({
    label: e.name,
    value: e.id,
    status: e.status,
  }));
};

export const fetchEventNameById = async (id) => {
  const res = await api.get(`/event-names/${id}`);
  if (!res.data.success) throw new Error("Failed to fetch event name");
  return res.data.data;
};

export const addEventName = async (data) => {
  const res = await api.post("/event-names", data);
  if (!res.data.success) throw new Error("Failed to add event name");
  return res.data.eventName;
};

export const editEventName = async (id, data) => {
  const res = await api.put(`/event-names/${id}`, data);
  if (!res.data.success) throw new Error("Failed to update event name");
  return res.data.data;
};

export const disableEventName = async (id, status = "Disabled") => {
  const res = await api.patch(`/event-names/${id}/status`, { status });
  if (!res.data.success) throw new Error("Failed to update event name status");
  return res.data;
};
