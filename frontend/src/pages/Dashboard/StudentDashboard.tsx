import React, { useContext, useEffect, useState } from 'react';
import { Button, Card, Layout, Row, Col, Typography, message } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SearchOutlined,
  TrophyOutlined,
  MessageOutlined,
  HomeOutlined,
  PlayCircleOutlined,
  ReadOutlined,
} from '@ant-design/icons';

import { useNavigate } from 'react-router-dom';
const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;
import CoopMatchHeaderDefault from '../Component/CoopMatchHeader';
import { UserContext } from '../../components/UserContext';
import { GetAllCompany,GetIntershipPost, GetAllStudent, } from '../../services/https';
import { GetAllInterviewAppointments } from '../../services/https/Application';
import type { CompanyInterface } from '../../interfaces/Company';
import type { IntershipPostInterface } from '../../interfaces/IntershipPost';
import type { StudentInterface } from '../../interfaces/Student';
import type { InterviewAppointmentInterface } from '../../interfaces/InterviewAppointment';

function StudentDashboard() {
  const [animated, setAnimated] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [company, setCompany] = useState<CompanyInterface[]>([]);
  const [posts, setPosts] = useState<IntershipPostInterface[]>([]);
  const [student, setStudent] = useState<StudentInterface[]>([]);
  const [appointments, setAppointments] = useState<InterviewAppointmentInterface[]>([]);


  const navigate = useNavigate();
  useEffect(() => {
    setTimeout(() => setAnimated(true), 300);
  }, []);

  const { logout } = useContext(UserContext);
  const handleLogout = async () => {
    await logout();
    navigate("/sign-in");
  };

  const handleSearchClick = () => {
      navigate('/student/search');
  };

  const handleProfileClick = () => {
      navigate('/student/profile');
    };

  // Fetch initial data with better error handling
  const fetchInitialData = async () => {
    try {
      const [
        companyRes,
        studentRes,
        postRes,
        appointmentRes,
      ] = await Promise.all([
        GetAllCompany(),
        GetAllStudent(),
        GetIntershipPost(),
        GetAllInterviewAppointments(),
      ]);

      // Use a more concise way to handle responses
      const responses = [
        { res: companyRes, setter: setCompany },
        { res: studentRes, setter: setStudent },
        { res: postRes, setter: setPosts },
        { res: appointmentRes, setter: setAppointments }
      ];

      responses.forEach(({ res, setter }) => {
        if (res.status === 200) {
          setter(res.data);
        }
      });

    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Error fetching initial data",
      });
      setTimeout(() => navigate("/"), 2000);
    }
  };
  // Effects
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  useEffect(() => {
    console.log("📦 Companies:", company);
    console.log("📦 Posts:", posts);
    console.log("📦 Students:", student);
    console.log("📦 Appointments:", appointments);
  }, [company, posts, student, appointments]);

  const statistics = [
    {
      title: 'นักศึกษาที่ลงทะเบียน',
      value: student.length,
      icon: <UserOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
    },
    {
      title: 'บริษัทที่เปิดรับฝึกงาน',
      value: company.length,
      icon: <TeamOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    },
    {
      title: 'นักศึกษาได้ที่ฝึกงาน',
      value: appointments.filter(app => app.status === "ผ่าน").length,
      icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#faad14' }} />,
    },
    {
      title: 'ตำแหน่งฝึกงานเปิดรับ',
      value: posts.filter(p => p.StatusPostID == 1).length,
      icon: <FileTextOutlined style={{ fontSize: 28, color: '#f5222d' }} />,
    },
  ];

  const steps = [
    {
      title: 'ลงทะเบียน',
      description: 'สร้างโปรไฟล์นักศึกษาและใส่ข้อมูลการศึกษา',
      icon: <UserOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
    },
    {
      title: 'ค้นหาที่ฝึกงาน',
      description: 'เลือกบริษัทที่เปิดรับนักศึกษาฝึกงาน',
      icon: <SearchOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    },
    {
      title: 'สมัครฝึกงาน',
      description: 'ส่งใบสมัครและเอกสารที่จำเป็น',
      icon: <FileTextOutlined style={{ fontSize: 28, color: '#faad14' }} />,
    },
    {
      title: 'เริ่มฝึกงาน',
      description: 'เข้าฝึกงานและเรียนรู้ประสบการณ์จริง',
      icon: <TrophyOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
    },
  ];
  
  const popularCoopTypes = [
    { name: 'บริษัทเทคโนโลยี', count: 180 },
    { name: 'บริษัทเอกชนขนาดใหญ่', count: 125 },
    { name: 'บริษัทสตาร์ทอัพ', count: 98 },
    { name: 'บริษัทต่างชาติ', count: 76 },
    { name: 'บริษัทอื่นๆ', count: 171 },
  ];

  const news = [
    { title: 'เปิดรับสมัครนักศึกษาฝึกงาน ภาคการศึกษา 2/2567', date: '15 ก.ค. 2567', type: 'ประกาศ' },
    { title: 'สัมมนาออนไลน์: การเตรียมตัวสู่การฝึกงานในบริษัท', date: '10 ก.ค. 2567', type: 'กิจกรรม' },
    { title: 'บริษัท ABC จ.กรุงเทพมหานคร เปิดรับนักศึกษาฝึกงาน 15 คน', date: '8 ก.ค. 2567', type: 'โอกาส' },
    { title: 'เทคนิคการสัมภาษณ์เข้าฝึกงานให้ประสบความสำเร็จ', date: '5 ก.ค. 2567', type: 'บทความ' },
  ];

  const features = [
    {
      icon: <SearchOutlined style={{ fontSize: 32, color: '#3b82f6' }} />,
      title: 'ค้นหาง่าย',
      description: 'ระบบค้นหาที่ทันสมัย พร้อมตัวกรองตามสาขาวิชา จังหวัด และประเภทธุรกิจ'
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      title: 'จับคู่แม่นยำ',
      description: 'ระบบจับคู่อัจฉริยะวิเคราะห์โปรไฟล์และความต้องการของคุณเพื่อแนะนำที่ฝึกงานที่เหมาะสม'
    },
    {
      icon: <TeamOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      title: 'เครือข่ายกว้าง',
      description: 'เชื่อมต่อกับบริษัทมากกว่า 650 แห่งทั่วประเทศ ครอบคลุมทุกประเภทธุรกิจ'
    }
  ];
