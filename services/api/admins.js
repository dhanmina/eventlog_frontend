import axios from "axios";
import { API_URL } from "../../config/config";

export const fetchAdmins = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/admins`);
    if (response.data.success) {
      return response.data.admins;
    }
    throw new Error("Failed to fetch admins");
  } catch (error) {
    throw error;
  }
};

export const fetchAdminById = async (id_number) => {
  try {
    const response = await axios.get(`${API_URL}/api/admins/${id_number}`);
    if (response.data.success) {
      return response.data.admin;
    }
    throw new Error(response.data.message || "Failed to fetch admin details");
  } catch (error) {
    throw error;
  }
};

export const addAdmin = async (adminData) => {
  try {
    const response = await axios.post(`${API_URL}/api/admins`, adminData);
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to add admin");
  } catch (error) {
    throw error;
  }
};

export const editAdmin = async (id_number, adminData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/admins/${id_number}`,
      adminData
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to update admin");
  } catch (error) {
    throw error;
  }
};

export const updateAdminStatus = async (id_number, status) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/admins/${id_number}/status`,
      { status }
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to update admin status");
  } catch (error) {
    throw error;
  }
};
