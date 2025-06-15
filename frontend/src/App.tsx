import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./pages/authentication/Login/LoginForm";
import RegisterPage from "./pages/authentication/Register/RegisterForm";
import RoleSelectionPage from "./pages/authentication/SelectRole/SelectRoleForm";
import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import CompanyDashboard from "./pages/Dashboard/CompanyDashboard";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import LecturerDashboard from "./pages/Dashboard/LecturerDashboard";
import StudentProfile from "./pages/Profile/Student";
import ProtectedRoute from "./components/ProtectedRoute"; // 👈 เพิ่มไฟล์นี้
import SearchJobs from "./pages/SearchJob/SearchJobs";
import AdminProfileAnalysis from "./pages/admin/ProfileAnalysis";
import AdminSidebar from "./components/admin_sidebar";
import ProfileAnalysis from "./pages/admin/ProfileAnalysis";


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
        {/* <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        /> */}

        {/* Admin Layout + Protected Nested Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <AdminSidebar />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="analysis" element={<ProfileAnalysis />} />
        </Route>

        {/* <Route path="/admin/analysis" element={<ProtectedRoute allowedRoles={[1]}><AdminProfileAnalysis /></ProtectedRoute>}/> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
