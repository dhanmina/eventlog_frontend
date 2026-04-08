import api from "./client";

export const getCurrentSchoolYear = async () => {
  const res = await api.get("/school-years/current");
  if (!res.data.success) throw new Error("Failed to get current school year");
  return res.data;
};

export const uploadSchoolYearFile = async (fileUri) => {
  const formData = new FormData();
  formData.append("file", { uri: fileUri, name: "student_list.csv", type: "text/csv" });
  const res = await api.post("/school-years", formData, { headers: { "Content-Type": "multipart/form-data" } });
  if (res.status !== 200) throw new Error(res.data.error || "Failed to upload file");
  return res.data;
};

export const changeSchoolYear = async (fileUri) => {
  const formData = new FormData();
  formData.append("file", { uri: fileUri, name: "student_list.csv", type: "text/csv" });
  const res = await api.post("/school-years/change", formData, { headers: { "Content-Type": "multipart/form-data" } });
  if (res.status !== 200) throw new Error(res.data.error || "Failed to change school year");
  return res.data;
};