import React, { useEffect } from 'react';
import { Form, Input, Upload, Avatar, message, Row, Col, Tooltip } from 'antd';
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
    // สร้าง/ล้าง preview ให้ถูกต้อง
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile, setPreviewUrl]);

  // ===== Validators / Normalizers =====
  const trim = (v: any) => (typeof v === 'string' ? v.trim() : v);

  // ชื่อบริษัท: ไทย/อังกฤษ/ตัวเลข และอักขระทั่วไป &,.-()/  ความยาว 2–100
  const validateCompanyName = (_: any, value: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกชื่อบริษัท');
    if (v.length < 2) return Promise.reject('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
    if (v.length > 100) return Promise.reject('ชื่อบริษัทต้องไม่เกิน 100 ตัวอักษร');
    const re = /^[A-Za-zก-๙0-9&().,/\-\s]+$/u;
    return re.test(v) ? Promise.resolve() : Promise.reject('รูปแบบชื่อบริษัทไม่ถูกต้อง');
  };

  // อัปโหลดโลโก้ (รูปเท่านั้น, ≤ 5MB)
  const handleBeforeUploadLogo = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      messageApi.error({ content: 'อัปโหลดได้เฉพาะไฟล์รูปภาพ', style: { marginTop: '20vh' }, duration: 3 });
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 <= 5;
    if (!isLt5M) {
      messageApi.error({ content: 'ขนาดรูปต้องไม่เกิน 5MB', style: { marginTop: '20vh' }, duration: 3 });
      return false;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    return false; // ไม่อัปโหลดจริง (ควบคุมเอง)
  };

  // อัปโหลดไฟล์ยืนยัน (PDF หรือ รูป, ≤ 10MB)
  const handleBeforeUploadDoc = (file: File) => {
    const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
    if (!isValidType) {
      messageApi.error({ content: 'รองรับเฉพาะไฟล์ PDF หรือ รูปภาพ', style: { marginTop: '20vh' }, duration: 3 });
      return false;
    }
    const isLt10M = file.size / 1024 / 1024 <= 10;
    if (!isLt10M) {
      messageApi.error({ content: 'ขนาดไฟล์ต้องไม่เกิน 10MB', style: { marginTop: '20vh' }, duration: 3 });
      return false;
    }
    setDocumentFile(file);
    return false; // ควบคุมเอง
  };

  // ผูก validation กับ state (ให้ form.validateFields จับได้)
  const validateLogoRequired = () =>
    imageFile ? Promise.resolve() : Promise.reject('กรุณาอัปโหลดโลโก้บริษัท');

  const validateDocRequired = () =>
    documentFile ? Promise.resolve() : Promise.reject('กรุณาอัปโหลดไฟล์ยืนยันบริษัท (PDF หรือ รูปภาพ)');

  return (
    <>
      {contextHolder}
      <div className="form-section-title">ข้อมูลบริษัท</div>

      <div className="student-avatar-upload">
        <Upload showUploadList={false} beforeUpload={handleBeforeUploadLogo} accept="image/*">
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
        {/* ชื่อบริษัท */}
        <Col span={12}>
          <Form.Item
            name="company_name"
            label="ชื่อบริษัท"
            normalize={trim}
            validateTrigger="onBlur"
            rules={[{ required: true, message: 'กรุณากรอกชื่อบริษัท' }, { validator: validateCompanyName }]}
          >
            <Input placeholder="กรอกชื่อบริษัท" maxLength={100} />
          </Form.Item>

          {/* Hidden field เพื่อให้ form.validateFields ตรวจว่าอัปโหลดโลโก้แล้ว */}
          <Form.Item name="__company_logo" hidden rules={[{ validator: validateLogoRequired }]}>
            <Input />
          </Form.Item>
        </Col>

        {/* อัปโหลดไฟล์ยืนยันบริษัท */}
        <Col span={12}>
          <Form.Item label="ไฟล์ยืนยันบริษัท (PDF หรือ รูปภาพ)" required>
            <Upload
              showUploadList={false}
              beforeUpload={handleBeforeUploadDoc}
              accept=".pdf,image/*"
            >
              <div className="document-upload-button">
                <PaperClipOutlined />
                {documentFile ? 'เปลี่ยนไฟล์ยืนยัน' : 'คลิกเพื่ออัปโหลดไฟล์ยืนยัน'}
              </div>
            </Upload>

            {/* แสดงชื่อไฟล์ที่อัปโหลดแล้ว */}
            {documentFile && (
              <div className="uploaded-file-wrapper" style={{ marginTop: 8 }}>
                <Tooltip title={documentFile.name}>
                  <div className="uploaded-file-tag">
                    {documentFile.type.startsWith('image/') ? (
                      <PictureOutlined className="uploaded-file-icon" />
                    ) : (
                      <FileTextOutlined className="uploaded-file-icon" />
                    )}
                    <span className="uploaded-file-name">
                      {documentFile.name.length > 30 ? documentFile.name.slice(0, 27) + '…' : documentFile.name}
                    </span>
                  </div>
                </Tooltip>
              </div>
            )}
          </Form.Item>

          {/* Hidden field เพื่อให้ form.validateFields ตรวจว่าอัปโหลดไฟล์แล้ว */}
          <Form.Item name="__company_doc" hidden rules={[{ validator: validateDocRequired }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StepCompanyGeneral;
