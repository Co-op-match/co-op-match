import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Divider, Button, Row, Col } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { GetPostById } from '../../../services/https/post/index';
import { GetPostByCompanyId } from '../../../services/https/post/index';
import { useNavigate } from 'react-router-dom';


const { Title, Text, Paragraph } = Typography;

const PostDetails = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const navigate = useNavigate();


  useEffect(() => {
    if (id) {
      GetPostById(Number(id)).then((res) => {
        if (res?.data) setPost(res.data);

        // ✅ โหลดโพสต์อื่น ๆ ของบริษัทเดียวกัน
        const companyId = res.data.company_id;
        GetPostByCompanyId(companyId).then((relatedRes) => {
          if (relatedRes?.data) {
            const others = relatedRes.data.filter((p: any) => p.id !== Number(id));
            setRelatedPosts(others);
          }
        });
      });

    }
  }, [id]);

  if (!post) return <div className="text-center p-8">Loading...</div>;

  return (
    <div style={styles.container}>
      {/* ส่วนหัวบริษัท */}
      <div style={styles.header}>
        <img
          src={post?.Company?.logo || '/logo.png'}
          alt=""
          style={styles.logo}
        />
        <div style={{ marginLeft: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            {post?.Company?.CompanyName}
          </Title>
          <Text type="secondary">{post?.Company?.Contact?.Address}</Text>
        </div>
      </div>


      {/* กล่องข้อมูลหลัก */}
      <Card style={styles.card}>
        {/* ชื่อโพสต์ */}
        <Title level={4} style={{ marginBottom: 16 }}>
          {post?.post_name}
        </Title>

        {/* ✅ สถานที่ */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
          <EnvironmentOutlined style={{ fontSize: 16, marginRight: 8, color: '#1890ff' }} />
          <Text strong style={{ marginRight: 8 }}>สถานที่:</Text>
          <Text>
            {[
              post?.location_detail,
              post?.subdistrict,
              post?.province,
              post?.location_province,
            ]
              .filter(Boolean) // ลบ null/undefined
              .join(' / ')}
          </Text>
        </div>

        {/* อัตรา */}
        <div style={{ fontSize: 16, marginRight: 8, color: '#1890ff' }}>
          <Text strong>อัตรา: </Text>
          <Text>{post?.quantity || 0} ตำแหน่ง</Text>
        </div>

        {/* ปุ่ม */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button type="primary" size="large" onClick={() => navigate('/history-application')}>
            สมัครฝึกงาน
          </Button>
        </div>

      </Card>


      {/* รายละเอียด */}
      <div style={{ marginTop: 40 }}>
        <Section title="รายละเอียดงาน" content={post?.post_description} />
        <Section
          title="วัน-เวลาทำงาน"
          content={
            <>
              {post?.WorkDay?.work_day || '-'} <br />
              {post?.WorkMode?.work_mode || '-'}
            </>
          }
        />

        <Section title="คุณสมบัติผู้สมัคร" content={post?.qualifications} />
        <Section title="เกรดขั้นต่ำ" content={post?.min_gpa} />
        <Section title="ค่าตอบแทน" content={post?.Stipend?.stipend} />
        <Section title="สิทธิประโยชน์" content={post?.Benefit?.benefit_name} />
        <Section
          title="ติดต่อ"
          content={
            <>
              {post?.Company?.Contact?.PhoneNumber && <>โทร: {post?.Company?.Contact?.PhoneNumber}<br /></>}
              {post?.Company?.Contact?.Website && (
                <>
                  เว็บไซต์:{' '}
                  <a href={post?.Company?.Contact?.Website} target="_blank" rel="noreferrer">
                    {post?.Company?.Contact?.Website}
                  </a>
                  <br />
                </>
              )}
              Email: {post?.Company?.User?.Email}
            </>
          }
        />

        {/* ✅ สถานที่ */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>

          <Text strong style={{ marginRight: 8 }}>สถานที่:</Text>
          <Text>
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
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: 60 }}>
            <Divider />
            <Title level={4}>งานอื่น ๆ จากบริษัทนี้</Title>
            <Row gutter={[16, 16]}>
              {relatedPosts.map((item) => (
                <Col span={12} key={item.id}>
                  <Card
                    title={item.post_name}
                    extra={<Button type="link" href={`/post-detail/${item.id}`}>ดูรายละเอียด</Button>}
                    style={{ borderRadius: 10 }}
                  >
                    <p><Text strong>จำนวน:</Text> {item.quantity} ตำแหน่ง</p>
                    <p><Text strong>สถานที่:</Text> {[item.location_detail, item.subdistrict, item.district, item.province].filter(Boolean).join(' / ')}</p>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}


      </div>
    </div>
  );
};

// Sub-component: สำหรับแสดงแต่ละหัวข้อ
const Section = ({ title, content }: { title: string; content: React.ReactNode }) => (
  <div style={{ marginBottom: 32 }}>
    <Title level={5}>{title}</Title>
    <Paragraph>{content}</Paragraph>
  </div>
);

// CSS-in-JS style objects
const styles = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '40px 20px',
    backgroundColor: '#fffafc',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    objectFit: 'cover' as const,
  },
  
  card: {
    backgroundColor: '#f0f6ff',
    padding: 24,
    borderRadius: 12,
    border: '1px solid #d0e4ff',
  },
};


export default PostDetails;
