import api, { requireSuccess } from "./client";

export const fetchCourses = async (search = "") => {
  const res = await api.get("/courses", { params: { search } });
  return requireSuccess(res, "Failed to fetch courses").courses;
};

export const fetchCourseById = async (id) => {
  const res = await api.get(`/courses/${id}`);
  return requireSuccess(res, "Failed to fetch course").course;
};

export const fetchCoursesByDepartmentId = async (departmentId) => {
  if (!departmentId || isNaN(departmentId)) throw new Error("Invalid department ID");
  const res = await api.get(`/courses/departments/${departmentId}`);
  return requireSuccess(res, "Failed to fetch courses", { preferServerMessage: true }).courses;
};

export const addCourse = async (data) => {
  const res = await api.post("/courses", data);
  return requireSuccess(res, "Failed to add course", { preferServerMessage: true });
};

export const editCourse = async (id, data) => {
  const res = await api.put(`/courses/${id}`, data);
  return requireSuccess(res, "Failed to update course", { preferServerMessage: true });
};

export const disableCourse = async (id) => {
  const res = await api.patch(`/courses/${id}/status`);
  return requireSuccess(res, "Failed to update course status", { preferServerMessage: true });
};
