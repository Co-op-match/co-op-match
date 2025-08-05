import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Progress, 
  Select, 
  DatePicker, 
  Layout, 
  Menu, 
  Button,
  Typography,
  Space,
  Tag,
  Avatar,
  Divider,
  Badge
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  TrendingUpOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SettingOutlined,
  DashboardOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CoopMatchDashboard = () => {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // Mock data based on your models
  const userStats = {
    students: 1250,
    companies: 85,
    academicStaff: 45,
    admins: 8,
    totalUsers: 1388
  };

  const recentActivities = [
    { id: 1, type: 'application', student: 'นางสาว สมใจ ใจดี', company: 'บริษัท เทคโนโลยี ABC', time: '2 ชั่วโมงที่แล้ว' },
    { id: 2, type: 'interview', student: 'นาย วิทยา วิทยาการ', company: 'บริษัท ซอฟต์แวร์ XYZ', time: '4 ชั่วโมงที่แล้ว' },
    { id: 3, type: 'match', student: 'นางสาว กิตติมา กิตติกุล', company: 'บริษัท ดาต้า DEF', time: '6 ชั่วโมงที่แล้ว' }
  ];

  const topCompanies = [
    { name: 'บริษัท เทคโนโลยี ABC จำกัด', applications: 45, posts: 8, matchRate: 85 },
    { name: 'บริษัท ซอฟต์แวร์ XYZ จำกัด', applications: 38, posts: 6, matchRate: 78 },
    { name: 'บริษัท ดิจิทัล DEF จำกัด', applications: 32, posts: 5, matchRate: 72 },
    { name: 'บริษัท ไอที GHI จำกัด', applications: 28, posts: 4, matchRate: 68 }
  ];

  const applicationStats = [
    { month: 'ม.ค.', applications: 120, matches: 85, interviews: 65 },
    { month: 'ก.พ.', applications: 135, matches: 92, interviews: 78 },
    { month: 'มี.ค.', applications: 158, matches: 110, interviews: 89 },
    { month: 'เม.ย.', applications: 142, matches: 98, interviews: 82 },
    { month: 'พ.ค.', applications: 165, matches: 125, interviews: 95 },
    { month: 'มิ.ย.', applications: 178, matches: 135, interviews: 108 }
  ];

  const skillDemand = [
    { skill: 'React.js', demand: 95, students: 85 },
    { skill: 'Node.js', demand: 88, students: 72 },
    { skill: 'Python', demand: 82, students: 90 },
    { skill: 'Java', demand: 78, students: 95 },
    { skill: 'Data Analysis', demand: 75, students: 45 }
  ];

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'แดชบอร์ด' },
    { key: 'analytics', icon: <BarChartOutlined />, label: 'การวิเคราะห์' },
    { key: 'users', icon: <UserOutlined />, label: 'ผู้ใช้งาน' },
    { key: 'companies', icon: <BankOutlined />, label: 'บริษัท' },
    { key: 'posts', icon: <FileTextOutlined />, label: 'โพสต์งาน' },
    { key: 'matches', icon: <TeamOutlined />, label: 'การจับคู่' },
    { key: 'settings', icon: <SettingOutlined />, label: 'ตั้งค่า' }
  ];

  const getStatusColor = (type) => {
    switch(type) {
      case 'application': return 'blue';
      case 'interview': return 'orange';
      case 'match': return 'green';
      default: return 'default';
    }
  };

  const getStatusText = (type) => {
    switch(type) {
      case 'application': return 'สมัครงาน';
      case 'interview': return 'นัดสัมภาษณ์';
      case 'match': return 'จับคู่สำเร็จ';
      default: return 'อื่นๆ';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>


      <Layout>
        <Header style={{ 
          background: '#ffffff', 
          padding: '0 24px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            ระบบจัดการ CoopMatch
          </Title>
          <Space>
            <Text>สวัสดี, ผู้ดูแลระบบ</Text>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          </Space>
        </Header>

        <Content style={{ margin: '24px 24px 0', overflow: 'initial' }}>
          {selectedMenu === 'dashboard' && (
            <div>
              {/* Stats Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title="นักศึกษา"
                      value={userStats.students}
                      prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title="บริษัท"
                      value={userStats.companies}
                      prefix={<BankOutlined style={{ color: '#52c41a' }} />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title="อาจารย์"
                      value={userStats.academicStaff}
                      prefix={<BookOutlined style={{ color: '#faad14' }} />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title="ผู้ใช้ทั้งหมด"
                      value={userStats.totalUsers}
                      prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                {/* Recent Activities */}
                <Col xs={24} md={12}>
                  <Card title="กิจกรรมล่าสุด" extra={<Button type="link">ดูทั้งหมด</Button>}>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {recentActivities.map(activity => (
                        <div key={activity.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Tag color={getStatusColor(activity.type)}>{getStatusText(activity.type)}</Tag>
                              <div style={{ marginTop: '4px' }}>
                                <Text strong>{activity.student}</Text>
                                <br />
                                <Text type="secondary">{activity.company}</Text>
                              </div>
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{activity.time}</Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>

                {/* Top Companies */}
                <Col xs={24} md={12}>
                  <Card title="บริษัทยอดนิยม" extra={<Button type="link">ดูทั้งหมด</Button>}>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {topCompanies.map((company, index) => (
                        <div key={index} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <Text strong>{company.name}</Text>
                            <Badge count={company.posts} style={{ backgroundColor: '#1890ff' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <Text type="secondary">ใบสมัคร: {company.applications}</Text>
                            <Text type="secondary">อัตราจับคู่: {company.matchRate}%</Text>
                          </div>
                          <Progress percent={company.matchRate} size="small" strokeColor="#1890ff" />
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {selectedMenu === 'analytics' && (
            <div>
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                  <Card title="การวิเคราะห์ระบบ" extra={
                    <Space>
                      <RangePicker />
                      <Select defaultValue="monthly" style={{ width: 120 }}>
                        <Option value="daily">รายวัน</Option>
                        <Option value="monthly">รายเดือน</Option>
                        <Option value="yearly">รายปี</Option>
                      </Select>
                    </Space>
                  }>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={12}>
                        <Title level={5}>สถิติการสมัครงาน</Title>
                        <div style={{ height: '200px', backgroundColor: '#fafafa', borderRadius: '8px', padding: '16px' }}>
                          {applicationStats.map((stat, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <Text>{stat.month}</Text>
                              <Space>
                                <Text type="secondary">สมัคร: {stat.applications}</Text>
                                <Text style={{ color: '#52c41a' }}>จับคู่: {stat.matches}</Text>
                                <Text style={{ color: '#1890ff' }}>สัมภาษณ์: {stat.interviews}</Text>
                              </Space>
                            </div>
                          ))}
                        </div>
                      </Col>
                      <Col xs={24} lg={12}>
                        <Title level={5}>ความต้องการทักษะ vs จำนวนนักศึกษา</Title>
                        <div style={{ height: '200px', backgroundColor: '#fafafa', borderRadius: '8px', padding: '16px' }}>
                          {skillDemand.map((skill, index) => (
                            <div key={index} style={{ marginBottom: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <Text strong>{skill.skill}</Text>
                                <Text type="secondary">ต้องการ: {skill.demand}% | มี: {skill.students}%</Text>
                              </div>
                              <Progress 
                                percent={skill.demand} 
                                success={{ percent: skill.students }} 
                                strokeColor="#ff4d4f"
                                size="small"
                              />
                            </div>
                          ))}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic
                      title="อัตราการจับคู่สำเร็จ"
                      value={78.5}
                      suffix="%"
                      prefix={<TrendingUpOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic
                      title="เวลาเฉลี่ยในการจับคู่"
                      value={3.2}
                      suffix="วัน"
                      prefix={<CalendarOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic
                      title="ความพึงพอใจเฉลี่ย"
                      value={4.6}
                      suffix="/ 5.0"
                      prefix={<TrendingUpOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {selectedMenu !== 'dashboard' && selectedMenu !== 'analytics' && (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Title level={3} type="secondary">หน้า {menuItems.find(item => item.key === selectedMenu)?.label}</Title>
                <Text type="secondary">เนื้อหาสำหรับหน้านี้จะถูกพัฒนาในขั้นตอนถัดไป</Text>
              </div>
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default CoopMatchDashboard;