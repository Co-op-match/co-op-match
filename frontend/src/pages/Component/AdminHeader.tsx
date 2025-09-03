import React, { useContext, useEffect, useState } from "react";
import { Avatar, Button, Dropdown, Layout, Menu, Drawer, Grid, message } from "antd";
import { UserOutlined, BellOutlined, SettingOutlined, HomeOutlined, TeamOutlined, FileTextOutlined, MenuOutlined, LogoutOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserByIdhaveStatusData } from "../../services/https";
import type { UserInterface } from "../../interfaces/User";
import { UserContext } from "../../components/UserContext";

const { Header } = Layout;
const { useBreakpoint } = Grid;

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
}

const AdminHeader: React.FC<CoopMatchHeaderDefaultProps> = ({
  minimalMenu = false,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const [user, setUser] = useState<UserInterface | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const { logout } = useContext(UserContext);

  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  
  const userID = Number(localStorage.getItem("id"));

  const fetchUser = async () => {
    if (!userID || Number.isNaN(userID)) return;

    try {
      const res = await GetUserByIdhaveStatusData(userID);
      setUser(res);
      if (res.status === 200) {
        setUser(res.data);
      }else {
        messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง!!!");
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  useEffect(() => {
    console.log("Welcome to Admin Dashboard")
    if (userID) {
      fetchUser();
    }
  }, [userID]);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      handleLogout();
      return;
    }

    navigate(`/admin/${key}`);
    setDrawerVisible(false); // Close drawer on mobile after navigation
  };

  const handleLogout = async () => {
    localStorage.clear();
    await logout();
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
      "settings",
      "students",
      "companies",
      "lecturers",
      "admins",
      "users",
    ].find((key) => location.pathname.includes(key)) || "dashboard";

  const fullMenu = [
    {
      key: "dashboard",
      icon: <HomeOutlined />,
      label: isMobile ? "หน้าหลัก" : "หน้าหลัก",
    },
    {
      key: "users",
      icon: <TeamOutlined />,
      label: isMobile ? "ผู้ใช้" : "ผู้ใช้ทั้งหมด",
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
      {contextHolder}
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

export default AdminHeader;
