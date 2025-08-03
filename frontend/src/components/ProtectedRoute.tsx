import { useContext, type JSX } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import { Spin } from "antd";

type Props = {
  children: JSX.Element;
  allowedRoles?: number[];
};

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, loading } = useContext(UserContext);

  if (loading) return <Spin tip="กำลังโหลด..." fullscreen />;

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.RoleID)) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
};

export default ProtectedRoute;
