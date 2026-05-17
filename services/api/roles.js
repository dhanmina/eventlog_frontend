import api, { getArrayField, requireSuccess } from "./client";

export const fetchRoles = async () => {
  const res = await api.get("/roles");
  return getArrayField(requireSuccess(res, "Failed to fetch roles"), [
    "roles",
    "data",
  ]).map((r) => ({
    role_id: r.id,
    role_name: r.name,
  }));
};
