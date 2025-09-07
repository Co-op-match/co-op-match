import { useEffect, useState } from 'react';
import { Button, Card, Layout, Row, Col, Typography, message, Modal, Collapse } from 'antd';
import { UserOutlined, TeamOutlined, CheckCircleOutlined, FileTextOutlined, SearchOutlined, TrophyOutlined, ReadOutlined} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
const { Content } = Layout;
const { Title, Paragraph } = Typography;
import CoopMatchHeaderDefault from '../Component/Coop_MatchHeader';
import { GetAllCompany, GetIntershipPost, GetAllStudent } from '../../services/https';
import { ListPublishedCareer, ListPublishedNews } from '../../services/https/Articles';
import { GetAllInterviewAppointments } from '../../services/https/Application';
import type { CompanyInterface } from '../../interfaces/Company';
import type { IntershipPostInterface } from '../../interfaces/IntershipPost';
import type { StudentInterface } from '../../interfaces/Student';
import type { InterviewAppointmentInterface } from '../../interfaces/InterviewAppointment';
import type { Article } from '../../interfaces/Article';
import type { AxiosResponse } from 'axios';
import { Search, FileText, Clock, Mail, Briefcase, Edit3 } from "lucide-react";

function StudentDashboard() {
  const [animated, setAnimated] = useState(false);
  const [messageApi] = message.useMessage();
  const [company, setCompany] = useState<CompanyInterface[]>([]);
  const [posts, setPosts] = useState<IntershipPostInterface[]>([]);
  const [student, setStudent] = useState<StudentInterface[]>([]);
  const [appointments, setAppointments] = useState<InterviewAppointmentInterface[]>([]);
  const [newsItems, setNewsItems] = useState<Article[]>([]);
  const [careerItems, setCareerItems] = useState<Article[]>([]);
  // 🆕 Modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  // 🆕 Copy tooltip state
  const [copied, setCopied] = useState<"success" | "error" | null>(null);

  const handleCopyAll = () => {
    if (!navigator.clipboard || !selectedArticle) return;
    let fullContent = selectedArticle.title || "";
    if (selectedArticle.subtitle) fullContent += "\n\n" + selectedArticle.subtitle;
    if (selectedArticle.body) fullContent += "\n\n" + selectedArticle.body;
    if (selectedArticle.category) fullContent += "\n\nหมวดหมู่: " + selectedArticle.category;
    if (selectedArticle.published_at) {
      const publishedDate = new Date(selectedArticle.published_at).toLocaleDateString("th-TH", {day: "numeric",month: "long",year: "numeric",});
      fullContent += "\nวันที่เผยแพร่: " + publishedDate;
    }
    navigator.clipboard
      .writeText(fullContent)
      .then(() => { setCopied("success"); setTimeout(() => setCopied(null), 2500); })
      .catch(() => { setCopied("error"); setTimeout(() => setCopied(null), 2500); });
  };

  const openArticleDetail = (a: Article) => { setSelectedArticle(a); setDetailOpen(true); };
  const closeArticleDetail = () => { setDetailOpen(false); setSelectedArticle(null); };

  const navigate = useNavigate();
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);
  const handleSearchClick = () => { navigate('/student/search'); };
  const handleProfileClick = () => { navigate('/student/profile'); };

  const fetchInitialData = async () => {
    const isOk = (r: PromiseSettledResult<AxiosResponse<any>>): r is PromiseFulfilledResult<AxiosResponse<any>> =>
      r.status === "fulfilled" && r.value?.status === 200;

    const results = await Promise.allSettled<AxiosResponse<any>>([
      GetAllCompany(),
      GetAllStudent(),
      GetIntershipPost(),
      GetAllInterviewAppointments(),
      ListPublishedNews(),
      ListPublishedCareer(),
    ]);
    const [companyRes, studentRes, postRes, appointmentRes, newsRes, careerRes] = results;

    if (isOk(companyRes)) setCompany(companyRes.value.data);
    if (isOk(studentRes)) setStudent(studentRes.value.data);
    if (isOk(postRes)) setPosts(postRes.value.data);
    if (isOk(appointmentRes)) setAppointments(appointmentRes.value.data);
    if (isOk(newsRes)) setNewsItems(newsRes.value.data);
    if (isOk(careerRes)) setCareerItems(careerRes.value.data);

    const fails: string[] = [];
    if (!isOk(companyRes)) fails.push("บริษัท");
    if (!isOk(studentRes)) fails.push("นักศึกษา");
    if (!isOk(postRes)) fails.push("ตำแหน่งฝึกงาน");
    if (!isOk(appointmentRes)) fails.push("นัดสัมภาษณ์");
    if (!isOk(newsRes)) fails.push("ข่าว");
    if (!isOk(careerRes)) fails.push("บทความ");
    if (fails.length) messageApi.error(`โหลดข้อมูลบางส่วนไม่สำเร็จ: ${fails.join(", ")}`);
  };

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => {
    console.log("📦 Companies:", company);
    console.log("📦 Posts:", posts);
    console.log("📦 Students:", student);
    console.log("📦 Appointments:", appointments);
  }, [company, posts, student, appointments]);

  const statistics = [
    { title: 'นักศึกษาที่ลงทะเบียน', value: student.length, icon: <UserOutlined style={{ fontSize: 28, color: '#1890ff' }} /> },
    { title: 'บริษัทที่เปิดรับฝึกงาน', value: company.length, icon: <TeamOutlined style={{ fontSize: 28, color: '#52c41a' }} /> },
    { title: 'นักศึกษาได้ที่ฝึกงาน', value: appointments.filter(app => app.status === "ผ่าน").length, icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#faad14' }} /> },
    { title: 'ตำแหน่งฝึกงานเปิดรับ', value: posts.filter(p => p.StatusPostID == 1).length, icon: <FileTextOutlined style={{ fontSize: 28, color: '#f5222d' }} /> },
  ];

  const steps = [
    { title: 'ลงทะเบียน', description: 'สร้างโปรไฟล์นักศึกษาและใส่ข้อมูลการศึกษา', icon: <UserOutlined style={{ fontSize: 28, color: '#1890ff' }} /> },
    { title: 'ค้นหาที่ฝึกงาน', description: 'เลือกบริษัทที่เปิดรับนักศึกษาฝึกงาน', icon: <SearchOutlined style={{ fontSize: 28, color: '#52c41a' }} /> },
    { title: 'สมัครฝึกงาน', description: 'ส่งใบสมัครและเอกสารที่จำเป็น', icon: <FileTextOutlined style={{ fontSize: 28, color: '#faad14' }} /> },
    { title: 'เริ่มฝึกงาน', description: 'เข้าฝึกงานและเรียนรู้ประสบการณ์จริง', icon: <TrophyOutlined style={{ fontSize: 28, color: '#722ed1' }} /> },
  ];

  const features = [
    { icon: <SearchOutlined style={{ fontSize: 32, color: '#3b82f6' }} />, title: 'ค้นหาง่าย', description: 'ระบบค้นหาที่ทันสมัย พร้อมตัวกรองตามหมวดหมู่งาน จังหวัด และสวัสดิการ' },
    { icon: <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />, title: 'จับคู่แม่นยำ', description: 'ระบบจับคู่อัจฉริยะวิเคราะห์โปรไฟล์และความต้องการของคุณเพื่อแนะนำที่ฝึกงานที่เหมาะสม' },
    { icon: <TeamOutlined style={{ fontSize: 32, color: '#faad14' }} />, title: 'เครือข่ายกว้าง', description: `เชื่อมต่อกับบริษัทมากกว่า ${company.length.toLocaleString()} แห่งทั่วประเทศ ครอบคลุมทุกประเภทธุรกิจ`},
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CoopMatchHeaderDefault />
      <Content style={{ padding: 24 }}>
        {/* 1) Hero + CTA */}
        <div
          style={{
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
          <Title style={{ color: '#fff' }}>COOP MATCH เพื่อนคู่ใจเรื่องฝึกงาน</Title>
          <Paragraph style={{ fontSize: 18, color: '#f0f0f0' }}>
            แหล่งรวมที่ฝึกงานดี ๆ สำหรับนักศึกษา
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

        {/* 2) Stats */}
        <Row gutter={[24, 24]}>
          {statistics.map((stat, index) => (
            <Col key={index} xs={24} sm={12} md={12} lg={6}>
              <Card hoverable style={{ borderRadius: 16, textAlign: 'center', transition: 'all 0.3s ease' }}>
                <div style={{ marginBottom: 12 }}>{stat.icon}</div>
                <Title level={4}>{stat.value.toLocaleString()}</Title>
                <Paragraph>{stat.title}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 3) Steps */}
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

        {/* 4) News & Announcements */}
        <Card
          bordered={false}
          bodyStyle={{ paddingBottom: 48 }} // ✅ เว้นท้ายการ์ดข่าว
          style={{ borderRadius: 24, marginBottom: 48 }}
          title={
            <div style={{ textAlign: "center", marginTop: 36 }}>
              <Title level={3} style={{ marginBottom: 8 }}> ข่าวสารและประกาศ </Title>
              <Paragraph
                style={{ fontSize: 16, color: "#666", marginBottom: 36, fontWeight: 400 }}
              >
                อัปเดตข่าวสารและประกาศสำคัญสำหรับนักศึกษาที่หาที่ฝึกงาน
              </Paragraph>
            </div>
          }
        >
          {newsItems.length === 0 ? (
            <div style={{ color: "#999", textAlign: "center" }}>ยังไม่มีข่าว</div>
          ) : (
            <Row gutter={[16, 16]}>
              {newsItems.map((item) => (
                <Col xs={24} md={12} key={item.ID}>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      transition: "background .2s",
                      borderBottom: "1px solid #e5e7eb",
                      marginBottom: -10,
                      cursor: "pointer",
                    }}
                    onClick={() => openArticleDetail(item)}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f7f9ff")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                  >
                    <div style={{ fontWeight: 500, fontSize: 15, color: "#1f2937" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      {item.published_at
                        ? new Date(item.published_at).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}{" "}
                      • {item.category || "ข่าว"}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Card>

        {/* 5) Career Guidance (Tips & Tricks) */}
        <div style={{ background: '#fff', padding: 36, borderRadius: 24, marginBottom: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Title level={3} style={{ marginBottom: 8 }}>Tips & Tricks ฝึกงานให้ปัง</Title>
            <Paragraph style={{ fontSize: 16, color: '#666', marginBottom: 8}}>
              ไอเดียและประสบการณ์ที่จะทำให้การฝึกงานของคุณไม่ธรรมดา
            </Paragraph>
          </div>
          <Row gutter={[24, 24]} justify="center">
            {careerItems.length === 0 ? (
              <div style={{ color: "#999" }}>ยังไม่มีบทความ</div>
            ) : (
              careerItems.map((article, index) => {
                const colors = [
                  "linear-gradient(135deg, #667eea, #764ba2)",
                  "linear-gradient(135deg, #ff9a9e, #fad0c4)",
                  "linear-gradient(135deg, #43cea2, #185a9d)",
                  "linear-gradient(135deg, #ff6a00, #ee0979)",
                  "linear-gradient(135deg, #36d1dc, #5b86e5)",
                  "linear-gradient(135deg, #f7971e, #ffd200)",
                ];
                const randomColor = colors[(article.ID ?? index) % colors.length];

                return (
                  <Col key={article.ID} xs={24} sm={12} lg={6}>
                    <Card
                      hoverable
                      onClick={() => openArticleDetail(article)}
                      style={{ borderRadius: 16, overflow: "hidden", cursor: "pointer" }}
                      bodyStyle={{ padding: 0 }}
                    >
                      <div
                        style={{
                          position: "relative",
                          height: 200,
                          background: randomColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 64,
                        }}
                      >
                        {article.type === "news" ? <FileTextOutlined /> : <ReadOutlined />}
                        <div
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            background: "rgba(255,255,255,0.9)",
                            padding: "4px 12px",
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#333",
                          }}
                        >
                          {article.category || "ทั่วไป"}
                        </div>
                      </div>
                      <div style={{ padding: 16 }}>
                        <Title level={5} style={{ marginBottom: 8 }}>{article.title}</Title>
                        {article.subtitle && (
                          <Paragraph style={{ margin: 0, fontSize: 12, color: "#666" }}>
                            {article.subtitle}
                          </Paragraph>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })
            )}
          </Row>
        </div>

        {/* 6) Features */}
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

        {/* 7) FAQ */}
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            marginTop: 48,
            marginBottom: 48,
            padding: 24,
          }}
        >
          <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
            คำถามที่พบบ่อย (FAQ)
          </Title>
          <Row gutter={[24, 24]} justify="center">
            {/* ซ้าย */}
            <Col xs={24} md={12}>
              <Collapse
                bordered={false}
                size="large"
                expandIconPosition="end"
                style={{ background: "transparent" }}
                items={[
                  {
                    key: "1",
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Search size={18} strokeWidth={2} color="#3b82f6" />
                        <span style={{ color: "#1f2937", fontWeight: 500 }}>
                          วิธีค้นหาที่ฝึกงาน?
                        </span>
                      </span>
                    ),
                    children: (
                      <Paragraph style={{ marginBottom: 0, color: "#475569" }}>
                        ไปที่เมนู <b>ค้นหางาน</b> เลือกตัวกรอง เช่น หมวดหมู่งาน จังหวัด 
                        หรือพิมพ์ตำแหน่งงานในช่องค้นหา
                      </Paragraph>
                    ),
                  },
                  {
                    key: "2",
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Briefcase size={18} strokeWidth={2} color="#3b82f6" />
                        <span style={{ color: "#1f2937", fontWeight: 500 }}>
                          สมัครได้กี่บริษัท?
                        </span>
                      </span>
                    ),
                    children: (
                      <Paragraph style={{ marginBottom: 0, color: "#475569" }}>
                        สมัครได้หลายบริษัท แต่ควรเลือกที่สนใจจริงและตรงกับสาขา
                        เพื่อเพิ่มโอกาสผ่านการคัดเลือก
                      </Paragraph>
                    ),
                  },
                  {
                    key: "3",
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={18} strokeWidth={2} color="#3b82f6" />
                        <span style={{ color: "#1f2937", fontWeight: 500 }}>
                          เอกสารที่ต้องใช้?
                        </span>
                      </span>
                    ),
                    children: (
                      <ul style={{ marginLeft: 18, color: "#475569" }}>
                        <li>เรซูเม่ (Resume)</li>
                        <li>ใบแสดงผลการเรียน (Transcript)</li>
                        <li>แฟ้มสะสมผลงาน (ถ้ามี)</li>
                        <li>เอกสารอื่นๆ ที่บริษัทกำหนด</li>
                      </ul>
                    ),
                  },
                ]}
              />
            </Col>
            {/* ขวา */}
            <Col xs={24} md={12}>
              <Collapse
                bordered={false}
                size="large"
                expandIconPosition="end"
                style={{ background: "transparent" }}
                items={[
                  {
                    key: "4",
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Clock size={18} strokeWidth={2} color="#3b82f6" />
                        <span style={{ color: "#1f2937", fontWeight: 500 }}>
                          ใช้เวลาพิจารณานานไหม?
                        </span>
                      </span>
                    ),
                    children: (
                      <Paragraph style={{ marginBottom: 0, color: "#475569" }}>
                        โดยทั่วไปบริษัทใช้เวลา <b>1–3 สัปดาห์</b> สามารถติดตามสถานะได้ที่ <b>ประวัติการสมัคร</b>
                      </Paragraph>
                    ),
                  },
                  {
                    key: "5",
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Edit3 size={18} strokeWidth={2} color="#3b82f6" />
                        <span style={{ color: "#1f2937", fontWeight: 500 }}>
                          จำเป็นต้องมีประสบการณ์ทำงานมาก่อนหรือไม่?
                        </span>
                      </span>
                    ),
                    children: (
                      <Paragraph style={{ marginBottom: 0, color: "#475569" }}>
                        ไม่มีประสบการณ์ก็สมัครได้ ขอแค่มีความตั้งใจ
                      </Paragraph>
                    ),
                  },
                  {
                    key: "6",
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Mail size={18} strokeWidth={2} color="#3b82f6" />
                        <span style={{ color: "#1f2937", fontWeight: 500 }}>
                          ถ้าได้รับการเรียกสัมภาษณ์ จะได้รับแจ้งอย่างไร?
                        </span>
                      </span>
                    ),
                    children: (
                      <Paragraph style={{ marginBottom: 0, color: "#475569" }}>
                        ระบบจะแจ้งเตือนผ่านแพลตฟอร์ม และส่งอีเมลไปยังนักศึกษาโดยตรง
                      </Paragraph>
                    ),
                  },
                ]}
              />
            </Col>
          </Row>
        </div>

        {/* 8) About Us */}
        <div style={{ background: '#fff', padding: 36, borderRadius: 24, marginBottom: 48, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>เกี่ยวกับเรา</Title>
          <Paragraph style={{ fontSize: 16, textAlign: 'center', maxWidth: 990, margin: '0 auto' }}>
            COOP MATCH เป็นแพลตฟอร์มสำหรับนักศึกษาหาที่ฝึกงานในบริษัท ที่เชื่อมต่อนักศึกษากับโอกาสการฝึกงานที่เหมาะสมกับสาขาวิชาและความสนใจ 
            ด้วยเทคโนโลยีที่ช่วยจับคู่ข้อมูลอย่างแม่นยำ เพื่อให้นักศึกษาได้รับประสบการณ์การทำงานจริงที่มีคุณภาพ
          </Paragraph>
        </div>

        {/* 🧩 Modal วางท้ายสุดของ Content */}
        <Modal
          open={detailOpen}
          onCancel={closeArticleDetail}
          footer={null}
          width={600}
          centered
          style={{ padding: 0 }}
          closable={false}
        >
          {selectedArticle && (
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  height: 120,
                  background:
                    selectedArticle.type === 'news'
                      ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                      : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 24px',
                  color: '#fff',
                }}
              >
                {/* Icon & Type */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 32 }}>{selectedArticle.type === 'news' ? '📰' : '📚'}</div>
                  <div>
                    <div style={{ fontSize: 14, opacity: 0.8 }}>
                      {selectedArticle.type === 'news' ? 'ข่าวสาร' : 'บทความ'}
                    </div>
                    {selectedArticle.category && (
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{selectedArticle.category}</div>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={closeArticleDetail}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 10px rgba(0,0,0,0.25)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseDown={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px) scale(0.9)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                  }}
                  onMouseUp={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 10px rgba(0,0,0,0.25)';
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px 0', color: '#1f2937', lineHeight: 1.3 }}>
                  {selectedArticle.title}
                </h3>

                {selectedArticle.published_at && (
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📅</span>
                    {new Date(selectedArticle.published_at).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}

                {/* Subtitle */}
                {selectedArticle.subtitle && (
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '16px',
                      borderRadius: 8,
                      marginBottom: 16,
                      borderLeft: `3px solid ${selectedArticle.type === 'news' ? '#3b82f6' : '#7c3aed'}`,
                      fontSize: 15,
                      color: '#475569',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                    }}
                  >
                    {selectedArticle.subtitle}
                  </div>
                )}

                {/* Content */}
                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 20 }}>
                  {selectedArticle.body ? (
                    <div style={{ fontSize: 15, lineHeight: 1.6, color: '#374151', whiteSpace: 'pre-wrap' }}>
                      {selectedArticle.body}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: 14 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                      ไม่มีเนื้อหา
                    </div>
                  )}
                </div>

                {/* Footer Actions - Compact */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                  {/* Status */}
                  {selectedArticle.is_published !== undefined && (
                    <span
                      style={{
                        fontSize: 13,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: selectedArticle.is_published ? '#dcfce7' : '#fef2f2',
                        color: selectedArticle.is_published ? '#16a34a' : '#dc2626',
                        fontWeight: 500,
                      }}
                    >
                      {selectedArticle.is_published ? 'เผยแพร่' : 'ร่าง'}
                    </span>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* ปุ่มคัดลอก + แจ้งเตือนติดปุ่ม */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={handleCopyAll}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: '1px solid #d1d5db',
                          background: '#fff',
                          color: '#374151',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 14px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                        }}
                        onMouseDown={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px) scale(0.97)';
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                        onMouseUp={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 14px rgba(0,0,0,0.15)';
                        }}
                      >
                        📋 คัดลอกทั้งหมด
                      </button>
                      {copied && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-36px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '6px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            background: copied === 'success' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#ef4444',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {copied === 'success' ? '✅ คัดลอกเนื้อหาแล้ว' : '❌ คัดลอกไม่สำเร็จ'}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={closeArticleDetail}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 8,
                        border: 'none',
                        background: selectedArticle?.type === 'news' ? '#3b82f6' : '#7c3aed',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        transition: 'all 0.25s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.05)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                    >
                      ปิด
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
}

export default StudentDashboard;
