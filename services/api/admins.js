import api, { requireSuccess } from "./client";

export const fetchAdmins = async () => {
  const res = await api.get("/admins");
  return requireSuccess(res, "Failed to fetch admins").admins;
};

export const fetchAdminById = async (id) => {
  const res = await api.get(`/admins/${id}`);
  return requireSuccess(res, "Failed to fetch admin", { preferServerMessage: true }).admin;
};

export const addAdmin = async (data) => {
  const res = await api.post("/admins", data);
  return requireSuccess(res, "Failed to add admin", { preferServerMessage: true });
};

export const editAdmin = async (id, data) => {
  const res = await api.put(`/admins/${id}`, data);
  return requireSuccess(res, "Failed to update admin", { preferServerMessage: true });
};

export const disableAdmin = async (idNumber) => {
  const res = await api.patch(`/admins/${idNumber}/status`);
  return requireSuccess(res, "Failed to update admin status", { preferServerMessage: true });
};
