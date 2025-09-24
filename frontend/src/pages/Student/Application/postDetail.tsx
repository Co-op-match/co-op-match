import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Row, Col, Tag, Badge, Carousel, Space, Avatar } from 'antd';
import { CoopMatchLoader } from '../../../components/loaders';
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
  EyeOutlined,
  BankOutlined,
  SafetyOutlined,
  ApartmentOutlined,
  LeftOutlined,
  RightOutlined,
  FireOutlined,
  TrophyOutlined,
  HeartOutlined
} from '@ant-design/icons';
import { GetPostById, GetPostByCompanyId } from '../../../services/https/post/index';

const { Title, Text, Paragraph } = Typography;

/* ---------- helper: ประกอบ URL ให้วิ่งที่ backend:8000 เสมอ ---------- */
const getApiBase = () => {
  const base = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:8080';
  return String(base).replace(/\/$/, '');
};

const toFileURL = (p?: string | null) => {
  if (!p) return '';
  const base = getApiBase();

  if (/^https?:\/\/localhost:5173\//i.test(p)) {
    return p.replace(/^https?:\/\/localhost:5173/i, base);
  }

  if (/^https?:\/\//i.test(p)) return p;

  return `${base}${p.startsWith('/') ? '' : '/'}${encodeURI(p)}`;
};

/** ✅ รองรับทั้ง id, ID, post_id */
const getPostId = (x: any) => x?.id ?? x?.ID ?? x?.post_id;

/** ✅ ลูกศรสำหรับ Carousel ที่ไม่ส่ง prop แปลก ๆ ลง DOM */
const SlickArrow: React.FC<{
  type: 'prev' | 'next';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}> = ({ type, className, style, onClick }) => (
  <button
    type="button"
    className={className}
    style={{ ...style, ...(styles as any).carouselArrow }}
    onClick={onClick}
    aria-label={type === 'prev' ? 'Previous' : 'Next'}
  >
    {type === 'prev' ? <LeftOutlined /> : <RightOutlined />}
  </button>
);

const PostDetails = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    GetPostById(Number(id)).then((res) => {
      if (res?.data) {
        setPost(res.data);

        const companyId =
          res.data?.CompanyID ||
          res.data?.company_id ||
          res.data?.Company?.ID ||
          res.data?.company?.id;

        if (companyId) {
          GetPostByCompanyId(companyId).then((relatedRes) => {
            if (relatedRes?.data) {
              // ✅ normalize id ให้เป็นฟิลด์ id เสมอ + ตัดตัวเองออก
              const normalized = relatedRes.data.map((p: any) => ({
                ...p,
                id: getPostId(p),
              }));
              const others = normalized.filter((p: any) => Number(p.id) !== Number(id));
              setRelatedPosts(others);
            }
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
  }, [id]);

  if (loading) {
    return <CoopMatchLoader overlay text="กำลังโหลดข้อมูล..." />;
  }

  if (!post) return (
    <div style={styles.loadingContainer}>
      <Text style={{ color: '#666', fontSize: '18px' }}>ไม่พบข้อมูลตำแหน่งงาน</Text>
    </div>
  );

  const company = post?.Company || post?.company;
  const rawLogoPath: string | undefined = company?.logo;
  const logoURL = rawLogoPath ? toFileURL(rawLogoPath) : '';

  return (
    <div style={styles.pageBackground}>
      <div style={styles.container}>

        {/* Back Button */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={styles.backButton}
          size="large"
        >
          ย้อนกลับ
        </Button>

        {/* HERO BANNER - Most Prominent */}
        <div style={styles.heroBanner}>
          <div style={styles.heroOverlay}>
            <div style={styles.heroContent}>

              {/* Company Info */}
              <div style={styles.companySection}>
                <div style={styles.companyLogoWrapper}>
                  <img
                    src={logoURL || '/logo.png'}
                    alt="Company Logo"
                    style={styles.heroLogo}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                  <Badge
                    count={
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <FireOutlined /> HOT
                      </span>
                    }
                    style={styles.hotBadge}
                  />
                </div>

                <div style={styles.companyInfo}>
                  <div style={styles.companyHeader}>
                    <ApartmentOutlined style={styles.companyIcon} />
                    <Text style={styles.companyLabel}>บริษัท</Text>
                  </div>
                  <Title
                    level={2}
                    style={styles.heroCompanyName}
                    onClick={() => {
                      const companyId = company?.ID || company?.id;
                      if (companyId) navigate(`/company-profile/${companyId}`);
                    }}
                  >
                    {company?.company_name || 'ไม่ระบุชื่อบริษัท'}
                  </Title>
                  <div style={styles.heroLocation}>
                    <EnvironmentOutlined style={styles.heroLocationIcon} />
                    <Text style={styles.heroLocationText}>
                      {[post?.location_detail, post?.subdistrict, post?.district, post?.province]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Job Title - PROMINENT */}
              <div style={styles.jobTitleSection}>
                <Title level={1} style={styles.heroJobTitle}>
                  {post?.post_name}
                </Title>

                {/* Key Stats */}
                <div style={styles.heroStats}>
                  <div style={styles.heroStatItem}>
                    <div style={styles.heroStatIcon}>
                      <TeamOutlined />
                    </div>
                    <div>
                      <Text style={styles.heroStatLabel}>รับสมัคร</Text>
                      <Text style={styles.heroStatValue}>{post?.quantity || 0} คน</Text>
                    </div>
                  </div>

                  <div style={styles.heroStatDivider} />

                  <div style={styles.heroStatItem}>
                    <div style={styles.heroStatIcon}>
                      <DollarOutlined />
                    </div>
                    <div>
                      <Text style={styles.heroStatLabel}>ค่าตอบแทน</Text>
                      <Text style={styles.heroStatValue}>{post?.Stipend?.stipend || 'ตามตกลง'}</Text>
                    </div>
                  </div>

                  <div style={styles.heroStatDivider} />

                  <div style={styles.heroStatItem}>
                    <div style={styles.heroStatIcon}>
                      <CalendarOutlined />
                    </div>
                    <div>
                      <Text style={styles.heroStatLabel}>รูปแบบ</Text>
                      <Text style={styles.heroStatValue}>{post?.WorkMode?.work_mode || 'Remote'}</Text>
                    </div>
                  </div>
                </div>

                {/* CTA Button - PROMINENT */}
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={() => navigate(`/student/applications/${post.ID}`)}
                  style={styles.heroCTA}
                >
                  สมัครฝึกงานเลย!
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT SECTIONS */}
        <div style={styles.mainContent}>

          {/* Job Description - Prominent Card */}
          <Card style={styles.prominentCard}>
            <div style={styles.prominentHeader}>
              <div style={styles.prominentIcon}>
                <BookOutlined />
              </div>
              <Title level={3} style={styles.prominentTitle}>รายละเอียดงาน</Title>
            </div>
            <Paragraph style={styles.prominentContent}>
              {post?.post_description || 'ไม่มีข้อมูลรายละเอียดงาน'}
            </Paragraph>
          </Card>

          {/* Two Column Layout */}
          <Row gutter={[32, 32]}>

            {/* Left Column */}
            <Col xs={24} lg={16}>

              {/* Requirements */}
              <Card style={styles.contentCard}>
                <SectionHeader
                  icon={<UserOutlined style={styles.sectionIcon} />}
                  title="คุณสมบัติผู้สมัคร"
                  accent
                />

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {post?.min_gpa && (
                    <div style={styles.requirementItem}>
                      <div style={styles.requirementIcon}>
                        <TrophyOutlined />
                      </div>
                      <div style={styles.requirementContent}>
                        <Text strong style={styles.requirementLabel}>เกรดขั้นต่ำ</Text>
                        <Tag color="orange" style={styles.gpaTag}>
                          GPA {Number(post.min_gpa).toFixed(2)}
                        </Tag>
                      </div>
                    </div>
                  )}

                  {post?.company_required_skills && post.company_required_skills.length > 0 && (
                    <div style={styles.skillsWrapper}>
                      <Text strong style={styles.skillsTitle}>ทักษะที่ต้องการ</Text>
                      <div style={styles.skillsContainer}>
                        {post.company_required_skills.map(
                          (item: { Skill: { skill_name: string } }, index: number) => (
                            <Tag key={index} style={styles.skillTag}>
                              {item.Skill?.skill_name || 'ไม่ระบุ'}
                            </Tag>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </Space>
              </Card>

              {/* Benefits */}
              <Card style={styles.contentCard}>
                <SectionHeader
                  icon={<GiftOutlined style={styles.sectionIcon} />}
                  title="สิทธิประโยชน์"
                  accent
                />

                {post?.benefits && post.benefits.length > 0 ? (
                  <div style={styles.benefitsGrid}>
                    {post.benefits.map((benefit: { benefit: string }, index: number) => (
                      <div key={index} style={styles.benefitCard}>
                        <HeartOutlined style={styles.benefitIcon} />
                        <Text style={styles.benefitText}>{benefit.benefit}</Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    <Text style={styles.emptyText}>ไม่มีข้อมูลสิทธิประโยชน์</Text>
                  </div>
                )}
              </Card>

              {/* Work Schedule */}
              <Card style={styles.contentCard}>
                <SectionHeader
                  icon={<ClockCircleOutlined style={styles.sectionIcon} />}
                  title="เวลาทำงาน"
                />

                <div style={styles.scheduleGrid}>
                  <div style={styles.scheduleItem}>
                    <CalendarOutlined style={styles.scheduleIcon} />
                    <div>
                      <Text style={styles.scheduleLabel}>วันทำงาน</Text>
                      <Text style={styles.scheduleValue}>{post?.WorkDay?.work_day || 'จันทร์ - เสาร์'}</Text>
                    </div>
                  </div>
                  <div style={styles.scheduleItem}>
                    <ClockCircleOutlined style={styles.scheduleIcon} />
                    <div>
                      <Text style={styles.scheduleLabel}>รูปแบบงาน</Text>
                      <Text style={styles.scheduleValue}>{post?.WorkMode?.work_mode || 'Remote'}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Right Column - Sidebar */}
            <Col xs={24} lg={8}>

              {/* Contact Card - Sticky */}
              <div style={styles.stickyWrapper}>
                <Card style={styles.contactCard}>
                  <SectionHeader
                    icon={<PhoneOutlined style={styles.sectionIcon} />}
                    title="ติดต่อสอบถาม"
                    compact
                  />

                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {company?.Contact?.phone_number && (
                      <div style={styles.contactItem}>
                        <Avatar icon={<PhoneOutlined />} style={styles.contactAvatar} />
                        <div>
                          <Text style={styles.contactLabel}>โทรศัพท์</Text>
                          <Text style={styles.contactValue}>{company.Contact.phone_number}</Text>
                        </div>
                      </div>
                    )}

                    {company?.Contact?.email && (
                      <div style={styles.contactItem}>
                        <Avatar icon={<MailOutlined />} style={styles.contactAvatar} />
                        <div>
                          <Text style={styles.contactLabel}>อีเมล</Text>
                          <Text style={styles.contactValue}>{company.Contact.email}</Text>
                        </div>
                      </div>
                    )}

                    {company?.Contact?.website && (
                      <div style={styles.contactItem}>
                        <Avatar icon={<GlobalOutlined />} style={styles.contactAvatar} />
                        <div>
                          <Text style={styles.contactLabel}>เว็บไซต์</Text>
                          <a
                            href={company.Contact.website}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.contactLink}
                          >
                            เยี่ยมชมเว็บไซต์
                          </a>
                        </div>
                      </div>
                    )}
                  </Space>
                </Card>

                {/* Apply Card */}
                <Card style={styles.applyCard}>
                  <div style={styles.applyCardContent}>
                    <SafetyOutlined style={styles.applyCardIcon} />
                    <Title level={4} style={styles.applyCardTitle}>
                      พร้อมเริ่มต้นแล้ว?
                    </Title>
                    <Text style={styles.applyCardDesc}>
                      สมัครฝึกงานกับเราวันนี้
                    </Text>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SendOutlined />}
                      onClick={() => navigate(`/student/applications/${post.ID}`)}
                      style={styles.applyButton}
                      block
                    >
                      สมัครฝึกงาน
                    </Button>
                  </div>
                </Card>
              </div>
            </Col>
          </Row>

          {/* Related Jobs Carousel - SLIDE COMPONENT */}
          {relatedPosts.length > 0 && (
            <Card style={styles.carouselCard}>
              <div style={styles.carouselHeader}>
                <div style={styles.carouselHeaderLeft}>
                  <BankOutlined style={styles.carouselIcon} />
                  <Title level={3} style={styles.carouselTitle}>
                    งานอื่น ๆ จาก {company?.company_name}
                  </Title>
                </div>
                <Text style={styles.carouselSubtitle}>
                  {relatedPosts.length} ตำแหน่งงาน
                </Text>
              </div>

              <Carousel
                dots={false}
                arrows
                prevArrow={<SlickArrow type="prev" />}
                nextArrow={<SlickArrow type="next" />}
                slidesToShow={3}
                slidesToScroll={1}
                responsive={[
                  {
                    breakpoint: 1200,
                    settings: {
                      slidesToShow: 2,
                    }
                  },
                  {
                    breakpoint: 768,
                    settings: {
                      slidesToShow: 1,
                    }
                  }
                ]}
              >
                {relatedPosts.map((item) => {
                  const pid = getPostId(item);
                  return (
                    <div key={pid ?? Math.random()} style={styles.carouselSlide}>
                      <Card
                        style={styles.jobCard}
                        hoverable
                        cover={
                          <div style={styles.jobCardHeader}>
                            <div style={styles.jobCardBadge}>
                              <StarOutlined style={{ marginRight: 4 }} />
                              เปิดรับ
                            </div>
                          </div>
                        }
                        actions={[
                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => pid && navigate(`/student/post-student/${pid}`)}
                            style={styles.jobCardAction}
                          >
                            ดูรายละเอียด
                          </Button>
                        ]}
                      >
                        <Card.Meta
                          title={
                            <Title level={5} style={styles.jobCardTitle}>
                              {item.post_name}
                            </Title>
                          }
                          description={
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <div style={styles.jobCardMeta}>
                                <TeamOutlined style={styles.jobCardIcon} />
                                <Text style={styles.jobCardText}>{item.quantity} ตำแหน่ง</Text>
                              </div>
                              <div style={styles.jobCardMeta}>
                                <EnvironmentOutlined style={styles.jobCardIcon} />
                                <Text style={styles.jobCardText} ellipsis>
                                  {[item.district, item.province].filter(Boolean).join(', ')}
                                </Text>
                              </div>
                            </Space>
                          }
                        />
                      </Card>
                    </div>
                  );
                })}
              </Carousel>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
};

// Section Header Component
const SectionHeader = ({
  icon,
  title,
  accent = false,
  compact = false
}: {
  icon: React.ReactNode;
  title: string;
  accent?: boolean;
  compact?: boolean;
}) => (
  <div style={compact ? styles.sectionHeaderCompact : styles.sectionHeader}>
    <div style={accent ? styles.sectionIconAccent : styles.sectionIconWrapper}>
      {icon}
    </div>
    <Title level={compact ? 5 : 4} style={styles.sectionTitle}>{title}</Title>
  </div>
);

// Updated Styles with Gray/Light Blue Color Scheme
const styles = {
  pageBackground: {
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    minHeight: '100vh',
    position: 'relative' as const,
  },
  container: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 24px 120px',
    position: 'relative' as const,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
    backgroundColor: 'transparent',
  },
  loadingSpinner: {
    width: 48,
    height: 48,
    border: '4px solid rgba(34, 211, 238, 0.3)',
    borderTop: '4px solid #22d3ee',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  backButton: {
    margin: '24px 0 32px 0',
    color: '#334155',
    fontSize: '16px',
    fontWeight: 600,
    padding: '12px 24px',
    height: 'auto',
    borderRadius: '12px',
    background: 'white',
    border: '1px solid #cbd5e1',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
  },

  // HERO BANNER - Soft blue/gray themed like other pages
  heroBanner: {
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    borderRadius: '16px',
    marginBottom: 48,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    position: 'relative' as const,
    border: '1px solid #e2e8f0',
  },
  heroOverlay: {
    background: 'rgba(255, 255, 255, 0.8)',
    padding: '48px',
  },
  heroContent: {
    maxWidth: 1200,
    margin: '0 auto',
  },

  // Company Section in Hero
  companySection: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 40,
    flexWrap: 'wrap' as const,
    gap: '24px',
  },
  companyLogoWrapper: {
    position: 'relative' as const,
  },
  heroLogo: {
    width: 120,
    height: 120,
    borderRadius: '12px',
    objectFit: 'cover' as const,
    border: '4px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },
  hotBadge: {
    position: 'absolute' as const,
    top: -12,
    right: -12,
    backgroundColor: '#f97316',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '6px 10px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.4)',
  },
  companyInfo: {
    flex: 1,
    minWidth: '300px',
  },
  companyHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyIcon: {
    color: '#64748b',
    fontSize: '16px',
    marginRight: 8,
  },
  companyLabel: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  heroCompanyName: {
    margin: '0 0 16px 0',
    color: '#1e293b',
    fontSize: '28px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.3s ease',
  },
  heroLocation: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    padding: '10px 16px',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    width: 'fit-content',
    border: '1px solid #e2e8f0',
  },
  heroLocationIcon: {
    color: '#64748b',
    fontSize: '14px',
    marginRight: 10,
  },
  heroLocationText: {
    color: '#475569',
    fontSize: '14px',
    fontWeight: 500,
  },

  // Job Title Section
  jobTitleSection: {
    textAlign: 'center' as const,
  },
  heroJobTitle: {
    margin: '0 0 32px 0',
    color: '#1e293b',
    fontSize: '40px',
    fontWeight: 700,
    lineHeight: 1.2,
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  // Hero Stats - Clean white cards
  heroStats: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '20px',
    marginBottom: 36,
  },
  heroStatItem: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '16px 20px',
    borderRadius: '16px',
    backdropFilter: 'blur(15px)',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
  },
  heroStatIcon: {
    fontSize: '20px',
    color: '#3b82f6',
    marginRight: 14,
    backgroundColor: '#eff6ff',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #dbeafe',
  },
  heroStatLabel: {
    display: 'block',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: 4,
  },
  heroStatValue: {
    display: 'block',
    color: '#1e293b',
    fontSize: '16px',
    fontWeight: 700,
  },
  heroStatDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#e2e8f0',
  },

  // Hero CTA - Softer green
  heroCTA: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    color: 'white',
    fontSize: '18px',
    fontWeight: 700,
    height: '56px',
    padding: '0 36px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(5, 150, 105, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid #047857',
  },

  // Main Content
  mainContent: {
    maxWidth: 1200,
    margin: '0 auto',
  },

  // Prominent Card - Gray header
  prominentCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e0f2fe',
    boxShadow: '0 4px 20px rgba(14, 165, 233, 0.12)',
    marginBottom: 40,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  prominentHeader: {
    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 24,
  },
  prominentIcon: {
    fontSize: '24px',
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  prominentTitle: {
    margin: 0,
    color: 'white',
    fontSize: '20px',
    fontWeight: 700,
  },
  prominentContent: {
    color: '#475569',
    fontSize: '16px',
    lineHeight: 1.7,
    margin: '0 24px 24px 24px',
  },

  // Content Cards
  contentCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e0f2fe',
    boxShadow: '0 2px 12px rgba(14, 165, 233, 0.08)',
    marginBottom: 24,
    transition: 'all 0.3s ease',
  },

  // Section Headers
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '1px solid #f0f9ff',
  },
  sectionHeaderCompact: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconWrapper: {
    fontSize: '18px',
    color: '#0ea5e9',
    backgroundColor: '#f0f9ff',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    border: '1px solid #e0f2fe',
  },
  sectionIconAccent: {
    fontSize: '18px',
    color: 'white',
    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    boxShadow: '0 2px 8px rgba(100, 116, 139, 0.25)',
  },
  sectionIcon: {
    color: 'inherit',
  },
  sectionTitle: {
    margin: 0,
    color: '#1e293b',
    fontSize: '18px',
    fontWeight: 600,
  },

  // Requirements - Orange theme for GPA
  requirementItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#fff7ed',
    borderRadius: '12px',
    border: '1px solid #fed7aa',
  },
  requirementIcon: {
    fontSize: '20px',
    color: '#ea580c',
    marginRight: 14,
  },
  requirementContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
  },
  requirementLabel: {
    color: '#c2410c',
    fontSize: '15px',
    fontWeight: 600,
  },
  gpaTag: {
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    padding: '6px 12px',
  },

  // Skills - Blue/cyan themed
  skillsWrapper: {
    padding: '16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '12px',
    border: '1px solid #e0f2fe',
  },
  skillsTitle: {
    color: '#0c4a6e',
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: 10,
    display: 'block',
  },
  skillsContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  skillTag: {
    background: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 600,
    padding: '6px 12px',
    margin: 0,
    boxShadow: '0 1px 3px rgba(14, 165, 233, 0.2)',
  },

  // Benefits - Green theme
  benefitsGrid: {
    display: 'grid',
    gap: '12px',
  },
  benefitCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 18px',
    backgroundColor: '#f0fdf4',
    borderRadius: '12px',
    border: '1px solid #bbf7d0',
    transition: 'all 0.3s ease',
    boxShadow: '0 1px 3px rgba(34, 197, 94, 0.1)',
  },
  benefitIcon: {
    fontSize: '18px',
    color: '#16a34a',
    marginRight: 14,
  },
  benefitText: {
    color: '#166534',
    fontSize: '14px',
    fontWeight: 500,
    flex: 1,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '32px 16px',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px',
    fontStyle: 'italic',
  },

  // Schedule - Purple theme
  scheduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  scheduleItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '18px',
    backgroundColor: '#faf5ff',
    borderRadius: '12px',
    border: '1px solid #e9d5ff',
    transition: 'all 0.3s ease',
  },
  scheduleIcon: {
    fontSize: '18px',
    color: '#7c3aed',
    marginRight: 12,
  },
  scheduleLabel: {
    display: 'block',
    color: '#6b21a8',
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: 4,
  },
  scheduleValue: {
    display: 'block',
    color: '#581c87',
    fontSize: '15px',
    fontWeight: 600,
  },

  // Sidebar
  stickyWrapper: {
    position: 'sticky' as const,
    top: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e0f2fe',
    boxShadow: '0 2px 12px rgba(14, 165, 233, 0.08)',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
  },
  contactAvatar: {
    background: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)',
    marginRight: 12,
  },
  contactLabel: {
    display: 'block',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 500,
    marginBottom: 2,
  },
  contactValue: {
    display: 'block',
    color: '#1f2937',
    fontSize: '14px',
    fontWeight: 500,
  },
  contactLink: {
    display: 'block',
    color: '#0ea5e9',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
  },

  // Apply Card - Bright green
  applyCard: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)',
  },
  applyCardContent: {
    textAlign: 'center' as const,
    padding: '8px',
  },
  applyCardIcon: {
    fontSize: '40px',
    color: 'white',
    marginBottom: 12,
  },
  applyCardTitle: {
    margin: '0 0 6px 0',
    color: 'white',
    fontSize: '18px',
    fontWeight: 700,
  },
  applyCardDesc: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '13px',
    marginBottom: 20,
    display: 'block',
  },
  applyButton: {
    backgroundColor: 'white',
    borderColor: 'white',
    color: '#10b981',
    fontSize: '15px',
    fontWeight: 700,
    height: '44px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.3)',
  },

  // Carousel Section - Subtle gray theme
  carouselCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e0f2fe',
    boxShadow: '0 4px 20px rgba(14, 165, 233, 0.1)',
    marginTop: 40,
    overflow: 'hidden',
  },
  carouselHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 20px 24px',
    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  },
  carouselHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  carouselIcon: {
    fontSize: '24px',
    color: 'white',
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselTitle: {
    margin: 0,
    color: 'white',
    fontSize: '20px',
    fontWeight: 700,
  },
  carouselSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '13px',
    fontWeight: 500,
  },
  carouselSlide: {
    padding: '0 10px',
  },
  carouselArrow: {
    backgroundColor: 'white',
    border: '1px solid #e0f2fe',
    color: '#0ea5e9',
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.15)',
  },

  // Job Cards in Carousel
  jobCard: {
    borderRadius: '12px',
    border: '1px solid #e0f2fe',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    height: '100%',
    margin: '20px 0',
    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.08)',
  },
  jobCardHeader: {
    height: '50px',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 14px',
  },
  jobCardBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: '#0ea5e9',
    fontSize: '11px',
    fontWeight: 700,
    padding: '5px 10px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  jobCardTitle: {
    margin: '0 0 10px 0',
    color: '#1e293b',
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  jobCardMeta: {
    display: 'flex',
    alignItems: 'center',
  },
  jobCardIcon: {
    color: '#0ea5e9',
    fontSize: '13px',
    marginRight: 6,
  },
  jobCardText: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 500,
  },
  jobCardAction: {
    color: '#0ea5e9',
    fontWeight: 600,
    fontSize: '13px',
  },

  // Floating Button
  floatingButton: {
    position: 'fixed' as const,
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  floatingApplyButton: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    height: '52px',
    padding: '0 20px',
    borderRadius: '26px',
    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
    transition: 'all 0.3s ease',
  },

  // Responsive Design
  '@media (max-width: 1200px)': {
    heroOverlay: {
      padding: '32px 20px',
    },
    heroJobTitle: {
      fontSize: '36px',
    },
    heroStats: {
      justifyContent: 'center',
    },
  },
  '@media (max-width: 768px)': {
    container: {
      padding: '0 16px 120px',
    },
    heroBanner: {
      borderRadius: '12px',
      margin: '0 -4px 32px -4px',
    },
    heroOverlay: {
      padding: '24px 16px',
    },
    companySection: {
      flexDirection: 'column' as const,
      textAlign: 'center' as const,
      alignItems: 'center',
    },
    companyInfo: {
      minWidth: 'auto',
    },
    heroJobTitle: {
      fontSize: '28px',
    },
    heroStats: {
      flexDirection: 'column' as const,
      gap: '12px',
    },
    heroStatDivider: {
      display: 'none',
    },
    heroCTA: {
      fontSize: '16px',
      padding: '0 28px',
      height: '48px',
    },
    stickyWrapper: {
      position: 'static' as const,
    },
    floatingButton: {
      bottom: 16,
      right: 16,
      left: 16,
    },
    floatingApplyButton: {
      width: '100%',
      borderRadius: '12px',
    },
  },
  '@media (max-width: 480px)': {
    heroJobTitle: {
      fontSize: '24px',
    },
    prominentHeader: {
      padding: '16px 20px',
      flexDirection: 'column' as const,
      textAlign: 'center' as const,
    },
    prominentIcon: {
      marginRight: 0,
      marginBottom: 10,
    },
    prominentContent: {
      margin: '0 20px 20px 20px',
    },
  },
};

export default PostDetails;
