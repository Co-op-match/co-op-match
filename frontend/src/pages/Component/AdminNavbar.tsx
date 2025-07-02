import React, { useEffect } from "react";
import {
  Layout,
  Typography,
  Menu,
  Dropdown,
  Button,
  type MenuProps,
  Space,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/Co-op match-Photoroom.png";

const { Header } = Layout;
const { Title } = Typography;

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // แปลง path เป็น key เช่น /student/profile → "profile"
  const currentPage = (() => {
    if (location.pathname.includes("dashboard")) return "dashboard";
    if (location.pathname.includes("search")) return "search";
    if (location.pathname.includes("profile")) return "profile";
    if (location.pathname.includes("notifications")) return "notifications";
    if (location.pathname.includes("settings")) return "settings";
    if (location.pathname.includes("students")) return "students";
    if (location.pathname.includes("companies")) return "companies";
    if (location.pathname.includes("lecturers")) return "lecturers";
    if (location.pathname.includes("admins")) return "admins";
    return "dashboard"; // fallback
  })();

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case "dashboard":
        navigate("/student/dashboard");
        break;
      case "search":
        navigate("/student/search");
        break;
      case "profile":
        navigate("/student/profile");
        break;
      case "notifications":
        navigate("/student/notifications");
        break;
      case "settings":
        navigate("/student/settings");
        break;
      case "students":
        navigate("/admin/students");
        break;
      case "companies":
        navigate("/admin/companies");
        break;
      case "lecturers":
        navigate("/admin/lecturers");
        break;
      case "admins":
        navigate("/admin/admins");
        break;
    }
  };

  const items: MenuProps["items"] = [
    {
      label: "นักศึกษา",
      key: "students",
    },
    {
      label: "บริษัท",
      key: "companies",
    },
    {
      label: "อาจารย์",
      key: "lecturers",
    },
    {
      label: "ผู้ดูแลระบบ",
      key: "admins",
    },
  ];

  const handleLogoClick = () => {
    navigate("/student/dashboard");
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const menuItems = [
    { key: "dashboard", icon: <HomeOutlined />, label: "หน้าหลัก" },
    {
      key: "users",
      label: (
        <Dropdown menu={menuProps} trigger={["hover"]}>
          <Space>
            <TeamOutlined />
            <span style={{ cursor: "pointer" }}>ผู้ใช้ทั้งหมด</span>
          </Space>
        </Dropdown>
      ),
    },
    { key: "notifications", icon: <BellOutlined />, label: "การแจ้งเตือน" },
    { key: "settings", icon: <SettingOutlined />, label: "ตั้งค่า" },
  ];

/* useEffect(() => {
  const token = localStorage.getItem("token"); // หรือ sessionStorage.getItem()
  if (!token) return;

  const payloadBase64 = token.split(".")[1];
  try {
    const payload = JSON.parse(atob(payloadBase64));
    const exp = payload.exp; // วินาที
    const now = Math.floor(Date.now() / 1000); // ปัจจุบันเป็นวินาที

    if (exp && now >= exp) {
      // หมดอายุแล้ว
      localStorage.removeItem("token");
      // แจ้งเตือนแล้ว redirect ไป login
      alert("เซสชันหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
      navigate("/login");
    }
  } catch (err) {
    console.error("ไม่สามารถถอดรหัส token:", err);
  }
}, []); */

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        onClick={handleLogoClick}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
        }}
      >
        <img src={Logo} alt="Logo" style={{ height: 40 }} />
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={[currentPage]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          border: "none",
          backgroundColor: "transparent",
          justifyContent: "end",
          width: "100vw",
        }}
      />
    </Header>
  );
};

export default AdminHeader;
