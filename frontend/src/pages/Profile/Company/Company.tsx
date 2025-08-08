import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Avatar,
  Card,
  Descriptions,
  List,
  Typography,
  Rate,
  Badge,
  Divider,
  Progress,
  Row,
  Col,
  Tag,
  message,
} from "antd";
import { 
  EditOutlined, 
  EnvironmentOutlined, 
  UserOutlined, 
  StarFilled,
  CommentOutlined,
  LikeOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { GetCompanyByUserId, GetRwviewCompanyByUserId, GetVerifyByUserId, UpdateCompanyLogo } from "../../../services/https";
import CompanyHeader from "../../Component/CompanyHeader";
import type { CompanyInterface } from "../../../interfaces/Company";
import "./CompanyProfile.css";
import CompanyCalendarCard from "./CompanyCalendar";
import EditProfileCompanyModal from "./Edit/Popup";


const { Content } = Layout;
const { Text} = Typography;

interface ReviewResponse {
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
  position: string;
  image_url : string;
  tags: string[];
  helpful: number;
  student_id: number;
}


const CompanyProfile: React.FC = () => {
  const [company, setCompany] = useState<CompanyInterface | undefined>(undefined);
  const [verifyStatus, setVerifyStatus] = useState<string>("ยังไม่ได้ส่งคำขอ");
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const totalReviews = useMemo(() => reviews.length, [reviews]);
  const [editSection, setEditSection] = useState<"contact" | "address" | null>(null);

  

  const userId = localStorage.getItem("id");
  const [uploadingLogo, setUploadingLogo] = useState(false);

const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("logo", file);

  try {
    setUploadingLogo(true);
    const res = await UpdateCompanyLogo(Number(userId), formData);
    if (res?.status === 200) {
      message.success("อัปเดตโลโก้เรียบร้อยแล้ว");
      // โหลดข้อมูลใหม่
      const updated = await GetCompanyByUserId(Number(userId));
      setCompany(updated);
    } else {
      message.error("อัปเดตโลโก้ไม่สำเร็จ");
    }
  } catch (error) {
    message.error("เกิดข้อผิดพลาดในการอัปโหลดโลโก้");
  } finally {
    setUploadingLogo(false);
  }
};

  // const reviews = [
  //   { 
  //     reviewer: "ณัฐพล สายใจ", 
  //     rating: 5, 
  //     comment: "ประสบการณ์ดีมาก ได้เรียนรู้งานจริงจากพี่ๆ ทีมงานเป็นกันเอง และได้รับการดูแลเป็นอย่างดี สิ่งที่ได้เรียนรู้นำไปใช้ในการทำงานจริงได้มาก",
  //     date: "2024-01-15",
  //     position: "Software Developer Intern",
  //     helpful: 12,
  //     tags: ["เรียนรู้ได้เยอะ", "ทีมงานดี", "ประสบการณ์ดี"]
  //   },
  //   { 
  //     reviewer: "ศิริพร ใจดี", 
  //     rating: 4, 
  //     comment: "บริษัทดูแลดี ได้ลองทำโปรเจกต์จริง แต่อาจจะยุ่งหน่อยในช่วงแรก พี่ๆ ช่วยเหลือดีมาก มีโอกาสได้ทำงานในหลายแผนก",
  //     date: "2024-01-08",
  //     position: "Marketing Intern",
  //     helpful: 8,
  //     tags: ["โปรเจกต์จริง", "หลากหลาย", "พี่ๆ ช่วยเหลือดี"]
  //   },
  //   { 
  //     reviewer: "วิชญ์ พงษ์ศักดิ์", 
  //     rating: 5, 
  //     comment: "สุดยอดมาก! ได้ทำงานกับเทคโนโลยีใหม่ๆ บรรยากาศการทำงานดี มีการอบรมให้ความรู้เป็นระบบ และได้เงินเดือนที่เหมาะสม",
  //     date: "2023-12-20",
  //     position: "Data Science Intern",
  //     helpful: 15,
  //     tags: ["เทคโนโลยีใหม่", "อบรมดี", "เงินเดือนดี"]
  //   }
  // ];


useEffect(() => {
  async function fetchReviews() {
    try {
      const res = await GetRwviewCompanyByUserId(Number(userId));
      const data: ReviewResponse[] = res?.data ?? [];

      console.log("📦 ได้รีวิว:", data);

      setReviews(data);

      if (data.length > 0) {
        const total = data.reduce((sum, r) => sum + r.rating, 0);
        const avg = total / data.length;
        setAverageRating(avg);

        const counts = [0, 0, 0, 0, 0];
        data.forEach((r) => {
          if (r.rating >= 1 && r.rating <= 5) {
            counts[5 - r.rating] += 1;
          }
        });

        console.log("⭐ ratingCounts:", counts);
        console.log("📊 averageRating:", avg.toFixed(1));

        setRatingCounts(counts);
      } else {
        // ไม่มีรีวิว → reset ค่า
        setAverageRating(0);
        setRatingCounts([0, 0, 0, 0, 0]);
      }

    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
      setReviews([]); // fallback ป้องกัน error ใน render
      setAverageRating(0);
      setRatingCounts([0, 0, 0, 0, 0]);
    }
  }

  fetchReviews();
}, [userId]);


  useEffect(() => {
    const loadCompany = async () => {
      const userIdString = localStorage.getItem("id");
      if (userIdString) {
        const userId = Number(userIdString);
        try {
          const companyData = await GetCompanyByUserId(userId);
          setCompany(companyData);

          const verifyData = await GetVerifyByUserId(userId);
          console.log(verifyData)
          if (verifyData?.StatusVerify?.status_verify) {
            setVerifyStatus(verifyData.StatusVerify.status_verify);
          } else {
            setVerifyStatus("ยังไม่ได้ส่งคำขอ");
          }
        } catch (error) {
          console.error("โหลดข้อมูลล้มเหลว:", error);
        }
      }
    };

    loadCompany();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
const onEditSection = (section: "contact" | "address") => {
  setEditSection(section);
};

  return (
    <Layout>
      <CompanyHeader />
      <Layout className="company-layout">
        <Content>
          <div className="company-profile-title">
            <span className="company-profile-text">Company Profile</span>
            <div className="company-profile-line" />
          </div>

          {/* TOP: Company Info */}
          <div className="company-main-section">
            <Card className="company-profile-card">
              <div className="company-profile-container">
                <div className="company-profile-left">
                  <div className="company-logo-container">
                    <label style={{ cursor: "pointer" }}>
                      <Avatar
                        src={company?.logo ? `http://localhost:8000${company.logo}` : undefined}
                        size={120}
                        icon={!company?.logo ? <UserOutlined /> : undefined}
                        style={{ border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleLogoUpload}
                      />
                    </label>
                    <label className="company-logo-edit-icon" title="เปลี่ยนโลโก้บริษัท">
                      <EditOutlined />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleLogoUpload}
                      />
                    </label>

                    {uploadingLogo && <div className="uploading-overlay">กำลังอัปโหลด...</div>}
                  </div>
                  <p className="company-name">{company?.company_name}</p>
                  <Badge
                    className="verify-badge"
                    status={
                      verifyStatus === "รับรอง"
                        ? "success"
                        : verifyStatus === "รอรับรอง"
                        ? "processing"
                        : verifyStatus === "ปฏิเสธ"
                        ? "error"
                        : "default"
                    }
                    text={`สถานะการรับรอง: ${verifyStatus}`}
                  />
                </div>

                <div className="company-profile-details">
                  <div className="section-header">
                    <h4><UserOutlined style={{ color: "#0d47a1" }} /> ข้อมูลติดต่อ</h4>
                    <button className="edit-profile-button" onClick={() => onEditSection("contact")}>
                      <EditOutlined /> แก้ไข
                    </button>
                  </div>
                  <Descriptions column={3}>
                    <Descriptions.Item label="เว็บไซต์">{company?.Contact?.website || "-"}</Descriptions.Item>
                    <Descriptions.Item label="ไลน์">{company?.Contact?.line || "-"}</Descriptions.Item>
                    <Descriptions.Item label="เบอร์">{company?.Contact?.phone_number || "-"}</Descriptions.Item>
                    <Descriptions.Item label="เฟสบุ๊ค">{company?.Contact?.facebook || "-"}</Descriptions.Item>
                    <Descriptions.Item label="อีเมล">{company?.Contact?.email || "-"}</Descriptions.Item>
                  </Descriptions>

                  <div className="section-header">
                    <h4><EnvironmentOutlined style={{ color: "#0d47a1" }} /> ที่อยู่</h4>
                    <button  className="edit-profile-button" onClick={() => onEditSection("address")}>
                      <EditOutlined /> แก้ไข
                    </button>
                  </div>
                  <Descriptions column={3}>
                    <Descriptions.Item label="บ้านเลขที่">{company?.Address?.house_number}</Descriptions.Item>
                    <Descriptions.Item label="หมู่บ้าน">{company?.Address?.village}</Descriptions.Item>
                    <Descriptions.Item label="ซอย">{company?.Address?.sub_street}</Descriptions.Item>
                    <Descriptions.Item label="ถนน">{company?.Address?.street}</Descriptions.Item>
                    <Descriptions.Item label="ตำบล">{company?.Address?.SubDistrict?.name_th}</Descriptions.Item>
                    <Descriptions.Item label="อำเภอ">{company?.Address?.District?.name_th}</Descriptions.Item>
                    <Descriptions.Item label="จังหวัด">{company?.Address?.Province?.name_th}</Descriptions.Item>
                    <Descriptions.Item label="รหัสไปรษณีย์">{company?.Address?.Postcode?.post_code}</Descriptions.Item>
                  </Descriptions>
                </div>
              </div>
            </Card>
          </div>

          {/* BOTTOM: Calendar + Reviews */}
          <div className="student-dashboard-section">
            <div className="application-list-wrapper">
          <Card 
            className="company-review-card" 
        style={{
          borderRadius: '12px',
          overflow: 'hidden'
        }}
        headStyle={{
          background: 'linear-gradient(135deg, #1890ff 0%, #0d47a1 100%)',
          borderBottom: 'none',
          height: '5px', // ✅ เพิ่มบรรทัดนี้เพื่อกำหนดความสูง
          display: 'flex', // ✅ ให้ title ตรงกลางแนวดิ่ง
          padding: '10px 14px',
          borderRadius: '12px 12px 0 0',
          position: 'relative',
          overflow: 'hidden'
        }}
        bodyStyle={{
          padding: '16px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fafcff 100%)'
                  }}
            title={
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                letterSpacing: '-0.2px',
                position: 'relative',
                zIndex: 1
              }}>
                <CommentOutlined style={{ 
                  color: '#ffffff',
                  fontSize: '18px',
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
                }} />
                <span>รีวิวจากนักศึกษา</span>
              </div>
            }
          >
            {/* สถิติรีวิวภาพรวม */}
<div 
  style={{ 
    marginBottom: '20px', 
    padding: '16px', 
    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafe 100%)',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(24, 144, 255, 0.08)',
    position: 'relative',
    overflow: 'hidden'
  }}
>
  {/* Decorative background pattern */}
  <div 
    style={{
      position: 'absolute',
      top: '-50%',
      right: '-20%',
      width: '200px',
      height: '200px',
      background: 'radial-gradient(circle, rgba(250, 173, 20, 0.05) 0%, transparent 70%)',
      borderRadius: '50%',
      pointerEvents: 'none'
    }}
  />
  
  <Row gutter={[16, 16]} align="middle" style={{ position: 'relative', zIndex: 1 }}>
    <Col span={8}>
      <div 
        style={{ 
          textAlign: 'center',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '8px',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 1px 6px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div 
          style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            background: 'linear-gradient(135deg, #faad14 0%, #ff9800 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '6px',
            lineHeight: 1
          }}
        >
          {averageRating.toFixed(1)}
        </div>
        <Rate 
          disabled 
          value={averageRating} 
          allowHalf 
          style={{ 
            fontSize: '16px',
            marginBottom: '6px'
          }}
        />
        <div 
          style={{ 
            color: '#666', 
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          จาก {totalReviews.toLocaleString()} รีวิว
        </div>
      </div>
    </Col>
    
    <Col span={16}>
      <div style={{ padding: '4px 0' }}>
        {[5, 4, 3, 2, 1].map((star, index) => (
          <div 
            key={star} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '8px',
              padding: '4px 6px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.backgroundColor = 'rgba(250, 173, 20, 0.04)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.backgroundColor = 'transparent';
            }}
          >
            <div 
              style={{ 
                width: '55px', 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '13px',
                fontWeight: '600',
                color: '#444'
              }}
            >
              <span>{star}</span>
              <StarFilled 
                style={{ 
                  color: '#faad14', 
                  marginLeft: '5px',
                  fontSize: '14px'
                }} 
              />
            </div>
            <Progress
              percent={totalReviews > 0 ? (ratingCounts[index] / totalReviews) * 100 : 0}
              showInfo={false}
              strokeColor={{
                '0%': '#faad14',
                '100%': '#ffd666'
              }}
              trailColor="rgba(0, 0, 0, 0.05)"
              strokeWidth={8}
              style={{ 
                flex: 1, 
                marginLeft: '10px', 
                marginRight: '10px'
              }}
            />
            <div style={{ minWidth: '35px', textAlign: 'right' }}>
              <div 
                style={{ 
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#333'
                }}
              >
                {ratingCounts[index]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Col>
  </Row>
</div>
            {totalReviews === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  ยังไม่มีรีวิวจากนักศึกษา
                </Text>
              </div>
            ) : (
              <>
                <Divider>รีวิวล่าสุด</Divider>

                <List
                  itemLayout="vertical"
                  dataSource={reviews}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <Row justify="space-between" align="top">
                          <Col>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <Avatar
                                src={item.image_url ? `http://localhost:8000${item.image_url}` : undefined}
                                size={35}
                                icon={!item.image_url ? <UserOutlined /> : undefined}
                              />
                              <Text strong style={{ fontSize: '16px' }}>{item.reviewer}</Text>
                              <Tag color="blue">{item.position}</Tag>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <Rate disabled defaultValue={item.rating} style={{ fontSize: '14px' }} />
                              <span style={{ color: '#666', fontSize: '12px' }}>
                                <CalendarOutlined style={{ marginRight: '4px' }} />
                                {formatDate(item.date)}
                              </span>
                            </div>
                          </Col>
                        </Row>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <Text style={{ lineHeight: '1.6', color: '#333' }}>{item.comment}</Text>
                      </div>

// ตอน render
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                      {(item.tags ?? []).map((tag, index) => (
                        <Tag key={index} color="green" style={{ fontSize: '11px' }}>
                          {tag}
                        </Tag>
                      ))}
                    </div>


                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#666' }}>
                        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <LikeOutlined />
                          มีประโยชน์ {item.helpful} คน
                        </span>
                      </div>
                    </List.Item>
                  )}
                />

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Text type="secondary">
                    แสดง {reviews.length} จาก {totalReviews} รีวิว
                  </Text>
                </div>
              </>
            )}
          </Card>

            </div>
            <div className="calendar-card-wrapper">
              <CompanyCalendarCard />
            </div>
          </div>
          {company && editSection && (
      <EditProfileCompanyModal
        open={!!editSection}
        section={editSection}
        initialData={company}
        onClose={() => {
          setEditSection(null);
          // reload company data after update
          const userIdString = localStorage.getItem("id");
          if (userIdString) {
            GetCompanyByUserId(Number(userIdString)).then(setCompany);
          }
        }}
      />
)}

        </Content>
      </Layout>
    </Layout>
  );
};

export default CompanyProfile;