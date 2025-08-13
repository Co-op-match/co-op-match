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
import type { ReviewPayload } from "../../interface/IReview";
import type { VerifyInterface } from "../../interfaces/Verify";
import type { LikeReviewInput } from "../../interfaces/LikeReviewInput";
const apiUrl = "http://localhost:8000";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");
axios.defaults.withCredentials = true;

const requestOptions = {
   withCredentials: true,
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
export async function SignUp(data: SignInInterface) {
  return await axios
    .post(`${apiUrl}/sign-up`, data, requestOptions)
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

export async function GetAllUser() {
  return await axios
    .get(`${apiUrl}/all-users`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateUser(id: number, data: UserInterface) {
  return await axios
    .put(`${apiUrl}/update-user/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
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
      'Content-Type': 'multipart/form-data',
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

export async function UpdateStatusPost(postId: number, statusPostId: number) {
  return await axios
    .put(`${apiUrl}/update-status-posts`, { post_id: postId, status_post_id: statusPostId }, requestOptions)
    .then((res) => res.data)
    .catch((e) => e.response);
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
export async function GetAllInternshipPostsInAdmin() {
  return await axios
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
//=============================== Verify ==============================//
export async function GetAllVerifications() {
  return await axios
    .get(`${apiUrl}/verify`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function GetVerificationByID(id: number) {
  return await axios
    .get(`${apiUrl}/verify/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function GetAllStatusVerify() {
  return await axios
    .get(`${apiUrl}/verify/status`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
export async function UpdateVerifyStatus(verifyId: number, data: VerifyInterface) {
  return await axios
    .put(`${apiUrl}/verify/update-verify/${verifyId}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error updating verification status:", e);
      return e.response;
    });
}
//=======================================AcademicStaffs============================================
export async function GetAllAcademicStaff() {
  return await axios
    .get(`${apiUrl}/academic/all`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
//=============================== Analysis ==============================//
export async function GetAdminDashboardSummary () {
  return await axios
    .get(`${apiUrl}/analysis/dashboard-summary`)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function GetAdminDashboardOverview () {
  return await axios
    .get(`${apiUrl}/analysis/dashboard-overview`)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function GetAllLoginLogs () {
  return await axios
    .get(`${apiUrl}/all-login-logs`)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function GetAdminMonthlyApplicationStats () {
  return await axios
    .get(`${apiUrl}/analysis/monthly-application-stats`)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function GetAdminRecentActivities () {
  return await axios
    .get(`${apiUrl}/analysis/recent-activities`)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function GetAdminPendingPosts () {
  return await axios
    .get(`${apiUrl}/analysis/pending-posts`)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function GetUsersByRoleSeries(params: { mode: 'month'|'quarter'|'year'; year: number }) {
  const { mode, year } = params;
  return await axios
    .get(`${apiUrl}/analysis/users-by-role-series`, { params: { mode, year } })
    .then(res => res)
    .catch(e => e.response);
}
export async function GetMonthlyUsersByRole () {
  return await axios
    .get(`${apiUrl}/analysis/monthly-user-by-role`)
    .then((res) => res)
    .catch((e) => e.response);
}
export const GetTopJobs = () => axios.get(`${apiUrl}/analysis/top-jobs`, requestOptions);
export const GetPopularCompanies = () => axios.get(`${apiUrl}/analysis/popular-companies`, requestOptions);
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
async function GetCompanyId(id: number): Promise<CompanyInterface> {
  try {
    const res = await axios.get<CompanyInterface>(`${apiUrl}/company/${id}`, requestOptions);
    return res.data;
  } catch (e: any) {
    throw e.response || e;
  }
}
async function GetVerifyByUserId(user_id: number) {
  try {
    const res = await axios.get<VerifyInterface>(`${apiUrl}/company/verify/${user_id}`, requestOptions);
    return res.data;
  } catch (e: any) {
    throw e.response || e;
  }
}
async function CreateSendVerify(user_id: number ,data: FormData) {
  return await axios.post(`${apiUrl}/company/verify/${user_id}`, data, {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      'Content-Type': 'multipart/form-data', // ตั้ง header ให้ถูกต้องสำหรับส่งไฟล์
    },
  })
  .then(res => res)
  .catch(e => e.response);
}
async function UpdateCompanyLogo(user_id: number ,data: FormData) {
  return await axios.put(`${apiUrl}/company/logo/${user_id}`, data, {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      'Content-Type': 'multipart/form-data', // ตั้ง header ให้ถูกต้องสำหรับส่งไฟล์
    },
  })
  .then(res => res)
  .catch(e => e.response);
}
//=======================================Contact============================================
async function CreateContact(data:ContactInterface) {
  return await axios
    .post(`${apiUrl}/contact`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function UpdateCompanyContact(user_id: number, data: ContactInterface) {
  return await axios
    .put(`${apiUrl}/contact/${user_id}`, data, requestOptions)
    .then(res => res)
    .catch(e => e.response);
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

async function UpdateEducation(user_id: number, data: EducationInput) {
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

///notification/interview/send-email/${student_id}/${company_id}  SendEmailinterview
async function SendEmailinterview(student_id: number,company_id: number, ) {
  const Authorization = localStorage.getItem("token");
  const Bearer = localStorage.getItem("token_type");

  const requestOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `${Bearer} ${Authorization}`,
    },
  };

  return await axios
    .post(`${apiUrl}/notification/interview/send-email/${student_id}/${company_id}`, {}, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function GetRecommendedPosts(studentId: number, query: string = "") {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("ไม่มี token ใน localStorage");
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
async function GetEventsStudentByUserId(user_id: number) {
  return await axios
    .get(`${apiUrl}/notification/calendar/student/${user_id}`, requestOptions)
    .then((res) => res)
    .then((res) => res.data);
}
async function GetEventsCompanyByUserId(user_id: number) {
  return await axios
    .get(`${apiUrl}/notification/calendar/company/${user_id}`, requestOptions)
    .then((res) => res)
    .then((res) => res.data);
}
async function GetApplicationsByUserID(user_id: number) {
  return await axios
    .get(`${apiUrl}/students/applications/${user_id}`, requestOptions)
    .then((res) => res.data.data) 
    .catch((e) => {
      console.error("Error fetching applications:", e);
      return []; 
    });
}
async function GetRwviewCompanyByUserId(user_id: number) {
  return await axios
    .get(`${apiUrl}/reviews/${user_id}`, requestOptions)
    .then((res) => res)
    .then((res) => res.data);
}
export async function LikeReview(data: LikeReviewInput) {
  return await axios
    .post(`${apiUrl}/review/like`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
export async function UnlikeReview(data: { user_id: number; review_id: number }) {
  return await axios
    .post(`${apiUrl}/review/unlike`, data, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}
export async function GetLikedReviews(userId: number) {
  return await axios
    .get(`${apiUrl}/review/liked/${userId}`, requestOptions)
    .then(res => res)
    .catch(e => e.response);
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
export async function LikePost(data: { StudentID: number; IntershipPostID: number }) {
  return await axios.post(`${apiUrl}/liked-post`, data, requestOptions);
}
export async function GetLikedPostsByStudentID(studentId: number) {
  return await axios.get(`${apiUrl}/liked-posts/student/${studentId}`, requestOptions);
}

export async function DeleteLikedPost(studentId: number, postId: number) {
  return await axios.delete(`${apiUrl}/liked-post/${studentId}/${postId}`, requestOptions);
}

// ============================== Review =================================== //

// ✅ สร้างรีวิว
export async function CreateReview(data: ReviewPayload) {
  return await axios
    .post(`${apiUrl}/reviews`, data, requestOptions)
    .then((res) => res.data)
    .catch((e) => {
      console.error("❌ Failed to create review:", e);
      throw e;
    });
}

// ✅ ดึงรีวิวของบริษัท
export async function GetReviewsByCompanyID(companyId: number) {
  return await axios
    .get(`${apiUrl}/reviews/company/${companyId}`, requestOptions)
    .then((res) => res.data.data)
    .catch((e) => {
      console.error("❌ Failed to fetch company reviews:", e);
      return [];
    });
}

// ✅ ดึงรีวิวของนักศึกษา (ถ้ามี)
export async function GetReviewsByStudentID(studentId: number) {
  return await axios
    .get(`${apiUrl}/reviews/student/${studentId}`, requestOptions)
    .then((res) => res.data.data)
    .catch((e) => {
      console.error("❌ Failed to fetch student reviews:", e);
      return [];
    });
}

// ✅ ดึง Application ที่ผ่านแล้วของนักศึกษา
export async function GetPassedApplicationsByStudentID(studentId: number) {
  return await axios
    .get(`${apiUrl}/reviews/application/passed/student/${studentId}`, requestOptions)
    .then((res) => res.data) // หรือ res.data.data แล้วแต่ backend ส่งกลับมาแบบไหน
    .catch((e) => {
      console.error("❌ Failed to fetch passed applications:", e);
      return [];
    });
}
// ✅ สร้างห้องแชท (หรือคืนห้องเดิมถ้ามี)
export async function CreateChatRoom(user1_id: number, user2_id: number) {
  try {
    const res = await axios.post(
      `${apiUrl}/chat/room`,
      { user1_id, user2_id },
      requestOptions
    );
    return res.data;
  } catch (e: any) {
    return e.response;
  }
}

// ✅ ดึงข้อความทั้งหมดของห้องแชท
export async function GetMessagesByRoomId(roomId: number) {
  try {
    const res = await axios.get(
      `${apiUrl}/chat/messages/${roomId}`,
      requestOptions
    );
    return res.data;
  } catch (e: any) {
    return e.response;
  }
}

// ✅ อัปเดตข้อความว่าอ่านแล้ว
export async function MarkMessagesAsRead(roomId: number, userId: number) {
  try {
    const res = await axios.patch(
      `${apiUrl}/chat/messages/${roomId}/read`,
      null,
      {
        params: { user_id: userId },
        ...requestOptions,
      }
    );
    return res.data;
  } catch (e: any) {
    return e.response;
  }
}

// ✅ ดึงห้องแชททั้งหมดของผู้ใช้
export async function GetChatRoomsByUserId(userId: number) {
  try {
    const res = await axios.get(
      `${apiUrl}/chat/rooms/${userId}`,
      requestOptions
    );
    return res.data;
  } catch (e: any) {
    return e.response;
  }
}
export function CreateWebSocketConnection(roomId: number, userId: number): WebSocket {
  const wsUrl = apiUrl.replace(/^http/, "ws");
  return new WebSocket(`${wsUrl}/chat/ws?room_id=${roomId}&user_id=${userId}`);
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
  GetEventsStudentByUserId,
  GetApplicationsByUserID,
  CreateSendVerify,
  GetRecommendedPosts,
  GetEventsCompanyByUserId,
  GetRwviewCompanyByUserId,
  UpdateCompanyContact,
  UpdateCompanyLogo,
  GetCompanyId

};