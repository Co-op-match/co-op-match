import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Empty,
  Spin,
  Space,
  Tag,
  Layout,
} from "antd";
import {
  HeartFilled,
  UserOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { GetLikedPostsByStudentID, GetStudentByUserId } from "../../services/https";
import { useNavigate } from "react-router-dom";
import type { IntershipPostInterface } from "../../interfaces/IntershipPost";
const { Title, Text, Paragraph } = Typography;
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import CoopMatchHeaderDefault from '../Component/Coop_MatchHeader';

interface LikedPost {
  created_at: string | number | Date;
  ID: number;
  IntershipPost: IntershipPostInterface;
}

const LikedPosts: React.FC = () => {
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const uniquePosts = Array.from(
    new Map(likedPosts.map(item => [item.IntershipPost.ID, item])).values()
  );

  useEffect(() => {
    const fetchLikedPosts = async () => {
      const userId = localStorage.getItem("id");
      if (!userId) return;

      try {
        const studentRes = await GetStudentByUserId(Number(userId));
        const studentId = studentRes?.ID;
        if (!studentId) return;

        const res = await GetLikedPostsByStudentID(studentId);
        setLikedPosts(res.data);
      } catch (err) {
        console.error("❌ Error loading liked posts:", err);
        setLikedPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CoopMatchHeaderDefault />
      
      {/* Modern Minimalist Header */}
      <div style={{
        background: '#ffffffff',
        padding: '40px 24px 30px',
        borderBottom: '1px solid #f0f0f0',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            {/* Left side - Title and subtitle */}
            <div>
              <Title 
                level={2} 
                style={{ 
                  color: '#1f2937',
                  marginBottom: '8px',
                  fontSize: '32px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em'
                }}
              >
                โพสต์ที่คุณสนใจ
              </Title>
              <Text style={{ 
                color: '#6b7280',
                fontSize: '16px',
                fontWeight: 400
              }}>
                รวมโอกาสฝึกงานที่คุณได้บันทึกไว้ทั้งหมด
              </Text>
            </div>
            
            {/* Right side - Stats Badge */}
            {!loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                padding: '16px 24px',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ff4d4f 0%, #f5222d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <HeartFilled style={{ 
                    color: '#ffffff', 
                    fontSize: '18px'
                  }} />
                </div>
                <div>
                  <div style={{
                    color: '#1f2937',
                    fontSize: '20px',
                    fontWeight: 700,
                    lineHeight: 1
                  }}>
                    {uniquePosts.length}
                  </div>
                  <Text style={{
                    color: '#6b7280',
                    fontSize: '13px',
                    fontWeight: 500
                  }}>
                    โพสต์ที่สนใจ
                  </Text>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div style={{ 
        padding: "32px 24px",
        background: "#fafbfc",
        minHeight: "60vh"
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px 40px",
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #f3f4f6'
            }}>
              <Spin size="large" />
              <div style={{ marginTop: '20px' }}>
                <Text style={{ color: '#6b7280', fontSize: '15px' }}>
                  กำลังโหลดโพสต์ที่คุณสนใจ...
                </Text>
              </div>
            </div>
          ) : likedPosts.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px 40px",
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #f3f4f6'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HeartFilled style={{ 
                  color: '#ffffff', 
                  fontSize: '32px'
                }} />
              </div>
              <Title level={4} style={{ color: '#374151', marginBottom: '8px', fontWeight: 600 }}>
                ยังไม่มีโพสต์ที่สนใจ
              </Title>
              <Text style={{ color: '#6b7280', fontSize: '15px' }}>
                เริ่มค้นหาโอกาสฝึกงานและบันทึกโพสต์ที่คุณสนใจได้เลย
              </Text>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {uniquePosts.map((item) => {
                const job = item.IntershipPost;
                return (
                  <Col xs={24} sm={12} lg={8} key={item.ID}>
                    <Card
                      style={{
                        borderRadius: 16,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #f0f0f0',
                        overflow: 'hidden',
                        height: '100%',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      bodyStyle={{ padding: 0 }}
                      hoverable
                      onClick={() => navigate(`/student/post-student/${job.ID}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                    >
                      {/* Header with date and heart */}
                      <div style={{
                        padding: '16px 20px 12px',
                        borderBottom: '1px solid #f5f5f5',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Text style={{ 
                          color: '#999', 
                          fontSize: '13px' 
                        }}>
                          บันทึกเมื่อ : {dayjs(item.created_at).locale('th').format('D MMM YYYY เวลา HH:mm')}
                        </Text>
                        <HeartFilled style={{ color: '#ff4d4f', fontSize: '18px' }} />
                      </div>

                    {/* Company info */}
                      <div style={{ padding: '16px 20px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Logo */}
                          <div>
                            <img
                              src={
                                job.Company?.logo?.startsWith('http')
                                  ? job.Company.logo
                                  : job.Company?.logo
                                    ? `http://localhost:8000${job.Company.logo}`
                                    : undefined
                              }
                              alt={job.Company?.company_name || 'โลโก้บริษัท'}
                              style={{
                                height: '80px',
                                width: '80px',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                padding: 4,
                                border: '1px solid #bfc0c2ff' 
                              }}
                            />
                          </div>

                          {/* Company Info */}
                          <div>
                            <Title level={5} style={{ margin: 0, color: '#000', fontSize: '16px' }}>
                              {job.Company?.company_name || "ไม่ระบุชื่อบริษัท"}
                            </Title>
                            <Text style={{ color: '#999', fontSize: '13px' }}>
                              {job.Company?.Address?.Province?.name_th} - {job.Company?.Address?.District?.name_th}
                            </Text>
                          </div>
                        </div>
                      </div>

                      {/* Job title */}
                      <div style={{ padding: '0 20px 16px' }}>
                        <Title level={4} style={{ 
                          margin: 0, 
                          color: '#000', 
                          fontSize: '18px',
                          fontWeight: 600 
                        }}>
                          {job.post_name}
                        </Title>
                      </div>

                      {/* Tags */}
                      <div style={{ padding: '0 20px 16px' }}>
                        <Space size={8} wrap>
                          <Tag 
                            color={job.WorkMode?.work_mode === 'Remote' ? '#1890ff' :
                                  job.WorkMode?.work_mode === 'On-site' ? '#52c41a' :
                                  job.WorkMode?.work_mode === 'Hybrid' ? '#fa8c16' : '#d9d9d9'}
                            style={{ marginTop: 3, fontWeight: 'bold', color: 'white', borderRadius: '20px', }}
                          >
                            {job.WorkMode?.work_mode || 'ไม่ระบุ'}
                          </Tag>
                        </Space>
                      </div>

                      {/* Job details */}
                      <div style={{ padding: '0 20px 20px' }}>
                        <Space direction="vertical" size={4}>
                          <Space>
                            <DollarOutlined style={{ color: '#1976d2', fontSize: '14px' }} />
                            <Text style={{ color: '#434343', fontSize: '14px' }}>
                              เบี้ยเลี้ยง: {job.Stipend?.stipend || "ไม่ระบุ"}
                            </Text>
                          </Space>
                          <Space>
                            <UserOutlined style={{ color: '#1976d2', fontSize: '14px' }} />
                            <Text style={{ color: '#434343', fontSize: '14px' }}>
                              รับสมัคร: {job.quantity || 0} อัตรา
                            </Text>
                          </Space>
                        </Space>
                      </div>

                      {/* Description */}
                      {job.post_description && (
                        <div style={{ padding: '0 20px 20px' }}>
                          <Paragraph
                            style={{ 
                              color: '#666',
                              margin: 0,
                              fontSize: '13px'
                            }}
                            ellipsis={{ rows: 2 }}
                          >
                            {job.post_description}
                          </Paragraph>
                        </div>
                      )}

                      {/* Footer button */}
                      <div style={{ 
                        padding: '16px 20px',
                        borderTop: '1px solid #f5f5f5',
                        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                        marginTop: 'auto'
                      }}>
                        <div style={{
                          textAlign: 'center',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 500
                        }}>
                          ดูรายละเอียด
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LikedPosts;