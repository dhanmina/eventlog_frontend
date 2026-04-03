import axios from "axios";
import { API_URL } from "../../config/config";

export const signup = async (userData) => {
  const response = await axios.post(`${API_URL}/api/auth/signup`, userData);
  if (response.data.success) {
    return response.data;
  }
  throw new Error(response.data.message || "Registration failed.");
};
