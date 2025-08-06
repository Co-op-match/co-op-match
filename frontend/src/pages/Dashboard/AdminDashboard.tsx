import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Statistic, 
  Avatar, 
  Tag, 
  Typography, 
  Progress,
  List,
  Space,
  Button
} from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  BookOutlined, 
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data
  const summaryStats = [
    { title: 'รับสมัคร', value: 256, increase: 12, icon: UserOutlined, color: '#1890ff' },
    { title: 'สัมภาษณ์', value: 89, increase: 8, icon: UserOutlined, color: '#52c41a' },
    { title: 'ยืนยันโพสต์', value: 15, decrease: 3, icon: BookOutlined, color: '#faad14' },
    { title: 'ยืนยันตัวตน', value: 23, increase: 5, icon: CheckCircleOutlined, color: '#722ed1' }
  ];

  const applicationTrend = [
    { month: 'ม.ค.', students: 45, companies: 12, interviews: 28, applications: 67 },
    { month: 'ก.พ.', students: 52, companies: 15, interviews: 35, applications: 84 },
    { month: 'มี.ค.', students: 48, companies: 18, interviews: 41, applications: 92 },
    { month: 'เม.ย.', students: 65, companies: 22, interviews: 38, applications: 115 },
    { month: 'พ.ค.', students: 71, companies: 25, interviews: 45, applications: 128 },
    { month: 'มิ.ย.', students: 58, companies: 20, interviews: 52, applications: 98 }
  ];

  const universityData = [
    { university: 'มหาวิทยาลัยเทคโนโลยีสุรนารี', students: 45, applications: 128, interviews: 32, accepted: 28, gpa: 3.25 },
    { university: 'มหาวิทยาลัยขอนแก่น', value: 38, applications: 95, interviews: 28, accepted: 22, gpa: 3.18 },
    { university: 'มหาวิทยาลัยมหิดล', students: 35, applications: 87, interviews: 25, accepted: 20, gpa: 3.45 },
    { university: 'จุฬาลงกรณ์มหาวิทยาลัย', students: 28, applications: 76, interviews: 22, accepted: 18, gpa: 3.52 },
    { university: 'มหาวิทยาลัยเกษตรศาสตร์', students: 22, applications: 63, interviews: 18, accepted: 15, gpa: 3.31 },
  ];

  const companyData = [
    { name: 'บริษัท ไมโครซอฟท์', posts: 5, applications: 45, interviews: 18, rating: 4.5 },
    { name: 'บริษัท กูเกิล', posts: 3, applications: 38, interviews: 15, rating: 4.7 },
    { name: 'บริษัท เอไอเอส', posts: 4, applications: 32, interviews: 12, rating: 4.2 },
    { name: 'บริษัท ทรู คอร์ปอเรชั่น', posts: 2, applications: 28, interviews: 10, rating: 4.0 },
    { name: 'บริษัท ซีพี ออลล์', posts: 6, applications: 52, interviews: 22, rating: 4.3 }
  ];

  const verificationData = [
    { name: 'รับรอง', value: 156, color: '#52c41a' },
    { name: 'รอรับรอง', value: 45, color: '#faad14' },
    { name: 'ปฏิเสธ', value: 12, color: '#ff4d4f' },
    { name: 'ยังไม่ส่งคำขอ', value: 28, color: '#d9d9d9' }
  ];

  const recentActivities = [
    { user: 'นายสมชาย ใจดี', action: 'สมัครงานที่บริษัท Microsoft', time: '2 นาทีที่แล้ว', type: 'student' },
    { user: 'บริษัท กูเกิล', action: 'โพสต์ตำแหน่งงานใหม่', time: '15 นาทีที่แล้ว', type: 'company' },
    { user: 'อ.ดร.วิชัย มั่นคง', action: 'อนุมัติการสมัครของนักศึกษา', time: '1 ชั่วโมงที่แล้ว', type: 'teacher' },
    { user: 'นางสาวมารี อินทร์', action: 'ยืนยันตัวตนเรียบร้อย', time: '2 ชั่วโมงที่แล้ว', type: 'student' },
    { user: 'บริษัท ทรู', action: 'ตั้งเวลานัดสัมภาษณ์', time: '3 ชั่วโมงที่แล้ว', type: 'company' }
  ];

  const skillDemand = [
    { skill: 'React', count: 25 },
    { skill: 'Python', count: 22 },
    { skill: 'Java', count: 18 },
    { skill: 'Node.js', count: 15 },
    { skill: 'SQL', count: 12 }
  ];

  const getUserIcon = (type) => {
    const icons = {
      student: <UserOutlined style={{ color: '#1890ff' }} />,
      company: <BankOutlined style={{ color: '#52c41a' }} />,
      teacher: <BookOutlined style={{ color: '#faad14' }} />,
      admin: <SettingOutlined style={{ color: '#722ed1' }} />
    };
    return icons[type] || <UserOutlined />;
  };

  const universityColumns = [
    {
      title: 'มหาวิทยาลัย',
      dataIndex: 'university',
      key: 'university',
      width: '30%'
    },
    {
      title: 'นักศึกษา',
      dataIndex: 'students',
      key: 'students',
      sorter: true,
      render: (value) => <Text strong style={{ color: '#1890ff' }}>{value}</Text>
    },
    {
      title: 'ใบสมัคร',
      dataIndex: 'applications',
      key: 'applications',
      sorter: true
    },
    {
      title: 'สัมภาษณ์',
      dataIndex: 'interviews',
      key: 'interviews',
      sorter: true
    },
    {
      title: 'รับเข้าทำงาน',
      dataIndex: 'accepted',
      key: 'accepted',
      sorter: true,
      render: (value) => <Text style={{ color: '#52c41a' }}>{value}</Text>
    },
    {
      title: 'เกรดเฉลี่ย',
      dataIndex: 'gpa',
      key: 'gpa',
      sorter: true,
      render: (value) => <Tag color="blue">{value}</Tag>
    }
  ];

  const companyColumns = [
    {
      title: 'บริษัท',
      dataIndex: 'name',
      key: 'name',
      width: '35%'
    },
    {
      title: 'โพสต์งาน',
      dataIndex: 'posts',
      key: 'posts',
      sorter: true,
      render: (value) => <Text strong style={{ color: '#722ed1' }}>{value}</Text>
    },
    {
      title: 'ใบสมัคร',
      dataIndex: 'applications',
      key: 'applications',
      sorter: true
    },
    {
      title: 'สัมภาษณ์',
      dataIndex: 'interviews',
      key: 'interviews',
      sorter: true
    },
    {
      title: 'คะแนนรีวิว',
      dataIndex: 'rating',
      key: 'rating',
      sorter: true,
      render: (value) => <Tag color="gold">{value} ⭐</Tag>
    }
  ];

  return (
    <div style={{ 
      padding: '24px', 
      background: '#f5f5f5', 
      minHeight: '100vh',
      fontFamily: 'Sarabun, sans-serif'
    }}>
      {/* Header */}
      <Row style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
            📊 Dashboard Analysis - CoopMatch
          </Title>
          <Text type="secondary">ภาพรวมข้อมูลระบบสหกิจศึกษา</Text>
        </Col>
      </Row>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {summaryStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card 
              hoverable
              style={{ 
                borderRadius: '12px',
                border: '1px solid #e8f4fd',
                background: '#fafcff'
              }}
            >
              <Statistic
                title={stat.title}
                value={stat.value}
                precision={0}
                valueStyle={{ 
                  color: stat.color,
                  fontSize: '28px',
                  fontWeight: 'bold'
                }}
                prefix={<stat.icon style={{ fontSize: '24px' }} />}
                suffix={
                  <Text style={{ fontSize: '14px' }}>
                    {stat.increase ? (
                      <span style={{ color: '#52c41a' }}>
                        <ArrowUpOutlined /> +{stat.increase}%
                      </span>
                    ) : (
                      <span style={{ color: '#ff4d4f' }}>
                        <ArrowDownOutlined /> -{stat.decrease}%
                      </span>
                    )}
                  </Text>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Application Trends */}
        <Col xs={24} lg={16}>
          <Card 
            title="📈 แนวโน้มการสมัครงาน" 
            extra={<Button size="small">ดูรายละเอียด</Button>}
            style={{ borderRadius: '12px', height: '400px' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={applicationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="applications" stroke="#1890ff" strokeWidth={3} name="ใบสมัคร" />
                <Line type="monotone" dataKey="interviews" stroke="#52c41a" strokeWidth={2} name="สัมภาษณ์" />
                <Line type="monotone" dataKey="students" stroke="#faad14" strokeWidth={2} name="นักศึกษาใหม่" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Verification Status */}
        <Col xs={24} lg={8}>
          <Card 
            title="✅ สถานะการยืนยันตัวตน" 
            extra={<Button size="small">จัดการ</Button>}
            style={{ borderRadius: '12px', height: '400px' }}
          >
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={verificationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {verificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: '16px' }}>
              {verificationData.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: item.color }}>● {item.name}</span>
                  <Text strong>{item.value} คน</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* University Analysis Table */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card 
            title="🎓 วิเคราะห์ตามมหาวิทยาลัย" 
            extra={<Button size="small">ส่งออกข้อมูล</Button>}
            style={{ borderRadius: '12px' }}
          >
            <Table
              columns={universityColumns}
              dataSource={universityData}
              pagination={{ pageSize: 8 }}
              size="middle"
              scroll={{ x: true }}
              rowKey="university"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Company Performance */}
        <Col xs={24} lg={14}>
          <Card 
            title="🏢 ประสิทธิภาพบริษัท" 
            extra={<Button size="small">รายงานเต็ม</Button>}
            style={{ borderRadius: '12px' }}
          >
            <Table
              columns={companyColumns}
              dataSource={companyData}
              pagination={false}
              size="small"
              scroll={{ x: true }}
              rowKey="name"
            />
          </Card>
        </Col>

        {/* Skill Demand */}
        <Col xs={24} lg={10}>
          <Card 
            title="💼 ทักษะที่ต้องการมากที่สุด" 
            extra={<Button size="small">ดูทั้งหมด</Button>}
            style={{ borderRadius: '12px' }}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={skillDemand} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="skill" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card 
            title="🔔 กิจกรรมล่าสุด" 
            extra={<Button size="small">ดูทั้งหมด</Button>}
            style={{ borderRadius: '12px' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentActivities}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={getUserIcon(item.type)} />}
                    title={<Text strong>{item.user}</Text>}
                    description={
                      <div>
                        <div>{item.action}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.time}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="📊 สถิติด่วน" 
            style={{ borderRadius: '12px' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="อัตราการจับคู่สำเร็จ"
                  value={73.5}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="ความพึงพอใจเฉลี่ย"
                  value={4.2}
                  precision={1}
                  suffix="/5.0 ⭐"
                  valueStyle={{ color: '#faad14', fontSize: '24px' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: '24px' }}>
              <Text strong>ความคืบหน้าการรับสมัคร</Text>
              <Progress 
                percent={68} 
                status="active" 
                strokeColor="#1890ff"
                style={{ marginTop: '8px' }}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <Text strong>การใช้งานระบบ (ออนไลน์)</Text>
              <div style={{ marginTop: '8px' }}>
                <Tag color="blue">นักศึกษา: 45 คน</Tag>
                <Tag color="green">บริษัท: 12 คน</Tag>
                <Tag color="orange">อาจารย์: 8 คน</Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;