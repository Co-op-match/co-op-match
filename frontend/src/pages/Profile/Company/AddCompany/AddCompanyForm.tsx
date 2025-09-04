import React, { useContext, useEffect, useState } from 'react';
import { Layout, Card, Steps, Form, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import StepCompanyGeneral from './CompanyFormSteps/StepCompanyGeneral';
import StepAddress from './CompanyFormSteps/StepAddress';
import StepCompanyContact from './CompanyFormSteps/StepCompanyContact';

import {
  CreateCompany,
  CreateAddress,
  CreateContact,
  CreateSendVerify,
} from '../../../../services/https';

import './AddCompanyForm.css';
import CompanyHeaderDefault from '../../../Component/CoopMatchHeaderDefault';
import { UserContext } from '../../../../components/UserContext';

// ✅ เพิ่ม Loader
import CoopMatchLoader from '../../../Component/loading';

const { Content } = Layout;

/* =======================
   helpers: map labelInValue -> id
   ======================= */
const getId = (v: unknown): number | undefined => {
  if (v == null) return undefined;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && 'value' in (v as any)) {
    const val = (v as any).value;
    const n = typeof val === 'number' ? val : Number(val);
    return Number.isNaN(n) ? undefined : n;
  }
  const n = Number(v as any);
  return Number.isNaN(n) ? undefined : n;
};

const toIdArray = (arr: any) =>
  Array.isArray(arr) ? arr.map(getId).filter((x): x is number => typeof x === 'number') : [];

const mapIdFields = <T extends Record<string, any>>(
  values: T,
  spec: Record<string, 'scalar' | 'array'>
) => {
  const out: any = { ...values };
  for (const [k, kind] of Object.entries(spec)) {
    out[k] = kind === 'array' ? toIdArray(values[k]) : getId(values[k]);
  }
  return out as T;
};
/* ======================= */

