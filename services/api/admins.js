import api from "./client";

export const fetchAdmins = async () => {
  const res = await api.get("/admins");
  if (!res.data.success) throw new Error("Failed to fetch admins");
  return res.data.admins;
};

export const fetchAdminById = async (id) => {
  const res = await api.get(`/admins/${id}`);
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch admin");
  return res.data.admin;
};

export const addAdmin = async (data) => {
  const res = await api.post("/admins", data);
  if (!res.data.success) throw new Error(res.data.message || "Failed to add admin");
  return res.data;
};

export const editAdmin = async (id, data) => {
  const res = await api.put(`/admins/${id}`, data);
  if (!res.data.success) throw new Error(res.data.message || "Failed to update admin");
  return res.data;
};

export const disableAdmin = async (idNumber) => {
  const res = await api.patch(`/admins/${idNumber}/status`);
  if (!res.data.success) throw new Error(res.data.message || "Failed to update admin status");
  return res.data;
};
