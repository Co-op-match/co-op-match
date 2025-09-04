// CheckUser.tsx
import { useContext, type JSX } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";

type Props = { children: JSX.Element };

const CheckUser = ({ children }: Props) => {
  const { user, loading } = useContext(UserContext);

  // ให้ UserProvider แสดง Loader เอง ไม่ต้องซ้ำที่นี่
  if (loading) return null;

  const roleId = user?.RoleID;
  const userId = user?.ID;

  const hasStudentProfile = !!user?.Student?.some((s) => s.user_id === userId);
  const hasCompanyProfile = !!user?.Company?.some((s) => s.user_id === userId);
  const hasAcademicStaffProfile = !!user?.AcademicStaff?.some((s) => s.user_id === userId);

  if (roleId === 3 && !hasStudentProfile) return <Navigate to="/student/add-student" replace />;
  if (roleId === 2 && !hasCompanyProfile) return <Navigate to="/company/add-company" replace />;
  if (roleId === 4 && !hasAcademicStaffProfile) return <Navigate to="/lecturer/add-lecturer" replace />;

  return children;
};

export default CheckUser;