const AddCompanyForm: React.FC = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // ✅ state สำหรับ Loader
  const [loading, setLoading] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [loadingText, setLoadingText] = useState('กำลังบันทึกข้อมูล...');

  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { refetchUser } = useContext(UserContext);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleNext = async () => {
    try {
      const currentValues = await form.validateFields();

      if (currentStep === 0 && !imageFile) {
        messageApi.warning({
          content: 'กรุณาเลือกรูปโลโก้บริษัทก่อนดำเนินการต่อ',
          style: { marginTop: '20vh' },
          duration: 3,
        });
        return;
      }

      setFormData((prev: any) => ({
        ...prev,
        ...currentValues,
        imageFile,
        documentFile,
      }));
      setCurrentStep(currentStep + 1);
    } catch {
      messageApi.warning({
        content: 'กรุณากรอกข้อมูลให้ครบในขั้นตอนนี้',
        style: { marginTop: '20vh' },
        duration: 3,
      });
    }
  };

  const handleBack = () => {
    if (formData) {
      form.setFieldsValue(formData);
      if (formData.imageFile) setImageFile(formData.imageFile);
      if (formData.documentFile) setDocumentFile(formData.documentFile);
    }
    setCurrentStep(currentStep - 1);
  };

  const onFinish = async () => {
    // ✅ เปิด Loader
    setLoading(true);
    setProgressPct(5);
    setLoadingText('กำลังตรวจสอบข้อมูล...');

    try {
      const finalValues = await form.validateFields();
      const merged = { ...formData, ...finalValues };

      const idSpec: Record<string, 'scalar' | 'array'> = {
        province: 'scalar',
        district: 'scalar',
        subdistrict_id: 'scalar',
        post_code: 'scalar',
      };
      const cleaned = mapIdFields(merged, idSpec);

      const userId = Number(localStorage.getItem('id'));
      const roleId = Number(localStorage.getItem('roleId'));
      if (!userId || !roleId) {
        messageApi.error({
          content: 'ไม่พบข้อมูลผู้ใช้หรือบทบาท กรุณาล็อกอินใหม่',
          style: { marginTop: '20vh' },
          duration: 3,
        });
        return;
      }

      // 1) Create Address
      setLoadingText('กำลังบันทึกที่อยู่...');
      setProgressPct(20);
      const addressPayload = {
        house_number: cleaned.house_number,
        village: cleaned.village,
        street: cleaned.street,
        sub_street: cleaned.sub_street,
        province_id: cleaned.province,
        district_id: cleaned.district,
        subdistrict_id: cleaned.subdistrict_id,
        postcode_id: cleaned.post_code,
      };
      const addressRes = await CreateAddress(roleId, userId, addressPayload);
      const addressId = addressRes?.data?.address?.ID;
      if (!addressId) {
        throw new Error('สร้างที่อยู่ไม่สำเร็จ');
      }

      // 2) Create Contact
      setLoadingText('กำลังบันทึกข้อมูลติดต่อ...');
      setProgressPct(45);
      const contactPayload = {
        email: cleaned.email,
        line: cleaned.line,
        facebook: cleaned.facebook,
        phone_number: cleaned.phone_number,
        website: cleaned.website,
      };
      const contactRes = await CreateContact(contactPayload);
      const contactId = contactRes?.data?.ID;
      if (!contactId) {
        throw new Error('สร้างข้อมูลติดต่อไม่สำเร็จ');
      }

      // 3) Create Company (FormData + โลโก้)
      setLoadingText('กำลังสร้างข้อมูลบริษัท...');
      setProgressPct(70);
      const formDataToSend = new FormData();
      formDataToSend.append('company_name', String(cleaned.company_name ?? ''));
      formDataToSend.append('user_id', String(userId));
      formDataToSend.append('address_id', String(addressId));
      formDataToSend.append('admin_id', '0');
      formDataToSend.append('contact_id', String(contactId));
      if (imageFile) {
        formDataToSend.append('logo', imageFile);
      }
      await CreateCompany(formDataToSend);

      // 4) ส่งไฟล์ยืนยันบริษัท (ถ้ามี)
      if (documentFile) {
        setLoadingText('กำลังอัปโหลดเอกสารยืนยัน...');
        setProgressPct(85);
        const verifyFormData = new FormData();
        verifyFormData.append('status_verify_id', '2'); // ปรับตาม logic ระบบ
        verifyFormData.append('user_id', String(userId));
        verifyFormData.append('verification_document', documentFile);
        await CreateSendVerify(userId, verifyFormData);
      }

      setLoadingText('เสร็จสิ้น!');
      setProgressPct(100);

      refetchUser?.();

      messageApi.success({
        content: 'เพิ่มข้อมูลบริษัทเรียบร้อยแล้ว',
        style: { marginTop: '20vh' },
        duration: 3,
      });

      form.resetFields();
      setCurrentStep(0);
      setFormData({});
      setImageFile(null);
      setPreviewUrl(null);
      setDocumentFile(null);

      setTimeout(() => {
        navigate('/company/profile');
      });
    } catch (error) {
      console.error(error);
      messageApi.error({
        content: 'เกิดข้อผิดพลาดในการบันทึก',
        style: { marginTop: '20vh' },
        duration: 3,
      });
    } finally {
      // ✅ ปิด Loader เสมอ
      setTimeout(() => {
        setLoading(false);
        setProgressPct(0);
        setLoadingText('กำลังบันทึกข้อมูล...');
      }, 300); // หน่วงนิดหน่อยให้ผู้ใช้เห็น 100%
    }
  };

  const steps = [
    {
      title: 'ข้อมูลบริษัท',
      content: (
        <StepCompanyGeneral
          form={form}
          imageFile={imageFile}
          setImageFile={setImageFile}
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
          documentFile={documentFile}
          setDocumentFile={setDocumentFile}
        />
      ),
    },
    { title: 'ข้อมูลที่อยู่', content: <StepAddress form={form} formData={formData} /> },
    { title: 'ข้อมูลติดต่อ', content: <StepCompanyContact form={form} formData={formData} /> },
  ];

  return (
    <>
      {contextHolder}
      {/* ✅ แปะ Loader Overlay ไว้ระดับเพจ */}
      {loading && (
        <CoopMatchLoader
          overlay
          animation="puzzle-fold"
          progressMode="determinate"
          progress={progressPct}
          text={loadingText}
          // ปรับแต่งแบรนด์ได้ถ้าต้องการ:
          // primaryColor="#1890ff"
          // speed={2.2}
        />
      )}

      <CompanyHeaderDefault />
      <Layout className="add-company-layout">
        <Content className="add-company-content">
          <Card className="add-company-card">
            <h2 className="add-company-title">เพิ่มข้อมูลบริษัท</h2>
            <Steps
              current={currentStep}
              size="small"
              className="add-company-steps"
              items={steps.map((step) => ({ title: step.title }))}
            />

            <Form layout="vertical" form={form}>
              <Card className="step-card">{steps[currentStep].content}</Card>

              <Form.Item className="form-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>{currentStep > 0 && <Button onClick={handleBack}>ย้อนกลับ</Button>}</div>
                  <div>
                    {currentStep < steps.length - 1 ? (
                      <Button type="primary" onClick={handleNext}>
                        ถัดไป
                      </Button>
                    ) : (
                      <Button type="primary" onClick={onFinish}>
                        บันทึก
                      </Button>
                    )}
                  </div>
                </div>
              </Form.Item>
            </Form>
          </Card>
        </Content>
      </Layout>
    </>
  );
};

export default AddCompanyForm;
