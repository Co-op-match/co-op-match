import { useContext, type JSX, useLayoutEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import { CoopMatchLoader } from "./loaders";

type Props = { children: JSX.Element };

const ProtectProfile = ({ children }: Props) => {
  const { user, loading } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isStudent = user?.RoleID === 3;
  const isCompany = user?.RoleID === 2;
  const isAcademicStaff = user?.RoleID === 4;

  const userId = user?.ID;

  // ✅ ใช้ startsWith เผื่อ path มี segment ต่อท้าย
  const isOnAddStudentPage = location.pathname.startsWith("/student/add-student");
  const isOnAddCompanyPage = location.pathname.startsWith("/company/add-company");
  const isOnAddAcademicStaffPage = location.pathname.startsWith("/lecturer/add-lecturer");

  // ✅ ถ้าโมเดลสัมพันธ์ของคุณเป็น array ต่อ user คนเดียว แค่ length > 0 ก็พอ
  const hasStudentProfile = !!user?.Student?.length || !!user?.Student?.some?.(s => s.user_id === userId);
  const hasCompanyProfile = !!user?.Company?.length || !!user?.Company?.some?.(c => c.user_id === userId);
  const hasAcademicStaffProfile = !!user?.AcademicStaff?.length || !!user?.AcademicStaff?.some?.(a => a.user_id === userId);

  // เส้นทางปลายทางตามบทบาท
  const defaultPath = useMemo(() => {
    if (isStudent) return "/student/dashboard";
    if (isCompany) return "/company/dashboard";
    if (isAcademicStaff) return "/lecturer/dashboard";
    return "/sign-in";
  }, [isStudent, isCompany, isAcademicStaff]);

  // ต้องบล็อกไหม?
  const shouldBlock =
    (isStudent && hasStudentProfile && isOnAddStudentPage) ||
    (isCompany && hasCompanyProfile && isOnAddCompanyPage) ||
    (isAcademicStaff && hasAcademicStaffProfile && isOnAddAcademicStaffPage);

  useLayoutEffect(() => {
    if (loading) return;

    // ถ้าไม่ได้ล็อกอิน -> ไปหน้า sign-in
    if (!user) {
      navigate("/sign-in", { replace: true });
      return;
    }

    // ถ้ามีโปรไฟล์อยู่แล้วแต่เข้าหน้า add-* -> ส่งกลับ dashboard ตามบทบาท
    if (shouldBlock) {
      navigate(defaultPath, { replace: true });
    }
  }, [loading, user, shouldBlock, defaultPath, navigate]);

  // โหลดอยู่แสดงสปินเนอร์เต็มจอ
  if (loading) return <CoopMatchLoader overlay text="กำลังโหลด..." />;

  // กันแว้บ: ถ้าต้องบล็อกไม่ต้องเรนเดอร์ children ระหว่างที่กำลัง navigate
  if (shouldBlock) return null;

  return children;
};

export default ProtectProfile;
