import api, { getArrayField, requireSuccess } from "./client";

const getYearLevelList = (responseData) =>
  getArrayField(responseData, ["yearlevel", "yearLevels", "data"]);

export const fetchYearLevels = async () => {
  const res = await api.get("/year-level");
  const data = requireSuccess(res, "Failed to fetch year levels");

  return getYearLevelList(data).map((y) => ({
    year_level_id: y.year_level_id,
    year_level_name: y.year_level_name,
  }));
};
