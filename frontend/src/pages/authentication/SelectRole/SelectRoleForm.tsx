import React, { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Typography, Space, Avatar, message } from 'antd';
import { UserOutlined, TeamOutlined, ReadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { GetRole } from '../../../services/https';
import type { RoleInterface } from '../../../interfaces/auth/Roles';
const { Title, Text } = Typography;

const roleDetailsMap: Record<string, {
  title: string;
  titleEn: string;
  description: string;
  icon: React.ReactNode;
  signupPath: string;
}> = {
  Student: {
    title: 'สมัครเป็นนักศึกษา',
    titleEn: 'register as a Student',
    description: 'สำหรับนักศึกษาที่ต้องการหาสถานที่ฝึกงาน',
    icon: <UserOutlined style={{ fontSize: 48, color: '#8B5CF6' }} />,
    signupPath: '/sign-up',
  },
  Company: {
    title: 'สมัครในนามบริษัท',
    titleEn: 'register as a Company',
    description: 'สำหรับบริษัทที่ต้องการนักศึกษาฝึกงาน',
    icon: <TeamOutlined style={{ fontSize: 48, color: '#8B5CF6' }} />,
    signupPath: '/sign-up',
  },
  AcademicStaff: {
    title: 'สมัครในนามอาจารย์',
    titleEn: 'register as a AcademicStaff',
    description: 'ตรวจสอบการสมัครงานของนักศึกษา',
    icon: <ReadOutlined style={{ fontSize: 48, color: '#8B5CF6' }} />,
    signupPath: '/sign-up',
  },
};

const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const onGetRole = async () => {
    let res = await GetRole();
    if (res.status == 200) {
      setRoles(res.data);
    } else {
      messageApi.open({
        type: "error",
        content: "ไม่พบข้อมูล role",
      });
      setTimeout(() => {
        navigate("/sign-up");
      }, 2000);
    }
  };

  useEffect(() => {
    onGetRole();
    return () => {};
  }, []);

  const handleRoleSelect = (roleName: string) => {
    const detail = roleDetailsMap[roleName];
    setSelectedRole(roleName);
    navigate(`${detail.signupPath}?role=${roleName}`);
  };

  return (
    <>
     {contextHolder}
    <div 
     style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <Card
        style={{
          maxWidth: 1000,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: 'none',
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2} style={{ color: '#1f2937', marginBottom: 8 }}>
            สมัครใช้งานในระบบสหกิจศึกษา
          </Title>
          <Text style={{ fontSize: 16, color: '#6b7280' }}>
            Please choose your registration type:
          </Text>
        </div>

        <Row gutter={[24, 24]} justify="center">
          {roles.map((role) => {
            const detail = roleDetailsMap[role.RoleName!];
            if (!detail) return null;

            return (
              <Col xs={24} sm={12} lg={8} key={role.ID}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    borderRadius: 12,
                    border: selectedRole === role.RoleName ? '2px solid #4096FF' : '1px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                    background: selectedRole === role.RoleName ? '#faf5ff' : '#ffffff',
                  }}
                  bodyStyle={{
                    padding: '32px 24px',
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Avatar size={80} style={{ backgroundColor: '#f3f4f6', marginBottom: 16 }} icon={detail.icon} />
                    <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                      {detail.title}
                    </Title>
                    <Text style={{ color: '#6b7280', fontSize: 14 }}>
                      {detail.titleEn}
                    </Text>
                    <Text style={{ color: '#6b7280', lineHeight: 1.6 }}>
                      {detail.description}
                    </Text>
                  </Space>

                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={() => handleRoleSelect(role.RoleName!)}
                    style={{
                      marginTop: 24,
                      height: 48,
                      borderRadius: 8,
                      background: '#8B5CF6',
                      borderColor: '#8B5CF6',
                      fontSize: 16,
                      fontWeight: 500,
                    }}
                    className="role-button"
                  >
                    ลงทะเบียนเป็น{detail.title.replace("สมัครเป็น", "").replace("สมัครในนาม", "")}
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <style>{`
        .role-button:hover {
          background: #7C3AED !important;
          border-color: #7C3AED !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
        }

        .ant-card-hoverable:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
    </>
  );
};

export default RoleSelectionPage;
