import React, { useEffect, useState } from 'react';
import { Avatar, Button, Dropdown, Layout, Menu } from 'antd';
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
import { Link } from 'react-router-dom';


const { Header } = Layout;

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
}

const CompanyHeader: React.FC<CoopMatchHeaderDefaultProps> = ({ minimalMenu = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);

  useEffect(() => {
    const userId = Number(localStorage.getItem("id"));
    if (!userId || isNaN(userId)) return;
    GetUserById(userId).then(setUser).catch(err => console.error("Failed to fetch user", err));
  }, []);

  

  const fullMenu = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'หน้าหลัก' },
    {
      key: 'recruitment',
      icon: <UserOutlined />,
      label: 'รับสมัคร',
      children: [
        {
          key: 'post',
          label: <Link to="/company/post">โพสต์</Link>,
        },
        {
          key: 'interview_appointments',
          label: <Link to="/company/interview_appointments">นัดสัมภาษณ์</Link>,
        },
        {
          key: 'interview_appointments/confirm',
          label: <Link to="/company/interview_appointments/confirm">ยืนยันการนัดสัมภาษณ์</Link>,
        },
      ],
    },
    { key: 'profile', icon: <UserOutlined />, label: 'โปรไฟล์', },
    { key: 'notifications', icon: <BellOutlined />, label: 'การแจ้งเตือน' },
    { key: 'settings', icon: <SettingOutlined />, label: 'ตั้งค่า' },
  ];

  const menuItems = minimalMenu
    ? [fullMenu.find((item) => item.key === 'profile')!]
    : fullMenu;

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/company/${key}`);
  };
    const handleLogout = () => {
    localStorage.clear(); 
    navigate('/sign-in');
  };
  const logoutMenu = (
  <Menu>
    <Menu.Item key="logout" danger onClick={handleLogout}>
      ออกจากระบบ
    </Menu.Item>
  </Menu>
);
const currentPath = location.pathname;
  
const currentPage = fullMenu.find(item => {
  if (item.children) {
    return item.children.some(child => currentPath.startsWith(`/company/${child.key}`));
  }
  return currentPath === `/company/${item.key} ?? '' `;
})?.key;
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

{/* Menu + Avatar + Logout */}
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

<Dropdown overlay={logoutMenu} placement="bottomRight" trigger={['click']}>
  <Avatar
    src={user?.ProfileImage?.[0]?.image_url ? `http://localhost:8000${user.ProfileImage[0].image_url}` : undefined}
    icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
    style={{ cursor: "pointer", marginLeft: 16 }}
  />
</Dropdown>
</div>
    </Header>
  );
};

export default CompanyHeader;