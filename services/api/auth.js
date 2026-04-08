import api from "./client";

export const login = async (id_number, password) => {
  const res = await api.post("/auth/login", { id_number, password });
  if (!res.data.success) throw new Error(res.data.message || "Login failed");
  return res.data;
};

export const register = async (data) => {
  const res = await api.post("/auth/register", data);
  if (!res.data.success) throw new Error(res.data.message || "Registration failed");
  return res.data;
};

export const resetPassword = async (email) => {
  const res = await api.post("/auth/reset-password", { email });
  if (!res.data.success) throw new Error(res.data.message || "Reset password failed");
  return res.data;
};

export const confirmResetPassword = async (email, code, newPassword) => {
  const res = await api.post("/auth/reset-password/confirm", { email, code, new_password: newPassword });
  if (!res.data.success) throw new Error(res.data.message || "Confirm reset failed");
  return res.data;
};