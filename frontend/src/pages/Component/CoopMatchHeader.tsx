import React, { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Dropdown,
  Layout,
  Menu,
  Space,
  type MenuProps,
  type SubMenuProps,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
  TeamOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserById } from "../../services/https";
import type { UserInterface } from "../../interfaces/User";

const { Header } = Layout;

const CoopMatchHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);
  const [isOverflow, setIsOverflow] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showAvatar, setShowAvatar] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userIdString = localStorage.getItem("id");
        if (!userIdString) return;

        const userId = Number(userIdString);
        if (isNaN(userId)) return;

        const data = await GetUserById(userId);
        setUser(data);
        console.log("user", data);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();

    // ✅ เช็ค avatar ตอน mount ครั้งแรก
    setShowAvatar(window.innerWidth > 768);

    // ✅ Reload เมื่อ resize แล้วหยุด
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    window.addEventListener("resize", handleResize);

    // ✅ Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // แปลง path เป็น key เช่น /student/profile → "profile"
  const currentPage = (() => {
    // ส่วนของ student
    if (location.pathname.includes("dashboard")) return "dashboard";
    if (location.pathname.includes("search")) return "search";
    if (location.pathname.includes("profile")) return "profile";
    if (location.pathname.includes("notifications")) return "notifications";
    if (location.pathname.includes("settings")) return "settings";

    // ส่วนของ admin
    if (location.pathname.includes("students")) return "students";
    if (location.pathname.includes("companies")) return "companies";
    if (location.pathname.includes("lecturers")) return "lecturers";
    if (location.pathname.includes("admins")) return "admins";
    return "dashboard"; // fallback
  })();

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      // ส่วนของ student
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

      // ส่วนของ admin
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

      case "logout":
        localStorage.clear();
        navigate("/sign-in");
        break;
    }
  };

  const handleLogoClick = () => {
    navigate("/student/dashboard");
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

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const baseItems = [
    { key: "dashboard", icon: <HomeOutlined />, label: "หน้าหลัก" },
    ...(user?.Role?.RoleName === "Student"
      ? [{ key: "search", icon: <SearchOutlined />, label: "ค้นหางาน" }]
      : []),
    ...(user?.Role?.RoleName === "Admin"
      ? [
          {
            key: "users",
            label: (
              <Dropdown menu={menuProps} trigger={["hover"]}>
                <Space>
                  <TeamOutlined />
                  ผู้ใช้ทั้งหมด
                </Space>
              </Dropdown>
            ),
          },
        ]
      : []),
  ];

  const overflowItems: MenuProps["items"] = [
    { key: "profile", icon: <UserOutlined />, label: "โปรไฟล์" },
    { key: "notifications", icon: <BellOutlined />, label: "การแจ้งเตือน" },
    ...(!showAvatar
      ? [
          { key: "settings", icon: <SettingOutlined />, label: "ตั้งค่า" },
          { key: "divider-1", type: "divider" as const },
          {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "ออกจากระบบ",
            danger: true,
          },
        ]
      : []),
  ];

  const menuItems = isOverflow
    ? baseItems // ถ้า overflow เอาแค่ base
    : [...baseItems, ...overflowItems]; // ถ้าไม่ overflow ใส่ครบ

  const [openAvatar, setOpenAvatar] = useState(false);

  /*   const avatarMenuItems: SubMenuProps["items"] = [
    { key: "profile", icon: <UserOutlined />, label: "โปรไฟล์" },
    { key: "notifications", icon: <BellOutlined />, label: "การแจ้งเตือน" },
    { key: "settings", icon: <SettingOutlined />, label: "ตั้งค่า" },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "ออกจากระบบ",
      danger: true,
 
      },
  ]; */
  const avatarMenuItems: MenuProps["items"] = [
    ...(!showAvatar
      ? [
          { key: "profile", icon: <UserOutlined />, label: "โปรไฟล์" },
          {
            key: "notifications",
            icon: <BellOutlined />,
            label: "การแจ้งเตือน",
          },
        ]
      : []),
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "ตั้งค่า",
    },
    { key: "divider-1", type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "ออกจากระบบ",
      danger: true,
    },
  ];

  const avatarElement = (
    <Avatar
      src={
        user?.ProfileImage?.[0]?.image_url
          ? `http://localhost:8000${user.ProfileImage[0].image_url}`
          : undefined
      }
      icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
      style={{ cursor: "pointer", marginLeft: 16 }}
    />
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "end",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: "none",
            backgroundColor: "transparent",
            /* flex: 1, */
            justifyContent: "end",
            /* width: "4vw", */
            minWidth: "-webkit-fill-available", // ✅ ให้เมนูหดได้ตามพื้นที่
            maxWidth: "50vw",
          }}
          overflowedIndicator={avatarElement}
        />
        {showAvatar && (
          <Dropdown
            menu={{ items: avatarMenuItems, onClick: handleMenuClick }}
            trigger={["hover"]}
            placement="bottomRight"
          >
            <div style={{ cursor: "pointer", marginLeft: 16 }}>
              {avatarElement}
            </div>
          </Dropdown>
        )}
      </div>
    </Header>
  );
};

export default CoopMatchHeader;
