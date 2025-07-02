import { ResetPassword } from "../../../services/https";
import { Form, Input, Button, message, Typography, Card } from "antd";
import { useNavigate } from "react-router-dom";
import "../Login/login.css"
import { useState } from "react";
const { Title } = Typography;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; new_password: string }) => {
  setLoading(true);
  try {
    const resData = await ResetPassword(values.email, values.new_password);
    console.log("Response data:", resData);

    messageApi.success("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");

    setTimeout(() => {
      navigate("/sign-in");
    }, 1000); 
  } catch (error: any) {
    messageApi.error(error.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
  }
  setLoading(false);
  };

  return (
    <>
      {contextHolder}

    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center", 
        alignItems: "center",     
        backgroundColor: "#f5f5f5", 
      }}
    >
      <Card
        style={{
          width: "50%",
          maxWidth: 500,
          padding: 32,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          borderRadius: 12,
        }}
      >
        <Title level={3} style={{ textAlign: "center" }}>
          Reset Password
        </Title>
        <Form form={form} layout="vertical" onFinish={onFinish}   requiredMark="optional"   className="signin-form" >
          <Form.Item
            name="email"
            label="EMAIL"
            
            rules={[
              { required: true, message: "กรุณากรอกอีเมล" },
              { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
            ]}
          >
            <Input placeholder="Email" style={{ height: 50 }}/>
          </Form.Item>

          <Form.Item
            name="new_password"
            label="NEW PASSWORD"
            rules={[
              { required: true, message: "กรุณากรอกรหัสผ่านใหม่" },
              { min: 6, message: "ต้องมีอย่างน้อย 6 ตัวอักษร" },
            ]}
          >
            <Input.Password placeholder="New Password" style={{ height: 50 }}/>
          </Form.Item>

          <Form.Item>
            <Button className="signin-button" loading={loading} type="primary" htmlType="submit" style={{ width: "100%", height: 50 }}>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
    </>
  );
}

export default ResetPasswordPage;
