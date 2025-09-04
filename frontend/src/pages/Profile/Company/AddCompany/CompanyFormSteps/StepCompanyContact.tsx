import React from 'react';
import { Form, Input } from 'antd';
import type { FormInstance } from 'antd';

export interface StepCompanyContactProps {
  form: FormInstance<any>;
  formData: any;
}

const StepCompanyContact: React.FC<StepCompanyContactProps> = ({ }) => {
  // ===== Helpers =====
  const trim = (v: any) => (typeof v === 'string' ? v.trim() : v);

  // เว็บไซต์: รองรับ http/https หรือไม่มีโปรโตคอลก็ได้ (เช่น www.example.com / example.co.th/path)
  const validateWebsite = (_: any, value: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกเว็บไซต์');

    // อนุโลมไม่มีโปรโตคอล แต่ต้องเป็นโดเมนถูกต้อง
    const re =
      /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;

    return re.test(v)
      ? Promise.resolve()
      : Promise.reject('รูปแบบเว็บไซต์ไม่ถูกต้อง (ตัวอย่าง: https://example.com)');
  };

  // อีเมล: ใช้ rule type + กันช่องว่าง/ความยาว
  const validateEmail = (_: any, value: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกอีเมล');
    if (v.length > 100) return Promise.reject('อีเมลต้องไม่เกิน 100 ตัวอักษร');
    // ให้ antd ตรวจ type อีกชั้นผ่าน rule type: 'email'
    return Promise.resolve();
  };

  // ไลน์ไอดี: อนุโลม @ ข้างหน้าได้ และรองรับ a-z0-9._- ความยาว 3–50
  const validateLine = (_: any, value: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกไลน์');
    if (!/^@?[a-zA-Z0-9._-]{3,50}$/.test(v)) {
      return Promise.reject('รูปแบบไลน์ไม่ถูกต้อง (ใช้ตัวอักษร/ตัวเลข/._- 3–50 ตัว อนุโลม @ นำหน้า)');
    }
    return Promise.resolve();
  };

  // เฟซบุ๊ก: อนุโลมเป็น URL facebook หรือเป็นชื่อเพจ (ตัวอักษร/ตัวเลข/จุด) 5–50 ตัว
  const validateFacebook = (_: any, value: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกเฟสบุ๊ค');

    const isFbUrl = /^(https?:\/\/)?(www\.)?facebook\.com\/[A-Za-z0-9\.]+\/?$/i.test(v);
    const isPageName = /^[A-Za-z0-9\.]{5,50}$/.test(v);

    return isFbUrl || isPageName
      ? Promise.resolve()
      : Promise.reject('กรุณากรอกเป็นลิงก์ facebook.com/… หรือชื่อเพจ (ตัวอักษร/ตัวเลข/.) 5–50 ตัว');
  };

  // เบอร์โทร: รองรับรูปแบบไทย 0XXXXXXXXX (10 หลัก) หรือ +66XXXXXXXXX (ไม่มีขีด/ช่องว่างก็ได้)
  const validatePhone = (_: any, value: string) => {
    const raw = (value || '').trim();
    if (!raw) return Promise.reject('กรุณากรอกเบอร์');

    const v = raw.replace(/[\s-]/g, ''); // ตัดช่องว่างและขีด
    const re = /^(\+66\d{9}|0\d{9})$/;

    return re.test(v)
      ? Promise.resolve()
      : Promise.reject('กรุณากรอกเบอร์ให้ถูกต้อง (เช่น 0912345678 หรือ +66912345678)');
  };

  return (
    <div>
      <div
        className="form-section-title"
        style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}
      >
        ข้อมูลติดต่อ
      </div>

      <Form.Item
        name="website"
        label="เว็บไซต์"
        normalize={trim}
        validateTrigger="onBlur"
        rules={[ { validator: validateWebsite }]}
      >
        <Input placeholder="เช่น www.website.com" maxLength={150} />
      </Form.Item>

      <Form.Item
        name="email"
        label="อีเมล"
        normalize={trim}
        validateTrigger="onBlur"
        rules={[
          { required: true, message: 'กรุณากรอกอีเมล' },
          { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' },
          { validator: validateEmail },
        ]}
      >
        <Input placeholder="เช่น example@gmail.com" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="line"
        label="ไลน์"
        normalize={trim}
        validateTrigger="onBlur"
        rules={[ { validator: validateLine }]}
      >
        <Input placeholder="เช่น @line123" maxLength={50} />
      </Form.Item>

      <Form.Item
        name="facebook"
        label="เฟสบุ๊ค"
        normalize={trim}
        validateTrigger="onBlur"
        rules={[ { validator: validateFacebook }]}
      >
        <Input placeholder="เช่น your.page" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="phone_number"
        label="เบอร์"
        normalize={trim}
        validateTrigger="onBlur"
        rules={[ { validator: validatePhone }]}
      >
        <Input placeholder="เช่น 0912345678 หรือ +66912345678" maxLength={16} />
      </Form.Item>
    </div>
  );
};

export default StepCompanyContact;
