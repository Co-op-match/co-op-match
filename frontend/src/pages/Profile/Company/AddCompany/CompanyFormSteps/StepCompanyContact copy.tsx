import React from 'react';
import { Form, Input } from 'antd';
import type { FormInstance } from 'antd';

export interface StepCompanyContactProps {
  form: FormInstance<any>;
  formData: any;
}

const StepCompanyContact1: React.FC<StepCompanyContactProps> = ({ }) => {
  return (
    <div>
      <div
        className="form-section-title"
        style={{ fontSize: 20, fontWeight: "bold", marginBottom: 24 }}
      >
        ข้อมูลติดต่อ
      </div>
        <Form.Item
          name="website"
          label="เว็บไซต์"
          validateTrigger="none"
          rules={[{ required: true, message: 'กรุณากรอกเว็บไซต์' }]}
        >
          <Input placeholder="เช่น www.website.com" />
        </Form.Item>
        <Form.Item name="email" label="อีเมล" rules={[{ required: true }]}>
          <Input placeholder="เช่น example@gmail.com" />
        </Form.Item>
        <Form.Item name="line" label="ไลน์" rules={[{ required: true }]}>
          <Input placeholder="เช่น @line123" />
        </Form.Item>
        <Form.Item name="facebook" label="เฟสบุ๊ค" rules={[{ required: true }]}>
          <Input placeholder="เช่น facebook" />
        </Form.Item>
        <Form.Item name="phone_number" label="เบอร์" rules={[{ required: true }]}>
          <Input placeholder="เช่น 093-0000000" />
        </Form.Item>
    </div>
  );
};

export default StepCompanyContact1;
