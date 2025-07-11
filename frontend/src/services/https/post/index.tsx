import axios from "axios";

// URL ของ API backend
const apiUrl = "http://localhost:8000"; // เปลี่ยน URL ให้ตรงกับเซิร์ฟเวอร์ของคุณ

const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");

const requestOptions = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  },
};

// ฟังก์ชันสำหรับดึงข้อมูล Work Modes
async function GetWorkModes() {
  return await axios
    .get(`${apiUrl}/work_modes`, requestOptions)
    .then((res) => res.data)
    .catch((e) => e.response);
}

// ฟังก์ชันสำหรับดึงข้อมูล Work Days
async function GetWorkDays() {
  return await axios
    .get(`${apiUrl}/work_days`, requestOptions)
    .then((res) => res.data)
    .catch((e) => e.response);
}

// ฟังก์ชันสำหรับดึงข้อมูล Stipends
async function GetStipends() {
  return await axios
    .get(`${apiUrl}/stipends`, requestOptions)
    .then((res) => res.data)
    .catch((e) => e.response);
}

// ฟังก์ชันสำหรับดึงข้อมูล Job Types
async function GetJobTypes() {
  return await axios
    .get(`${apiUrl}/job_types`, requestOptions)
    .then((res) => res.data)
    .catch((e) => e.response);
}

// ฟังก์ชันสำหรับดึงข้อมูล Status Posts
async function GetStatusPosts() {
  return await axios
    .get(`${apiUrl}/status_posts`, requestOptions)
    .then((res) => res.data)
    .catch((e) => e.response);
}

// ฟังก์ชันสำหรับดึงข้อมูล Status Posts
async function GetBenefits() {
    return await axios
      .get(`${apiUrl}/benefit`, requestOptions)
      .then((res) => res.data)
      .catch((e) => e.response);
  }

// ฟังก์ชันสำหรับดึงข้อมูล All Posts
async function GetAllPost() {
  return await axios
    .get(`${apiUrl}/getpost`, requestOptions)
    .then((res) => res.data)
    .catch((e) => e.response);
}


// ฟังก์ชันสำหรับดึงข้อมูล Application ตาม ID
async function GetPostById(id: number) {
  return await axios
    .get(`${apiUrl}/getpost/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// ✅ ฟังก์ชันดึงโพสต์ทั้งหมดของบริษัท
export async function GetPostByCompanyId(companyId: number) {
  return await axios
    .get(`${apiUrl}/posts/company/${companyId}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}


export {
  GetWorkModes,
  GetWorkDays,
  GetStipends,
  GetJobTypes,
  GetStatusPosts,
  GetBenefits,
  GetAllPost,
  GetPostById,

};
