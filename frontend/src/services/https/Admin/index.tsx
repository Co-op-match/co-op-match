import axios from "axios";
import type { VerifyInterface } from "../../../interfaces/Verify";
import api from "./api";
import type { CompanyInterface } from "../../../interfaces/Company";
const apiUrl = "http://localhost:8000";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");
const requestOptions = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  },
};

/* ============================ all  ============================ */
// ฟังก์ชันสำหรับดึงข้อมูล Status Posts
export async function UpdateStatusPost(postId: number, statusPostId: number) {
  return await api
    .put(`${apiUrl}/posts/update-status`, { post_id: postId, status_post_id: statusPostId }, requestOptions)
    .then((res) => res.data)
    .catch((e) => e.response);
}

export async function GetAllStatusVerify() {
  return await api
    .get(`${apiUrl}/status_verifies`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
export async function UpdateVerifyStatus(verifyId: number, data: VerifyInterface) {
  return await axios
    .patch(`${apiUrl}/patch-verify/${verifyId}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error updating verification status:", e);
      return e.response;
    });
}

export async function GetAllInternshipPostsInAdmin() {
  return await api
    .get(`${apiUrl}/admin/get-allpost`)
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetInternshipPostsInAdminByIPostID(id: number) {
  return await axios
    .get(`${apiUrl}/admin/get-post-by-postid/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
/* ============================ student  ============================ */
// สำหรับ student, student => ไม่เห็นข้อมูลบริษัทที่โดนลบ
export async function GetAllActiveStudents() {
  return await api
    .get(`${apiUrl}/students/all-active`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
// สำหรับ admin => เห็นข้อมูลบริษัทที่โดนลบ
export async function GetAllDeletedStudents() {
  return await api
    .get(`${apiUrl}/students/all-deleted`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching admin companies:", e);
      return e.response;
    });
}
export async function CreateUserStudentContact(data: FormData) {
  return await axios.post(`${apiUrl}/student`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `${Bearer} ${Authorization}`,
    },
  });
}
export async function UpdateStudent(id: number, data: any) {
  return await axios.patch(`${apiUrl}/student/${id}`, data, {
    headers: {
      Authorization: `${Bearer} ${Authorization}`,
    },
  });
}
export async function DeleteStudent(studentId: number) {
  return await axios
    .delete(`${apiUrl}/students/delete/${studentId}`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error deleting company:", e);
      return e.response;
    });
}

/* ============================ company  ============================ */
export async function CreateUserCompanyContact(data: FormData): Promise<any> {
  try {
    const res = await axios.post(`${apiUrl}/company/create-user-company-contact`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `${Bearer} ${Authorization}`,
      },
    });
    return res;
  } catch (e: any) {
    return e.response;
  }
}
// สำหรับ student, company => ไม่เห็นข้อมูลบริษัทที่โดนลบ
export async function GetAllActiveCompanies() {
  return await api
    .get(`${apiUrl}/company/all-active`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
// สำหรับ admin => เห็นข้อมูลบริษัทที่โดนลบ
export async function GetAllDeletedCompany() {
  return await api
    .get(`${apiUrl}/company/all-deleted`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching admin companies:", e);
      return e.response;
    });
}

/* ============================ academicstaff  ============================ */
export async function GetAllAcademicStaff() {
  return await api
    .get(`${apiUrl}/academic-staff/`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
export async function GetAllActiveAcademicStaffs() {
  return await api
    .get(`${apiUrl}/academic-staff/all-active`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
export async function GetAllDeletedAcademicStaffs() {
  return await api
    .get(`${apiUrl}/academic-staff/all-deleted`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
export async function DeleteAcademicStaff(staffId: number) {
  return await axios
    .delete(`${apiUrl}/academic-staff/delete/${staffId}`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error deleting company:", e);
      return e.response;
    });
}
export async function UpdateAcademicStaff(id: number, data: any) {
  return await axios
    .patch(`${apiUrl}/academic-staff/update/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((err) => {
      console.error("Error updating academic staff:", err);
      return err.response;
    });
}
export async function CreateAcademicStaff(data: FormData): Promise<any> {
  try {
    const token = localStorage.getItem("token"); // หรือ Authorization จาก context ของคุณ
    const res = await axios.post(`${apiUrl}/academic-staff`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return res;
  } catch (err: any) {
    return err.response;
  }
}
export async function CreateUserAcademicStaffContact(data: FormData): Promise<any> {
  try {
    const res = await axios.post(`${apiUrl}/academic-staff/create-user-academic-staff-contact`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `${Bearer} ${Authorization}`,
      },
    });
    return res;
  } catch (e: any) {
    return e.response;
  }
}

/* ============================ academicstaff  ============================ */
export async function GetAllActiveAdmins() {
  return await api
    .get(`${apiUrl}/admin/all-active`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
export async function GetAllDeletedAdmins() {
  return await api
    .get(`${apiUrl}/admin/all-deleted`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
export async function DeleteAdmin(addminId: number) {
  return await axios
    .delete(`${apiUrl}/admin/delete/${addminId}`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error deleting company:", e);
      return e.response;
    });
}