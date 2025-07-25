import React from 'react';
import {
  Layout,
  Row,
  Typography,
  Input,
  Button,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import AdminHeader from "../Component/AdminCoopMatchHeaderDefault";

const { Header, Content } = Layout;
const { Title } = Typography;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate(); // ใช้งาน hook

  const handleLogout = () => {
    // เคลียร์ทุกอย่างที่เกี่ยวข้องกับ session
    localStorage.removeItem("token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("id");
    localStorage.removeItem("isLogin");
    localStorage.removeItem("role");
    localStorage.removeItem("roleId");

    // redirect กลับไปหน้า login
    navigate("/sign-in");
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminHeader />
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
