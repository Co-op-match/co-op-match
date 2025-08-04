import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Button, Row, Col, Tag, Badge } from 'antd';
import {
  EnvironmentOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  PhoneOutlined,
  GlobalOutlined,
  MailOutlined,
  StarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  BookOutlined,
  GiftOutlined,
  SendOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { GetPostById } from '../../../services/https/post/index';
import { GetPostByCompanyId } from '../../../services/https/post/index';
import { useNavigate } from 'react-router-dom';
import './AddApplication.css';


const { Title, Text, Paragraph } = Typography;

const PostDetails = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setLoading(true);
      GetPostById(Number(id)).then((res) => {
        if (res?.data) {
          setPost(res.data);

          // โหลดโพสต์อื่น ๆ ของบริษัทเดียวกัน
          const companyId = res.data.company_id;
          GetPostByCompanyId(companyId).then((relatedRes) => {
            if (relatedRes?.data) {
              const others = relatedRes.data.filter((p: any) => p.id !== Number(id));
              setRelatedPosts(others);
            }
            setLoading(false);
          });
        }
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <Text style={{ marginTop: 16, color: '#87ceeb' }}>กำลังโหลด...</Text>
      </div>
    );
  }

  if (!post) return <div style={styles.loadingContainer}>ไม่พบข้อมูล</div>;

  return (
    <div className="full-page-background">
      <div style={styles.container}>


        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={styles.backButton}
          size="large"
        >
          ย้อนกลับ
        </Button>

        {/* Company Header */}
        <Card style={styles.headerCard}>
          <div style={styles.header}>
            <div style={styles.logoContainer}>
              <img
                src={post?.Company?.logo || '/logo.png'}
                alt=""
                style={styles.logo}
              />
              <Badge count="HIRING" style={styles.hiringBadge} />
            </div>
            <div style={styles.companyInfo}>
              <Title level={2} style={styles.companyName}>
                {post?.Company?.company_name}
              </Title>
              <div style={styles.addressContainer}>
                <EnvironmentOutlined style={styles.addressIcon} />
                <Text style={styles.addressText}>
                  {post?.Company?.Contact?.Address}
                </Text>
              </div>
            </div>
          </div>
        </Card>

        {/* Job Title Card */}
        <Card style={styles.titleCard}>
          <div style={styles.jobTitleContainer}>
            <Title level={3} style={styles.jobTitle}>
              {post?.post_name}
            </Title>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={() => navigate(`/student/applications/${post.ID}`)}
              className="apply-button"
            >
              สมัครฝึกงาน
            </Button>
          </div>

          <div style={styles.quickInfoGrid}>
            <div style={styles.quickInfoItem}>
              <EnvironmentOutlined style={styles.quickIcon} />
              <div>
                <Text strong style={styles.quickLabel}>สถานที่</Text>
                <br />
                <Text style={styles.quickValue}>
                  {[
                    post?.location_detail,
                    post?.subdistrict,
                    post?.district,
                    post?.province,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              </div>
            </div>

            <div style={styles.quickInfoItem}>
              <TeamOutlined style={styles.quickIcon} />
              <div>
                <Text strong style={styles.quickLabel}>อัตรา</Text>
                <br />
                <Text style={styles.quickValue}>{post?.quantity || 0} ตำแหน่ง</Text>
              </div>
            </div>

            <div style={styles.quickInfoItem}>
              <DollarOutlined style={styles.quickIcon} />
              <div>
                <Text strong style={styles.quickLabel}>ค่าตอบแทน</Text>
                <br />
                <Text style={styles.quickValue}>{post?.Stipend?.stipend || 'ตามตกลง'}</Text>
              </div>
            </div>
          </div>
        </Card>

        {/* Details Grid */}
        <div style={styles.detailsGrid}>
          {/* Job Description */}
          <Card style={styles.detailCard}>
            <SectionHeader icon={<BookOutlined />} title="รายละเอียดงาน" />
            <Paragraph style={styles.sectionContent}>
              {post?.post_description || 'ไม่มีข้อมูล'}
            </Paragraph>
          </Card>

          {/* Work Schedule */}
          <Card style={styles.detailCard}>
            <SectionHeader icon={<CalendarOutlined />} title="วัน-เวลาทำงาน" />
            <div style={styles.scheduleContainer}>
              <div style={styles.scheduleItem}>
                <ClockCircleOutlined style={styles.scheduleIcon} />
                <div>
                  <Text strong>วันทำงาน:</Text><br />
                  <Text>{post?.WorkDay?.work_day || 'ไม่ระบุ'}</Text>
                </div>
              </div>
              <div style={styles.scheduleItem}>
                <CalendarOutlined style={styles.scheduleIcon} />
                <div>
                  <Text strong>รูปแบบงาน:</Text><br />
                  <Text>{post?.WorkMode?.work_mode || 'ไม่ระบุ'}</Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Qualifications & Requirements */}
          <Card style={styles.detailCard}>
            <SectionHeader icon={<UserOutlined />} title="คุณสมบัติผู้สมัคร" />
            <div style={styles.requirementsContainer}>
              

              {post?.min_gpa && (
                <div style={styles.gpaRequirement}>
                  <StarOutlined style={styles.gpaIcon} />
                  <Text strong>เกรดขั้นต่ำ: </Text>
                  <Tag color="blue" style={styles.gpaTag}>{post.min_gpa}</Tag>
                </div>
              )}

              {post?.company_required_skills && post.company_required_skills.length > 0 && (
                <div >
                  <Text strong>ทักษะที่ต้องการ:</Text>
                  <div >
                    {post.company_required_skills.map((item: { Skill: { skill_name: any; }; }, index: React.Key | null | undefined) => (
                      <Tag key={index} color="purple">
                        {item.Skill?.skill_name || "ไม่ระบุ"}

                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>


          {/* Benefits */}
          <Card style={styles.detailCard}>
            <SectionHeader icon={<GiftOutlined />} title="สิทธิประโยชน์" />
            <div style={styles.benefitsContainer}>
              {post?.benefits && post.benefits.length > 0 ? (
                post.benefits.map((benefit: { benefit: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: React.Key | null | undefined) => (
                  <div key={index} style={styles.benefitItem}>
                    <div style={styles.benefitDot}></div>
                    <Text style={styles.benefitText}>{benefit.benefit}</Text>
                  </div>
                ))
              ) : (
                <Text style={styles.sectionContent}>ไม่มีข้อมูลสิทธิประโยชน์</Text>
              )}
            </div>
          </Card>


          {/* Contact Info */}
          <Card style={styles.detailCard}>
            <SectionHeader icon={<PhoneOutlined />} title="ติดต่อ" />
            <div style={styles.contactInfo}>
              {post?.Company?.Contact?.PhoneNumber && (
                <div style={styles.contactItem}>
                  <PhoneOutlined style={styles.contactIcon} />
                  <Text style={styles.contactText}>{post.Company.Contact.PhoneNumber}</Text>
                </div>
              )}

              {post?.Company?.Contact?.Website && (
                <div style={styles.contactItem}>
                  <GlobalOutlined style={styles.contactIcon} />
                  <a
                    href={post.Company.Contact.Website}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.contactLink}
                  >
                    {post.Company.Contact.Website}
                  </a>
                </div>
              )}

              {post?.Company?.User?.Email && (
                <div style={styles.contactItem}>
                  <MailOutlined style={styles.contactIcon} />
                  <Text style={styles.contactText}>{post.Company.User.Email}</Text>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Related Jobs */}
        {relatedPosts.length > 0 && (
          <Card style={styles.relatedCard}>
            <SectionHeader icon={<TeamOutlined />} title="งานอื่น ๆ จากบริษัทนี้" />
            <Row gutter={[16, 16]}>
              {relatedPosts.map((item) => (
                <Col xs={24} md={12} key={item.id}>
                  <Card
                    style={styles.relatedJobCard}
                    hoverable
                    actions={[
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/post-detail/${item.id}`)}
                        style={styles.viewButton}
                      >
                        ดูรายละเอียด
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Text strong style={styles.relatedJobTitle}>
                          {item.post_name}
                        </Text>
                      }
                      description={
                        <div style={styles.relatedJobInfo}>
                          <div style={styles.relatedJobDetail}>
                            <TeamOutlined style={styles.relatedJobIcon} />
                            <Text>{item.quantity} ตำแหน่ง</Text>
                          </div>
                          <div style={styles.relatedJobDetail}>
                            <EnvironmentOutlined style={styles.relatedJobIcon} />
                            <Text>
                              {[item.location_detail, item.subdistrict, item.district, item.province]
                                .filter(Boolean)
                                .join(' • ')}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* Floating Apply Button */}
        <div style={styles.floatingButtonContainer}>
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={() => navigate(`/student/applications/${post.ID}`)}
            className="apply-button"
          >
            สมัครฝึกงาน
          </Button>
        </div>
      </div>
    </div>
  );
};

// Section Header Component
const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div style={styles.sectionHeader}>
    <span style={styles.sectionIcon}>{icon}</span>
    <Title level={4} style={styles.sectionTitle}>{title}</Title>
  </div>
);

// Styles
const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f0f7ff',
    minHeight: '100vh',
    paddingBottom: '100px', // Space for floating button
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    backgroundColor: '#f0f7ff',
  },

  loadingSpinner: {
    width: 40,
    height: 40,
    border: '4px solid #b8e6ff',
    borderTop: '4px solid #87ceeb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  backButton: {
    marginBottom: 24,
    color: '#87ceeb',
    fontSize: '16px',
    fontWeight: 500,
    padding: '8px 16px',
    height: 'auto',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },

  headerCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    marginBottom: 24,
    border: '1px solid #b8e6ff',
    boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)',
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
  },

  logoContainer: {
    marginRight: 20,
    position: 'relative' as const,
  },

  logo: {
    width: 90,
    height: 90,
    borderRadius: '16px',
    objectFit: 'cover' as const,
    border: '3px solid #b8e6ff',
    boxShadow: '0 4px 12px rgba(135, 206, 235, 0.2)',
  },

  hiringBadge: {
    position: 'absolute' as const,
    top: -8,
    right: -8,
    backgroundColor: '#87ceeb',
    color: 'white',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: 'bold',
  },

  companyInfo: {
    flex: 1,
  },

  companyName: {
    margin: '0 0 8px 0',
    color: '#2c5282',
    fontSize: '28px',
    fontWeight: 600,
  },

  addressContainer: {
    display: 'flex',
    alignItems: 'center',
  },

  addressIcon: {
    color: '#87ceeb',
    fontSize: '16px',
    marginRight: 8,
  },

  addressText: {
    color: '#4a5568',
    fontSize: '16px',
  },

  titleCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    marginBottom: 24,
    border: '1px solid #b8e6ff',
    boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)',
  },

  jobTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap' as const,
    gap: '16px',
  },

  jobTitle: {
    margin: 0,
    color: '#2c5282',
    fontSize: '24px',
    fontWeight: 600,
    flex: 1,
  },

  applyButton: {
    backgroundColor: '#87ceeb',
    borderColor: '#87ceeb',
    borderRadius: '8px',
    height: '48px',
    padding: '0 32px',
    fontWeight: 600,
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(135, 206, 235, 0.3)',
    transition: 'all 0.3s ease',
  },

  quickInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },

  quickInfoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '16px',
    backgroundColor: '#f0f7ff',
    borderRadius: '12px',
    border: '1px solid #b8e6ff',
  },

  quickIcon: {
    fontSize: '20px',
    color: '#87ceeb',
    marginRight: 12,
    marginTop: 2,
  },

  quickLabel: {
    color: '#2c5282',
    fontSize: '14px',
    fontWeight: 600,
  },

  quickValue: {
    color: '#4a5568',
    fontSize: '14px',
  },

  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: 24,
  },

  detailCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #b8e6ff',
    boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '2px solid #f0f7ff',
  },

  sectionIcon: {
    color: '#87ceeb',
    fontSize: '18px',
    marginRight: 12,
    padding: '8px',
    backgroundColor: '#f0f7ff',
    borderRadius: '8px',
  },

  sectionTitle: {
    margin: 0,
    color: '#2c5282',
    fontSize: '18px',
    fontWeight: 600,
  },

  sectionContent: {
    color: '#4a5568',
    fontSize: '15px',
    lineHeight: 1.6,
    margin: 0,
  },

  scheduleContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },

  scheduleItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px',
    backgroundColor: '#f0f7ff',
    borderRadius: '8px',
    border: '1px solid #b8e6ff',
  },

  scheduleIcon: {
    color: '#87ceeb',
    fontSize: '16px',
    marginRight: 12,
    marginTop: 2,
  },

  requirementsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },

  gpaRequirement: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #b8e6ff',
  },

  gpaIcon: {
    color: '#87ceeb',
    fontSize: '16px',
    marginRight: 8,
  },

  gpaTag: {
    backgroundColor: '#87ceeb',
    color: 'white',
    border: 'none',
    marginLeft: 8,
  },

  benefitsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },

  benefitItem: {
    display: 'flex',
    alignItems: 'flex-start',
  },

  benefitDot: {
    width: 8,
    height: 8,
    backgroundColor: '#87ceeb',
    borderRadius: '50%',
    marginRight: 12,
    marginTop: 6,
    flexShrink: 0,
  },

  benefitText: {
    color: '#4a5568',
    fontSize: '15px',
    lineHeight: 1.6,
  },

  contactInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },

  contactItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#f0f7ff',
    borderRadius: '6px',
  },

  contactIcon: {
    color: '#87ceeb',
    fontSize: '16px',
    marginRight: 12,
    width: 20,
  },

  contactText: {
    color: '#4a5568',
    fontSize: '15px',
  },

  contactLink: {
    color: '#87ceeb',
    fontSize: '15px',
    textDecoration: 'none',
  },

  relatedCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #b8e6ff',
    boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)',
    marginTop: 24,
  },

  relatedJobCard: {
    borderRadius: '12px',
    border: '1px solid #b8e6ff',
    transition: 'all 0.3s ease',
  },

  relatedJobTitle: {
    color: '#2c5282',
    fontSize: '16px',
  },

  relatedJobInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: 8,
  },

  relatedJobDetail: {
    display: 'flex',
    alignItems: 'center',
  },

  relatedJobIcon: {
    color: '#87ceeb',
    fontSize: '14px',
    marginRight: 8,
  },

  viewButton: {
    color: '#87ceeb',
    fontWeight: 500,
  },

  floatingButtonContainer: {
    position: 'fixed' as const,
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },

  floatingApplyButton: {
    backgroundColor: '#87ceeb',
    borderColor: '#87ceeb',
    borderRadius: '50px',
    height: '56px',
    padding: '0 32px',
    fontWeight: 600,
    fontSize: '16px',
    boxShadow: '0 8px 24px rgba(135, 206, 235, 0.4)',
    transition: 'all 0.3s ease',
  },
};

export default PostDetails;