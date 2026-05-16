import api, { requireSuccess } from "./client";

export const fetchRoles = async () => {
  const res = await api.get("/roles");
  return requireSuccess(res, "Failed to fetch roles").roles.map((r) => ({
    role_id: r.id,
    role_name: r.name,
  }));
};
