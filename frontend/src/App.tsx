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
//import SelectUsersAdmin from "./pages/Admin/users/SelectUsers";
import CompaniesInAdmin from "./pages/Admin/users/Companies/Companies";
import SubCompanyInAdmin from "./pages/Admin/users/Companies/SubCompany";
import StudentsInAdmin from "./pages/Admin/users/Students/Students";
import LecturersInAdmin from "./pages/Admin/users/Lecturers/Lecturers";
import AdminsInAdmin from "./pages/Admin/users/Admins/Admins";
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
import PostDetailsStudent from './pages/Student/Application/Post';
import StudentRecommendedPosts from "./pages/StudentMatch/StudentRecommendedPosts";



function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/sign-in" replace />} />

          {/* Public Routes */}
          <Route element={<UserProvider><Outlet /></UserProvider>}>
            <Route path="/sign-in" element={<LoginForm />} />
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
          />{" "}
          <Route
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
                <StudentRecommendedPosts />
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
          {/* <Route
            path="/student/add-profile"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <AddressForm />
              </ProtectedRoute>
            }
          /> */}
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
                <AddStudentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/post-student"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <PostDetailsStudent />
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
              <ProtectedRoute allowedRoles={[2]}>
                <PostDetails />
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
            path="/lecturer/dashboard"
            element={
              <ProtectedRoute allowedRoles={[4]}>
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />
          {/*-------------------------   Admin   -------------------------*/}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <CompaniesInAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <SubCompanyInAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <StudentsInAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lecturers"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <LecturersInAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admins"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AdminsInAdmin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
