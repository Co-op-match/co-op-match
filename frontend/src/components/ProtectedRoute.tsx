import type { JSX } from "react";
import { Navigate } from "react-router-dom";

type Props = {
  children: JSX.Element;
  allowedRoles?: number[]; // ตัวเลข roleId ที่อนุญาตให้เข้า
};

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const isLogin = localStorage.getItem("isLogin") === "true";
  const roleId = Number(localStorage.getItem("roleId"));

  if (!isLogin) {
    return <Navigate to="/sign-in" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(roleId)) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
};

export default ProtectedRoute;
