import api from "./client";

export const fetchBlocks = async (params = {}) => {
  const res = await api.get("/blocks", { params });
  if (!res.data.success) throw new Error("Failed to fetch blocks");
  return res.data.data;
};

export const fetchBlockById = async (id) => {
  if (!id || isNaN(id)) throw new Error("Invalid block ID");
  const res = await api.get(`/blocks/${id}`);
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch block");
  return res.data.data;
};

export const fetchBlocksByDepartment = async (departmentIds) => {
  if (departmentIds.length === 0) return [];
  const responses = await Promise.all(
    departmentIds.map((deptId) => api.get("/blocks", { params: { department_id: deptId } }))
  );
  return responses.flatMap((res) => (res.data.success ? res.data.data : []));
};

export const addBlock = async (data) => {
  const res = await api.post("/blocks", data);
  if (!res.data.success) throw new Error("Failed to add block");
  return res.data.data;
};

export const editBlock = async (id, data) => {
  const res = await api.put(`/blocks/${id}`, data);
  if (!res.data.success) throw new Error("Failed to edit block");
  return res.data.data;
};

export const deleteBlock = async (id) => {
  const res = await api.delete(`/blocks/${id}`);
  if (!res.data.success) throw new Error("Failed to delete block");
  return true;
};