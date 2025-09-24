import React, { useEffect, useState } from 'react';
import { fileURL } from '@/config/env';
import { Avatar, Layout, Menu, Button, Drawer, Grid } from 'antd';
import {
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserById } from '../../services/https';
import type { UserInterface } from '../../interfaces/User';
import HamburgerIcon from './HamburgerIcon';
import "./Header.css";

const { Header } = Layout;
const { useBreakpoint } = Grid;

const CoopMatchHeaderDefault: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();

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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
    setDrawerVisible(false);
  };

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  const handleDrawerMenuClick = ({ key }: { key: string }) => {
    handleMenuClick({ key });
    setDrawerVisible(false);
  };

  const isMobile = !screens.md;

  const menuItems = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'หน้าหลัก' },
    { key: 'notifications', icon: <BellOutlined />, label: 'การแจ้งเตือน' },
    { key: 'settings', icon: <SettingOutlined />, label: 'ตั้งค่า' },
  ];

  return (
    <>
      <Header className="header-default-responsive">
        <div 
          className="header-default-logo-container"
          onClick={handleLogoClick}
          style={{
            marginLeft: isMobile ? 4 : screens.xl ? 12 : 8,
            marginRight: isMobile ? 8 : screens.xl ? 20 : 16,
          }}
        >
          <img src={Logo} alt="Logo" className="header-default-logo" />
        </div>

        {isMobile ? (
          <>
            <div className="header-default-mobile-controls">
              <Avatar
                src={user?.ProfileImage?.[0]?.image_url
                  ? fileURL(user.ProfileImage[0].image_url)
                  : undefined}
                icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
                className="header-default-avatar-mobile"
              />
              <Button
                type="text"
                icon={<HamburgerIcon size={20} />}
                onClick={toggleDrawer}
                className="header-default-menu-button"
              />
            </div>

            <Drawer
              title="เมนู"
              placement="right"
              onClose={() => setDrawerVisible(false)}
              open={drawerVisible}
              className="header-default-drawer"
            >
              <Menu
                mode="vertical"
                selectedKeys={[currentPage]}
                items={menuItems}
                onClick={handleDrawerMenuClick}
                className="header-default-drawer-menu"
              />
              <div className="header-default-drawer-footer">
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  block
                  className="header-default-logout-button"
                >
                  ออกจากระบบ
                </Button>
              </div>
            </Drawer>
          </>
        ) : (
          <div className="header-default-desktop-menu">
            <Menu
              mode="horizontal"
              selectedKeys={[currentPage]}
              items={menuItems}
              onClick={handleMenuClick}
              className="header-default-menu"
            />
            <Avatar
              src={user?.ProfileImage?.[0]?.image_url
                ? fileURL(user.ProfileImage[0].image_url)
                : undefined}
              icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
              className="header-default-avatar-desktop"
            />
          </div>
        )}
      </Header>
    </>
  );
};

export default CoopMatchHeaderDefault;
