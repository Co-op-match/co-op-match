import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />

        {/* Public Routes */}
        <Route path="/sign-in" element={<LoginForm />} />
        <Route path="/sign-up" element={<RegisterPage />} />
        <Route path="/role-select" element={<RoleSelectionPage />} />

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
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <StudentProfile />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
