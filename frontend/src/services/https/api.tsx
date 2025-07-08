import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: เพิ่ม Authorization header ก่อนทุก request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const tokenType = localStorage.getItem("token_type");
    if (token && tokenType) {
      config.headers.Authorization = `${tokenType} ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: ดัก 401 แล้ว redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("token_type");
      alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  }
);

export default api;