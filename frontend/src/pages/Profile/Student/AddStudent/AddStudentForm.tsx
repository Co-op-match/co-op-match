import React, { useContext, useEffect, useState } from 'react';
import { Layout, Card, Steps, Form, Button, message } from 'antd';
import {
  CreateStudent,
  CreateProfileImage,
  GetAllGender,
  CreateAddress,
  CreateEducation,
  CreateStudentSkills,
} from '../../../../services/https';

import type { GenderInterface } from '../../../../interfaces/Gender';
import type { StudentInterface } from '../../../../interfaces/Student';
import StepEducation from './StudentFormSteps/StepEducation';
import StepAddress from './StudentFormSteps/StepAddress';
import StepSkills from './StudentFormSteps/StepSkills';
import StepGeneralInfo from './StudentFormSteps/StepGeneral';
import './AddStudentForm.css';
import { useNavigate } from 'react-router-dom';
import CoopMatchHeaderDefault from '../../../Component/CoopMatchHeaderDefault';
import { UserContext } from '../../../../components/UserContext';

// ✅ เพิ่ม Loader
import CoopMatchLoader from '../../../Component/loading';

const { Content } = Layout;

/* =======================
   helper: map labelInValue -> id
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

const AddStudentForm: React.FC = () => {
  const [form] = Form.useForm();
  const [genders, setGenders] = useState<GenderInterface[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refetchUser } = useContext(UserContext);

  const [messageApi, contextHolder] = message.useMessage();

  // ✅ สถานะ Loader ตอนบันทึก
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

      // ต้องเลือกรูปก่อนผ่าน Step 0
      if (currentStep === 0 && !imageFile) {
        messageApi.warning({
          content: 'กรุณาเลือกรูปนักศึกษาก่อนดำเนินการต่อ',
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

      // ระบุฟิลด์ที่เป็น Select (labelInValue) ให้แปลงเป็น id ก่อนส่ง
      const idSpec: Record<string, 'scalar' | 'array'> = {
        // Education
        university_id: 'scalar',
        faculty_id: 'scalar',
        program_id: 'scalar',
        education_level_id: 'scalar',
        // Address
        province: 'scalar',
        district: 'scalar',
        subdistrict_id: 'scalar',
        post_code: 'scalar',
        // General (ถ้า gender เป็น select labelInValue)
        gender_id: 'scalar',
        // Skills (ถ้าเป็น multi-select)
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

      // ✅ ควรตรวจรูปก่อนเริ่ม call API จะได้ไม่สร้างข้อมูลค้าง
      if (!imageFile) {
        messageApi.warning({
          content: 'ยังไม่ได้เพิ่มรูปนักศึกษา',
          style: { marginTop: '20vh' },
          duration: 3,
        });
        return;
      }

      // ✅ เริ่ม Loader
      setSaving(true);
      setProgressPct(5);
      setLoadingText('กำลังเริ่มบันทึกข้อมูล...');

      // ✅ STEP 1: Student
      setLoadingText('กำลังบันทึกข้อมูลนักศึกษา...');
      setProgressPct(20);
      const payload: StudentInterface = {
        first_name: cleaned.firstName,
        last_name: cleaned.lastName,
        age: Number(cleaned.age),
        birthday: cleaned.birthday,
        weight: Number(cleaned.weight),
        height: Number(cleaned.height),
        phone_number: cleaned.phoneNumber,
        nationality: cleaned.nationality,
        religion: cleaned.religion,
        gender_id: Number(cleaned.gender_id),
        user_id: userId,
      };
      const res = await CreateStudent(payload);
      if (!(res.status === 200 || res.status === 201)) throw new Error('สร้างนักศึกษาไม่สำเร็จ');

      // ✅ STEP 2: Address
      setLoadingText('กำลังบันทึกที่อยู่...');
      setProgressPct(40);
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
      if (!(addressRes.status === 200 || addressRes.status === 201)) throw new Error('สร้างที่อยู่ไม่สำเร็จ');

      // ✅ STEP 3: Upload image
      setLoadingText('กำลังอัปโหลดรูปโปรไฟล์...');
      setProgressPct(60);
      const uploadData = new FormData();
      uploadData.append('image', imageFile);
      uploadData.append('user_id', String(userId));
      await CreateProfileImage(uploadData);

      // ✅ STEP 4: Education
      setLoadingText('กำลังบันทึกข้อมูลการศึกษา...');
      setProgressPct(80);
      const educationPayload = {
        user_id: userId,
        university_id: cleaned.university_id,
        faculty_id: cleaned.faculty_id,
        program_id: cleaned.program_id,
        education_level_id: cleaned.education_level_id,
        year: cleaned.year,
        grade: cleaned.grade,
      };
      await CreateEducation(educationPayload);

      // ✅ STEP 5: Skills + Interests
      setLoadingText('กำลังบันทึกทักษะและความสนใจ...');
      setProgressPct(95);
      const skillsPayload = {
        skill_ids: cleaned.skills || [],
        interest_ids: cleaned.interests || [],
      };
      await CreateStudentSkills(userId, skillsPayload);

      // ✅ FINISH
      setLoadingText('เสร็จสิ้น!');
      setProgressPct(100);

      messageApi.success({
        content: 'เพิ่มนักศึกษาและข้อมูลทั้งหมดเรียบร้อยแล้ว',
        style: { marginTop: '20vh' },
        duration: 3,
      });

      form.resetFields();
      setCurrentStep(0);
      setFormData({});
      setImageFile(null);
      setPreviewUrl(null);
      refetchUser?.();

      setTimeout(() => {
        navigate('/student/profile');
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
        <StepGeneralInfo
          form={form}
          formData={formData}
          genders={genders}
          imageFile={imageFile}
          setImageFile={setImageFile}
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
        />
      ),
    },
    { title: 'ข้อมูลที่อยู่', content: <StepAddress form={form} formData={formData} /> },
    { title: 'ข้อมูลการศึกษา', content: <StepEducation form={form} formData={formData} /> },
    { title: 'ทักษะและความสามารถ', content: <StepSkills form={form} formData={formData} /> },
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
      <Layout className="add-student-layout">
        <Content className="add-student-content">
          <Card className="add-student-card">
            <h2 className="add-student-title">เพิ่มข้อมูล</h2>
            <Steps
              current={currentStep}
              size="small"
              className="add-student-steps"
              items={steps.map((step) => ({ title: step.title }))}
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

export default AddStudentForm;
