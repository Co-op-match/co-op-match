import React from 'react';
import { Layout, Typography, Menu } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Title } = Typography;

const CoopMatchHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // แปลง path เป็น key เช่น /student/profile → "profile"
  const currentPage = (() => {
    if (location.pathname.includes('search')) return 'search';
    if (location.pathname.includes('profile')) return 'profile';
    if (location.pathname.includes('notifications')) return 'notifications';
    if (location.pathname.includes('settings')) return 'settings';
    return 'search'; // fallback
  })();

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'search':
        navigate('/student/search');
        break;
      case 'profile':
        navigate('/student/profile');
        break;
      case 'notifications':
        navigate('/student/notifications');
        break;
      case 'settings':
        navigate('/student/settings');
        break;
    }
  };

  const menuItems = [
    { key: 'search', icon: <SearchOutlined />, label: 'ค้นหางาน' },
    { key: 'profile', icon: <UserOutlined />, label: 'โปรไฟล์' },
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
      <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
        CoopMatch
      </Title>

      <Menu
        mode="horizontal"
        selectedKeys={[currentPage]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          border: 'none',
          backgroundColor: 'transparent',
          minWidth: 400,
        }}
      />
    </Header>
  );
};

export default CoopMatchHeader;
