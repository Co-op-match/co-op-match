import React from 'react';
import {
  Layout,
  Card,
  Typography,
  Button,
  Table,
  Tag,
} from 'antd';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title } = Typography;

const CompanyDashboard: React.FC = () => {
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

  const jobPostings = [
    {
      id: 1,
      title: 'Frontend Intern',
      applicants: 5,
      status: 'เปิดรับสมัคร',
    },
    {
      id: 2,
      title: 'Backend Developer',
      applicants: 2,
      status: 'ปิดรับสมัคร',
    },
  ];

  const columns = [
    {
      title: 'ตำแหน่งงาน',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'จำนวนผู้สมัคร',
      dataIndex: 'applicants',
      key: 'applicants',
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) =>
        status === 'เปิดรับสมัคร' ? (
          <Tag color="green">เปิดรับสมัคร</Tag>
        ) : (
          <Tag color="red">ปิดรับสมัคร</Tag>
        ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => alert(`ดูรายละเอียดงาน ${record.title}`)}>
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Title level={3} style={{ margin: 0 }}>Company Dashboard</Title>
          <Button type="primary" danger onClick={handleLogout}>
            Logout
          </Button>
        </Header>

        <Content style={{ margin: '16px' }}>
          <Card title="ตำแหน่งงานที่เปิดรับสมัคร">
            <Table
              dataSource={jobPostings}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CompanyDashboard;
