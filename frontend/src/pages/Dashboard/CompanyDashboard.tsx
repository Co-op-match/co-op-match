// src/pages/company/CompanyDashboard.tsx
import React from 'react';
import { Layout, Typography, Row, Col, Card, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import CompanyHeader from '../Component/CompanyHeader';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const CompanyDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleCreatePost = () => {
    navigate('/company/create-post');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CompanyHeader />

      <Content style={{ margin: '24px', padding: 24, background: '#fff' }}>
        <Title level={3}>แดชบอร์ดบริษัท</Title>
        <Paragraph>
          ยินดีต้อนรับเข้าสู่หน้าจัดการสำหรับบริษัทของคุณ คุณสามารถเพิ่มโพสต์ฝึกงาน ดูรายการโพสต์ และจัดการข้อมูลบริษัทได้ที่นี่
        </Paragraph>

        <Button type="primary" onClick={handleCreatePost} style={{ marginBottom: 24 }}>
          เพิ่มโพสต์ใหม่
        </Button>

        {/* ตัวอย่างการแสดงข้อมูล */}
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card title="จำนวนโพสต์ทั้งหมด" bordered={false}>
              5 โพสต์
            </Card>
          </Col>
          <Col span={8}>
            <Card title="โพสต์ที่กำลังเปิดรับ" bordered={false}>
              3 โพสต์
            </Card>
          </Col>
          <Col span={8}>
            <Card title="จำนวนผู้สมัคร" bordered={false}>
              27 คน
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default CompanyDashboard;
