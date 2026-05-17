import api, { getArrayField, requireSuccess } from "./client";

export const fetchEventNames = async () => {
  const res = await api.get("/event-names", { params: { limit: 100 } });
  const data = getArrayField(requireSuccess(res, "Failed to fetch event names"), [
    "data",
    "eventNames",
  ]);
  return data.map((e) => ({
    label: e.name,
    value: e.id,
    status: e.status,
  }));
};

export const fetchEventNameById = async (id) => {
  const res = await api.get(`/event-names/${id}`);
  return requireSuccess(res, "Failed to fetch event name").data;
};

export const addEventName = async (data) => {
  const res = await api.post("/event-names", data);
  return requireSuccess(res, "Failed to add event name").eventName;
};

export const editEventName = async (id, data) => {
  const res = await api.put(`/event-names/${id}`, data);
  return requireSuccess(res, "Failed to update event name").data;
};

export const disableEventName = async (id, status = "Disabled") => {
  const res = await api.patch(`/event-names/${id}/status`, { status });
  return requireSuccess(res, "Failed to update event name status");
};
