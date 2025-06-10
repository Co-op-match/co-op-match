import React, { useState } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Tag,
  Input,
} from 'antd';
import { useNavigate } from 'react-router-dom'; // เพิ่ม useNavigate

const { Header, Content } = Layout;
const { Title } = Typography;

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate(); // ใช้งาน navigate

  const handleLogout = () => {
    localStorage.removeItem('token'); // หรือ studentID แล้วแต่ที่คุณใช้
    localStorage.removeItem('studentID');
    navigate('/sign-in'); // กลับไปหน้า login
  };

  // รายการงานทั้งหมด
  const jobData = [
    {
      title: 'Frontend Intern',
      company: 'บริษัท ABC จำกัด',
      location: 'กรุงเทพฯ',
      applied: true,
    },
    {
      title: 'Backend Developer',
      company: 'XYZ Tech',
      location: 'เชียงใหม่',
      applied: false,
    },
    {
      title: 'UX/UI Designer',
      company: 'Design Studio',
      location: 'ขอนแก่น',
      applied: false,
    },
  ];

  // สถานะการค้นหา
  const [searchText, setSearchText] = useState('');

  // ฟังก์ชันกรองงาน
  const filteredJobs = jobData.filter(
    (job) =>
      job.title.toLowerCase().includes(searchText.toLowerCase()) ||
      job.company.toLowerCase().includes(searchText.toLowerCase()) ||
      job.location.toLowerCase().includes(searchText.toLowerCase())
  );

  // การ์ดงาน
  const JobCard = ({
    title,
    company,
    location,
    applied,
  }: {
    title: string;
    company: string;
    location: string;
    applied: boolean;
  }) => (
    <Card title={title} bordered>
      <p>บริษัท: {company}</p>
      <p>สถานที่: {location}</p>
      {applied ? (
        <Tag color="green">สมัครแล้ว</Tag>
      ) : (
        <Button type="primary">สมัครงาน</Button>
      )}
    </Card>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Student Dashboard
          </Title>
          <Button type="primary" danger onClick={handleLogout}>
            ออกจากระบบ
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
            onSearch={(value) => setSearchText(value)}
            onChange={(e) => setSearchText(e.target.value)}
          />

          {/* 🧾 รายการงาน */}
          <Row gutter={[16, 16]}>
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job, index) => (
                <Col key={index} span={8}>
                  <JobCard {...job} />
                </Col>
              ))
            ) : (
              <Col span={24}>
                <p>ไม่พบงานที่คุณค้นหา</p>
              </Col>
            )}
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentDashboard;
