import axios from "axios";
import { API_URL } from "../../config/config";

export const fetchBlocksByDepartment = async (departmentIds) => {
  if (departmentIds.length === 0) return [];

  try {
    const responses = await Promise.all(
      departmentIds.map((deptId) =>
        axios.get(`${API_URL}/api/blocks`, { params: { department_id: deptId } })
      )
    );

    return responses.flatMap((res) => (res.data.success ? res.data.data : []));
  } catch (error) {
    throw error;
  }
};

export const fetchBlocks = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/blocks`);

    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    throw new Error("Invalid blocks data received");
  } catch (error) {
    console.error("Error fetching blocks:", error);
    throw error;
  }
};

export const fetchBlockById = async (blockId) => {
  if (!blockId || isNaN(blockId)) {
    console.error("Invalid block ID provided:", blockId);
    throw new Error("Invalid block ID");
  }

  try {
    const response = await axios.get(`${API_URL}/api/blocks/${blockId}`);

    if (response.data.success) {
      return response.data.data;
    }

    console.error(
      "Failed to fetch block. Backend message:",
      response.data.message
    );
    throw new Error(response.data.message || "Failed to fetch block");
  } catch (error) {
    console.error(
      "Error fetching block details:",
      error.response?.data?.message || error.message
    );

    throw new Error(
      error.response?.data?.message ||
        "An error occurred while fetching the block."
    );
  }
};

export const addBlock = async (blockData) => {
  try {
    const response = await axios.post(`${API_URL}/api/blocks`, blockData);
    if (response.data.success) return response.data.data;
    throw new Error("Failed to add block");
  } catch (error) {
    throw error;
  }
};

export const editBlock = async (blockId, blockData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/blocks/${blockId}`,
      blockData
    );
    if (response.data.success) return response.data.data;
    throw new Error("Failed to edit block");
  } catch (error) {
    throw error;
  }
};

export const disableBlock = async (blockId) => {
  try {
    const response = await axios.patch(`${API_URL}/api/blocks/${blockId}/status`);
    if (response.data.success) return response.data.message;
    throw new Error("Failed to disable block");
  } catch (error) {
    throw error;
  }
};
