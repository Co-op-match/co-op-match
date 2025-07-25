import React, { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Dropdown,
  Layout,
  Menu,
  Space,
  type MenuProps,
} from "antd";
import {
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserById } from "../../services/https";
import type { UserInterface } from "../../interfaces/User";

const { Header } = Layout;

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
}

const CompanyHeader: React.FC<CoopMatchHeaderDefaultProps> = ({
  minimalMenu = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);

  useEffect(() => {
    const userId = Number(localStorage.getItem("id"));
    if (!userId || isNaN(userId)) return;
    GetUserById(userId)
      .then(setUser)
      .catch((err) => console.error("Failed to fetch user", err));
  }, []);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "users") return;
    navigate(`/admin/${key}`);
  };

  const handleLogout = () => {
    localStorage.clear(); // เคลียร์ข้อมูล
    navigate("/sign-in");
  };

  const currentPage =
    [
      "dashboard",
      "post",
      "notifications",
      "settings",
      "students",
      "companies",
      "lecturers",
      "admins",
    ].find((key) => location.pathname.includes(key)) || "dashboard";

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

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const fullMenu = [
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

  const menuItems = minimalMenu
    ? [fullMenu.find((item) => item.key === "profile")!]
    : fullMenu;

  const logoutMenu = (
    <Menu>
      <Menu.Item key="logout" danger onClick={handleLogout}>
        ออกจากระบบ
      </Menu.Item>
    </Menu>
  );

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <div
        onClick={() => navigate("/admin/dashboard")}
        style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        <img src={Logo} alt="Logo" style={{ height: 40 }} />
      </div>

      {/* Menu + Avatar + Logout */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: "none",
            backgroundColor: "transparent",
            minWidth: "50vw",
            justifyContent: "end",
          }}
        />

        <Dropdown
          overlay={logoutMenu}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Avatar
            src={
              user?.ProfileImage?.[0]?.image_url
                ? `http://localhost:8000${user.ProfileImage[0].image_url}`
                : undefined
            }
            icon={
              !user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined
            }
            style={{ cursor: "pointer", marginLeft: 16 }}
          />
        </Dropdown>
      </div>
    </Header>
  );
};

export default CompanyHeader;
