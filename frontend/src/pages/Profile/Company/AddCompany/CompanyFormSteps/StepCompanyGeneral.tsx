import React, { useEffect } from 'react';
import { Form, Input, Upload, Avatar, message, Row, Col, Tooltip, Tag } from 'antd';
import { EditOutlined, FileTextOutlined, HomeOutlined, PaperClipOutlined, PictureOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
export interface StepCompanyInfoProps {
  form: FormInstance<any>;
  imageFile: File | null;
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>;
  previewUrl: string | null;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
  documentFile: File | null;
  setDocumentFile: React.Dispatch<React.SetStateAction<File | null>>;
}
const StepCompanyGeneral: React.FC<StepCompanyInfoProps> = ({
  imageFile,
  setImageFile,
  previewUrl,
  setPreviewUrl,
  documentFile,
  setDocumentFile,
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
<Row gutter={100}>
  {/* คอลัมน์ซ้าย: ชื่อบริษัท */}
  <Col span={12}>
    <Form.Item
      name="company_name"
      label="ชื่อบริษัท"
      rules={[{ required: true, message: "กรุณากรอกชื่อบริษัท" }]}
    >
      <Input placeholder="กรอกชื่อบริษัท" />
    </Form.Item>
  </Col>

  {/* คอลัมน์ขวา: อัปโหลดไฟล์ */}
<Col span={12}>
  <Form.Item
    label="ไฟล์ยืนยันบริษัท (PDF หรือ รูปภาพ)"
    required
  >
    <Upload
      showUploadList={false} // ❗ ปิดรายการไฟล์ เพื่อให้ใช้ custom UI
      beforeUpload={(file: File) => {
        const isValidType =
          file.type === "application/pdf" || file.type.startsWith("image/");
        if (!isValidType) {
          messageApi.error({
            content: "รองรับเฉพาะไฟล์ PDF หรือ รูปภาพ",
            style: { marginTop: "20vh" },
            duration: 3,
          });
          return false;
        }
        setDocumentFile(file);
        return false;
      }}
      accept=".pdf,image/*"
    >
      <div className="document-upload-button">
        <PaperClipOutlined />
        {documentFile ? "เปลี่ยนไฟล์ยืนยัน" : "คลิกเพื่ออัปโหลดไฟล์ยืนยัน"}
      </div>
    </Upload>

    {/* แสดงชื่อไฟล์ที่อัปโหลดแล้ว */}
    {documentFile && (
      <div className="uploaded-file-wrapper">
        <Tooltip title={documentFile.name}>
          <div className="uploaded-file-tag">
            {documentFile.type.startsWith('image/') ? (
              <PictureOutlined className="uploaded-file-icon" />
            ) : (
              <FileTextOutlined className="uploaded-file-icon" />
            )}
            <span className="uploaded-file-name">
              {documentFile.name.length > 30
                ? documentFile.name.slice(0, 27) + '...'
                : documentFile.name}
            </span>
          </div>
        </Tooltip>
      </div>
    )}
  </Form.Item>
</Col>

</Row>
    </>
    
  );
};

export default StepCompanyGeneral;
