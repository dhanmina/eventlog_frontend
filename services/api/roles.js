import axios from "axios";
import { API_URL } from "../../config/config";

export const fetchRoles = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/roles`);
    if (response.data.success) {
      return response.data.roles.map((role) => ({
        role_id: role.id,
        role_name: role.name,
      }));
    }
    throw new Error("Failed to fetch roles");
  } catch (error) {
    throw error;
  }
};

export const fetchYearLevels = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/year-level`);

    if (response.data.success) {
      return response.data.yearlevel.map((yearlevel) => ({
        year_level_id: yearlevel.id,
        year_level_name: yearlevel.name,
      }));
    }
    throw new Error("Failed to fetch year levels");
  } catch (error) {
    throw error;
  }
};
