import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Select, 
  DatePicker, 
  Typography,
  Space,
  Tabs,
  Progress,
  Tag,
  Avatar,
  List,
  Badge
} from 'antd';
import {
  UserOutlined,
  BankOutlined,
  TeamOutlined,
  BookOutlined,
  FileTextOutlined,
  StarOutlined,
  LoginOutlined,
  TrophyOutlined,
  RiseOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Types
interface UserStats {
  role: string;
  roleNameTH: string;
  count: number;
  growth: number;
  icon: React.ReactNode;
  color: string;
}

interface AnalysisData {
  typeCode: string;
  typeName: string;
  data: any;
  trend: number;
}

interface TopCompany {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  applications: number;
}

interface TopSkill {
  id: number;
  name: string;
  demand: number;
  growth: number;
}

const CoopMatchAdminDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock Data
  const userStats: UserStats[] = [
    {
      role: 'Student',
      roleNameTH: 'นักเรียน',
      count: 1248,
      growth: 12.5,
      icon: <UserOutlined />,
      color: '#1890ff'
    },
    {
      role: 'Company',
      roleNameTH: 'บริษัท',
      count: 156,
      growth: 8.3,
      icon: <BankOutlined />,
      color: '#52c41a'
    },
    {
      role: 'AcademicStaff',
      roleNameTH: 'อาจารย์',
      count: 89,
      growth: 3.2,
      icon: <BookOutlined />,
      color: '#faad14'
    },
    {
      role: 'Admin',
      roleNameTH: 'แอดมิน',
      count: 12,
      growth: 0,
      icon: <TeamOutlined />,
      color: '#722ed1'
    }
  ];

  // Data for charts
  const userGrowthData = [
    { month: 'ม.ค.', students: 980, companies: 120, staff: 78, admins: 12 },
    { month: 'ก.พ.', students: 1050, companies: 128, staff: 81, admins: 12 },
    { month: 'มี.ค.', students: 1120, companies: 135, staff: 83, admins: 12 },
    { month: 'เม.ย.', students: 1180, companies: 142, staff: 85, admins: 12 },
    { month: 'พ.ค.', students: 1210, companies: 148, staff: 87, admins: 12 },
    { month: 'มิ.ย.', students: 1248, companies: 156, staff: 89, admins: 12 }
  ];

  const applicationStatusData = [
    { name: 'อนุมัติแล้ว', value: 456, color: '#52c41a' },
    { name: 'รอพิจารณา', value: 234, color: '#faad14' },
    { name: 'ปฏิเสธ', value: 202, color: '#ff4d4f' }
  ];

  const dailyApplicationData = [
    { date: '01/08', applications: 32, approved: 18 },
    { date: '02/08', applications: 41, approved: 21 },
    { date: '03/08', applications: 52, approved: 28 },
    { date: '04/08', applications: 38, approved: 19 },
    { date: '05/08', applications: 45, approved: 23 },
    { date: '06/08', applications: 48, approved: 26 },
    { date: '07/08', applications: 55, approved: 32 }
  ];

  const skillDemandData = [
    { skill: 'JavaScript', demand: 89, fill: '#1890ff' },
    { skill: 'Python', demand: 76, fill: '#52c41a' },
    { skill: 'React', demand: 65, fill: '#faad14' },
    { skill: 'Node.js', demand: 54, fill: '#722ed1' },
    { skill: 'Database', demand: 48, fill: '#eb2f96' }
  ];

  const loginActivityData = [
    { time: '00:00', users: 12 },
    { time: '04:00', users: 8 },
    { time: '08:00', users: 45 },
    { time: '12:00', users: 89 },
    { time: '16:00', users: 123 },
    { time: '20:00', users: 67 },
    { time: '24:00', users: 34 }
  ];

  const universityApplicationData = [
    { university: 'มหาวิทยาลัย A', applications: 234, students: 345 },
    { university: 'มหาวิทยาลัย B', applications: 198, students: 287 },
    { university: 'มหาวิทยาลัย C', applications: 167, students: 234 },
    { university: 'มหาวิทยาลัย D', applications: 145, students: 201 },
    { university: 'มหาวิทยาลัย E', applications: 123, students: 178 }
  ];

  const companyReviewData = [
    { name: 'เทคโนโลยี ABC', rating: 4.8, reviews: 124 },
    { name: 'ซอฟต์แวร์ XYZ', rating: 4.6, reviews: 98 },
    { name: 'ดิจิทัล DEF', rating: 4.5, reviews: 87 },
    { name: 'ไอที GHI', rating: 4.4, reviews: 76 },
    { name: 'เน็ตเวิร์ค JKL', rating: 4.3, reviews: 65 }
  ];

  const matchingSuccessData = [
    { name: 'สำเร็จ', value: 187, fill: '#52c41a' },
    { name: 'รอพิจารณา', value: 156, fill: '#faad14' },
    { name: 'ไม่สำเร็จ', value: 89, fill: '#ff4d4f' }
  ];

  const topCompanies: TopCompany[] = [
    { id: 1, name: 'บริษัท เทคโนโลยี ABC จำกัด', rating: 4.8, reviews: 124, applications: 89 },
    { id: 2, name: 'บริษัท ซอฟต์แวร์ XYZ จำกัด', rating: 4.6, reviews: 98, applications: 76 },
    { id: 3, name: 'บริษัท ดิจิทัล DEF จำกัด', rating: 4.5, reviews: 87, applications: 65 },
    { id: 4, name: 'บริษัท ไอที GHI จำกัด', rating: 4.4, reviews: 76, applications: 54 },
    { id: 5, name: 'บริษัท เน็ตเวิร์ค JKL จำกัด', rating: 4.3, reviews: 65, applications: 43 }
  ];

  const applicationColumns = [
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'รวม',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => <Text strong>{value}</Text>
    },
    {
      title: 'อนุมัติ',
      dataIndex: 'approved',
      key: 'approved',
      render: (value: number) => <Tag color="green">{value}</Tag>
    },
    {
      title: 'รอพิจารณา',
      dataIndex: 'pending',
      key: 'pending',
      render: (value: number) => <Tag color="orange">{value}</Tag>
    },
    {
      title: 'ปฏิเสธ',
      dataIndex: 'rejected',
      key: 'rejected',
      render: (value: number) => <Tag color="red">{value}</Tag>
    }
  ];

  const applicationTableData = [
    { key: '1', date: '2024-08-05', total: 45, approved: 23, pending: 15, rejected: 7 },
    { key: '2', date: '2024-08-04', total: 38, approved: 19, pending: 12, rejected: 7 },
    { key: '3', date: '2024-08-03', total: 52, approved: 28, pending: 18, rejected: 6 },
    { key: '4', date: '2024-08-02', total: 41, approved: 21, pending: 14, rejected: 6 },
    { key: '5', date: '2024-08-01', total: 47, approved: 25, pending: 16, rejected: 6 }
  ];

  const contentStyle = {
    background: '#f5f7fa',
    minHeight: '100vh',
    padding: '24px'
  };

  return (
    <div style={contentStyle}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          แดชบอร์ดวิเคราะห์ระบบสหกิจศึกษา CoopMatch
        </Title>
        <Space>
          <Select 
            value={selectedPeriod} 
            onChange={setSelectedPeriod}
            style={{ width: 120 }}
          >
            <Option value="day">รายวัน</Option>
            <Option value="week">รายสัปดาห์</Option>
            <Option value="month">รายเดือน</Option>
            <Option value="year">รายปี</Option>
          </Select>
          <RangePicker />
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane tab="ภาพรวม" key="overview">
          {/* User Statistics Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {userStats.map((stat) => (
              <Col xs={24} sm={12} md={6} key={stat.role}>
                <Card 
                  hoverable
                  style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: `2px solid ${stat.color}20`,
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {stat.roleNameTH}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                        <Title level={2} style={{ margin: 0, color: stat.color }}>
                          {stat.count.toLocaleString()}
                        </Title>
                        {stat.growth > 0 && (
                          <Tag color="green" style={{ marginLeft: '8px' }}>
                            <RiseOutlined /> +{stat.growth}%
                          </Tag>
                        )}
                      </div>
                    </div>
                    <Avatar 
                      size={48} 
                      style={{ background: stat.color, fontSize: '20px' }}
                    >
                      {stat.icon}
                    </Avatar>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Charts Row 1 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={16}>
              <Card title="การเติบโตของผู้ใช้ระบบ" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="students" 
                      stackId="1"
                      stroke="#1890ff" 
                      fill="#1890ff" 
                      name="นักเรียน"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="companies" 
                      stackId="1"
                      stroke="#52c41a" 
                      fill="#52c41a" 
                      name="บริษัท"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="staff" 
                      stackId="1"
                      stroke="#faad14" 
                      fill="#faad14" 
                      name="อาจารย์"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="สถานะการสมัครงาน" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Charts Row 2 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={12}>
              <Card title="การสมัครงานรายวัน" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyApplicationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#1890ff" 
                      strokeWidth={3}
                      name="การสมัคร"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="approved" 
                      stroke="#52c41a" 
                      strokeWidth={3}
                      name="อนุมัติ"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="ทักษะที่ต้องการมากที่สุด" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skillDemandData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="skill" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="demand" fill="#1890ff" radius={[0, 5, 5, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Charts Row 3 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={8}>
              <Card title="การจับคู่งาน" style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={matchingSuccessData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent! * 100).toFixed(0)}%`}
                    >
                      {matchingSuccessData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="การเข้าใช้ระบบรายชั่วโมง" style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={loginActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#722ed1" 
                      fill="#722ed1" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="คะแนนรีวิวบริษัท" style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={companyReviewData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="rating" fill="#faad14" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Top Lists */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="บริษัทยอดนิยม" 
                extra={<TrophyOutlined style={{ color: '#faad14' }} />}
              >
                <List
                  dataSource={topCompanies}
                  renderItem={(company, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Badge count={index + 1} style={{ background: '#1890ff' }}>
                            <Avatar style={{ background: '#f0f8ff', color: '#1890ff' }}>
                              <BankOutlined />
                            </Avatar>
                          </Badge>
                        }
                        title={company.name}
                        description={
                          <Space>
                            <Tag color="gold">★ {company.rating}</Tag>
                            <Tag color="blue">{company.reviews} รีวิว</Tag>
                            <Tag color="green">{company.applications} สมัคร</Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="การสมัครตามมหาวิทยาลัย" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={universityApplicationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="university" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applications" fill="#1890ff" name="การสมัคร" />
                    <Bar dataKey="students" fill="#52c41a" name="นักเรียน" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="การสมัครงาน" key="applications">
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="การสมัครทั้งหมด"
                  value={892}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="อนุมัติแล้ว"
                  value={456}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="รอพิจารณา"
                  value={234}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<LoginOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="ปฏิเสธ"
                  value={202}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={16}>
              <Card title="แนวโน้มการสมัครงาน" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyApplicationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#1890ff" 
                      strokeWidth={3}
                      name="การสมัครรวม"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="approved" 
                      stroke="#52c41a" 
                      strokeWidth={3}
                      name="อนุมัติ"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="สัดส่วนสถานะการสมัคร" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent! * 100).toFixed(0)}%`}
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Card title="รายละเอียดการสมัครงาน">
            <Table
              columns={applicationColumns}
              dataSource={applicationTableData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 600 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="รายงานการเข้าระบบ" key="login">
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={8}>
              <Card title="การเข้าระบบวันนี้">
                <Statistic
                  title="ผู้ใช้ที่เข้าระบบ"
                  value={245}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<LoginOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="การเข้าระบบสัปดาห์นี้">
                <Statistic
                  title="ผู้ใช้ที่เข้าระบบ"
                  value={1456}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="การเข้าระบบเดือนนี้">
                <Statistic
                  title="ผู้ใช้ที่เข้าระบบ"
                  value={5678}
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="การเข้าใช้ระบบตลอดวัน" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={loginActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#722ed1" 
                      fill="#722ed1" 
                      fillOpacity={0.6}
                      name="จำนวนผู้ใช้"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="การเข้าระบบตามประเภทผู้ใช้" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#1890ff" name="นักเรียน" />
                    <Bar dataKey="companies" fill="#52c41a" name="บริษัท" />
                    <Bar dataKey="staff" fill="#faad14" name="อาจารย์" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CoopMatchAdminDashboard;