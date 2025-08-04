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
import type { EducationInput } from "../../interfaces/EducationInput";
import type { CompanyInterface } from "../../interfaces/Company";
import type { ContactInterface } from "../../interfaces/Contact";
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

async function ResetPassword(email: string, newPassword: string) {
  try {
    const token = localStorage.getItem('token');
    console.log(token);
    const response = await axios.post(`${apiUrl}/reset-password`, {
      Email: email,
      NewPassword: newPassword,
    }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `${Bearer} ${Authorization}`,
      }
    });
    return response.data;
  } catch (error: any) {
    return error.response ? error.response.data : { error: "An unknown error occurred" };
  }
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
    .get(`${apiUrl}/job_types`, requestOptions)
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
    .get(`${apiUrl}/work_days`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetWorkMode() {
  return await axios
    .get(`${apiUrl}/work_modes`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetBenefit() {
  return await axios
    .get(`${apiUrl}/benefit`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetIntershipPost() {
  return await axios
    .get(`${apiUrl}/intership-posts`, requestOptions)
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
async function GetAllStudent() {
  return await axios
    .get(`${apiUrl}/students`, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}
//=======================================Company============================================
async function GetAllCompany() {
  return await axios
    .get(`${apiUrl}/company`, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}
async function CreateCompany(data: FormData) {
await axios.post(`${apiUrl}/company`, data, {
  headers: {
    'Content-Type': 'multipart/form-data',
    Authorization: `${Bearer} ${Authorization}`, // ✅ สำคัญ
  },
})
  .then(res => res)
  .catch(e => e.response);
}

async function GetCompanyByUserId(user_id: number): Promise<CompanyInterface> {
  try {
    const res = await axios.get<CompanyInterface>(`${apiUrl}/company/user/${user_id}`, requestOptions);
    return res.data;
  } catch (e: any) {
    throw e.response || e;
  }
}
async function GetVerifyByUserId(user_id: number) {
  try {
    const res = await axios.get<CompanyInterface>(`${apiUrl}/company/verify/${user_id}`, requestOptions);
    return res.data;
  } catch (e: any) {
    throw e.response || e;
  }
}
//=======================================Contact============================================
async function CreateContact(data:ContactInterface) {
  return await axios
    .post(`${apiUrl}/contact`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function GetContactByUserId(user_id: number): Promise<ContactInterface> {
  try {
    const res = await axios.get<ContactInterface>(`${apiUrl}/contact/user/${user_id}`, requestOptions);
    return res.data;
  } catch (e: any) {
    throw e.response || e;
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

async function CreateEducation(data: EducationInput) {
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
 async function GetUniversity() {
  try {
    const res = await axios.get(`${apiUrl}/universities`, requestOptions);
    return res.data; 
  } catch (error: any) {
    console.error("Failed to fetch universities:", error);
    throw error.response?.data || error.message;
  }
}
 async function GetAllEducationLevel() {
  try {
    const res = await axios.get(`${apiUrl}/education/levels`, requestOptions);
    return res.data; 
  } catch (error: any) {
    console.error("Failed to fetch EducationLevel:", error);
    throw error.response?.data || error.message;
  }
}
 async function GetAllProvinces() {
  try {
    const res = await axios.get(`${apiUrl}/address/provinces`, requestOptions);
    return res.data; 
  } catch (error: any) {
    console.error("Failed to fetch EducationLevel:", error);
    throw error.response?.data || error.message;
  }
}
// ============================== Notifycation =================================== //

async function SendEmailVerify(user_id: number) {
  const Authorization = localStorage.getItem("token");
  const Bearer = localStorage.getItem("token_type");

  const requestOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `${Bearer} ${Authorization}`,
    },
  };

  return await axios
    .post(`${apiUrl}/notification/email/verify-status/${user_id}`, {}, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function SendEmailinterview(id: number) {
  const Authorization = localStorage.getItem("token");
  const Bearer = localStorage.getItem("token_type");

  const requestOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `${Bearer} ${Authorization}`,
    },
  };

  return await axios
    .post(`${apiUrl}/notification/interview/send-email/${id}`, {}, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

export async function GetRecommendedPosts(studentId: number, query: string = "") {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ ไม่มี token ใน localStorage");
    return;
  }

  return await axios
    .get(`${apiUrl}/students/recommended-posts/${studentId}${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => res)
    .catch((e) => {
      console.error("❌ Error:", e?.response?.data || e.message);
      return e.response;
    });
}


export async function Logout(email: string) {
  try {
    const response = await axios.post(
      `${apiUrl}/logout`,
      { email },
      requestOptions
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
}


export {
  SignIn,
  GetRole,
  ResetPassword,
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
  GetIntershipPost,

  CreateStudent,
  UpdateStudent,
  GetAllStudent,
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
  UpdateEducation,
  GetUniversity,
  GetAllEducationLevel,
  GetAllProvinces,

  GetCompanyByUserId,
  CreateCompany,
  GetAllCompany,
  GetContactByUserId,
  CreateContact,
  GetVerifyByUserId,
  SendEmailVerify,
  SendEmailinterview,

};