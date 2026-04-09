import api from "./client";

export const getCurrentSchoolYear = async () => {
  const res = await api.get("/school-years/current");
  if (!res.data.success) throw new Error("Failed to get current school year");
  return res.data;
};

export const uploadSchoolYearFile = async (file, type, extraFields = {}) => {
  const formData = new FormData();
  formData.append("file", { uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" });
  Object.entries(extraFields).forEach(([key, value]) => formData.append(key, value));
  const res = await api.post("/school-years/students", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (!res.data.success) throw new Error(res.data.error || res.data.message || "Failed to upload file");
  return res.data;
};

export const changeSchoolYear = async (file, extraFields = {}) => {
  const formData = new FormData();
  formData.append("file", { uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" });
  Object.entries(extraFields).forEach(([key, value]) => formData.append(key, value));
  const res = await api.post("/school-years/change-school-year", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (!res.data.success) throw new Error(res.data.error || res.data.message || "Failed to change school year");
  return res.data;
};
