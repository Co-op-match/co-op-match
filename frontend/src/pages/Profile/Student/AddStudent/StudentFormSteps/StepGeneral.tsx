import React, { useEffect, useState } from 'react';
import { Form, Input, DatePicker, Radio, Upload, Avatar, Row, Col, message, type FormInstance } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { GetAllGender } from '../../../../../services/https';
import type { GenderInterface } from '../../../../../interfaces/Gender';
import dayjs, { Dayjs } from 'dayjs';

export interface StepGeneralInfoProps {
  form: FormInstance<any>;
  formData: any;
  genders: GenderInterface[];
  imageFile: File | null;
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>;
  previewUrl: string | null;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

const StepGeneral: React.FC<StepGeneralInfoProps> = ({
  form,
  setImageFile,
  previewUrl,
  setPreviewUrl,
}) => {
  const [genders, setGenders] = useState<GenderInterface[]>([]);
  const [messageApi] = message.useMessage();

  useEffect(() => {
    const fetchGender = async () => {
      try {
        const data = await GetAllGender();
        setGenders(data);
      } catch {
        messageApi.error({
          content: 'โหลดข้อมูลเพศไม่สำเร็จ',
          style: { marginTop: '20vh' },
          duration: 3,
        });
      }
    };
    fetchGender();
  }, []); // eslint-disable-line

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ===== Validators =====
  const validateName = (_: any, value: string) => {
    if (!value) return Promise.reject('กรุณากรอกชื่อ-นามสกุล');
    if (value.length < 2) return Promise.reject('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
    if (value.length > 50) return Promise.reject('ชื่อต้องไม่เกิน 50 ตัวอักษร');
    if (!/^[a-zA-Zก-๙\s]+$/.test(value)) return Promise.reject('ชื่อต้องเป็นตัวอักษรภาษาไทยหรือภาษาอังกฤษเท่านั้น');
    return Promise.resolve();
  };

  const validateWeight = (_: any, value: string) => {
    if (!value) return Promise.reject('กรุณากรอกน้ำหนัก');
    const weight = parseFloat(value);
    if (isNaN(weight)) return Promise.reject('น้ำหนักต้องเป็นตัวเลข');
    if (weight < 1 || weight > 500) return Promise.reject('น้ำหนักต้องอยู่ระหว่าง 1-500 กิโลกรัม');
    return Promise.resolve();
  };

  const validateHeight = (_: any, value: string) => {
    if (!value) return Promise.reject('กรุณากรอกส่วนสูง');
    const height = parseFloat(value);
    if (isNaN(height)) return Promise.reject('ส่วนสูงต้องเป็นตัวเลข');
    if (height < 30 || height > 300) return Promise.reject('ส่วนสูงต้องอยู่ระหว่าง 30-300 เซนติเมตร');
    return Promise.resolve();
  };

  const validatePhoneNumber = (_: any, value: string) => {
    if (!value) return Promise.reject('กรุณากรอกเบอร์โทรศัพท์');
    const cleanPhone = value.replace(/[\s-]/g, '');
    if (!/^[0-9+]+$/.test(cleanPhone)) return Promise.reject('เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น');
    if (cleanPhone.length < 9 || cleanPhone.length > 15) return Promise.reject('เบอร์โทรศัพท์ต้องมี 9-15 หลัก');
    if (cleanPhone.startsWith('0') && cleanPhone.length !== 10) {
      return Promise.reject('เบอร์โทรศัพท์ไทยต้องมี 10 หลักและขึ้นต้นด้วย 0');
    }
    return Promise.resolve();
  };

  const validateBirthday = (_: any, value: any) => {
    if (!value) return Promise.reject('กรุณาเลือกวันเกิด');
    const today = dayjs();
    const birthDate = dayjs(value);
    if (birthDate.isAfter(today)) return Promise.reject('วันเกิดไม่สามารถเป็นวันในอนาคตได้');
    const age = today.diff(birthDate, 'year');
    if (age > 120) return Promise.reject('อายุไม่สามารถเกิน 120 ปี');
    if (age < 0) return Promise.reject('วันเกิดไม่ถูกต้อง');
    return Promise.resolve();
  };

  const validateNationality = (_: any, value: string) => {
    if (!value) return Promise.reject('กรุณากรอกสัญชาติ');
    if (value.length < 2) return Promise.reject('สัญชาติต้องมีอย่างน้อย 2 ตัวอักษร');
    if (value.length > 30) return Promise.reject('สัญชาติต้องไม่เกิน 30 ตัวอักษร');
    if (!/^[a-zA-Zก-๙\s]+$/.test(value)) return Promise.reject('สัญชาติต้องเป็นตัวอักษรเท่านั้น');
    return Promise.resolve();
  };

  const validateReligion = (_: any, value: string) => {
    if (!value) return Promise.reject('กรุณากรอกศาสนา');
    if (value.length < 2) return Promise.reject('ศาสนาต้องมีอย่างน้อย 2 ตัวอักษร');
    if (value.length > 30) return Promise.reject('ศาสนาต้องไม่เกิน 30 ตัวอักษร');
    if (!/^[a-zA-Zก-๙\s]+$/.test(value)) return Promise.reject('ศาสนาต้องเป็นตัวอักษรเท่านั้น');
    return Promise.resolve();
  };

  // ===== คำนวณอายุจากวันเกิด =====
  const computeAge = (d?: Dayjs | null) => {
    if (!d) return undefined;
    const birth = dayjs(d);
    const age = dayjs().diff(birth, 'year'); // จำนวน "ปีเต็ม" ที่ผ่านไป
    return age < 0 ? undefined : age;
  };

  const handleBirthdayChange = (date: Dayjs | null) => {
    const age = computeAge(date);
    form.setFieldsValue({ age }); // age เป็น number (หรือ undefined ถ้าเลือกเป็นค่าว่าง)
  };

  // เฝ้าดูค่า birthday ที่อาจมาจาก initialValues / กลับมาสเต็ปนี้
  const birthdayWatch = Form.useWatch('birthday', form);
  useEffect(() => {
    const age = computeAge(birthdayWatch);
    if (typeof age === 'number') {
      form.setFieldsValue({ age });
    } else {
      form.setFieldsValue({ age: undefined });
    }
  }, [birthdayWatch, form]);

  const handleBeforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      messageApi.error({ content: 'สามารถอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น', style: { marginTop: '20vh' }, duration: 3 });
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      messageApi.error({ content: 'ขนาดไฟล์ต้องไม่เกิน 5MB', style: { marginTop: '20vh' }, duration: 3 });
      return false;
    }
    const img = new Image();
    img.onload = () => {
      if (img.width < 100 || img.height < 100) {
        messageApi.warning({ content: 'แนะนำให้ใช้รูปภาพอย่างน้อย 100x100 พิกเซล', style: { marginTop: '20vh' }, duration: 3 });
      }
    };
    img.src = URL.createObjectURL(file);

    // set preview
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    return false;
  };

