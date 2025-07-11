import { BrowserRouter, Routes, Route, Navigate ,Outlet } from "react-router-dom";
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
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
