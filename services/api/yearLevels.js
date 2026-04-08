import api from "./client";

export const fetchYearLevels = async () => {
  const res = await api.get("/year-level");
  if (!res.data.success) throw new Error("Failed to fetch year levels");
  return res.data.data.map((y) => ({ year_level_id: y.year_level_id, year_level_name: y.year_level_name }));
};