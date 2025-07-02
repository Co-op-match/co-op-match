import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Steps,
  Form,
  Input,
  DatePicker,
  Radio,
  Upload,
  Button,
  Row,
  Col,
  message,
  Avatar,
} from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';

import { GetAllGender, CreateStudent, CreateProfileImage } from '../../../../services/https';
import type { GenderInterface } from '../../../../interfaces/Gender';
import type { StudentInterface } from '../../../../interfaces/Student';

import './AddStudentForm.css';

const { Content } = Layout;

const AddStudentForm: React.FC = () => {
  const [form] = Form.useForm();
  const [genders, setGenders] = useState<GenderInterface[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // สร้าง message API สำหรับแจ้งเตือนแบบ customize
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchGender = async () => {
      try {
        const data = await GetAllGender();
        setGenders(data);
      } catch (err) {
        messageApi.error({
          content: "โหลดข้อมูลเพศไม่สำเร็จ",
          style: { marginTop: '20vh', fontSize: '16px' },
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

  const onFinish = async (values: any) => {
    if (!imageFile) {
      messageApi.warning({
        content: "ยังไม่ได้เพิ่มรูปนักศึกษา",
        style: { marginTop: '20vh', fontSize: '16px' },
        duration: 3,
      });
      return; // หยุดการทำงานถ้าไม่มีรูป
    }

    const payload: StudentInterface = {
      first_name: values.firstName,
      last_name: values.lastName,
      age: Number(values.age),
      birthday: values.birthday,
      weight: Number(values.weight),
      height: Number(values.height),
      phone_number: values.phoneNumber,
      nationality: values.nationality,
      religion: values.religion,
      gender_id: Number(values.gender_id),
    };

    const res = await CreateStudent(payload);

    if (res.status === 200 || res.status === 201) {
      const studentID = res.data?.id;

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const userIdFromLocal = localStorage.getItem("id");
        if (userIdFromLocal) {
          formData.append("user_id", userIdFromLocal);
        } else {
          formData.append("user_id", studentID.toString());
        }

        try {
          const imgRes = await CreateProfileImage(formData);
          if (imgRes.status === 200 || imgRes.status === 201) {
            messageApi.success({
              content: "เพิ่มนักศึกษาและอัปโหลดรูปเรียบร้อยแล้ว",
              style: { marginTop: '20vh', fontSize: '16px' },
              duration: 3,
            });
          } else {
            messageApi.warning({
              content: "เพิ่มนักศึกษาแล้ว แต่ไม่สามารถอัปโหลดรูปได้",
              style: { marginTop: '20vh', fontSize: '16px' },
              duration: 3,
            });
          }
        } catch {
          messageApi.warning({
            content: "เพิ่มนักศึกษาแล้ว แต่เกิดข้อผิดพลาดในการอัปโหลดรูป",
            style: { marginTop: '20vh', fontSize: '16px' },
            duration: 3,
          });
        }
      } else {
        // กรณีนี้จะไม่เกิดขึ้น เพราะ return ด้านบนถ้าไม่มีรูป
        messageApi.success({
          content: "เพิ่มนักศึกษาเรียบร้อยแล้ว (ไม่มีรูป)",
          style: { marginTop: '20vh', fontSize: '16px' },
          duration: 3,
        });
      }

      form.resetFields();
      setImageFile(null);
      setPreviewUrl(null);
    } else {
      messageApi.error({
        content: "เกิดข้อผิดพลาดในการบันทึก",
        style: { marginTop: '20vh', fontSize: '16px' },
        duration: 3,
      });
    }
  };

  return (
    <>
      {contextHolder}
      <Layout className="add-student-layout">
        <Content className="add-student-content">
          <Card className="add-student-card">
            <h2 className="add-student-title">เพิ่มข้อมูล</h2>
            <Steps
              current={0}
              size="small"
              className="add-student-steps"
              items={[
                { title: 'ข้อมูลทั่วไป' },
                { title: 'ข้อมูลที่อยู่' },
                { title: 'ข้อมูลการศึกษา' },
                { title: 'ทักษะและความสามารถ' },
              ]}
            />

            <div className="form-section-title">ข้อมูลทั่วไป</div>
            <div className="student-avatar-upload">
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    messageApi.error({
                      content: 'สามารถอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น',
                      style: { marginTop: '20vh', fontSize: '16px' },
                      duration: 3,
                    });
                    return false;
                  }

                  setImageFile(file);
                  setPreviewUrl(URL.createObjectURL(file));
                  return false;
                }}
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
            <Form layout="vertical" form={form} onFinish={onFinish}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="เพศ"
                    name="gender_id"
                    rules={[{ required: true, message: 'กรุณาเลือกเพศ' }]}
                  >
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

                <Col span={12}>
                  <Form.Item label="ชื่อ" name="firstName" rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}>
                    <Input placeholder="กรอกชื่อ" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="นามสกุล" name="lastName" rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}>
                    <Input placeholder="กรอกนามสกุล" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="อายุ" name="age" rules={[{ required: true, message: 'กรุณากรอกอายุ' }]}>
                    <Input type="number" placeholder="กรอกอายุ" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="วันเกิด" name="birthday" rules={[{ required: true, message: 'กรุณาเลือกวันเกิด' }]}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="น้ำหนัก" name="weight" rules={[{ required: true, message: 'กรุณากรอกน้ำหนัก' }]}>
                    <Input type="number" placeholder="กรอกน้ำหนัก" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="ส่วนสูง" name="height" rules={[{ required: true, message: 'กรุณากรอกส่วนสูง' }]}>
                    <Input type="number" placeholder="กรอกส่วนสูง" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="เบอร์โทร" name="phoneNumber" rules={[{ required: true, message: 'กรุณากรอกเบอร์' }]}>
                    <Input placeholder="กรอกเบอร์โทร" />
                  </Form.Item>
                </Col>

                <Col span={12}></Col>

                <Col span={12}>
                  <Form.Item label="สัญชาติ" name="nationality" rules={[{ required: true, message: 'กรุณากรอกสัญชาติ' }]}>
                    <Input placeholder="กรอกสัญชาติ" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="ศาสนา" name="religion" rules={[{ required: true, message: 'กรุณากรอกศาสนา' }]}>
                    <Input placeholder="กรอกศาสนา" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="add-student-submit-button">
                  บันทึก
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Content>
      </Layout>
    </>
  );
};

export default AddStudentForm;
