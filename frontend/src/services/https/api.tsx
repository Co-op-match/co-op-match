import axios from "axios";

const apiUrl = "http://localhost:8000";

// ใช้ instance เดียวสำหรับ endpoint ที่ต้อง auth
export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // เอาไว้ถ้าคุณมี cookie ฝั่ง server; ถ้าไม่ใช้คุกกี้จะไม่มีผลเสีย
});

// ใส่โทเคน “สดๆ” ก่อนยิงทุกครั้ง
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `${tokenType} ${token}`;
  } else if (config?.headers) {
    // ถ้าไม่มี token ให้แน่ใจว่าไม่ได้ส่ง header ผิดรูปแบบไป
    delete (config.headers as any).Authorization;
  }
  return config;
});

// handle 401 ทั่วไป: เคลียร์แล้วพากลับ sign-in (ตามที่คุณทำไว้เดิม)
api.interceptors.response.use(undefined, async (error) => {
  if (error.response?.status === 401) {
    localStorage.clear();
    window.location.href = "/sign-in";
  }
  return Promise.reject(error);
});