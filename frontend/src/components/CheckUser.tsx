import { useContext, type JSX } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import { Spin } from "antd";

type Props = {
  children: JSX.Element;
};

const CheckUser = ({ children }: Props) => {
  const { user, loading } = useContext(UserContext);

if (loading) return <Spin tip="กำลังโหลด..." fullscreen />;

  const roleId = user?.RoleID;
  const userId = user?.ID;

  // เช็คว่าเป็น student และไม่มี student profile ที่ตรง user id
 const hasStudentProfile = !!user?.Student?.some((s) => s.user_id === userId);

  if (roleId === 3 && !hasStudentProfile) {
    return <Navigate to="/student/add-student" replace />;
  }

  return children;
};

export default CheckUser;
