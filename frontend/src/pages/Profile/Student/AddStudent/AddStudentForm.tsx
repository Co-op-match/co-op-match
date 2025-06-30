import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Steps,
  Form,
  Button,
  message,
} from 'antd';
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
import StepEducation from '../StudentFormSteps/StepEducation';
import StepAddress from '../StudentFormSteps/StepAddress';
import StepSkills from '../StudentFormSteps/StepSkills';
import StepGeneralInfo from '../StudentFormSteps/StepGeneral';
import './AddStudentForm.css';


const { Content } = Layout;

const AddStudentForm: React.FC = () => {
  const [form] = Form.useForm();
  const [genders, setGenders] = useState<GenderInterface[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [messageApi, contextHolder] = message.useMessage();

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

  const handleNext = async () => {
    try {
      const currentValues = await form.validateFields();
      setFormData((prev: any) => ({ ...prev, ...currentValues }));
      setCurrentStep(currentStep + 1);
      form.resetFields();
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
    const finalData = { ...formData, ...finalValues };

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
    // ✅ STEP 1: สร้าง Student 
    const payload: StudentInterface = {
      first_name: finalData.firstName,
      last_name: finalData.lastName,
      age: Number(finalData.age),
      birthday: finalData.birthday,
      weight: Number(finalData.weight),
      height: Number(finalData.height),
      phone_number: finalData.phoneNumber,
      nationality: finalData.nationality,
      religion: finalData.religion,
      gender_id: Number(finalData.gender_id),
      user_id: userId,
    };
    // ✅ STEP 2: สร้าง Address ก่อน
    const addressPayload = {
      house_number: finalData.house_number,
      village: finalData.village,
      street: finalData.street,
      sub_street: finalData.sub_street,
      subdistrict: finalData.subdistrict,
      district: finalData.district,
      province: finalData.province,
      post_code: finalData.post_code,
    };
    const res = await CreateStudent(payload);
    if (!(res.status === 200 || res.status === 201)) {
      throw new Error('สร้างนักศึกษาไม่สำเร็จ');
    }
    const addressRes = await CreateAddress(roleId, userId, addressPayload);

    if (!(addressRes.status === 200 || addressRes.status === 201)) {
      throw new Error('สร้างที่อยู่ไม่สำเร็จ');
    }
    // ✅ STEP 3: อัปโหลดรูป
    if (!imageFile) {
      messageApi.warning({
        content: 'ยังไม่ได้เพิ่มรูปนักศึกษา',
        style: { marginTop: '20vh' },
        duration: 3,
      });
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', imageFile);
    uploadData.append('user_id', userId.toString());
    await CreateProfileImage(uploadData);

    // ✅ STEP 4: Education
    const educationPayload = {
      user_id: userId,
      university: finalData.university,
      faculty: finalData.faculty,
      major: finalData.major,
      education_level: finalData.education_level,
      year: finalData.year,
      grade: finalData.grade,
    };
    await CreateEducation(educationPayload);

    // ✅ STEP 5: Skills + Interests
    const skillsPayload = {
      skill_ids: finalData.skills || [],
      interest_ids: finalData.interests || [],
    };
    await CreateStudentSkills(userId, skillsPayload);

    // ✅ FINISH
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
  } catch (error) {
    console.error(error);
    messageApi.error({
      content: 'เกิดข้อผิดพลาดในการบันทึก',
      style: { marginTop: '20vh' },
      duration: 3,
    });
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

            <Form
              layout="vertical"
              form={form}
              onFinish={onFinish}
              style={{ marginTop: 24 }}
            >
              {steps[currentStep].content}
              <Form.Item style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {currentStep > 0 && (
                    <Button onClick={handleBack}>ย้อนกลับ</Button>
                  )}
                  {currentStep < steps.length - 1 ? (
                    <Button type="primary" onClick={handleNext}>
                      ถัดไป
                    </Button>
                  ) : (
                    <Button type="primary" htmlType="submit">
                      บันทึก
                    </Button>
                  )}
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
