
import { type ApplicationInterface } from '../../../interface/IApplication';
import axios from "axios";

const apiUrl = "http://localhost:8000"; // เปลี่ยน URL ให้ตรงกับเซิร์ฟเวอร์ของคุณ

const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");

const requestOptions = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  },
};

// ฟังก์ชันสำหรับสร้าง Application ใหม่
async function CreateApplication(data: ApplicationInterface) {
  return await axios
    .post(`${apiUrl}/applications`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// ฟังก์ชันสำหรับดึงข้อมูลทั้งหมดของ Application
async function GetApplications() {
  return await axios
    .get(`${apiUrl}/applications`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// ฟังก์ชันสำหรับดึงข้อมูล Application ตาม ID
async function GetApplicationById(id: number) {
  return await axios
    .get(`${apiUrl}/applications/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// ฟังก์ชันสำหรับอัพเดตข้อมูล Application
async function UpdateApplication(id: number, data: ApplicationInterface) {
  return await axios
    .put(`${apiUrl}/applications/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// ฟังก์ชันสำหรับลบ Application ตาม ID
async function DeleteApplication(id: number) {
  return await axios
    .delete(`${apiUrl}/applications/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// ฟังก์ชันสำหรับสร้าง Application ใหม่
async function CreatePost(data: ApplicationInterface) {
  return await axios
    .post(`${apiUrl}/post`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetAllInternshipPosts() {
  return await axios
    .get(`${apiUrl}/getpost`)
    .then((res) => res)
    .catch((e) => e.response);
}

export {
  CreateApplication,
  GetApplications,
  GetApplicationById,
  UpdateApplication,
  DeleteApplication,
  CreatePost,
  GetAllInternshipPosts,
};
