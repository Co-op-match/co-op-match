import React, { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Typography, Space, Avatar, message } from 'antd';
import { UserOutlined, TeamOutlined, ReadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { GetRole } from '../../../services/https';
import type { RoleInterface } from '../../../interfaces/auth/Roles';
import { CoopMatchLoader } from '../../../components/loaders';
const { Title, Text } = Typography;

const roleDetailsMap: Record<string, {
  title: string;
  titleEn: string;
  description: string;
  icon: React.ReactNode;
  signupPath: string;
}> = {
  Student: {
    title: 'สมัครในนามนักศึกษา',
    titleEn: 'Student Registration',
    description: 'Student co-op opportunities',
    icon: <UserOutlined style={{ fontSize: 48, color: '#1677ff' }} />,
    signupPath: '/sign-up',
  },
  Company: {
    title: 'สมัครในนามบริษัท',
    titleEn: 'Company Registration',
    description: 'Find student interns',
    icon: <TeamOutlined style={{ fontSize: 48, color: '#1677ff' }} />,
    signupPath: '/sign-up',
  },
  AcademicStaff: {
    title: 'สมัครในนามอาจารย์',
    titleEn: 'Academic Staff Registration',
    description: 'Monitor student internships',
    icon: <ReadOutlined style={{ fontSize: 48, color: '#1677ff' }} />,
    signupPath: '/sign-up',
  },
};

function RoleSelectionPage(){
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const onGetRole = async () => {
    setLoading(true);
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
    setLoading(false);
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

  if (loading) {
    return <CoopMatchLoader overlay text="กำลังโหลดข้อมูลบทบาท..." />;
  }

  return (
    <>
     {contextHolder}
    <div 
     style={{
      minHeight: '100vh',
      //background: 'linear-gradient(135deg, #001d66 0%, #002c8c 100%)',
      background: 'linear-gradient(135deg, #fefefe 0%, #ededed 50%, #c9c9c9 100%)',
      //background: 'linear-gradient(135deg, #2a81fb 0%, #001d66 100%)',
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
          background:'#fafafa',
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <Button
          type="link"
          onClick={() => navigate("/")}  // 👈 กลับไปหน้า landing
          style={{ color: "#888888" }}
        >
          &lt; Back
        </Button>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2} style={{ color: '#1f2937', marginBottom: 8 }}>
            สมัครใช้งานในระบบสหกิจศึกษา
          </Title>
          <Text style={{ fontSize: 16, color: '#6b7280' }}>
            Please select your registration type:
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
                    background: selectedRole === role.RoleName ? '#faf5ff' : '#fafafa',
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
                      background: '#1677ff',
                      borderColor: '#1677ff',
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
          background: #0958d9 !important;
          border-color: #0958d9 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(35, 83, 186, 0.3);
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
