import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button, Checkbox, Form, Input, Typography, message } from "antd";
import { FacebookOutlined, TwitterOutlined } from "@ant-design/icons";
import { GetUserByIdhaveStatusData, SignIn } from "../../../services/https";
import type { SignInInterface } from "../../../interfaces/auth/SignIn";
import "./login.css";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../../../components/UserContext";

const { Title, Text, Link } = Typography;

function LoginForm() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const { refetchUser } = useContext(UserContext);

  const location = useLocation();

  // อ่านค่าจาก localStorage ครั้งเดียวเพื่อใช้เป็น dependency ที่นิ่ง
  const ls = useMemo(() => ({
    isLogin: localStorage.getItem("isLogin") === "true",
    roleId: localStorage.getItem("roleId"),
    userID: Number(localStorage.getItem("id")),
  }), []);

  const didRedirectRef = useRef(false); // กัน navigate ซ้ำ

  const fetchIsStuckUser = async (): Promise<boolean> => {
    if (!ls.userID || Number.isNaN(ls.userID)) return false;
    try {
      const res = await GetUserByIdhaveStatusData(ls.userID);
      // ถ้า service คืน axios response:
      if (res?.status === 200) return true;
      // ถ้าคืน data ตรง ให้ปรับเป็น: if (res) return true;
      messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง!!!");
      return false;
    } catch (err) {
      console.error("Failed to fetch user", err);
      return false;
    }
  };

  useEffect(() => {
    // เงื่อนไข: อยู่หน้า /sign-in + เคย login + มี role
    if (location.pathname !== "/sign-in") return;
    if (!ls.isLogin || !ls.roleId) return;
    if (didRedirectRef.current) return;

    (async () => {
      const ok = await fetchIsStuckUser();
      if (!ok) return;

      didRedirectRef.current = true;
      switch (parseInt(ls.roleId!)) {
        case 1:
          navigate("/admin/dashboard");
          break;
        case 2:
          navigate("/company/dashboard");
          break;
        case 3:
          navigate("/student/dashboard");
          break;
        case 4:
          navigate("/lecturer/dashboard");
          break;
        default:
          navigate("/");
      }
    })();
  }, [navigate, location.pathname]);

  const onFinish = async (values: SignInInterface) => {
    setLoading(true);
    let res = await SignIn(values);
    setLoading(false);

    if (res.status === 200) {
      console.log("Response data:", res.data);

      messageApi.success("Sign-in successful");

      // Save data to localStorage
      localStorage.setItem("isLogin", "true");
      localStorage.setItem("token_type", res.data.token_type);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("id", res.data.id);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("roleId", res.data.roleId); 
      refetchUser(); 

      setTimeout(() => {
        const roleId = res.data.roleId;

        switch (roleId) {
          case 1:
            navigate("/admin/dashboard");
            break;
          case 2:
            navigate("/company/dashboard");
            break;
          case 3:
            navigate("/student/dashboard");
            break;
          case 4:
            navigate("/lecturer/dashboard");
            break;
          default:
            console.log("Unknown roleId:", roleId);
            navigate("/sign-in");
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
            {/* ปุ่มกลับ */}
            <div style={{ marginBottom: 16 }}>
              <Button
                type="link"
                onClick={() => navigate("/")}
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
                  {
                    type: "email",
                    message: "Invalid email format",
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
                  loading={loading}     
                >
                  Sign In
                </Button>
              </Form.Item>

              <div className="signin-options">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember Me</Checkbox>
                </Form.Item>
                <Link onClick={() => navigate("/reset-password")}>Forgot Password</Link>
              </div>

              <div className="signup-link">
                <Text>
                  Don't have an account?{" "}
                  <a onClick={() => navigate("/role-select")}>Sign Up</a>
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