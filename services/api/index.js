import axios from "axios";
import { API_URL } from "../../config/config";

console.log("[API] Base URL:", API_URL);

axios.interceptors.request.use(
  (config) => {
    const params = config.params ? JSON.stringify(config.params) : "";
    const body = config.data ? JSON.stringify(config.data) : "";
    console.log(
      `[API] --> ${config.method?.toUpperCase()} ${config.url}`,
      params ? `| params: ${params}` : "",
      body ? `| body: ${body}` : "",
    );
    return config;
  },
  (error) => {
    console.error("[API] Request setup error:", error.message);
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  (response) => {
    console.log(
      `[API] <-- ${response.status} ${response.config.url}`,
      `| success: ${response.data?.success}`,
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `[API] <-- ${error.response.status} ${error.config?.url}`,
        `| message: ${JSON.stringify(error.response.data)}`,
      );
    } else if (error.request) {
      console.error(
        `[API] No response from server | url: ${error.config?.url}`,
        `| baseURL: ${API_URL}`,
        `| message: ${error.message}`,
      );
    } else {
      console.error("[API] Error:", error.message);
    }
    return Promise.reject(error);
  },
);

export * from "./departments";
export * from "./blocks";
export * from "./events";
export * from "./admins";
export * from "./courses";
export * from "./users";
export * from "./roles";
export * from "./schoolYears";
export * from "./sync";
export * from "./records";
