import api, { requireSuccess } from "./client";

export const fetchDepartments = async () => {
  const res = await api.get("/departments");
  return requireSuccess(res, "Failed to fetch departments");
};

export const fetchDepartmentById = async (id) => {
  const res = await api.get(`/departments/${id}`);
  return requireSuccess(res, "Failed to fetch department").department;
};

export const addDepartment = async (data) => {
  const res = await api.post("/departments", data);
  return requireSuccess(res, "Failed to add department").department;
};

export const editDepartment = async (id, data) => {
  const res = await api.put(`/departments/${id}`, data);
  return requireSuccess(res, "Failed to update department").department;
};

export const disableDepartment = async (id) => {
  const res = await api.patch(`/departments/${id}/status`);
  return requireSuccess(res, "Failed to update department status");
};
