import React from 'react';
import { Layout, Typography, Menu, Dropdown, Button, type MenuProps, Space } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Title } = Typography;

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // แปลง path เป็น key เช่น /student/profile → "profile"
  const currentPage = (() => {
    if (location.pathname.includes('dashboard')) return 'dashboard';
    if (location.pathname.includes('students')) return 'students';
    if (location.pathname.includes('companies')) return 'companies';
    if (location.pathname.includes('lecturers')) return 'lecturers';
    if (location.pathname.includes('admins')) return 'admins';
    if (location.pathname.includes('notifications')) return 'notifications';
    if (location.pathname.includes('settings')) return 'settings';
    return 'dashboard'; // fallback
  })();

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'dashboard':
        navigate('/admin/dashboard');
        break;
      case 'students':
        navigate('/admin/students');
        break;
      case 'companies':
        navigate('/admin/companies');
        break;
      case 'lecturers':
        navigate('/admin/lecturers');
        break;
      case 'admins':
        navigate('/admin/admins');
        break;
      case 'notifications':
        navigate('/admin/notifications');
        break;
      case 'settings':
        navigate('/admin/settings');
        break;
    }
  };

    const items: MenuProps['items'] = [
    {
        label: 'นักศึกษา',
        key: 'students',
    },
    {
        label: 'บริษัท',
        key: 'companies',
    },
    {
        label: 'อาจารย์',
        key: 'lecturers',
    },
    {
        label: 'แอดมิน',
        key: 'admins',
    },
  ];

  const menuProps = {
  items,
  onClick: handleMenuClick,
  };
  
  const menuItems = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'หน้าหลัก' },
    {
      key: 'users',
      label: (
        <Dropdown menu={menuProps} trigger={['hover']}>
          <Space>
            <TeamOutlined />
            <span style={{ cursor: 'pointer' }}>ผู้ใช้ทั้งหมด</span>
          </Space>
        </Dropdown>
      ),
    },
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
          minWidth: 541,
        }}
      />
    </Header>
  );
};

export default AdminHeader;
