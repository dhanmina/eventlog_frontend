import api, { requireSuccess } from "./client";

export const fetchYearLevels = async () => {
  const res = await api.get("/year-level");
  return requireSuccess(res, "Failed to fetch year levels").data.map((y) => ({
    year_level_id: y.year_level_id,
    year_level_name: y.year_level_name,
  }));
};
