import api from "./client";

export const fetchCourses = async (search = "") => {
  const res = await api.get("/courses", { params: { search } });
  if (!res.data.success) throw new Error("Failed to fetch courses");
  return res.data.courses;
};

export const fetchCourseById = async (id) => {
  const res = await api.get(`/courses/${id}`);
  if (!res.data.success) throw new Error("Failed to fetch course");
  return res.data.course;
};

export const fetchCoursesByDepartmentId = async (departmentId) => {
  if (!departmentId || isNaN(departmentId)) throw new Error("Invalid department ID");
  const res = await api.get("/courses", { params: { department_id: departmentId } });
  if (!res.data.success) throw new Error(res.data.message || "Failed to fetch courses");
  return res.data.courses;
};

export const addCourse = async (data) => {
  const res = await api.post("/courses", data);
  if (!res.data.success) throw new Error(res.data.message || "Failed to add course");
  return res.data;
};

export const editCourse = async (id, data) => {
  const res = await api.put(`/courses/${id}`, data);
  if (!res.data.success) throw new Error(res.data.message || "Failed to update course");
  return res.data;
};

export const deleteCourse = async (id) => {
  const res = await api.delete(`/courses/${id}`);
  if (!res.data.success) throw new Error(res.data.message || "Failed to delete course");
  return res.data;
};