import React, { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Dropdown,
  Layout,
  Menu,
  Space,
  Drawer,
  Grid,
  type MenuProps,
} from "antd";
import {
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  MenuOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserById } from "../../services/https";
import type { UserInterface } from "../../interfaces/User";

const { Header } = Layout;
const { useBreakpoint } = Grid;

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
}

const CompanyHeader: React.FC<CoopMatchHeaderDefaultProps> = ({
  minimalMenu = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const [user, setUser] = useState<UserInterface | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Responsive breakpoints
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

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
    setDrawerVisible(false); // Close drawer on mobile after navigation
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/sign-in");
    setDrawerVisible(false);
  };

  const currentPage =
    [
      "dashboard",
      "post",
      "manage-posts",
      "verify",
      "notifications",
      "analysis",
      "settings",
      "students",
      "companies",
      "lecturers",
      "admins",
    ].find((key) => location.pathname.includes(key)) || "dashboard";

  const userDropdownItems: MenuProps["items"] = [
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

  const userMenuProps = {
    items: userDropdownItems,
    onClick: handleMenuClick,
  };

  const fullMenu = [
    {
      key: "dashboard",
      icon: <HomeOutlined />,
      label: isMobile ? "หน้าหลัก" : "หน้าหลัก",
    },
    {
      key: "users",
      icon: <TeamOutlined />,
      label: isMobile ? (
        "ผู้ใช้ทั้งหมด"
      ) : (
        <Dropdown menu={userMenuProps} trigger={["hover"]} disabled={isMobile}>
          <Space>
            <span style={{ cursor: "pointer" }}>ผู้ใช้ทั้งหมด</span>
          </Space>
        </Dropdown>
      ),
      children: isMobile ? userDropdownItems : undefined,
    },
    {
      key: "manage-posts",
      icon: <FileTextOutlined />,
      label: "จัดการ Post",
    },
    {
      key: "verify",
      icon: <CheckCircleOutlined />,
      label: isMobile ? "ตรวจสอบ" : "ตรวจสอบการรับรอง",
    },
    {
      key: "analysis",
      icon: <FileTextOutlined />,
      label: isMobile ? "วิเคราะห์" : "การวิเคราะห์",
    },
    {
      key: "notifications",
      icon: <BellOutlined />,
      label: isMobile ? "แจ้งเตือน" : "การแจ้งเตือน",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "ตั้งค่า",
    },
  ];

  const menuItems = minimalMenu
    ? [fullMenu.find((item) => item.key === "dashboard")!]
    : fullMenu;

  const logoutMenuItem = {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "ออกจากระบบ",
    danger: true,
    onClick: handleLogout,
  };

  // Mobile/Tablet menu items for drawer
  const drawerMenuItems = [
    ...menuItems,
    { type: "divider" as const },
    logoutMenuItem,
  ];

  const profileDropdownItems = [
    {
      key: "logout",
      danger: true,
      icon: <LogoutOutlined />,
      label: "ออกจากระบบ",
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <Header
        style={{
          background: "#fff",
          padding: isMobile ? "0 16px" : "0 24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          height: "64px",
        }}
      >
        {/* Left side - Logo */}
        <div
          onClick={() => navigate("/admin/dashboard")}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            flex: "0 0 auto",
          }}
        >
          <img
            src={Logo}
            alt="Logo"
            style={{
              height: isMobile ? 32 : 40,
              maxWidth: isMobile ? 120 : 150,
            }}
          />
        </div>

        {/* Right side - Menu and Profile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: "1 1 auto",
            justifyContent: "flex-end",
          }}
        >
          {/* Desktop Menu */}
          {!isMobile && (
            <Menu
              mode="horizontal"
              selectedKeys={[currentPage]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{
                border: "none",
                backgroundColor: "transparent",
                flex: "1 1 auto",
                justifyContent: "flex-end",
                maxWidth: isTablet ? "400px" : "600px",
              }}
            />
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              style={{ marginRight: 8 }}
            />
          )}

          {/* Profile Avatar */}
          <Dropdown
            menu={{
              items: profileDropdownItems,
            }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Avatar
              size={30}
              src={
                user?.ProfileImage?.[0]?.image_url
                  ? `http://localhost:8000${user.ProfileImage[0].image_url}`
                  : undefined
              }
              icon={
                !user?.ProfileImage?.[0]?.image_url ? (
                  <UserOutlined />
                ) : undefined
              }
              style={{
                cursor: "pointer",
                marginLeft: 5,
                marginRight: 5,
                flex: "0 0 auto",
              }}
            />
          </Dropdown>
        </div>
      </Header>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* <img src={Logo} alt="Logo" style={{ height: 32, marginRight: 12 }} /> */}
            <span>เมนู</span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
        styles={{
          body: { padding: 0 },
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={[currentPage]}
          items={drawerMenuItems}
          onClick={handleMenuClick}
          style={{ border: "none" }}
        />
      </Drawer>
    </>
  );
};

export default CompanyHeader;