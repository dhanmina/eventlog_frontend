import api from "./client";

export const fetchUsers = async (params = {}) => {
  const res = await api.get("/users", { params: { page: 1, limit: 10, ...params } });
  if (!res.data.success) throw new Error("Failed to fetch users");
  return res.data;
};

export const fetchUserById = async (id) => {
  const res = await api.get(`/users/${id}`);
  if (!res.data.success) throw new Error("Failed to fetch user");
  return res.data.user;
};

export const addUser = async (data) => {
  const res = await api.post("/users", data);
  if (!res.data.success) throw new Error(res.data.message || "Failed to add user");
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await api.put(`/users/${id}`, data);
  if (!res.data.success) throw new Error(res.data.message || "Failed to update user");
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/users/${id}`);
  if (!res.data.success) throw new Error(res.data.message || "Failed to delete user");
  return res.data;
};

export const changeUserPassword = async (email, newPassword) => {
  const res = await api.post("/users/change-password", { email, newPassword });
  if (!res.data.success) throw new Error(res.data.message || "Failed to change password");
  return res.data;
};