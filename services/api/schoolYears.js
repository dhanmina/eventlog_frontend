import api, { requireSuccess } from "./client";

const createSchoolYearFormData = (file, extraFields = {}) => {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/octet-stream",
  });
  Object.entries(extraFields).forEach(([key, value]) => formData.append(key, value));
  return formData;
};

export const getCurrentSchoolYear = async () => {
  const res = await api.get("/school-years/current");
  return requireSuccess(res, "Failed to get current school year");
};

export const uploadSchoolYearFile = async (file, type, extraFields = {}) => {
  const formData = createSchoolYearFormData(file, extraFields);
  const res = await api.post("/school-years/students", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return requireSuccess(res, "Failed to upload file", {
    preferServerMessage: true,
    messageFields: ["error", "message"],
  });
};

export const changeSchoolYear = async (file, extraFields = {}) => {
  const formData = createSchoolYearFormData(file, extraFields);
  const res = await api.post("/school-years/change-school-year", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return requireSuccess(res, "Failed to change school year", {
    preferServerMessage: true,
    messageFields: ["error", "message"],
  });
};
