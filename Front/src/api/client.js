import axios from "axios";

const resolveBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
  if (envUrl) {
    return envUrl;
  }
  if (import.meta.env.DEV) {
    return "http://localhost:4000";
  }
  throw new Error("VITE_API_URL is required");
};

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const clearAuthToken = () => {
  authToken = null;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default api;
