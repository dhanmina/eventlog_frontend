import axios from "axios";
import { API_URL } from "../../config/config";

export const uploadSchoolYearFile = async (file, type, extraFields = {}) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    });
    if (extraFields.department_code) formData.append("department_code", extraFields.department_code);
    if (extraFields.course_code) formData.append("course_code", extraFields.course_code);

    const response = await axios.post(
      `${API_URL}/api/school-years/students`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(response.data.error || "Failed to upload file");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const changeSchoolYear = async (file, extraFields = {}) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    });
    if (extraFields.department_code) formData.append("department_code", extraFields.department_code);
    if (extraFields.course_code) formData.append("course_code", extraFields.course_code);

    const response = await axios.post(
      `${API_URL}/api/school-years/change-school-year`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(response.data.error || "Failed to change school year");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getCurrentSchoolYear = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/school-years/current`);
    if (response.data.success) {
      return response.data;
    }
    throw new Error("Failed to get current school year");
  } catch (error) {
    throw error;
  }
};
