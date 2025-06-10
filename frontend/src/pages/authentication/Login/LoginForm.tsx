import { Button, Checkbox, Form, Input, Typography,message } from "antd";
import { FacebookOutlined, TwitterOutlined } from "@ant-design/icons";
import { SignIn } from "../../../services/https";
import type { SignInInterface } from "../../../interfaces/auth/SignIn";
import "./login.css";
import { useNavigate } from "react-router-dom";

const { Title, Text, Link } = Typography;

function LoginForm() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const onFinish = async (values: SignInInterface) => {
    let res = await SignIn(values);
    if (res.status === 200) {
      // Debug response data
      console.log("Response data:", res.data);
      console.log("RoleId from backend:", res.data.roleId);
      messageApi.success("Sign-in successful");
      localStorage.setItem("isLogin", "true");
      localStorage.setItem("token_type", res.data.token_type);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("id", res.data.id);
      localStorage.setItem("role", res.data.role);

      setTimeout(() => {
          const roleId = res.data.roleId;
          
          console.log("Navigating with role:", "roleId:", roleId);
          // ลอง navigate ด้วย roleId ก่อน
          switch (roleId) {
            case 1:
              navigate('/admin/dashboard');
              break;
            case 2:
              navigate('/company/dashboard');
              break;
            case 3:
              navigate('/student/dashboard');
              break;
            case 4:
              navigate('/lecturer/dashboard');
            break;
            default:
              console.log("Unknown role:", "roleId:", roleId);
              // navigate to login page instead of root
              navigate('/sign-in');
              }
          
        }, 1000);
    } else {
      messageApi.error(res.data.error);
    }
  };


  return (
    <>
      {contextHolder}
    <div className="login-page">
      <div className="signin-container">
        {/* Left Image Section */}
        <div className="signin-left"></div>

        {/* Right Form Section */}
        <div className="signin-right">
            {/* ปุ่มกลับสู่หน้าหลัก */}
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
            <Title level={2} className="signin-title">Sign In</Title>

            <div className="signin-social-icons">
              <Button
                shape="circle"
                icon={<FacebookOutlined />}
                className="social-btn"
              />
              <Button
                shape="circle"
                icon={<TwitterOutlined />}
                className="social-btn"
              />
            </div>
          </div>

          <Form
            name="signin"
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
              ]}
            >
              <Input.Password placeholder="Password" style={{ height: 50 }} />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="signin-button"
              >
                Sign In
              </Button>
            </Form.Item>

            <div className="signin-options">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember Me</Checkbox>
              </Form.Item>
              <Link href="#">Forgot Password</Link>
            </div>

            <div className="signup-link">
              <Text>
                Don't have an account? <a onClick={() => navigate("/role-select")}>Sign Up</a>
              </Text>
            </div>
          </Form>
        </div>
      </div>
    </div>
    </>
  );
}

export default LoginForm;
