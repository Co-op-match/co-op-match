import React from 'react';
import { Form, Input } from 'antd';
import type { FormInstance } from 'antd';

export interface StepAcadamicStaffContactProps {
  form: FormInstance<any>;
  formData: any;
}

const StepAcadamicStaffContact: React.FC<StepAcadamicStaffContactProps> = ({}) => {
  // ===== helpers =====
  const trimNorm = (v: any) => (typeof v === 'string' ? v.trim() : v);

  const validateWebsite = async (_: any, value?: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกเว็บไซต์');

    // ยอมรับทั้งแบบมี/ไม่มี http(s)
    const re =
      /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}([\/?#].*)?$/;
    if (!re.test(v)) {
      return Promise.reject('รูปแบบเว็บไซต์ไม่ถูกต้อง (เช่น https://example.com)');
    }
    return Promise.resolve();
  };

  const validateEmail = async (_: any, value?: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกอีเมล');
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(v)) return Promise.reject('รูปแบบอีเมลไม่ถูกต้อง');
    return Promise.resolve();
  };

  const validateLine = async (_: any, value?: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกไลน์');

    // อนุญาต @ นำหน้าได้, 3–30 ตัว, ใช้ตัวอักษร/ตัวเลข/._-
    const re = /^@?[a-zA-Z0-9._-]{3,30}$/;
    if (!re.test(v)) return Promise.reject('รูปแบบ LINE ID ไม่ถูกต้อง (เช่น @line123)');
    return Promise.resolve();
  };

  const validateFacebook = async (_: any, value?: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกเฟสบุ๊ค');

    // ยอมรับทั้ง URL facebook หรือ page/username
    const isUrl = /^(https?:\/\/)?(www\.)?facebook\.com\/[A-Za-z0-9\. _\-\/?=&#]+$/.test(v);
    const isUsername = /^[A-Za-z0-9.\-_]{5,50}$/.test(v);
    if (!isUrl && !isUsername) {
      return Promise.reject('กรุณากรอกลิงก์หรือชื่อเพจ/ผู้ใช้ Facebook ให้ถูกต้อง');
    }
    return Promise.resolve();
  };

  const validatePhone = async (_: any, value?: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกเบอร์โทรศัพท์');

    // ลบช่องว่าง/ขีดออกก่อนตรวจ
    const clean = v.replace(/[\s-]/g, '');
    // ไทย: 0XXXXXXXXX (10 หลัก) หรือสากล: + ตามด้วย 9–15 หลัก
    const reThai = /^0\d{9}$/;
    const reIntl = /^\+[0-9]{9,15}$/;

    if (!(reThai.test(clean) || reIntl.test(clean))) {
      return Promise.reject('รูปแบบเบอร์ไม่ถูกต้อง (เช่น 0912345678 หรือ +66812345678)');
    }
    return Promise.resolve();
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
        validateTrigger={['onBlur']}
        normalize={trimNorm}
        rules={[{ validator: validateWebsite }]}
        extra="เช่น https://company.co.th หรือ company.co.th"
      >
        <Input placeholder="เช่น https://www.website.com" allowClear />
      </Form.Item>

      <Form.Item
        name="email"
        label="อีเมล"
        validateTrigger={['onBlur']}
        normalize={trimNorm}
        rules={[{ validator: validateEmail }]}
      >
        <Input placeholder="เช่น example@gmail.com" allowClear />
      </Form.Item>

      <Form.Item
        name="line"
        label="ไลน์"
        validateTrigger={['onBlur']}
        normalize={trimNorm}
        rules={[{ validator: validateLine }]}
        extra="อนุญาต @ นำหน้าได้ ความยาว 3–30 ตัวอักษร"
      >
        <Input placeholder="เช่น @line123" allowClear />
      </Form.Item>

      <Form.Item
        name="facebook"
        label="เฟสบุ๊ค"
        validateTrigger={['onBlur']}
        normalize={trimNorm}
        rules={[{ validator: validateFacebook }]}
        extra="ใส่ URL (facebook.com/...) หรือชื่อเพจ/ผู้ใช้"
      >
        <Input placeholder="เช่น yourpage" allowClear />
      </Form.Item>

      <Form.Item
        name="phone_number"
        label="เบอร์"
        validateTrigger={['onBlur']}
        normalize={trimNorm}
        rules={[{ validator: validatePhone }]}
        extra="เช่น 0912345678 หรือ +66812345678"
      >
        <Input placeholder="เช่น 093-0000000" allowClear />
      </Form.Item>
    </div>
  );
};

export default StepAcadamicStaffContact;
