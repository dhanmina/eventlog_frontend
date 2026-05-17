import api, { requireSuccess, withArrayField } from "./client";

const withUserList = (responseData) =>
  withArrayField(responseData, "data", ["users"]);

export const fetchUsers = async (params = {}) => {
  const res = await api.get("/users", { params: { page: 1, limit: 10, ...params } });
  return withUserList(requireSuccess(res, "Failed to fetch users"));
};

export const fetchUserById = async (id) => {
  const res = await api.get(`/users/${id}`);
  return requireSuccess(res, "Failed to fetch user").user;
};

export const addUser = async (data) => {
  const res = await api.post("/users", data);
  return requireSuccess(res, "Failed to add user", { preferServerMessage: true });
};

export const updateUser = async (id, data) => {
  const res = await api.put(`/users/${id}`, data);
  return requireSuccess(res, "Failed to update user", { preferServerMessage: true });
};

export const disableUser = async (id, status = "Disabled") => {
  const res = await api.patch(`/users/${id}/status`, { status });
  return requireSuccess(res, "Failed to update user status", { preferServerMessage: true });
};
