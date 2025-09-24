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

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
}

const HeaderCompany: React.FC<CoopMatchHeaderDefaultProps> = ({ minimalMenu = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();

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

  return (
    <>
      <Header className="header-company-responsive">
        <div 
          className="header-company-logo-container"
          onClick={() => navigate("/company/dashboard")}
          style={{
            marginLeft: isMobile ? 4 : screens.xl ? 12 : 8,
            marginRight: isMobile ? 8 : screens.xl ? 20 : 16,
          }}
        >
          <img src={Logo} alt="Logo" className="header-company-logo" />
        </div>

        {isMobile ? (
          <>
            <div className="header-company-mobile-controls">
              <Avatar
                src={user?.ProfileImage?.[0]?.image_url 
                  ? fileURL(user.ProfileImage[0].image_url) 
                  : undefined}
                icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
                className="header-company-avatar-mobile"
              />
              <Button
                type="text"
                icon={<HamburgerIcon size={20} />}
                onClick={toggleDrawer}
                className="header-company-menu-button"
              />
            </div>

            <Drawer
              title="เมนู"
              placement="right"
              onClose={() => setDrawerVisible(false)}
              open={drawerVisible}
              className="header-company-drawer"
            >
              <Menu
                mode="vertical"
                selectedKeys={[currentPage]}
                items={menuItems}
                onClick={handleDrawerMenuClick}
                className="header-company-drawer-menu"
              />
              <div className="header-company-drawer-footer">
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  block
                  className="header-company-logout-button"
                >
                  ออกจากระบบ
                </Button>
              </div>
            </Drawer>
          </>
        ) : (
          <div className="header-company-desktop-menu">
            <Menu
              mode="horizontal"
              selectedKeys={[currentPage]}
              items={menuItems}
              onClick={handleMenuClick}
              className="header-company-menu"
            />
            <Avatar
              src={user?.ProfileImage?.[0]?.image_url 
                ? fileURL(user.ProfileImage[0].image_url) 
                : undefined}
              icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
              className="header-company-avatar-desktop"
            />
          </div>
        )}
      </Header>
    </>
  );
};

export default HeaderCompany;
