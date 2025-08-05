import React, { useEffect, useState } from 'react';
import { Avatar, Layout, Menu } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
  SolutionOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserById } from '../../services/https';
import type { UserInterface } from '../../interfaces/User';

const { Header } = Layout;

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
  postId?: number; // 👈 เพิ่มเพื่อให้ dynamic ได้ภายหลัง
}

const CoopMatchHeader: React.FC<CoopMatchHeaderDefaultProps> = ({ minimalMenu = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);

  useEffect(() => {
    const userId = Number(localStorage.getItem("id"));
    if (!userId || isNaN(userId)) return;

    GetUserById(userId)
      .then(setUser)
      .catch(err => console.error("Failed to fetch user", err));
  }, []);

  const fullMenu = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'หน้าหลัก' },
    { key: 'search', icon: <SearchOutlined />, label: 'ค้นหางาน' },
    { key: 'recommendations', icon: <SolutionOutlined />, label: 'งานแนะนำ' },
    {
      key: 'applications/history',
      label: 'ประวัติการสมัคร',
    },
    { key: 'profile', icon: <UserOutlined />, label: 'โปรไฟล์' },
    { key: 'notifications', icon: <BellOutlined />, label: 'การแจ้งเตือน' },
    { key: 'settings', icon: <SettingOutlined />, label: 'ตั้งค่า' },
  ];

  const menuItems = minimalMenu
    ? [fullMenu.find((item) => item.key === 'profile')!]
    : fullMenu;

  const availableKeys = menuItems.map(item => item.key);
  const currentPage =
    availableKeys.find((key) => location.pathname.includes(key)) || availableKeys[0];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/student/${key}`);
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
      <div
        onClick={() => navigate("/student/dashboard")}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          flex: '0 0 auto'
        }}
      >
        <img src={Logo} alt="Logo" style={{ height: 40 }} />
      </div>

      {/* Menu + Avatar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flex: '1 1 auto',
        justifyContent: 'flex-end'
      }}>
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            minWidth: minimalMenu ? 'auto' : 680, // ปรับ minWidth ตาม mode
            flex: '0 0 auto'
          }}
        />
        <Avatar
          size={40}
          src={user?.ProfileImage?.[0]?.image_url ? `http://localhost:8000${user.ProfileImage[0].image_url}` : undefined}
          icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
          style={{ 
            cursor: "pointer", 
            marginLeft: 5,
            marginRight: 5,
            flex: '0 0 auto' // ป้องกัน avatar โดนบีบ
          }}
        />
      </div>
    </Header>
  );
};

export default CoopMatchHeader;
