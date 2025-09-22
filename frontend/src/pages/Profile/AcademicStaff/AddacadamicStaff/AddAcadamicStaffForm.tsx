import React, { useContext, useEffect, useState } from 'react';
import { Layout, Card, Steps, Form, Button, message, Grid } from 'antd';
import {
  CreateProfileImage,
  GetAllGender,
  CreateAddress,
  CreateAcademicStaff,
  CreateContact,
  CreateSendVerifyAcademicStaff,
} from '../../../../services/https';

import type { GenderInterface } from '../../../../interfaces/Gender';
import StepAcadamicStaffContact from './AcadamicStaffFormSteps/StepAcadamicStaffContact';
import StepAcadamicStaffAddress from './AcadamicStaffFormSteps/StepAcadamicStaffAddress';
import StepAcadamicStaffGeneral from './AcadamicStaffFormSteps/StepAcadamicStaffGeneral';
import './AddAcademicStaffForm.css';
import { useNavigate } from 'react-router-dom';
import CoopMatchHeaderDefault from '../../../Component/CoopMatchHeaderDefault';
import { UserContext } from '@/components/UserContext';
import type { InputAcademicStaffInterface } from '@/interfaces/InputAcademicStaff';

// ✅ เพิ่ม Loader
import { CoopMatchLoader } from '../../../../components/loaders';

const { Content } = Layout;
const { useBreakpoint } = Grid;

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

