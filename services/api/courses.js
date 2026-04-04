import axios from "axios";
import { API_URL } from "../../config/config";

export const fetchCourses = async (searchQuery = "") => {
  try {
    const response = await axios.get(`${API_URL}/api/courses`, {
      params: { search: searchQuery },
    });
    if (response.data.success) {
      return response.data.courses;
    }
    throw new Error("Failed to fetch courses");
  } catch (error) {
    throw error;
  }
};

export const fetchCourseById = async (courseId) => {
  try {
    const response = await axios.get(`${API_URL}/api/courses/${courseId}`);
    if (response.data.success) {
      return response.data.course;
    }
    throw new Error("Failed to fetch course details");
  } catch (error) {
    throw error;
  }
};

export const fetchCoursesByDepartmentId = async (departmentId) => {
  try {
    if (!departmentId || isNaN(departmentId)) {
      throw new Error("Invalid department ID provided");
    }

    const response = await axios.get(
      `${API_URL}/api/courses/departments/${departmentId}`
    );

    if (response.data.success) {
      return response.data.courses;
    }

    throw new Error(
      response.data.message || "Failed to fetch courses by department ID"
    );
  } catch (error) {
    console.error("Error fetching courses by department ID:", error.message);
    throw error;
  }
};

export const addCourse = async (courseData) => {
  try {
    const response = await axios.post(`${API_URL}/api/courses`, courseData);
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to add course");
  } catch (error) {
    throw error;
  }
};

export const editCourse = async (courseId, courseData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/courses/${courseId}`,
      courseData
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to update course");
  } catch (error) {
    throw error;
  }
};

export const enableCourse = async (courseId) => {
  const response = await axios.patch(
    `${API_URL}/api/courses/${courseId}/status`,
    { status: "Active" }
  );
  if (response.data.success) return response.data.message;
  throw new Error("Failed to enable course");
};

export const disableCourse = async (courseId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/courses/${courseId}/status`,
      { status: "Disabled" }
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to disable course");
  } catch (error) {
    throw error;
  }
};
