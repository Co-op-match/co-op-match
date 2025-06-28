import type { UsersInterface } from "../../interfaces/auth/IUser";
import type { SignInInterface } from "../../interfaces/auth/SignIn";
import type { StudentInterface } from "../../interfaces/Student";
import axios from "axios";
import type { UserInterface } from "../../interfaces/User";
import type { ProfileImageInterface } from "../../interfaces/ProfileImage";
import type { GenderInterface } from "../../interfaces/Gender";
import type { EducationInterface } from "../../interfaces/Education";
import type { AddressInterface } from "../../interfaces/Address";
import type { StudentSkillPayload } from "../../interfaces/StudentSkillPayload";
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

async function GetUserById(user_id: number): Promise<UserInterface> {
  try {
    const res = await axios.get<UserInterface>(`${apiUrl}/user/${user_id}`, requestOptions);
    return res.data;
  } catch (e: any) {
    throw e.response || e;
  }
}

async function CreateProfileImage(data: FormData) {
  return await axios.post(`${apiUrl}/user/image`, data, {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      'Content-Type': 'multipart/form-data', // ตั้ง header ให้ถูกต้องสำหรับส่งไฟล์
    },
  })
  .then(res => res)
  .catch(e => e.response);
}

async function UpdateProfileImage(id: number, data: FormData) {
  return await axios.put(`${apiUrl}/user/image/${id}`, data, {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      'Content-Type': 'multipart/form-data', // ส่งไฟล์เช่นกัน
    },
  })
  .then(res => res)
  .catch(e => e.response);
}

async function GetProfileImageByUserID(user_id: number): Promise<ProfileImageInterface> {
  try {
    const res = await axios.get<ProfileImageInterface>(`${apiUrl}/user/image/${user_id}`, requestOptions);
    return res.data;
  } catch (e: any) {
    throw e.response || e;
  }
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
//=======================================Student============================================
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

async function CreateStudent(data: StudentInterface) {
  return await axios
    .post(`${apiUrl}/students`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateStudent(id: number, data: StudentInterface) {
  return await axios
    .put(`${apiUrl}/students/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetAllGender(): Promise<GenderInterface[]> {
  try {
    const res = await axios.get<GenderInterface[]>(`${apiUrl}/user/gender`, requestOptions);
    return res.data; // res.data เป็น array ของ GenderInterface
  } catch (error) {
    console.error("Failed to get genders:", error);
    return []; // กรณี error คืน array ว่าง
  }
}
/// ============================== Address =================================== //
async function GetAllAddress() {
  return await axios
    .get(`${apiUrl}/address/`, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function GetAddressByUserId(user_id: number) {
  return await axios
    .get(`${apiUrl}/address/${user_id}`, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function CreateAddress(role_id: number, user_id: number, data: AddressInterface) {
  return await axios
    .post(`${apiUrl}/address/${role_id}/${user_id}`, data, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function UpdateAddress(role_id: number, user_id: number, data: AddressInterface) {
  return await axios
    .put(`${apiUrl}/address/${role_id}/${user_id}`, data, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

// ============================== Skill =================================== //
async function GetAllSkill() {
  return await axios
    .get(`${apiUrl}/skills/`, requestOptions)
    .then(res => res.data) 
    .catch(e => {
      console.error('GetAllSkill error:', e);
      return [];
    });
}

async function GetStudentSkillsByUserId(user_id: number) {
  return await axios
    .get(`${apiUrl}/skills/${user_id}`, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function CreateStudentSkills(user_id: number, data: StudentSkillPayload) {
  return await axios
    .post(`${apiUrl}/skills/${user_id}`, data, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function UpdateStudentSkills(user_id: number, data: StudentSkillPayload) {
  return await axios
    .put(`${apiUrl}/skills/${user_id}`, data, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

// ============================== Interest =================================== //
async function GetAllInterest() {
  return await axios
    .get(`${apiUrl}/interests/`, requestOptions)
    .then(res => res.data) 
    .catch(e => {
      console.error('GetAllInterest error:', e);
      return [];
    });
}

async function GetStudentInterestsByUserId(user_id: number) {
  return await axios
    .get(`${apiUrl}/interests/${user_id}`, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

// ============================== Education =================================== //
async function GetAllEducation() {
  return await axios
    .get(`${apiUrl}/education/`, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function GetEducationByUserId(user_id: number) {
  return await axios
    .get(`${apiUrl}/education/${user_id}`, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function CreateEducation(data: EducationInterface) {
  return await axios
    .post(`${apiUrl}/education/`, data, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function UpdateEducation(user_id: number, data: EducationInterface) {
  return await axios
    .put(`${apiUrl}/education/${user_id}`, data, requestOptions)
    .then(res => res)
    .catch(e => e.response);
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
  CreateStudent,
  UpdateStudent,
  CreateProfileImage,
  UpdateProfileImage,
  GetAllGender,
  GetProfileImageByUserID,
    GetAllAddress,
  GetAddressByUserId,
  CreateAddress,
  UpdateAddress,

  GetAllSkill,
  GetStudentSkillsByUserId,
  CreateStudentSkills,
  UpdateStudentSkills,

  GetAllInterest,
  GetStudentInterestsByUserId,

  GetAllEducation,
  GetEducationByUserId,
  CreateEducation,
  UpdateEducation

};