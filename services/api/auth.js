import api from "./client";

export const login = async (id_number, password) => {
  const res = await api.post("/auth/login", { id_number, password });
  if (!res.data.success) throw new Error(res.data.message || "Login failed");
  return res.data;
};

export const register = async (data) => {
  const res = await api.post("/auth/signup", data);
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

export const fetchPublicDepartments = async () => {
  const res = await api.get("/auth/departments");
  if (!res.data.success) throw new Error("Failed to fetch departments");
  return res.data.departments;
};

export const changeUserPassword = async (email, password) => {
  const res = await api.patch("/auth/reset-password/change", { email, newPassword: password });
  if (!res.data.success) throw new Error(res.data.message || "Failed to change password");
  return res.data;
};
