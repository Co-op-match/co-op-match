import React from 'react';
import {
  Layout,
  Row,
  Typography,
  Input,
  Button,
} from 'antd';

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
        <Header style={{
          background: '#fff',
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Title level={3} style={{ margin: 0 }}>Admin Dashboard</Title>
          <Button type="primary" danger onClick={handleLogout}>
            Logout
          </Button>
        </Header>

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