const AddAcademicStaffForm: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  const [form] = Form.useForm();
  const [genders, setGenders] = useState<GenderInterface[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const navigate = useNavigate();
  const { refetchUser } = useContext(UserContext);
  const [messageApi, contextHolder] = message.useMessage();

  // ✅ สถานะ Loader
  const [saving, setSaving] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [loadingText, setLoadingText] = useState('กำลังบันทึกข้อมูล...');

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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleNext = async () => {
    try {
      const currentValues = await form.validateFields();
      if (currentStep === 0 && !imageFile) {
        messageApi.warning({
          content: 'กรุณาเลือกรูปบุคลากรก่อนดำเนินการต่อ',
          style: { marginTop: '20vh' },
          duration: 3,
        });
        return;
      }
      setFormData((prev: any) => ({ ...prev, ...currentValues }));
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
    form.setFieldsValue(formData);
    setCurrentStep(currentStep - 1);
  };

  const onFinish = async () => {
    try {
      const finalValues = await form.validateFields();
      const merged = { ...formData, ...finalValues };

      // ▶️ ตรวจรูปอีกครั้งก่อนเริ่ม call API (กันข้อมูลค้าง)
      if (!imageFile) {
        messageApi.warning({
          content: 'ยังไม่ได้เพิ่มรูปโปรไฟล์บุคลากร',
          style: { marginTop: '20vh' },
          duration: 3,
        });
        return;
      }

      // แปลง select -> id
      const idSpec: Record<string, 'scalar' | 'array'> = {
        university_id: 'scalar',
        faculty_id: 'scalar',
        program_id: 'scalar',
        province: 'scalar',
        district: 'scalar',
        subdistrict_id: 'scalar',
        post_code: 'scalar',
        skills: 'array',
        interests: 'array',
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

      // ✅ เริ่ม Loader
      setSaving(true);
      setProgressPct(5);
      setLoadingText('กำลังเริ่มบันทึกข้อมูล...');

      // 1) Address
      setLoadingText('กำลังบันทึกที่อยู่...');
      setProgressPct(25);
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
      if (!(addressRes?.status === 200 || addressRes?.status === 201)) {
        throw new Error('สร้างที่อยู่ไม่สำเร็จ');
      }
      const addressId =
        addressRes?.data?.address?.ID ??
        addressRes?.data?.address_id ??
        addressRes?.data?.id ??
        addressRes?.data?.ID;

      // 2) Contact
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

      // 3) Academic Staff
      setLoadingText('กำลังบันทึกข้อมูลบุคลากร...');
      setProgressPct(70);
      const payload: InputAcademicStaffInterface = {
        academic_position: cleaned.academic_position,
        first_name: cleaned.firstName,
        last_name: cleaned.lastName,
        age: Number(cleaned.age),
        birthday: cleaned.birthday?.format?.('YYYY-MM-DD') ?? cleaned.birthday,
        gender_id: Number(cleaned.gender_id),
        university_id: cleaned.university_id,
        faculty_id: cleaned.faculty_id,
        program_id: cleaned.program_id,
        user_id: userId,
        contact_id: contactId,
        address_id: addressId,
      };
      const res = await CreateAcademicStaff(payload);
      if (!(res?.status === 200 || res?.status === 201)) {
        throw new Error('สร้างข้อมูลบุคลากรไม่สำเร็จ');
      }

      // 4) Upload profile image
      setLoadingText('กำลังอัปโหลดรูปโปรไฟล์...');
      setProgressPct(88);
      const uploadData = new FormData();
      uploadData.append('image', imageFile);
      uploadData.append('user_id', String(userId));
      await CreateProfileImage(uploadData);

      // 5) ส่งเอกสารยืนยัน (ถ้ามี)
      if (documentFile) {
        setLoadingText('กำลังส่งเอกสารยืนยัน...');
        setProgressPct(95);
        const verifyFormData = new FormData();
        verifyFormData.append('status_verify_id', '2');
        verifyFormData.append('user_id', String(userId));
        verifyFormData.append('verification_document', documentFile);
        await CreateSendVerifyAcademicStaff(userId, verifyFormData);
      }

      refetchUser?.();

      setLoadingText('เสร็จสิ้น!');
      setProgressPct(100);

      messageApi.success({
        content: 'เพิ่มข้อมูลบุคลากรเรียบร้อยแล้ว',
        style: { marginTop: '20vh' },
        duration: 3,
      });

      form.resetFields();
      setCurrentStep(0);
      setFormData({});
      setImageFile(null);
      setPreviewUrl(null);
      setDocumentFile(null);

      setTimeout(() => navigate('/lecturer/profile'));
    } catch (error) {
      console.error(error);
      messageApi.error({
        content: 'เกิดข้อผิดพลาดในการบันทึก',
        style: { marginTop: '20vh' },
        duration: 3,
      });
    } finally {
      // ปิด Loader เสมอ
      setTimeout(() => {
        setSaving(false);
        setProgressPct(0);
        setLoadingText('กำลังบันทึกข้อมูล...');
      }, 300);
    }
  };

  const steps = [
    {
      title: 'ข้อมูลทั่วไป',
      content: (
        <StepAcadamicStaffGeneral
          form={form}
          formData={formData}
          genders={genders}
          imageFile={imageFile}
          setImageFile={setImageFile}
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
          documentFile={documentFile}
          setDocumentFile={setDocumentFile}
        />
      ),
    },
    { title: 'ข้อมูลที่อยู่', content: <StepAcadamicStaffAddress form={form} formData={formData} /> },
    { title: 'ข้อมูลติดต่อ', content: <StepAcadamicStaffContact form={form} formData={formData} /> },
  ];

  return (
    <>
      {contextHolder}

      {/* ✅ Loader Overlay ตอนบันทึก */}
      {saving && (
        <CoopMatchLoader
          overlay
          animation="puzzle-fold"
          progressMode="determinate"
          progress={progressPct}
          text={loadingText}
          // primaryColor="#1890ff"
          // speed={2.0}
        />
      )}

      <CoopMatchHeaderDefault />
      <Layout className={`add-academicstaff-layout ${isMobile ? 'add-academicstaff-mobile' : ''} ${isTablet ? 'add-academicstaff-tablet' : ''}`}>
        <Content className="add-academicstaff-content">
          <Card className="add-academicstaff-card">
            <h2 className="add-academicstaff-title">เพิ่มข้อมูล</h2>

            <Steps
              current={currentStep}
              size={isMobile ? "small" : "default"}
              direction={isMobile ? "vertical" : "horizontal"}
              className="add-academicstaff-steps"
              items={steps.map((s) => ({ title: s.title }))}
            />

            <Form layout="vertical" form={form} style={{ marginTop: 24 }}>
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

export default AddAcademicStaffForm;
