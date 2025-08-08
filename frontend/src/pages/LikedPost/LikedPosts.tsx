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
    <Layout style={{backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <CoopMatchHeaderDefault />
    <div 
      style={{ 
        padding: "24px",
        background: "#fafbfc",
        minHeight: "100vh"
      }}
    >
      <Title 
        level={2} 
        style={{ 
          color: "#111214ff",
          marginBottom: "32px"
        }}
      >
        โพสต์ที่คุณสนใจ
      </Title>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      ) : likedPosts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Empty 
            description={
              <Text style={{ color: "#1976d2", fontSize: "16px" }}>
                ยังไม่มีโพสต์ที่สนใจ
              </Text>
            }
          />
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
                    height: '100%'
                  }}
                  bodyStyle={{ padding: 0 }}
                  hoverable
                  onClick={() => navigate(`/student/post-student/${job.ID}`)}
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
    </Layout>
  );
};

export default LikedPosts;