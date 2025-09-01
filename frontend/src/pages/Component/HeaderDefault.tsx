import React, { useEffect, useState } from 'react';
import { Avatar, Layout, Menu } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserById } from '../../services/https';
import type { UserInterface } from '../../interfaces/User';

const { Header } = Layout;

const CoopMatchHeaderDefault: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userIdString = localStorage.getItem("id");
        if (!userIdString) return;

        const userId = Number(userIdString);
        if (isNaN(userId)) return;

        const data = await GetUserById(userId);
        setUser(data);
         console.log("user",data)
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);


  // แปลง path เป็น key เช่น /student/profile → "profile"
  const currentPage = (() => {
    if (location.pathname.includes('dashboard')) return 'dashboard';
    if (location.pathname.includes('notifications')) return 'notifications';
    if (location.pathname.includes('settings')) return 'settings';
    return 'dashboard'; // fallback
  })();

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'dashboard':
        navigate('/student/dashboard');
        break;
      case 'notifications':
        navigate('/student/notifications');
        break;
      case 'settings':
        navigate('/student/settings');
        break;
    }
  };

  const handleLogoClick = () => {
  navigate("/student/dashboard");
};

  const menuItems = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'หน้าหลัก' },
    { key: 'notifications', icon: <BellOutlined />, label: 'การแจ้งเตือน' },
    { key: 'settings', icon: <SettingOutlined />, label: 'ตั้งค่า' },
  ];

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
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


<div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
<Menu
        mode="horizontal"
        selectedKeys={[currentPage]}
        items={menuItems}
        onClick={handleMenuClick}
    style={{
      border: 'none',
      backgroundColor: 'transparent',
      minWidth: 350,
    }}
  />
  <Avatar
    src={user?.ProfileImage?.[0]?.image_url
      ? `http://localhost:8000${user.ProfileImage[0].image_url}`
      : undefined}
    icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
    style={{ cursor: "pointer", marginLeft: 16 }}
  />
</div>
    </Header>
  );
};

export default CoopMatchHeaderDefault;
