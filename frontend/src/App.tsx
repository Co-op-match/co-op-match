import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./pages/authentication/Login/LoginForm";
import RegisterPage from "./pages/authentication/Register/RegisterForm";
import RoleSelectionPage from "./pages/authentication/SelectRole/SelectRoleForm";
import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import CompanyDashboard from "./pages/Dashboard/CompanyDashboard";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import LecturerDashboard from "./pages/Dashboard/LecturerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />

        <Route path="/sign-in" element={<LoginForm />} />
        <Route path="/sign-up" element={<RegisterPage />} />
        <Route path="/role-select" element={<RoleSelectionPage />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/company/dashboard" element={<CompanyDashboard />} />
        <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
