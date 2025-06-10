import React from 'react';
import {
  Layout,
  Menu,
  Card,
  Typography,
  Table,
  Tag,
  Button,
} from 'antd';
import {
  DashboardOutlined,
  FileDoneOutlined,
  TeamOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const LecturerDashboard: React.FC = () => {
  const menuItems = [
    { key: '1', icon: <DashboardOutlined />, label: 'แดชบอร์ด' },
    { key: '2', icon: <TeamOutlined />, label: 'นักศึกษาฝึกงาน' },
    { key: '3', icon: <FileDoneOutlined />, label: 'อนุมัติการฝึกงาน' },
    { key: '4', icon: <LogoutOutlined />, label: 'ออกจากระบบ' },
  ];

  const handleMenuClick = (item: any) => {
    if (item.key === '4') {
      // Logout logic
      localStorage.removeItem('token');
      localStorage.removeItem('id');
      window.location.href = '/sign-in';
    }
  };

  const studentInternships = [
    {
      id: 1,
      name: 'สมชาย ใจดี',
      studentID: '64011234',
      company: 'บริษัท ABC จำกัด',
      status: 'รออนุมัติ',
    },
    {
      id: 2,
      name: 'สมหญิง สายฮา',
      studentID: '64015678',
      company: 'XYZ Tech',
      status: 'ผ่านการอนุมัติ',
    },
  ];

  const columns = [
    {
      title: 'ชื่อ-นามสกุล',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'รหัสนักศึกษา',
      dataIndex: 'studentID',
      key: 'studentID',
    },
    {
      title: 'สถานประกอบการ',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) =>
        status === 'ผ่านการอนุมัติ' ? (
          <Tag color="green">{status}</Tag>
        ) : (
          <Tag color="orange">{status}</Tag>
        ),
    },
    {
      title: 'การดำเนินการ',
      key: 'action',
      render: (_: any, record: any) =>
        record.status !== 'ผ่านการอนุมัติ' ? (
          <Button
            type="primary"
            onClick={() => alert(`อนุมัตินักศึกษา: ${record.name}`)}
          >
            อนุมัติ
          </Button>
        ) : (
          <span>-</span>
        ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div
          style={{
            height: 32,
            margin: 16,
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          LecturerZone
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: 16 }}>
          <Title level={3}>แดชบอร์ดอาจารย์</Title>
        </Header>
        <Content style={{ margin: '16px' }}>
          <Card title="นักศึกษาที่กำลังฝึกงาน">
            <Table
              dataSource={studentInternships}
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

export default LecturerDashboard;
