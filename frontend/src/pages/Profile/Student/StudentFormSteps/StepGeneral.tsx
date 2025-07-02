import React, { useEffect, useState } from 'react';
import { Form, Input, DatePicker, Radio, Upload, Avatar, Row, Col, message, type FormInstance } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { GetAllGender } from '../../../../services/https';
import type { GenderInterface } from '../../../../interfaces/Gender';

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
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleBeforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      messageApi.error({
        content: 'สามารถอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น',
        style: { marginTop: '20vh' },
        duration: 3,
      });
      return false;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    return false;
  };

  return (
    <>
      <div className="form-section-title">ข้อมูลทั่วไป</div>

      <div className="student-avatar-upload">
        <Upload
          showUploadList={false}
          beforeUpload={handleBeforeUpload}
          accept="image/*"
        >
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
          <Form.Item name="gender_id" label="เพศ" rules={[{ required: true }]}>
            <Radio.Group>
              {genders.map((g) => (
                <Radio key={g.ID} value={g.ID}>
                  {g.name}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}></Col>

        <Col span={12}><Form.Item name="firstName" label="ชื่อ" rules={[{ required: true }]}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name="lastName" label="นามสกุล" rules={[{ required: true }]}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name="age" label="อายุ" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
        <Col span={12}><Form.Item name="birthday" label="วันเกิด" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
        <Col span={12}><Form.Item name="weight" label="น้ำหนัก" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
        <Col span={12}><Form.Item name="height" label="ส่วนสูง" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
        <Col span={12}><Form.Item name="phoneNumber" label="เบอร์โทร" rules={[{ required: true }]}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name="nationality" label="สัญชาติ" rules={[{ required: true }]}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name="religion" label="ศาสนา" rules={[{ required: true }]}><Input /></Form.Item></Col>
      </Row>
    </>
  );
};

export default StepGeneral;
