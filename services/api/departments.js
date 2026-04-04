import axios from "axios";
import { API_URL } from "../../config/config";

export const fetchPublicDepartments = async () => {
  const response = await axios.get(`${API_URL}/api/auth/departments`);
  if (response.data.departments) {
    return response.data.departments;
  }
  throw new Error("Failed to fetch departments");
};

export const fetchDepartments = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/departments`);
    if (response.data.success) {
      return response.data;
    }
    throw new Error("Failed to fetch departments");
  } catch (error) {
    throw error;
  }
};

export const fetchDepartmentById = async (departmentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/departments/${departmentId}`,
    );
    if (response.data.success) {
      return response.data.department;
    }
    throw new Error("Failed to fetch department");
  } catch (error) {
    throw error;
  }
};

export const addDepartment = async (departmentData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/departments`,
      departmentData,
    );
    if (response.data.success) {
      return response.data.department;
    }
    throw new Error("Failed to add department");
  } catch (error) {
    throw error;
  }
};

export const editDepartment = async (departmentId, departmentData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/departments/${departmentId}`,
      departmentData,
    );
    if (response.data.success) {
      return response.data.department;
    }
    throw new Error("Failed to update department");
  } catch (error) {
    throw error;
  }
};

export const disableDepartment = async (departmentId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/departments/${departmentId}/status`,
      { status: "Disabled" },
    );
    if (response.data.success) {
      return true;
    }
    throw new Error("Failed to disable department");
  } catch (error) {
    throw error;
  }
};

export const enableDepartment = async (departmentId) => {
  const response = await axios.patch(
    `${API_URL}/api/departments/${departmentId}/status`,
    { status: "Active" },
  );
  if (response.data.success) return response.data.message;
  throw new Error("Failed to enable department");
};
