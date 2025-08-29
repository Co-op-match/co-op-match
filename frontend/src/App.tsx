import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import LoginForm from "./pages/authentication/Login/LoginForm";
import RegisterPage from "./pages/authentication/Register/RegisterForm";
import RoleSelectionPage from "./pages/authentication/SelectRole/SelectRoleForm";
import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import CompanyDashboard from "./pages/Dashboard/CompanyDashboard";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import LecturerDashboard from "./pages/Dashboard/LecturerDashboard";
import StudentProfile from "./pages/Profile/Student/Student";
import ProtectedRoute from "./components/ProtectedRoute"; // 👈 เพิ่มไฟล์นี้
import SearchJobs from "./pages/SearchJob/SearchJobs";
import CheckUser from "./components/CheckUser";
import { UserProvider } from "./components/UserContext";
// import AddressForm from "./pages/Profile/Student/AddAddess/Addres";
import AddStudentForm from "./pages/Profile/Student/AddStudent/AddStudentForm";
import ResetPassword from "./pages/authentication/ResetPassword/ResetPassword";
import AddCompanyForm from "./pages/Profile/Company/AddCompany/AddCompanyForm";
import CompanyProfile from "./pages/Profile/Company/Company";
import CompanyApplication from './pages/company/application/application';
import PostDetails from './pages/company/post/postdetails';
import CompanyPostPage from './pages/company/post/post';
import PostDetailsStudent from './pages/Student/Application/postDetail';
import StudentRecommendedPosts from "./pages/StudentMatch/StudentRecommendedPosts";
import AddApplication from './pages/Student/Application/AddApplication';
import ApplicationHistory from "./pages/Student/Application/History";
import ApplicationByCompany from "../src/pages/company/application/application";
import ConfirmInterviewAppointment from "../src/pages/company/comfirmappointment/ConfirmApppointment";
import CreateInterviewAppointment from "../src/pages/company/appointment/Appointment";
import ProtectProfile from "./components/ProtectedProfile";
import AdminPostManagement from "./pages/Admin/post/post";
import AdminPostDetailManagement from "./pages/Admin/post/PostDetail";
import LikedPosts from "./pages/LikedPost/LikedPosts";
import CompanyProfileView from "./pages/Profile/Company/CompanyProfileView";
import AdminVerify from "./pages/Admin/verify/verify";
// import ChatInterface from "./Chat/ChatInterface";
import AdvancedChatInterface from "./Chat/ChatInterface";
import AcademicStaffProfile from "./pages/Profile/AcademicStaff/AcademicStaff";

import AdminUser from "./pages/Admin/user/main";
import CompanyAnalysisPage from "./pages/company/analysis/analysis";

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/sign-in" replace />} />

          {/* Public Routes */}
          <Route element={<Outlet />}>
            <Route path="/sign-in" element={<LoginForm />} />
            <Route path="/academic" element={<AcademicStaffProfile />} />
            <Route path="/sign-up" element={<RegisterPage />} />
            <Route path="/role-select" element={<RoleSelectionPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          {/* Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />  <Route
            path="/student/search"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <SearchJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/recommendations"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <CheckUser>
                  <StudentRecommendedPosts />
                </CheckUser>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <CheckUser>
                  <StudentProfile />
                </CheckUser>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/profile"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <CheckUser>
                  <CompanyProfile />
                </CheckUser>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-profile/:id"
            element={
              <CompanyProfileView />
            }
          />
          <Route path="/chat/session/:sid" element={<AdvancedChatInterface />} />
          <Route path="/chat" element={<AdvancedChatInterface />} />
          <Route
            path="/company/add-company"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <AddCompanyForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/add-student"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <ProtectProfile>
                  <AddStudentForm />
                </ProtectProfile>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/post-student/:id"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <PostDetailsStudent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/applications/:postId"
            element={

              <ProtectedRoute allowedRoles={[3]}>
                <CheckUser>
                  <AddApplication />
                </CheckUser>
              </ProtectedRoute>

            }
          />

          <Route
            path="/student/applications/history"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <ApplicationHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/favorite-posts"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <LikedPosts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/company/dashboard"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/application"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <CompanyApplication />
              </ProtectedRoute>
            }
          />

          <Route
            path="/post/:id"
            element={
              <ProtectedRoute allowedRoles={[2, 3]}>
                <PostDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/post-student/:id"
            element={
              <ProtectedRoute allowedRoles={[2, 3]}>
                <PostDetailsStudent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/applications/post/:postId"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <ApplicationByCompany />
              </ProtectedRoute>
            }
          />

          <Route
            path="/company/post"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <CompanyPostPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/company/interview_appointments"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <CreateInterviewAppointment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/company/interview_appointments/confirm"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <ConfirmInterviewAppointment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/company/analysis"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <CompanyAnalysisPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lecturer/dashboard"
            element={
              <ProtectedRoute allowedRoles={[4]}>
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-posts"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AdminPostManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verify"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AdminVerify />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AdminUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-post/:id"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AdminPostDetailManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
