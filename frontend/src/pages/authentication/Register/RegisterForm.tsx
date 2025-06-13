import React, { useEffect, useState } from 'react';
import { Button, Form, Input, message, Typography } from 'antd';
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import type { UsersInterface } from '../../../interfaces/auth/IUser';
import { CreateUser } from '../../../services/https';
const { Title, Text } = Typography;

interface LocationState {
  role?: string;
  roleTitle?: string;
  roleDescription?: string;
}

// Role mapping สำหรับ navigation
const roleRouteMap: Record<string, string> = {
  'Student': '/student/dashboard',
  'Company': '/company/dashboard',
  'AcademicStaff': '/lecturer/dashboard',
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [roleData, setRoleData] = useState<LocationState>({});
  const [loading, setLoading] = useState(false);


  // รับ role จากหลายแหล่ง (state, URL params, localStorage)
  useEffect(() => {
    let role = '';
    let roleTitle = '';
    let roleDescription = '';

    // 1. ลองดึงจาก location.state ก่อน (จาก navigate state)
    const state = location.state as LocationState;
    if (state?.role) {
      role = state.role;
      roleTitle = state.roleTitle || '';
      roleDescription = state.roleDescription || '';
    }
    
    // 2. ถ้าไม่มี ลองดึงจาก URL parameters
    else if (searchParams.get('role')) {
      role = searchParams.get('role') || '';
      // ถ้าเป็น URL param อาจจะต้องแปลง roleTitle เอง
      const roleDetailsMap: Record<string, string> = {
        'Student': 'สมัครเป็นนักศึกษา',
        'Company': 'สมัครในนามบริษัท',
        'AcademicStaff': 'สมัครในนามอาจารย์',
      };
      roleTitle = roleDetailsMap[role] || '';
    }
    
    // 3. สุดท้าย ลองดึงจาก localStorage (ถ้ามี)
    else {
      try {
        const savedRole = localStorage.getItem('selectedRole');
        if (savedRole) {
          const parsed = JSON.parse(savedRole);
          role = parsed.role || '';
          roleTitle = parsed.roleTitle || '';
          roleDescription = parsed.roleDescription || '';
        }
      } catch (error) {
        console.warn('Error parsing saved role:', error);
      }
    }

    setRoleData({ role, roleTitle, roleDescription });
  }, [location.state, searchParams]);

  const onFinish = async (values: UsersInterface) => {
    console.log('Form values:', values);
    console.log('Role selected:', roleData.role);
    
    // ตรวจสอบว่ามี role หรือไม่
    if (!roleData.role) {
      messageApi.open({
        type: "error",
        content: "Role is required. Please select a role first.",
      });
      return;
    }

    // เตรียมข้อมูลที่จะส่ง - ใช้ field names ตรงกับ backend struct
    const payload = {
      email: String(values.email || '').trim(),
      password: String(values.password || '').trim(),
      confirm_password: String(values.confirm_password || '').trim(),
      role: String(roleData.role || '').trim(),
    };

    // ตรวจสอบข้อมูลก่อนส่ง
    if (!payload.email) {
      messageApi.open({
        type: "error",
        content: "Email is required!",
      });
      return;
    }

    if (!payload.password) {
      messageApi.open({
        type: "error",
        content: "Password is required!",
      });
      return;
    }

    if (!payload.confirm_password) {
      messageApi.open({
        type: "error",
        content: "Please confirm your password!",
      });
      return;
    }

    if (!payload.role) {
      messageApi.open({
        type: "error",
        content: "Role is required!",
      });
      return;
    }

    // ตรวจสอบว่า password ตรงกัน
    if (payload.password !== payload.confirm_password) {
      messageApi.open({
        type: "error",
        content: "Passwords do not match!",
      });
      return;
    }

    console.log('Payload to send:', payload);
    console.log('Payload JSON:', JSON.stringify(payload, null, 2));

    try {
      setLoading(true);
      let res = await CreateUser(payload);
      setLoading(false);
      console.log('Response:', res);

      if (res.status === 201) {
        messageApi.open({
          type: "success",
          content: res.data.message,
        });

        // ลบข้อมูล role ที่เก็บไว้ใน localStorage (ถ้ามี)
        localStorage.removeItem('selectedRole');

        setTimeout(() => {
          // ใช้ mapping สำหรับ navigation
          const dashboardRoute = roleRouteMap[roleData.role!];
          if (dashboardRoute) {
            navigate(dashboardRoute);
          } else {
            navigate("/"); // fallback
          }
        }, 1500);
      } else {
        messageApi.open({
          type: "error",
          content: res.data.error,
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      messageApi.open({
        type: "error",
        content: "Registration failed. Please try again.",
      });
    }
  };

  // ถ้าไม่มี role redirect กลับไปเลือก role
  if (!roleData.role) {
    return (
      <>
        {contextHolder}
        <div className="login-page">
          <div className="signin-container">
            <div className="signin-right">
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Title level={3}>Please select a role first</Title>
                <Text type="secondary">
                  You need to select a role before registering.
                </Text>
                <br />
                <Button 
                  type="primary" 
                  onClick={() => navigate("/")}
                  style={{ marginTop: 16 }}
                >
                  Go back to select role
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="login-page">
        <div className="signin-container">
          <div className="signin-left"></div>

          <div className="signin-right">
            <div style={{ marginBottom: 16 }}>
              <Button
                type="link"
                onClick={() => navigate("/student/dashboard")}
                style={{ color: "#888888" }}
              >
                &lt; กลับสู่หน้าหลัก
              </Button>
            </div>

            <div className="signin-header">
              <Title level={3} className="signin-title">
                Register {roleData.roleTitle ? `- ${roleData.roleTitle.replace('สมัครเป็น', '').replace('สมัครในนาม', '')}` : ''}
              </Title>
              {roleData.roleDescription && (
                <Text type="secondary">{roleData.roleDescription}</Text>
              )}
            </div>

            <Form
              name="register"
              layout="vertical"
              onFinish={onFinish}
              className="signin-form"
              autoComplete="off"
              requiredMark="optional"
            >
              <Form.Item
                label="EMAIL"
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Please input your email!",
                  },
                  {
                    type: "email",
                    message: "Please enter a valid email!",
                  },
                ]}
              >
                <Input placeholder="Email" style={{ height: 50 }} />
              </Form.Item>

              <Form.Item
                label="PASSWORD"
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Please input your password!",
                  },
                  {
                    min: 6,
                    message: "Password must be at least 6 characters!",
                  },
                ]}
              >
                <Input.Password placeholder="Password" style={{ height: 50 }} />
              </Form.Item>

              <Form.Item
                label="CONFIRM PASSWORD"
                name="confirm_password"
                dependencies={['password']}
                rules={[
                  {
                    required: true,
                    message: 'Please confirm your password!',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm Password" style={{ height: 50 }} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="signin-button"
                  loading={loading}     
                >
                  Register as {roleData.role}
                </Button>
              </Form.Item>

              <div className="signup-link">
                <Text>
                  Already have an account? <a onClick={() => navigate("/sign-in")}>Sign In</a>
                </Text>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;