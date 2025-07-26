
import { type ApplicationInterface } from '../../../interface/IApplication';
import { type StudentInterface } from "../../../interfaces/Student"; 
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
// ✅ ใหม่: ฟังก์ชันสำหรับสร้าง Application พร้อมแนบไฟล์ (resume, transcript)
async function CreateApplication(postId: number, formData: FormData) {
  return await axios
    .post(`${apiUrl}/applications/${postId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `${Bearer} ${Authorization}`,
      },
    })
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
    .get(`${apiUrl}/application/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetApplicationsByStudentID(studentId: number) {
  return await axios
    .get(`${apiUrl}/application_details/student/${studentId}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetStudentByUserId(userId: number): Promise<StudentInterface | null> {
  return await axios
    .get(`${apiUrl}/student/user/${userId}`, requestOptions)
    .then((res) => res.data)
    .catch((e) => {
      console.error("❌ Error fetching student:", e);
      return null;
    });
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

async function GetPostById(id: number) {
  return await axios
    .get(`${apiUrl}/getpost/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// ✅ ฟังก์ชันสำหรับดึงใบสมัครจาก InternshipPostID
async function GetApplicationsByPostId(postId: number) {
  return await axios
    .get(`${apiUrl}/applications/post/${postId}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateApplicationStatus(id: number, status: string, companyNote?: string) {
  return await axios
    .put(`${apiUrl}/applications/post/${id}`, { status, company_note: companyNote }, requestOptions)
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
  GetPostById,
  GetApplicationsByStudentID,
  GetStudentByUserId,
  GetApplicationsByPostId,
  UpdateApplicationStatus,
};
