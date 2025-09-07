import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Tag } from 'antd';
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
  TeamOutlined
} from '@ant-design/icons';
import { GetPostById } from '../../../services/https/post/index';
import type { BenefitInterface } from '../../../interface/IBenefit';

const { Title, Text, Paragraph } = Typography;

/* ---------------- helper: สร้าง URL รูปจาก backend:8000 ---------------- */
const getApiBase = () => 'https://api.coop-match.online';

const toFileURL = (p?: string | null) => {
  if (!p) return '';
  const base = getApiBase();

  // ถ้าเป็น absolute URL อยู่แล้ว
  if (/^https?:\/\//i.test(p)) {
    // ถ้าเผลอเป็น 5173 → replace เป็น 8000
    return p.replace(/^https?:\/\/localhost:5173/i, base);
  }

  // ถ้าเป็น path relative
  return `${base}${p.startsWith('/') ? '' : '/'}${encodeURI(p)}`;
};
/* ----------------------------------------------------------------------- */

const PostDetails = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      GetPostById(Number(id)).then((res) => {
        if (res?.data) {
          setPost(res.data);
        }
      });
    }
  }, [id]);

  if (!post) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <Text style={{ marginTop: 16, color: '#87ceeb' }}>กำลังโหลด...</Text>
      </div>
    );
  }

  // ✅ ดึง logo จากทั้ง Company และ company
  const company = post?.Company || post?.company;
  const logoSrc = company?.logo ? toFileURL(company.logo) : '/logo.png';

  return (
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

      {/* Company Header */}
      <Card style={styles.headerCard}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <img
              src={logoSrc}
              alt="Company Logo"
              style={styles.logo}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>

          <div style={styles.companyInfo}>
            <Title level={2} style={styles.companyName}>
              {company?.company_name || "ชื่อบริษัทไม่ระบุ"}
            </Title>
            <div style={styles.addressContainer}>
              <EnvironmentOutlined style={styles.addressIcon} />
              <Text style={styles.addressText}>
                {post?.location_detail && `${post.location_detail} `}
                {post?.subdistrict && `ต.${post.subdistrict} `}
                {post?.district && `อ.${post.district} `}
                {post?.province && `จ.${post.province}`}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Job Title Card */}
      <Card style={styles.titleCard}>
        <Title level={3} style={styles.jobTitle}>
          {post?.post_name}
        </Title>

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
                  .join(' / ')}
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
              <Text style={styles.quickValue}>{post?.Stipend?.stipend || '-'}</Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div style={styles.detailsGrid}>
        {/* Job Description */}
        <Card style={styles.detailCard}>
          <SectionHeader icon={<StarOutlined />} title="รายละเอียดงาน" />
          <Paragraph style={styles.sectionContent}>
            {post?.post_description || '-'}
          </Paragraph>
        </Card>

        {/* Work Schedule */}
        <Card style={styles.detailCard}>
          <SectionHeader icon={<CalendarOutlined />} title="วัน-เวลาทำงาน" />
          <Paragraph style={styles.sectionContent}>
            <Text strong>วันทำงาน:</Text> {post?.WorkDay?.work_day || '-'}<br />
            <Text strong>รูปแบบงาน:</Text> {post?.WorkMode?.work_mode || '-'}
          </Paragraph>
        </Card>

        {/* Required Skills */}
        <Card style={styles.detailCard}>
          <SectionHeader icon={<UserOutlined />} title="คุณสมบัติผู้สมัคร" />
          <div style={styles.skillsContainer}>
            {post?.company_required_skills?.length > 0 ? (
              post.company_required_skills.map((rel: any, idx: number) => (
                rel?.Skill?.skill_name && (
                  <Tag key={idx} style={styles.skillTag}>
                    {rel.Skill.skill_name}
                  </Tag>
                )
              ))
            ) : (
              <Text style={styles.sectionContent}>-</Text>
            )}
          </div>
          {post?.min_gpa && (
            <div style={{ marginTop: 16 }}>
              <Text strong style={styles.quickLabel}>เกรดขั้นต่ำ: </Text>
              <Text style={styles.sectionContent}>
                {Number(post.min_gpa).toFixed(2)}
              </Text>
            </div>
          )}
        </Card>

        {/* Benefits */}
        <Card style={styles.detailCard}>
          <SectionHeader icon={<StarOutlined />} title="สิทธิประโยชน์" />
          {post?.benefits && post.benefits.length > 0 ? (
            <div style={styles.benefitsList}>
              {post.benefits.map((b: BenefitInterface, idx: number) => (
                <div key={idx} style={styles.benefitItem}>
                  <div style={styles.benefitDot}></div>
                  <Text style={styles.benefitText}>{b.benefit}</Text>
                </div>
              ))}
            </div>
          ) : (
            <Text style={styles.sectionContent}>-</Text>
          )}
        </Card>

        {/* Contact Info */}
        <Card style={styles.detailCard}>
          <SectionHeader icon={<PhoneOutlined />} title="ติดต่อ" />
          <div style={styles.contactInfo}>
            {company?.Contact?.PhoneNumber && (
              <div style={styles.contactItem}>
                <PhoneOutlined style={styles.contactIcon} />
                <Text style={styles.contactText}>{company.Contact.PhoneNumber}</Text>
              </div>
            )}

            {company?.Contact?.Website && (
              <div style={styles.contactItem}>
                <GlobalOutlined style={styles.contactIcon} />
                <a
                  href={company.Contact.Website}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.contactLink}
                >
                  {company.Contact.Website}
                </a>
              </div>
            )}

            {company?.User?.Email && (
              <div style={styles.contactItem}>
                <MailOutlined style={styles.contactIcon} />
                <Text style={styles.contactText}>{company.User.Email}</Text>
              </div>
            )}
          </div>
        </Card>
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

