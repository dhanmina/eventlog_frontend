import axios from "axios";
import { API_URL } from "../../config/config";

export const fetchUsers = async (searchQuery = "", page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/api/users`, {
      params: { search: searchQuery, page, limit },
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error("Failed to fetch users");
  } catch (error) {
    throw error;
  }
};

export const fetchUserById = async (idNumber) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/${idNumber}`);
    if (response.data.success) {
      return response.data.user;
    }
    throw new Error("Failed to fetch user details");
  } catch (error) {
    throw error;
  }
};

export const addUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/api/users`, userData);
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to add user");
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (idNumber, userData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/users/${idNumber}`,
      userData
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to update user");
  } catch (error) {
    throw error;
  }
};

export const disableUser = async (idNumber) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/users/${idNumber}/status`,
      { status: "Disabled" }
    );

    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to disable user");
  } catch (error) {
    throw error;
  }
};

export const changeUserPassword = async (email, newPassword) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/users/${email}/password`,
      { email, newPassword }
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to change password");
  } catch (error) {
    throw error;
  }
};
