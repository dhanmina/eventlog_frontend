import api, { getArrayField, requireSuccess } from "./client";

const getCourseList = (responseData) =>
  getArrayField(responseData, ["courses", "data"]);

export const fetchCourses = async (search = "") => {
  const res = await api.get("/courses", { params: { search } });
  return getCourseList(requireSuccess(res, "Failed to fetch courses"));
};

export const fetchCourseById = async (id) => {
  const res = await api.get(`/courses/${id}`);
  return requireSuccess(res, "Failed to fetch course").course;
};

export const fetchCoursesByDepartmentId = async (departmentId) => {
  if (!departmentId || isNaN(departmentId)) throw new Error("Invalid department ID");
  const res = await api.get(`/courses/departments/${departmentId}`);
  return getCourseList(
    requireSuccess(res, "Failed to fetch courses", { preferServerMessage: true })
  );
};

export const addCourse = async (data) => {
  const res = await api.post("/courses", data);
  return requireSuccess(res, "Failed to add course", { preferServerMessage: true });
};

export const editCourse = async (id, data) => {
  const res = await api.put(`/courses/${id}`, data);
  return requireSuccess(res, "Failed to update course", { preferServerMessage: true });
};

export const disableCourse = async (id, status = "Disabled") => {
  const res = await api.patch(`/courses/${id}/status`, { status });
  return requireSuccess(res, "Failed to update course status", { preferServerMessage: true });
};
