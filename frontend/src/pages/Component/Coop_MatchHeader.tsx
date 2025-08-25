import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Dropdown, Layout, Menu } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  HomeOutlined,
  SolutionOutlined,
  HistoryOutlined,
  MessageOutlined, // 👈 แชท
<<<<<<< HEAD
=======
  LogoutOutlined,
  FolderOpenOutlined,
  HeartFilled,
  DownOutlined,

>>>>>>> 9b715b6bcd6db21fd2fc5e3aebd62a59fd17d2fc
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserById } from '../../services/https';
import type { UserInterface } from '../../interfaces/User';
import Notification from '../component/Notification';

import Notification from '../component/Notification';
import { UserContext } from '../../components/UserContext';


const { Header } = Layout;

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
  postId?: number;
}

const CoopMatchHeader: React.FC<CoopMatchHeaderDefaultProps> = ({ minimalMenu = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);
  const userId = Number(localStorage.getItem("id"));

  const { logout } = useContext(UserContext);


  const handleLogout = async () => {
    await logout();
    navigate("/sign-in");
  };
  useEffect(() => {
    if (!userId || isNaN(userId)) return;
    GetUserById(userId).then(setUser).catch(err => console.error("Failed to fetch user", err));
  }, []);


  const fullMenu = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'หน้าหลัก' },
    { key: 'search', icon: <SearchOutlined />, label: 'ค้นหางาน' },
    { key: 'recommendations', icon: <SolutionOutlined />, label: 'งานแนะนำ' },
    { key: 'applications/history', icon: <HistoryOutlined />, label: 'ประวัติการสมัคร' },
    { key: 'profile', icon: <UserOutlined />, label: 'โปรไฟล์' },
    { key: 'chat', icon: <MessageOutlined />, label: 'แชท' },
  ];

  const getVisibleMenuItems = () => (minimalMenu ? fullMenu.slice(-2) : fullMenu);
  const visibleMenuItems = getVisibleMenuItems();

  const availableKeys = fullMenu.map(item => item.key);
  const currentPage = availableKeys.find((key) => location.pathname.includes(key)) || availableKeys[0];

  // ✅ แมป key → path; chat เป็น path ตรง /chat
  const routeMap: Record<string, string> = {
    chat: '/chat',
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const target = routeMap[key] ?? `/student/${key}`;
    navigate(target);
  };

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: 64,
        borderBottom: '1px solid #f0f0f0'
      }}
    >
      {/* Left: Logo */}
      <div
        onClick={() => navigate("/student/dashboard")}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", marginRight: 24, flexShrink: 0 }}
      >
        <img src={Logo} alt="Logo" style={{ height: 40 }} />
      </div>

      {/* Right: Menu + Notifications + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto', minWidth: 0 }}>
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          items={visibleMenuItems}
          onClick={handleMenuClick}
          style={{ border: 'none', backgroundColor: 'transparent', width: '100%' }}
          overflowedIndicator={null}
        />

<<<<<<< HEAD
        <Notification />

=======

        <Notification />
        <Dropdown
          overlay={
            <Menu
              onClick={({ key }) => {
                if (key === "logout") {
                  handleLogout();
                } else {
                  navigate(`/student/${key}`);
                }
              }}
            >
              <Menu.Item key="favorite-posts" icon={<HeartFilled style={{ color: '#ff4de1ff' }} />}>
                โพสต์งานที่สนใจ
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item key="logout" icon={<LogoutOutlined />} danger>
                ออกจากระบบ
              </Menu.Item>
            </Menu>
          }
          placement="bottomRight"
          trigger={['hover']}
        >
>>>>>>> 9b715b6bcd6db21fd2fc5e3aebd62a59fd17d2fc
        <Avatar
          size={36}
          shape="circle"
          src={
            user?.ProfileImage?.[0]?.image_url ? (
              <img
                src={`http://localhost:8000${user.ProfileImage[0].image_url}`}
                alt="avatar"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            ) : undefined
          }
          icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
          style={{
            border: '2px solid #f0f0f0',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        />  
        </Dropdown>
      </div>
    </Header>
  );
};

export default CoopMatchHeader;
