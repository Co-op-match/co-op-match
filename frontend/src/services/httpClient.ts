import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  withCredentials: true,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";

  if (token) {
    // สร้าง/แปลง headers ให้เป็น AxiosHeaders ก่อนค่อย set
    const headers = (config.headers ?? new AxiosHeaders()) as AxiosHeaders;
    headers.set("Authorization", `${tokenType} ${token}`);
    config.headers = headers;
  }
  return config;
});
