import React, { useEffect } from 'react';
import { Form, Input, Upload, Avatar, message } from 'antd';
import { EditOutlined, HomeOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';

export interface StepCompanyInfoProps {
  form: FormInstance<any>;
  imageFile: File | null;
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>;
  previewUrl: string | null;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

const StepCompanyGeneral: React.FC<StepCompanyInfoProps> = ({
  setImageFile,
  previewUrl,
  setPreviewUrl,
  imageFile,
}) => {
  const [messageApi, contextHolder] = message.useMessage();

useEffect(() => {
  // ทุกครั้งที่ mount แล้วมีไฟล์ → สร้าง preview ใหม่
  if (imageFile) {
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url); // ✅ cleanup blob เก่า
    };
  }
}, [imageFile]);

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
      {contextHolder}
      <div className="form-section-title">ข้อมูลบริษัท</div>

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
              <Avatar size={120} icon={<HomeOutlined />} className="avatar-default" />
            )}
            <div className="avatar-edit-icon">
              <EditOutlined />
            </div>
          </div>
        </Upload>
      </div>

      <Form.Item
        name="company_name"
        label="ชื่อบริษัท"
        rules={[{ required: true, message: 'กรุณากรอกชื่อบริษัท' }]}
      >
        <Input placeholder="กรอกชื่อบริษัท" />
      </Form.Item>
    </>
  );
};

export default StepCompanyGeneral;