  return (
    <>
      <div className="form-section-title">ข้อมูลทั่วไป</div>

      <div className="student-avatar-upload">
        <Upload showUploadList={false} beforeUpload={handleBeforeUpload} accept="image/*">
          <div className="avatar-upload-container">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="avatar-preview" />
            ) : (
              <Avatar size={120} icon={<UserOutlined />} className="avatar-default" />
            )}
            <div className="avatar-edit-icon">
              <EditOutlined />
            </div>
          </div>
        </Upload>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="gender_id" label="เพศ" rules={[{ required: true, message: 'กรุณาเลือกเพศ' }]}>
            <Radio.Group>
              {genders.map((g) => (
                <Radio key={g.ID} value={g.ID}>
                  {g.name_th}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}></Col>

        <Col span={12}>
          <Form.Item name="firstName" label="ชื่อ" rules={[{ validator: validateName }]}>
            <Input placeholder="กรอกชื่อ" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="lastName" label="นามสกุล" rules={[{ validator: validateName }]}>
            <Input placeholder="กรอกนามสกุล" />
          </Form.Item>
        </Col>

        {/* อายุ — คำนวณอัตโนมัติจากวันเกิด */}
        <Col span={12}>
          <Form.Item
            name="age"
            label="อายุ"
            rules={[{ required: true, message: 'กรุณาเลือกวันเกิดเพื่อคำนวณอายุ' }]}
          >
            <Input type="number" placeholder="อายุจะคำนวณอัตโนมัติ" disabled />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="birthday" label="วันเกิด" rules={[{ validator: validateBirthday }]}>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="เลือกวันเกิด"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
              showToday={false}
              onChange={handleBirthdayChange}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="weight" label="น้ำหนัก (กก.)" rules={[{ validator: validateWeight }]}>
            <Input type="number" placeholder="กรอกน้ำหนัก" min={1} max={500} step={0.1} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="height" label="ส่วนสูง (ซม.)" rules={[{ validator: validateHeight }]}>
            <Input type="number" placeholder="กรอกส่วนสูง" min={30} max={300} step={0.1} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="phoneNumber" label="เบอร์โทรศัพท์" rules={[{ validator: validatePhoneNumber }]}>
            <Input placeholder="กรอกเบอร์โทรศัพท์" maxLength={15} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="nationality" label="สัญชาติ" rules={[{ validator: validateNationality }]}>
            <Input placeholder="กรอกสัญชาติ" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="religion" label="ศาสนา" rules={[{ validator: validateReligion }]}>
            <Input placeholder="กรอกศาสนา" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StepGeneral;
