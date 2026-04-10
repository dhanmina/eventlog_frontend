import api from "./client";

export const fetchRoles = async () => {
  const res = await api.get("/roles");
  if (!res.data.success) throw new Error("Failed to fetch roles");
  return res.data.roles.map((r) => ({ role_id: r.id, role_name: r.name }));
};