const styles = {
  container: { maxWidth: 1200, margin: '0 auto', padding: '20px', backgroundColor: '#f0f7ff', minHeight: '100vh' },
  loadingContainer: { display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', height: '50vh' },
  loadingSpinner: { width: 40, height: 40, border: '4px solid #b8e6ff', borderTop: '4px solid #87ceeb', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  backButton: { marginBottom: 24, color: '#87ceeb', fontSize: '16px', fontWeight: 500, padding: '8px 16px', height: 'auto', borderRadius: '8px' },
  headerCard: { backgroundColor: 'white', borderRadius: '16px', marginBottom: 24, border: '1px solid #b8e6ff', boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', padding: '8px 0' },
  logoContainer: { marginRight: 20, position: 'relative' as const },
  logo: { width: 90, height: 90, borderRadius: '16px', objectFit: 'cover' as const, border: '3px solid #b8e6ff', boxShadow: '0 4px 12px rgba(135, 206, 235, 0.2)' },
  companyInfo: { flex: 1 },
  companyName: { margin: '0 0 8px 0', color: '#2c5282', fontSize: '28px', fontWeight: 600 },
  addressContainer: { display: 'flex', alignItems: 'center' },
  addressIcon: { color: '#87ceeb', fontSize: '16px', marginRight: 8 },
  addressText: { color: '#4a5568', fontSize: '16px' },
  titleCard: { backgroundColor: 'white', borderRadius: '16px', marginBottom: 24, border: '1px solid #b8e6ff', boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)' },
  jobTitle: { margin: '0 0 24px 0', color: '#2c5282', fontSize: '24px', fontWeight: 600, textAlign: 'center' as const },
  quickInfoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
  quickInfoItem: { display: 'flex', alignItems: 'flex-start', padding: '16px', backgroundColor: '#f0f7ff', borderRadius: '12px', border: '1px solid #b8e6ff' },
  quickIcon: { fontSize: '20px', color: '#87ceeb', marginRight: 12, marginTop: 2 },
  quickLabel: { color: '#2c5282', fontSize: '14px', fontWeight: 600 },
  quickValue: { color: '#4a5568', fontSize: '14px' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' },
  detailCard: { backgroundColor: 'white', borderRadius: '16px', border: '1px solid #b8e6ff', boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' },
  sectionHeader: { display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #f0f7ff' },
  sectionIcon: { color: '#87ceeb', fontSize: '18px', marginRight: 12 },
  sectionTitle: { margin: 0, color: '#2c5282', fontSize: '18px', fontWeight: 600 },
  sectionContent: { color: '#4a5568', fontSize: '15px', lineHeight: 1.6, margin: 0 },
  skillsContainer: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
  skillTag: { backgroundColor: '#b8e6ff', color: '#2c5282', border: '1px solid #87ceeb', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: 500 },
  benefitsList: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  benefitItem: { display: 'flex', alignItems: 'flex-start' },
  benefitDot: { width: 8, height: 8, backgroundColor: '#87ceeb', borderRadius: '50%', marginRight: 12, marginTop: 6, flexShrink: 0 },
  benefitText: { color: '#4a5568', fontSize: '15px', lineHeight: 1.6 },
  contactInfo: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  contactItem: { display: 'flex', alignItems: 'center' },
  contactIcon: { color: '#87ceeb', fontSize: '16px', marginRight: 12, width: 20 },
  contactText: { color: '#4a5568', fontSize: '15px' },
  contactLink: { color: '#87ceeb', fontSize: '15px', textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#4a90e2' } }
};

export default PostDetails;