// Career guidance articles data
  const careerArticles = [
    {
      id: 1,
      title: '"เด็กจบใหม่" เริ่มต้นหางานยังไงดี ?',
      subtitle: 'เรื่องสำคัญสำหรับบอกใครหลายคน',
      image: '/api/placeholder/300/200',
      type: 'article',
      category: 'การหางาน'
    },
    {
      id: 2,
      title: 'สายงาน Creator เริ่มต้นอย่างไร?',
      subtitle: 'แนะนำการถูกสายพร้อมคำแนะนำที่ดี',
      image: '/api/placeholder/300/200',
      type: 'video',
      category: 'อาชีพใหม่'
    },
    {
      id: 3,
      title: '10 พฤติกรรมที่ไม่ควรทำในการสัมภาษณ์งาน',
      subtitle: '',
      image: '/api/placeholder/300/200',
      type: 'article',
      category: 'การสัมภาษณ์'
    },
    {
      id: 4,
      title: 'สิ่งของที่ไม่ควรนำไปสัมภาษณ์งาน',
      subtitle: 'รับอ่านเลย',
      image: '/api/placeholder/300/200',
      type: 'article',
      category: 'การสัมภาษณ์'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CoopMatchHeaderDefault />
      <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>COOP MATCH</Title>
          <Button
            type="primary"
            danger
            onClick={handleLogout}
            style={{ borderRadius: 20, padding: '0 20px' }}
          >
            ออกจากระบบ
          </Button>
        </div>
      </Header>

      <Content style={{ padding: 24 }}>
        <div
          style={{
            //background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6, #9270e4ff)',
            color: '#fff',
            borderRadius: 24,
            padding: 48,
            marginBottom: 32,
            textAlign: 'center',
            transition: 'all 0.5s ease-out',
            opacity: animated ? 1 : 0,
            transform: animated ? 'translateY(0)' : 'translateY(30px)',
          }}
        >
          <Title style={{ color: '#fff' }}>ยินดีต้อนรับสู่ COOP MATCH</Title>
          <Paragraph style={{ fontSize: 18, color: '#f0f0f0' }}>
            แพลตฟอร์มเชื่อมต่อนักศึกษากับบริษัท เพื่อการฝึกงานที่มีคุณภาพ
          </Paragraph>
          <div style={{ marginTop: 24 }}>
            <Button
              icon={<SearchOutlined />}
              onClick={handleSearchClick}
              style={{
                marginRight: 16,
                background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                color: '#fff',
                borderRadius: 24,
                padding: '8px 24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              ค้นหาที่ฝึกงาน
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={handleProfileClick}
              style={{
                background: '#fff',
                color: '#3b82f6',
                borderRadius: 24,
                padding: '8px 24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              สร้างโปรไฟล์
            </Button>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {statistics.map((stat, index) => (
            <Col key={index} xs={24} sm={12} md={12} lg={6}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ marginBottom: 12 }}>{stat.icon}</div>
                <Title level={4}>{stat.value.toLocaleString()}</Title>
                <Paragraph>{stat.title}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Steps Section */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 36, marginTop: 48, marginBottom: 48, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 36 }}>วิธีการใช้งาน</Title>
          <Row gutter={[24, 24]} justify="center">
            {steps.map((step, index) => (
              <Col key={index} xs={24} sm={12} lg={6}>
                <Card hoverable style={{ textAlign: 'center', borderRadius: 16, transition: 'transform 0.3s' }}>
                  <div style={{ marginBottom: 16 }}>{step.icon}</div>
                  <Title level={4}>{step.title}</Title>
                  <Paragraph>{step.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
 {/* New Career Guidance Section */}
        <div style={{ background: '#fff', padding: 36, borderRadius: 24, marginBottom: 48, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Title level={2} style={{ marginBottom: 8 }}>อัพเดทบทความสาระ</Title>
            <Paragraph style={{ fontSize: 16, color: '#666' }}>
              รวบการความสาระต่างๆ ทั่วไป เช่น ข้อมูลของอาชีพต่างๆ เทคนิคการทำงาน และการสัมภาษณ์งาน เป็นต้น
            </Paragraph>
          </div>
          
          <Row gutter={[24, 24]} justify="center">
            {careerArticles.map((article) => (
              <Col key={article.id} xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  bodyStyle={{ padding: 0 }}
                >
                  <div style={{ position: 'relative', height: 200 }}>
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(45deg, ${
                          article.id === 1 ? '#ff6b6b, #ffa726' :
                          article.id === 2 ? '#4c63d2, #7c4dff' :
                          article.id === 3 ? '#26a69a, #42a5f5' :
                          '#66bb6a, #42a5f5'
                        })`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 48
                      }}
                    >
                      {article.type === 'video' ? <PlayCircleOutlined /> : <ReadOutlined />}
                    </div>
                    {/* Category Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'rgba(255,255,255,0.9)',
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#333'
                      }}
                    >
                      {article.category}
                    </div>
                  </div>
                  
                  <div style={{ padding: 16 }}>
                    <Title level={5} style={{ marginBottom: 8, fontSize: 14, lineHeight: 1.4 }}>
                      {article.title}
                    </Title>
                    {article.subtitle && (
                      <Paragraph style={{ margin: 0, fontSize: 12, color: '#666' }}>
                        {article.subtitle}
                      </Paragraph>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        <div style={{ background: '#fff', padding: 36, borderRadius: 24, marginBottom: 48, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>เกี่ยวกับเรา</Title>
          <Paragraph style={{ fontSize: 16, textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
            COOP MATCH เป็นแพลตฟอร์มสำหรับนักศึกษาหาที่ฝึกงานในบริษัท ที่เชื่อมต่อนักศึกษากับโอกาสการฝึกงานที่เหมาะสมกับสาขาวิชาและความสนใจ 
            ด้วยเทคโนโลยีที่ช่วยจับคู่ข้อมูลอย่างแม่นยำ เพื่อให้นักศึกษาได้รับประสบการณ์การทำงานจริงที่มีคุณภาพ
          </Paragraph>
        </div>
        <Row gutter={[32, 32]} style={{ marginBottom: 48 }}>
          <Col xs={24} lg={12}>
            <Card title="ประเภทธุรกิจยอดนิยม" bordered={false} style={{ borderRadius: 24 }}>
              {popularCoopTypes.map((type, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontWeight: 500 }}>{type.name}</span>
                  <span style={{ color: '#888' }}>{type.count} แห่ง</span>
                </div>
              ))}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="ข่าวสารและประกาศ" bordered={false} style={{ borderRadius: 24 }}>
              {news.map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{item.date} • {item.type}</div>
                </div>
              ))}
            </Card>
          </Col>
        </Row>

        {/* Features Section */}
        <div style={{ background: '#fff', padding: 36, borderRadius: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 36 }}>ทำไมต้องเลือก COOP MATCH?</Title>
          <Row gutter={[24, 24]} justify="center">
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <Card hoverable style={{ textAlign: 'center', borderRadius: 16 }}>
                  <div style={{ marginBottom: 16 }}>{feature.icon}</div>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph>{feature.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default StudentDashboard;
