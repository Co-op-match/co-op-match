import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Steps,
  Form,
  Button,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import StepCompanyGeneral from './CompanyFormSteps/StepCompanyGeneral';
import StepAddress from './CompanyFormSteps/StepAddress';
import StepCompanyContact from './CompanyFormSteps/StepCompanyContact';

import {
  CreateCompany,
  CreateAddress,
  CreateContact,
} from '../../../../services/https';

import './AddCompanyForm.css';
import CompanyHeaderDefault from '../../../component/CoopMatchHeaderDefault';

const { Content } = Layout;

const AddCompanyForm: React.FC = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

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
      setFormData((prev: any) => ({ ...prev, ...currentValues,imageFile: imageFile,  }));
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
  // ✅ ตรวจสอบว่าค่าเดิมมีอยู่จริงก่อนค่อย set
  if (formData) {
    form.setFieldsValue(formData);
    if (formData.imageFile) {
    setImageFile(formData.imageFile); // ✅ set กลับ เพื่อให้ useEffect สร้าง preview ใหม่
  }
  }
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
    // 1. Create Address
    const addressPayload = {
      house_number: finalData.house_number,
      village: finalData.village,
      street: finalData.street,
      sub_street: finalData.sub_street,
      province_id: Number(finalData.province),
      district_id: Number(finalData.district),
      subdistrict_id: Number(finalData.subdistrict_id),
      postcode_id: Number(finalData.post_code),
    };

    const addressRes = await CreateAddress(roleId, userId, addressPayload);
    const addressId = addressRes?.data?.address?.ID;
    console.log('add',addressId)
    // 2. Create Contact
    const contactPayload = {
      email: finalData.email,
      line: finalData.line,
      facebook: finalData.facebook,
      phone_number: finalData.phone_number,
      website: finalData.website,
    };
    console.log(contactPayload)
    const contactRes = await CreateContact(contactPayload);
    console.log("data",contactRes)
    const contactId = contactRes?.data?.ID;

    // 3. Create Company 
    const formDataToSend = new FormData();
    formDataToSend.append('company_name', finalData.company_name);
    formDataToSend.append('user_id', userId.toString());
    formDataToSend.append('address_id', addressId.toString());
    formDataToSend.append('admin_id', '0');
    formDataToSend.append('contact_id', contactId.toString());
    if (imageFile) {
      formDataToSend.append('logo', imageFile);
    }
    await CreateCompany(formDataToSend);


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
        />
      ),
    },
    {
      title: 'ข้อมูลที่อยู่',
      content: <StepAddress form={form} formData={formData} />,
    },
    {
      title: 'ข้อมูลติดต่อ',
      content: <StepCompanyContact form={form} formData={formData} />,
    },
  
  ];

  return (
    <>
      {contextHolder}
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
            <Form layout="vertical" form={form} >
              <Card className="step-card">{steps[currentStep].content}</Card>
              <Form.Item className="form-footer" >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>{currentStep > 0 && <Button onClick={handleBack}>ย้อนกลับ</Button>}</div>
                  <div>
                    {currentStep < steps.length - 1 ? (
                      <Button type="primary" onClick={handleNext}>
                        ถัดไป
                      </Button>
                    ) : (
                      <Button type="primary" onClick={onFinish} >
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
