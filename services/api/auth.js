import api, { getArrayField, requireSuccess } from "./client";

export const login = async (id_number, password) => {
  const res = await api.post("/auth/login", { id_number, password });
  return requireSuccess(res, "Login failed", { preferServerMessage: true });
};

export const register = async (data) => {
  const res = await api.post("/auth/signup", data);
  return requireSuccess(res, "Registration failed", { preferServerMessage: true });
};

export const resetPassword = async (email) => {
  const res = await api.post("/auth/reset-password", { email });
  return requireSuccess(res, "Reset password failed", { preferServerMessage: true });
};

export const confirmResetPassword = async (email, code, newPassword) => {
  const res = await api.post("/auth/reset-password/confirm", { email, code, new_password: newPassword });
  return requireSuccess(res, "Confirm reset failed", { preferServerMessage: true });
};

export const fetchPublicDepartments = async () => {
  const res = await api.get("/auth/departments");
  return getArrayField(requireSuccess(res, "Failed to fetch departments"), [
    "departments",
    "data",
  ]);
};

export const changeUserPassword = async (email, password) => {
  const res = await api.patch("/auth/reset-password/change", { email, newPassword: password });
  return requireSuccess(res, "Failed to change password", { preferServerMessage: true });
};
