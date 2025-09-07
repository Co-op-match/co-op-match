// ✅ JobCard.tsx
import React from 'react';
import { Card, Button, Space, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { IntershipPostInterface } from '../../../interfaces/IntershipPost';


const { Text, Paragraph } = Typography;

const JobCard: React.FC<{ job: IntershipPostInterface }> = ({ job }) => {
  const navigate = useNavigate();

  return (
    <div className='animation-scroll'>
    <Card
      hoverable
      style={{
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(24, 144, 255, 0.2)',
        border: 'none',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(24, 144, 255, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(24, 144, 255, 0.2)';
      }}
      cover={
        <div style={{
          height: 140,
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 50%, #0050b3 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <img
            src={
              job.Company?.logo?.startsWith('http')
                ? job.Company.logo
                : job.Company?.logo
                  ? `https://api.coop-match.online:8080${job.Company.logo}`
                  : undefined
            }
            style={{ height: '100px', objectFit: 'contain' }}
          />
        </div>
      }
      actions={[
        <Button
          type="primary"
          size="large"
          onClick={() => navigate(`/student/post-student/${job.ID}`)}
          style={{
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            border: 'none',
            borderRadius: '25px',
            height: '40px',
            fontSize: '14px',
            fontWeight: 'bold',
            width: '90%',
            margin: 'auto',
            color: 'white',
            boxShadow: '0 4px 15px rgba(24, 144, 255, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          สมัครฝึกงาน
        </Button>
      ]}
    >
      <Card.Meta
        title={
          <div>
            <Text strong style={{ fontSize: '18px', color: '#0050b3' }}>{job.post_name}</Text><br />
            <Tag
              color={job.WorkMode?.work_mode === 'Remote' ? '#1890ff' :
                job.WorkMode?.work_mode === 'On-site' ? '#52c41a' :
                  job.WorkMode?.work_mode === 'Hybrid' ? '#fa8c16' : '#d9d9d9'}
              style={{ marginTop: 4, fontWeight: 'bold', color: 'white', borderRadius: '20px' }}
            >
              {job.WorkMode?.work_mode || 'ไม่ระบุ'}
            </Tag>
          </div>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <EnvironmentOutlined style={{ color: '#0050b3' }} />
              <Text style={{ color: '#434343' }}>{job.Company?.company_name}</Text>
            </Space>
            <Space>
              <CalendarOutlined style={{ color: '#0050b3' }} />
              <Text style={{ color: '#434343' }}>วันทำงาน: {job.WorkDay?.work_day}</Text>
            </Space>
            <Space>
              <UserOutlined style={{ color: '#0050b3' }} />
              <Text style={{ color: '#434343' }}>จำนวนรับสมัคร: {job.quantity} อัตรา</Text>
            </Space>
            <Space>
              <DollarOutlined style={{ color: '#0050b3' }} />
              <Text style={{ color: '#434343' }}>เบี้ยเลี้ยง: {job.Stipend?.stipend}</Text>
            </Space>
            <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginTop: 8 }}>
              {job.post_description}
            </Paragraph>
          </Space>
        }
      />
    </Card>
    </div>
  );
};

export default JobCard;
