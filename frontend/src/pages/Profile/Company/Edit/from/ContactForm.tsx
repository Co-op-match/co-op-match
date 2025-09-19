import React, { useEffect } from 'react';
import { Form, Input, Divider, Space } from 'antd';
import {
  GlobalOutlined,
  MailOutlined,
  LineOutlined,
  FacebookOutlined,
  PhoneOutlined,
  ContactsOutlined
} from '@ant-design/icons';

interface CompanyContactFormProps {
  form: any;
  onChange?: () => void;
  initialData?: any; // 👈 ข้อมูลเริ่มต้น เช่น company.Contact
}

const ContactForm: React.FC<CompanyContactFormProps> = ({ form, onChange, initialData }) => {
  // 🟡 เมื่อ initialData เปลี่ยน → เซตข้อมูลลงในฟอร์ม
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        website: initialData?.Contact?.website || "",
        email: initialData?.Contact?.email || "",
        line: initialData?.Contact?.line || "",
        facebook: initialData?.Contact?.facebook || "",
        phone_number: initialData?.Contact?.phone_number || "",
      });
    }
  }, [initialData, form]);

  return (
    <>
      {/* Contact Information Section */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{
          color: "#262626",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <ContactsOutlined style={{  color: "#1890ff" }} />
          ข้อมูลการติดต่อ
        </h4>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px"
        }}>
          <Form.Item
            label="เว็บไซต์"
            name="website"
            rules={[{ required: true, message: 'กรุณากรอกเว็บไซต์' }]}
          >
            <Input
              placeholder="เช่น www.website.com"
              size="large"
              prefix={<GlobalOutlined style={{ color: "#1890ff" }} />}
              onChange={onChange}
            />
          </Form.Item>

          <Form.Item
            label="อีเมล"
            name="email"
            rules={[
              { required: true, message: 'กรุณากรอกอีเมล' },
              { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
            ]}
          >
            <Input
              placeholder="เช่น example@gmail.com"
              size="large"
              prefix={<MailOutlined style={{ color: "#52c41a" }} />}
              onChange={onChange}
            />
          </Form.Item>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px"
        }}>
          <Form.Item
            label="ไลน์"
            name="line"
            rules={[{ required: true, message: 'กรุณากรอก LINE ID' }]}
          >
            <Input
              placeholder="เช่น @line123"
              size="large"
              prefix={<LineOutlined style={{ color: "#00B900" }} />}
              onChange={onChange}
            />
          </Form.Item>

          <Form.Item
            label="เฟซบุ๊ก"
            name="facebook"
            rules={[{ required: true, message: 'กรุณากรอก Facebook' }]}
          >
            <Input
              placeholder="เช่น facebook.com/yourpage"
              size="large"
              prefix={<FacebookOutlined style={{ color: "#1877f2" }} />}
              onChange={onChange}
            />
          </Form.Item>
        </div>
      </div>

      <Divider />

      {/* Phone Contact Section */}
      <div>
        <h4 style={{
          color: "#262626",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <PhoneOutlined style={{ color: "#faad14" }} />
          การติดต่อทางโทรศัพท์
        </h4>

        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Form.Item
            label="เบอร์โทรศัพท์"
            name="phone_number"
            rules={[
              { required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' },
              { pattern: /^[0-9]{9,10}$/, message: 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก' },
            ]}
          >
            <Input
              placeholder="เช่น 0930000000"
              maxLength={10}
              size="large"
              prefix={<PhoneOutlined style={{ color: "#fa8c16" }} />}
              onChange={onChange}
            />
          </Form.Item>
        </Space>
      </div>
    </>
  );
};

export default ContactForm;
