import { Form, Input, Button, message, Typography, Card, Steps } from "antd";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ResetPassword, SendResetPasswordEmail } from "../../../services/https";
import "../Login/login.css";

const { Title } = Typography;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [emailStepForm] = Form.useForm();
  const [otpStepForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<0 | 1>(0);
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<number | null>(null);

  // นับถอยหลังปุ่ม "ส่งรหัสอีกครั้ง"
  useEffect(() => {
    if (cooldown <= 0 && timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (cooldown > 0 && !timerRef.current) {
      timerRef.current = window.setInterval(() => {
        setCooldown((s) => s - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [cooldown]);

  const maskedEmail = useMemo(() => {
    if (!email) return "";
    const [u, d] = email.split("@");
    if (!d) return email;
    const head = u.slice(0, 2);
    const tail = u.slice(-1);
    return `${head}${"*".repeat(Math.max(1, u.length - 3))}${tail}@${d}`;
  }, [email]);

  // Step 1: ส่งอีเมลขอ OTP
  const onSendEmail = async (values: { email: string }) => {
    setLoading(true);
    try {
      await SendResetPasswordEmail(values.email);
      setEmail(values.email);
      setCurrentStep(1);
      setCooldown(60);
      otpStepForm.resetFields();
      messageApi.success("ส่งรหัสยืนยันไปยังอีเมลของคุณแล้ว");
    } catch (e: any) {
      messageApi.error(e?.message || "ไม่สามารถส่งอีเมลได้");
    } finally {
      setLoading(false);
    }
  };

  // ส่งรหัสอีกครั้ง
  const onResend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await SendResetPasswordEmail(email);
      setCooldown(60);
      messageApi.success("ส่งรหัสยืนยันอีกครั้งแล้ว");
    } catch (e: any) {
      messageApi.error(e?.message || "ส่งรหัสอีกครั้งไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: ยืนยัน OTP + ตั้งรหัสใหม่
  const onResetPassword = async (values: {
    otp: string;
    new_password: string;
    confirm_password: string;
  }) => {
    setLoading(true);
    try {
      await ResetPassword(email, values.new_password, values.otp);
      messageApi.success("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      setTimeout(() => navigate("/sign-in"), 800);
    } catch (e: any) {
      messageApi.error(e?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    } finally {
      setLoading(false);
    }
  };

  const goBackToEmailStep = () => {
    setCurrentStep(0);
    setEmail("");
    setCooldown(0);
    emailStepForm.resetFields();
    otpStepForm.resetFields();
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
          padding: 16,
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: 520,
            padding: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: 12,
          }}
        >
          <Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
            รีเซ็ตรหัสผ่าน
          </Title>

          <Steps
            current={currentStep}
            style={{ marginBottom: 24 }}
            items={[
              { title: "ส่งอีเมล", description: "กรอกอีเมลของคุณ" },
              { title: "ยืนยัน", description: "กรอกรหัสยืนยัน" },
            ]}
          />

          {/* Step 1 */}
          {currentStep === 0 && (
            <Form
              form={emailStepForm}
              layout="vertical"
              onFinish={onSendEmail}
              requiredMark="optional"
              className="signin-form"
            >
              <Form.Item
                name="email"
                label="อีเมล"
                rules={[
                  { required: true, message: "กรุณากรอกอีเมล" },
                  { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                ]}
              >
                <Input
                  placeholder="you@example.com"
                  style={{ height: 48 }}
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  className="signin-button"
                  loading={loading}
                  type="primary"
                  htmlType="submit"
                  style={{ width: "100%", height: 48 }}
                >
                  ส่งรหัสยืนยัน
                </Button>
              </Form.Item>
            </Form>
          )}

          {/* Step 2 */}
          {currentStep === 1 && (
            <Form
              form={otpStepForm}
              layout="vertical"
              onFinish={onResetPassword}
              requiredMark="optional"
              className="signin-form"
            >
              <div style={{ marginBottom: 12, textAlign: "center", color: "#666" }}>
                ส่งรหัสยืนยันไปยัง: <strong>{maskedEmail}</strong>
              </div>

              <Form.Item
                name="otp"
                label="รหัสยืนยัน (OTP)"
                rules={[
                  { required: true, message: "กรุณากรอกรหัสยืนยัน" },
                  { len: 6, message: "รหัสยืนยันต้องมี 6 หลัก" },
                  {
                    validator: (_, v) =>
                      v && /^\d{6}$/.test(v)
                        ? Promise.resolve()
                        : Promise.reject("ใส่ได้เฉพาะตัวเลข 6 หลัก"),
                  },
                ]}
              >
                <Input
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  style={{
                    height: 48,
                    textAlign: "center",
                    fontSize: 18,
                    letterSpacing: 4,
                  }}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, "");
                    if (onlyDigits !== e.target.value) {
                      otpStepForm.setFieldsValue({ otp: onlyDigits });
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                name="new_password"
                label="รหัสผ่านใหม่"
                rules={[
                  { required: true, message: "กรุณากรอกรหัสผ่านใหม่" },
                  { min: 6, message: "ต้องมีอย่างน้อย 6 ตัวอักษร" },
                ]}
              >
                <Input.Password
                  placeholder="New password"
                  style={{ height: 48 }}
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="confirm_password"
                label="ยืนยันรหัสผ่าน"
                dependencies={["new_password"]}
                rules={[
                  { required: true, message: "กรุณายืนยันรหัสผ่าน" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("new_password") === value)
                        return Promise.resolve();
                      return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน"));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="Confirm new password"
                  style={{ height: 48 }}
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  className="signin-button"
                  loading={loading}
                  type="primary"
                  htmlType="submit"
                  style={{ width: "100%", height: 48, marginBottom: 8 }}
                >
                  เปลี่ยนรหัสผ่าน
                </Button>

                <Button
                  type="default"
                  onClick={onResend}
                  disabled={loading || cooldown > 0}
                  style={{ width: "100%", height: 44, marginBottom: 8 }}
                >
                  {cooldown > 0
                    ? `ส่งรหัสอีกครั้งใน ${cooldown}s`
                    : "ส่งรหัสอีกครั้ง"}
                </Button>

                <Button
                  type="link"
                  onClick={goBackToEmailStep}
                  style={{ width: "100%", height: 40 }}
                >
                  กลับไปแก้ไขอีเมล
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </>
  );
}
export default ResetPasswordPage;

