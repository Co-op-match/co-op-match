import React, { useEffect, useState } from 'react';
import { Avatar, Layout, Menu } from 'antd';
import {
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

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
}

const HeaderCompany: React.FC<CoopMatchHeaderDefaultProps> = ({ minimalMenu = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);

  useEffect(() => {
    const userId = Number(localStorage.getItem("id"));
    if (!userId || isNaN(userId)) return;
    GetUserById(userId).then(setUser).catch(err => console.error("Failed to fetch user", err));
  }, []);

  const currentPage = ['dashboard', 'profile', 'notifications', 'settings']
    .find((key) => location.pathname.includes(key)) || 'dashboard';

  const fullMenu = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'หน้าหลัก' },
    { key: 'profile', icon: <UserOutlined />, label: 'โปรไฟล์' },
    { key: 'notifications', icon: <BellOutlined />, label: 'การแจ้งเตือน' },
    { key: 'settings', icon: <SettingOutlined />, label: 'ตั้งค่า' },
  ];

  const menuItems = minimalMenu
    ? [fullMenu.find((item) => item.key === 'profile')!]
    : fullMenu;

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/company/${key}`);
  };

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
      {/* Logo */}
      <div onClick={() => navigate("/company/dashboard")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
        <img src={Logo} alt="Logo" style={{ height: 40 }} />
      </div>

      {/* Menu + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            minWidth: 160,
          }}
        />
        <Avatar
          src={user?.ProfileImage?.[0]?.image_url ? `https://api.coop-match.online${user.ProfileImage[0].image_url}` : undefined}
          icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
          style={{ cursor: "pointer", marginLeft: 16 }}
        />
      </div>
    </Header>
  );
};

export default HeaderCompany;
