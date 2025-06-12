import type { UsersInterface } from "../../interfaces/auth/IUser";
import type { SignInInterface } from "../../interfaces/auth/SignIn";
import axios from "axios";
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
  const id = data.ID;  // ดึง id ออกมา
  return await axios
    .get(`${apiUrl}/students/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetStudentByUserId(user_id: any) {
  return await axios
    .get(`${apiUrl}/students/user/${user_id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
export {
  SignIn,
  GetRole,
  CreateUser,
  GetStudentById,
  GetStudentByUserId
};