import { useContext, type JSX, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import { Spin, message } from "antd";

type Props = {
  children: JSX.Element;
};

const ProtectProfile = ({ children }: Props) => {
  const { user, loading } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isStudent = user?.RoleID === 3;
  const userId = user?.ID;
  const hasStudentProfile =
    !!user?.Student?.some((s) => s.user_id === userId);
  const isOnAddStudentPage = location.pathname === "/student/add-student";

  // ✅ ใช้ useLayoutEffect เพื่อบล็อกก่อน render
  useLayoutEffect(() => {
    if (!loading && isStudent && hasStudentProfile && isOnAddStudentPage) {
      navigate(-1);
    }
  }, [loading, isStudent, hasStudentProfile, isOnAddStudentPage, navigate]);

  if (loading) return <Spin tip="กำลังโหลด..." fullscreen />;

  // ✅ ยัง block render children
  if (isStudent && hasStudentProfile && isOnAddStudentPage) {
    return null;
  }

  return children;
};

export default ProtectProfile;
