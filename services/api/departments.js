import api from "./client";

export const fetchDepartments = async () => {
  const res = await api.get("/departments");
  if (!res.data.success) throw new Error("Failed to fetch departments");
  return res.data;
};

export const fetchDepartmentById = async (id) => {
  const res = await api.get(`/departments/${id}`);
  if (!res.data.success) throw new Error("Failed to fetch department");
  return res.data.department;
};

export const addDepartment = async (data) => {
  const res = await api.post("/departments", data);
  if (!res.data.success) throw new Error("Failed to add department");
  return res.data.department;
};

export const editDepartment = async (id, data) => {
  const res = await api.put(`/departments/${id}`, data);
  if (!res.data.success) throw new Error("Failed to update department");
  return res.data.department;
};

export const deleteDepartment = async (id) => {
  const res = await api.delete(`/departments/${id}`);
  if (!res.data.success) throw new Error("Failed to delete department");
  return true;
};