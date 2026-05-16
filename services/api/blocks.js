import api, { requireSuccess } from "./client";

export const fetchBlocks = async (params = {}) => {
  const res = await api.get("/blocks", { params });
  return requireSuccess(res, "Failed to fetch blocks").data;
};

export const fetchBlockById = async (id) => {
  if (!id || isNaN(id)) throw new Error("Invalid block ID");
  const res = await api.get(`/blocks/${id}`);
  return requireSuccess(res, "Failed to fetch block", { preferServerMessage: true }).data;
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
  return requireSuccess(res, "Failed to add block").data;
};

export const editBlock = async (id, data) => {
  const res = await api.put(`/blocks/${id}`, data);
  return requireSuccess(res, "Failed to edit block").data;
};

export const disableBlock = async (id) => {
  const res = await api.patch(`/blocks/${id}/status`);
  return requireSuccess(res, "Failed to update block status");
};
