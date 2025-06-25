import type { UsersInterface } from "../../interfaces/auth/IUser";
import type { SignInInterface } from "../../interfaces/auth/SignIn";
import type { StudentInterface } from "../../interfaces/Student";
import axios from "axios";
import type { UserInterface } from "../../interfaces/User";
const apiUrl = "http://localhost:8000";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");
const requestOptions = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  },
};
async function SignIn(data: SignInInterface) {
  return await axios
    .post(`${apiUrl}/sign-in`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetRole() {
  return await axios
    .get(`${apiUrl}/roles`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateUser(data: UsersInterface) {
  return await axios
    .post(`${apiUrl}/sign-up`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetStudentById(data: UsersInterface) {
  const id = data.ID; 
  return await axios
    .get(`${apiUrl}/students/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetStudentByUserId(user_id: number): Promise<StudentInterface> {
  try {
    const res = await axios.get<StudentInterface>(`${apiUrl}/students/user/${user_id}`, requestOptions);
    return res.data;
  } catch (e: any) {
    throw e.response || e;
  }
}


async function GetUserById(user_id: number): Promise<UserInterface> {
  const res = await axios.get<UserInterface>(`${apiUrl}/user/${user_id}`, requestOptions);
  return res.data;
}


//=======================================Admin============================================
export async function GetAdminById(id: number) {
  return await axios
    .get(`${apiUrl}/admin/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function GetAdminByUserId(user_id: number) {
  return await axios
    .get(`${apiUrl}/admin/user/${user_id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function GetAllAdmin() {
  return await axios
    .get(`${apiUrl}/admin/all`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
//=============================== SearchJobs ==============================//
async function GetProvince() {
  return await axios
    .get(`${apiUrl}/provinces`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetJobtype() {
  return await axios
    .get(`${apiUrl}/jobtypes`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetStipends() {
  return await axios
    .get(`${apiUrl}/stipends`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetWorkDay() {
  return await axios
    .get(`${apiUrl}/workdays`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetWorkMode() {
  return await axios
    .get(`${apiUrl}/workmodes`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetBenefit() {
  return await axios
    .get(`${apiUrl}/benefits`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

export {
  SignIn,
  GetRole,
  CreateUser,
  GetStudentById,
  GetStudentByUserId,
  GetUserById,
  GetProvince,
  GetJobtype,
  GetStipends,
  GetWorkDay,
  GetWorkMode,
  GetBenefit,
};