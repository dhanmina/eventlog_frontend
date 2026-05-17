import api, { getArrayField, requireSuccess } from "./client";

const getBlockList = (responseData) => getArrayField(responseData, ["data", "blocks"]);

export const fetchBlocks = async (params = {}) => {
  const res = await api.get("/blocks", { params });
  return getBlockList(requireSuccess(res, "Failed to fetch blocks"));
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
  return responses.flatMap((res) => (res.data.success ? getBlockList(res.data) : []));
};

export const addBlock = async (data) => {
  const res = await api.post("/blocks", data);
  return requireSuccess(res, "Failed to add block").data;
};

export const editBlock = async (id, data) => {
  const res = await api.put(`/blocks/${id}`, data);
  return requireSuccess(res, "Failed to edit block").data;
};

export const disableBlock = async (id, status = "Disabled") => {
  const res = await api.patch(`/blocks/${id}/status`, { status });
  return requireSuccess(res, "Failed to update block status");
};
