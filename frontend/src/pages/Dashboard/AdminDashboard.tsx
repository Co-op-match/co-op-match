import React from 'react';
import {
  Layout,
  Row,
  Typography,
  Input,
  Button,
} from 'antd';
import AppHeader from '../component/header/Header';

const { Header, Content } = Layout;
const { Title } = Typography;

const AdminDashboard: React.FC = () => {
  const handleLogout = () => {
    // เคลียร์ token หรือ localStorage ตามที่คุณใช้
    localStorage.removeItem('token');
    localStorage.removeItem('id');

    // เปลี่ยนหน้า (redirect ไปหน้า login)
    window.location.href = '/sign-in';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
      <AppHeader />
        <Content style={{ margin: '16px' }}>
          {/* 🔍 ช่องค้นหางาน */}
          <Input.Search
            placeholder="ค้นหางานที่คุณสนใจ..."
            allowClear
            enterButton="ค้นหา"
            size="large"
            style={{ marginBottom: 24 }}
          />

          {/* 🧾 รายการงาน */}
          <Row gutter={[16, 16]}>
            
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
