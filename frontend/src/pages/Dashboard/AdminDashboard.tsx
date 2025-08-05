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
  Badge,
  Timeline,
  Alert,
  Tooltip,
  List,
  Rate
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  WarningOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SettingOutlined,
  DashboardOutlined,
  BarChartOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  MessageOutlined,
  HeartOutlined,
  BulbOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import AdminHeader from "./../Component/AdminCoopMatchHeaderDefault";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CoopMatchDashboard = () => {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // Enhanced mock data
  const userStats = {
    students: 1250,
    companies: 85,
    academicStaff: 45,
    admins: 8,
    totalUsers: 1388,
    activeStudents: 892,
    pendingApplications: 156,
    successfulMatches: 324,
    averageRating: 4.6
  };

  const recentActivities = [
    { id: 1, type: 'application', student: 'นางสาว สมใจ ใจดี', company: 'บริษัท เทคโนโลยี ABC', time: '2 ชั่วโมงที่แล้ว', avatar: 'S' },
    { id: 2, type: 'interview', student: 'นาย วิทยา วิทยาการ', company: 'บริษัท ซอฟต์แวร์ XYZ', time: '4 ชั่วโมงที่แล้ว', avatar: 'V' },
    { id: 3, type: 'match', student: 'นางสาว กิตติมา กิตติกุล', company: 'บริษัท ดาต้า DEF', time: '6 ชั่วโมงที่แล้ว', avatar: 'K' },
    { id: 4, type: 'approved', student: 'นาย ณัฐพล นักเรียน', company: 'บริษัท AI Solutions', time: '8 ชั่วโมงที่แล้ว', avatar: 'N' },
    { id: 5, type: 'feedback', student: 'นางสาว มยุรี มยุระ', company: 'บริษัท Cloud Tech', time: '12 ชั่วโมงที่แล้ว', avatar: 'M' }
  ];

  const topCompanies = [
    { name: 'บริษัท เทคโนโลยี ABC จำกัด', applications: 45, posts: 8, matchRate: 85, logo: 'A', rating: 4.8, verified: true },
    { name: 'บริษัท ซอฟต์แวร์ XYZ จำกัด', applications: 38, posts: 6, matchRate: 78, logo: 'X', rating: 4.6, verified: true },
    { name: 'บริษัท ดิจิทัล DEF จำกัด', applications: 32, posts: 5, matchRate: 72, logo: 'D', rating: 4.4, verified: false },
    { name: 'บริษัท ไอที GHI จำกัด', applications: 28, posts: 4, matchRate: 68, logo: 'G', rating: 4.2, verified: true }
  ];

  const quickActions = [
    { title: 'อนุมัติใบสมัคร', count: 23, color: '#1890ff', icon: <CheckCircleOutlined /> },
    { title: 'ตรวจสอบบริษัท', count: 5, color: '#faad14', icon: <SafetyCertificateOutlined /> },
    { title: 'แจ้งเตือนที่รอ', count: 12, color: '#ff4d4f', icon: <ExclamationCircleOutlined /> },
    { title: 'รายงานปัญหา', count: 3, color: '#722ed1', icon: <WarningOutlined /> }
  ];

  type AlertType = "info" | "warning" | "success" | "error" | undefined;

  const systemAlerts: { type: AlertType; message: string; showIcon: boolean }[] = [
    { type: 'info', message: 'ระบบจะปิดปรับปรุงในวันที่ 15 สิงหาคม 2025 เวลา 02:00-04:00 น.', showIcon: true },
    { type: 'warning', message: 'มีบริษัท 3 แห่งที่ยังไม่ได้ยืนยันตัวตน กรุณาตรวจสอบ', showIcon: true },
    { type: 'success', message: 'อัปเดตฟีเจอร์ AI Matching เรียบร้อยแล้ว - ประสิทธิภาพเพิ่มขึ้น 25%', showIcon: true }
  ];

  const popularSkills = [
    { skill: 'React.js', demand: 95, students: 85, trend: 'up' },
    { skill: 'Node.js', demand: 88, students: 72, trend: 'up' },
    { skill: 'Python', demand: 82, students: 90, trend: 'stable' },
    { skill: 'Java', demand: 78, students: 95, trend: 'down' },
    { skill: 'Data Science', demand: 92, students: 45, trend: 'up' },
    { skill: 'UI/UX Design', demand: 75, students: 68, trend: 'up' }
  ];

  const performanceMetrics = [
    { title: 'การจับคู่สำเร็จ', value: 324, change: 12, changeType: 'increase', icon: <TrophyOutlined /> },
    { title: 'เวลาเฉลี่ย', value: '3.2 วัน', change: -0.5, changeType: 'decrease', icon: <ClockCircleOutlined /> },
    { title: 'ความพึงพอใจ', value: '4.6/5.0', change: 0.2, changeType: 'increase', icon: <HeartOutlined /> },
    { title: 'อัตราการกลับมา', value: '87%', change: 5, changeType: 'increase', icon: <RiseOutlined /> }
  ];

  const recentFeedback = [
    { student: 'นางสาว จิรนันท์ จิระ', company: 'บริษัท Tech Innovation', rating: 5, comment: 'ระบบจับคู่แม่นยำมาก ได้งานที่ตรงใจ', time: '1 วันที่แล้ว' },
    { student: 'นาย อนุชา อนุชิต', company: 'บริษัท Digital Solutions', rating: 4, comment: 'กระบวนการรวดเร็ว เจ้าหน้าที่ช่วยเหลือดี', time: '2 วันที่แล้ว' },
    { student: 'นางสาว ปรียา ปรีชา', company: 'บริษัท Smart Systems', rating: 5, comment: 'ได้เรียนรู้ทักษะใหม่ๆ มากมาย แนะนำเลย', time: '3 วันที่แล้ว' }
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

  const getStatusColor = (type: any) => {
    switch(type) {
      case 'application': return 'blue';
      case 'interview': return 'orange';
      case 'match': return 'green';
      case 'approved': return 'purple';
      case 'feedback': return 'cyan';
      default: return 'default';
    }
  };

  const getStatusText = (type: any) => {
    switch(type) {
      case 'application': return 'สมัครงาน';
      case 'interview': return 'นัดสัมภาษณ์';
      case 'match': return 'จับคู่สำเร็จ';
      case 'approved': return 'อนุมัติแล้ว';
      case 'feedback': return 'ให้คะแนน';
      default: return 'อื่นๆ';
    }
  };

  const getTrendIcon = (trend: any) => {
    switch(trend) {
      case 'up': return <RiseOutlined style={{ color: '#52c41a' }} />;
      case 'down': return <FallOutlined style={{ color: '#ff4d4f' }} />;
      default: return <span style={{ color: '#faad14' }}>━</span>;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <AdminHeader/><Layout>
       

        <Content style={{ margin: '24px 24px 0', overflow: 'initial' }}>
          {selectedMenu === 'dashboard' && (
            <div>
              {/* System Alerts */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {systemAlerts.map((alert, index) => (
                      <Alert
                        key={index}
                        message={alert.message}
                        type={alert.type}
                        showIcon={alert.showIcon}
                        closable
                      />
                    ))}
                  </Space>
                </Col>
              </Row>

              {/* Main Stats Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 0 }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>นักศึกษาทั้งหมด</span>}
                      value={userStats.students}
                      prefix={<UserOutlined style={{ color: 'white' }} />}
                      valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
                      suffix={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>คน</span>}
                    />
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                      ใช้งานจริง: {userStats.activeStudents} คน
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', border: 0 }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(0,0,0,0.7)' }}>บริษัทพาร์ทเนอร์</span>}
                      value={userStats.companies}
                      prefix={<BankOutlined style={{ color: '#d48806' }} />}
                      valueStyle={{ color: '#d48806', fontSize: '28px', fontWeight: 'bold' }}
                      suffix={<span style={{ color: 'rgba(0,0,0,0.5)', fontSize: '14px' }}>แห่ง</span>}
                    />
                    <Text style={{ color: 'rgba(0,0,0,0.5)', fontSize: '12px' }}>
                      ยืนยันแล้ว: {userStats.companies - 3} แห่ง
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', border: 0 }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(0,0,0,0.7)' }}>การจับคู่สำเร็จ</span>}
                      value={userStats.successfulMatches}
                      prefix={<TrophyOutlined style={{ color: '#389e0d' }} />}
                      valueStyle={{ color: '#389e0d', fontSize: '28px', fontWeight: 'bold' }}
                      suffix={<span style={{ color: 'rgba(0,0,0,0.5)', fontSize: '14px' }}>ครั้ง</span>}
                    />
                    <Text style={{ color: 'rgba(0,0,0,0.5)', fontSize: '12px' }}>
                      เดือนนี้: +12 ครั้ง
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', border: 0 }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(0,0,0,0.7)' }}>คะแนนความพึงพอใจ</span>}
                      value={userStats.averageRating}
                      prefix={<HeartOutlined style={{ color: '#eb2f96' }} />}
                      valueStyle={{ color: '#eb2f96', fontSize: '28px', fontWeight: 'bold' }}
                      suffix={<span style={{ color: 'rgba(0,0,0,0.5)', fontSize: '14px' }}>/5.0</span>}
                    />
                    <Rate disabled defaultValue={userStats.averageRating} style={{ fontSize: '12px' }} />
                  </Card>
                </Col>
              </Row>

              {/* Quick Actions */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                  <Card title="การดำเนินการด่วน" extra={<Button type="link">ดูทั้งหมด</Button>}>
                    <Row gutter={[16, 16]}>
                      {quickActions.map((action, index) => (
                        <Col xs={24} sm={12} md={6} key={index}>
                          <Card 
                            size="small" 
                            hoverable
                            style={{ 
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              borderLeft: `4px solid ${action.color}`
                            }}
                          >
                            <div style={{ fontSize: '24px', color: action.color, marginBottom: '8px' }}>
                              {action.icon}
                            </div>
                            <Text strong style={{ display: 'block', marginBottom: '4px' }}>{action.title}</Text>
                            <Badge count={action.count} style={{ backgroundColor: action.color }} />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {/* Performance Metrics */}
                <Col xs={24} lg={12}>
                  <Card title="เมทริกประสิทธิภาพ" extra={<Button type="link" icon={<EyeOutlined />}>รายละเอียด</Button>}>
                    <Row gutter={[16, 16]}>
                      {performanceMetrics.map((metric, index) => (
                        <Col span={12} key={index}>
                          <Card size="small" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', color: '#1890ff', marginBottom: '8px' }}>
                              {metric.icon}
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{metric.title}</Text>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0' }}>
                              {metric.value}
                            </div>
                            <Text style={{ 
                              color: metric.changeType === 'increase' ? '#52c41a' : '#ff4d4f',
                              fontSize: '12px'
                            }}>
                              {metric.changeType === 'increase' ? '↑' : '↓'} {Math.abs(metric.change)}
                              {typeof metric.change === 'number' && metric.change % 1 !== 0 ? '' : '%'}
                            </Text>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>

                {/* Popular Skills */}
                <Col xs={24} lg={12}>
                  <Card title="ทักษะที่ต้องการ" extra={<Button type="link" icon={<BulbOutlined />}>แนะนำหลักสูตร</Button>}>
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {popularSkills.map((skill, index) => (
                        <div key={index} style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <Text strong>{skill.skill}</Text>
                            <Space>
                              {getTrendIcon(skill.trend)}
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                ต้องการ {skill.demand}% | มี {skill.students}%
                              </Text>
                            </Space>
                          </div>
                          <Progress 
                            percent={skill.demand} 
                            success={{ percent: skill.students }} 
                            strokeColor={skill.demand > skill.students ? "#ff4d4f" : "#52c41a"}
                            size="small"
                            format={() => `${skill.demand - skill.students > 0 ? '+' : ''}${skill.demand - skill.students}%`}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                {/* Recent Activities */}
                <Col xs={24} lg={8}>
                  <Card title="กิจกรรมล่าสุด" extra={<Button type="link">ดูทั้งหมด</Button>}>
                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      <Timeline>
                        {recentActivities.map(activity => (
                          <Timeline.Item 
                            key={activity.id}
                            color={getStatusColor(activity.type)}
                            dot={
                              <Avatar size="small" style={{ 
                                backgroundColor: getStatusColor(activity.type) === 'blue' ? '#1890ff' : 
                                                 getStatusColor(activity.type) === 'green' ? '#52c41a' :
                                                 getStatusColor(activity.type) === 'orange' ? '#fa8c16' : '#722ed1'
                              }}>
                                {activity.avatar}
                              </Avatar>
                            }
                          >
                            <div style={{ marginBottom: '8px' }}>
                              <Tag color={getStatusColor(activity.type)}>
                                {getStatusText(activity.type)}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: '12px', float: 'right' }}>
                                {activity.time}
                              </Text>
                            </div>
                            <Text strong style={{ display: 'block' }}>{activity.student}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{activity.company}</Text>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </div>
                  </Card>
                </Col>

                {/* Top Companies */}
                <Col xs={24} lg={8}>
                  <Card title="บริษัทยอดนิยม" extra={<Button type="link">จัดการบริษัท</Button>}>
                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      {topCompanies.map((company, index) => (
                        <div key={index} style={{ 
                          marginBottom: '16px', 
                          padding: '12px', 
                          border: '1px solid #f0f0f0',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <Avatar style={{ backgroundColor: '#1890ff', marginRight: '8px' }}>
                              {company.logo}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Text strong style={{ fontSize: '13px' }}>{company.name}</Text>
                                {company.verified && (
                                  <Tooltip title="บริษัทได้รับการยืนยัน">
                                    <SafetyCertificateOutlined style={{ color: '#52c41a', marginLeft: '4px' }} />
                                  </Tooltip>
                                )}
                              </div>
                              <Rate disabled defaultValue={company.rating} style={{ fontSize: '10px' }} />
                            </div>
                            <Badge count={company.posts} style={{ backgroundColor: '#1890ff' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              ใบสมัคร: {company.applications}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              อัตราจับคู่: {company.matchRate}%
                            </Text>
                          </div>
                          <Progress 
                            percent={company.matchRate} 
                            size="small" 
                            strokeColor={company.matchRate >= 80 ? "#52c41a" : company.matchRate >= 60 ? "#faad14" : "#ff4d4f"} 
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>

                {/* Recent Feedback */}
                <Col xs={24} lg={8}>
                  <Card title="ความคิดเห็นล่าสุด" extra={<Button type="link">ดูทั้งหมด</Button>}>
                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      {recentFeedback.map((feedback, index) => (
                        <div key={index} style={{ 
                          marginBottom: '16px', 
                          padding: '12px', 
                          backgroundColor: '#f9f9f9',
                          borderRadius: '8px',
                          borderLeft: '3px solid #1890ff'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <Text strong style={{ fontSize: '13px' }}>{feedback.student}</Text>
                            <Rate disabled defaultValue={feedback.rating} style={{ fontSize: '10px' }} />
                          </div>
                          <Text style={{ 
                            fontSize: '12px', 
                            fontStyle: 'italic',
                            display: 'block',
                            marginBottom: '8px',
                            color: '#595959'
                          }}>
                            "{feedback.comment}"
                          </Text>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {feedback.company}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {feedback.time}
                            </Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {/* Other menu content remains the same */}
          {selectedMenu === 'analytics' && (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Title level={3} type="secondary">หน้าการวิเคราะห์</Title>
                <Text type="secondary">เนื้อหาสำหรับหน้านี้จะถูกพัฒนาในขั้นตอนถัดไป</Text>
              </div>
            </Card>
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