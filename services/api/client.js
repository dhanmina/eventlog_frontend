import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config/config";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

export const apiClient = api;

export const requireSuccess = (
  response,
  fallbackMessage,
  { preferServerMessage = false, messageFields = ["message"] } = {}
) => {
  const data = response.data;

  if (!data.success) {
    const serverMessage = messageFields.map((field) => data[field]).find(Boolean);
    throw new Error(preferServerMessage ? serverMessage || fallbackMessage : fallbackMessage);
  }

  return data;
};

export const getArrayField = (data, fieldNames) => {
  const names = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
  const value = names.map((field) => data?.[field]).find(Array.isArray);
  return value || [];
};

export const withArrayField = (data, fieldName, fallbackFieldNames = []) => ({
  ...data,
  [fieldName]: getArrayField(data, [fieldName, ...fallbackFieldNames]),
});

export default api;
