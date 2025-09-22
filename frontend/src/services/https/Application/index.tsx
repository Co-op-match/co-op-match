
import { type ApplicationInterface } from '../../../interface/IApplication';
import { type StudentInterface } from "../../../interfaces/Student"; 
import axios from "axios";
import { API_BASE } from "@/config/env";

const apiUrl = API_BASE; // เปลี่ยน URL ให้ตรงกับเซิร์ฟเวอร์ของคุณ

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
export const GetApplicationSummary = async (companyId: number) => {
  return await axios
    .get(`${apiUrl}/applications/summary/${companyId}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
};




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


// POST นัดสัมภาษณ์ใหม่
export async function CreateInterviewAppointment(data: any) {
  return await axios
    .post(`${apiUrl}/company/interview_appointments`, data, requestOptions)
    .then((res) => res)
    .catch((err) => err.response);
}

// PUT แก้ไข
export async function UpdateInterviewAppointment(id: number, data: any) {
  return await axios
    .put(`${apiUrl}/interview_appointments/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((err) => err.response);
}

// GET ทั้งหมด
export async function GetAllInterviewAppointments() {
  return await axios
    .get(`${apiUrl}/interview_appointments`, requestOptions)
    .then((res) => res)
    .catch((err) => err.response);
}

// GET รายตัว
export async function GetInterviewAppointmentById(id: number) {
  return await axios
    .get(`${apiUrl}/interview_appointments/${id}`, requestOptions)
    .then((res) => res)
    .catch((err) => err.response);
}

// DELETE รายตัว
export async function DeleteInterviewAppointment(id: number) {
  return await axios
    .delete(`${apiUrl}/interview_appointments/${id}`, requestOptions)
    .then((res) => res)
    .catch((err) => err.response);
}

async function GetApplicationsByCompanyID(companyId: number) {
  return await axios
    .get(`${apiUrl}/applications/company/${companyId}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetCompanyByUserID(userId: number) {
  return await axios
    .get(`${apiUrl}/company/user/${userId}`, requestOptions)
    .then((res) => res.data)
    .catch((e) => {
      console.error("❌ GetCompanyByUserID error:", e);
      return null;
    });
}
export async function UpdateInterviewAppointmentStatus(
  studentId: number,
  companyId: number,
  status: string
) {
  return await axios
    .put(`${apiUrl}/interview-appointments/status`, {
      student_id: studentId,
      company_id: companyId,
      status,
    }, requestOptions)
    .then((res) => res)
    .catch((err) => err.response);
}

export async function GetInterviewAppointmentByStudentAndCompany(studentId: number, companyId: number) {
  return await axios
    .get(`${apiUrl}/interview_appointments/${studentId}/${companyId}`, requestOptions)
    .then((res) => res.data)
    .catch((err) => {
      console.error("❌ ไม่พบข้อมูลการนัดสัมภาษณ์:", err);
      return null;
    });
}

export async function GetAllTags() {
  return await axios
    .get(`${apiUrl}/reviews/tags`, requestOptions)
    .then((res) => res.data) // 👈 return res.data
    .catch((e) => {
      console.error("Error fetching tags:", e);
      return { data: [] };
    });
}



export {
  CreateApplication,

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
  GetApplicationsByCompanyID,

};
