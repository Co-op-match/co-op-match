import React from 'react';
import { Card, Form, Input, Divider, Layout, Button, Steps } from 'antd';
import "./Address.css";
import CoopMatchHeader from '../../../component/CoopMatchHeader';
import { Content } from 'antd/es/layout/layout';

const AddressForm: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('📦 Address values:', values);
  };

  return (
    <Layout>
      <CoopMatchHeader />
      <Layout className="student-address-layout">
        <Content className="student-address-content">
          <h2 className="student-address-page-title">เพิ่มข้อมูล</h2>

          <Card bordered={false} className="student-address-card">
            <div className="student-card-title-text">ข้อมูลที่อยู่</div>
            <div className="student-steps-container">
              <Steps
                size="small"
                current={1}
                items={[
                  { title: "ข้อมูลทั่วไป" },
                  { title: "ข้อมูลที่อยู่" },
                  { title: "ข้อมูลการศึกษา" },
                  { title: "ทักษะและความสามารถ" },
                ]}
              />
            </div>

            <Form layout="vertical" form={form} onFinish={onFinish} autoComplete="off">
              <Form.Item label="บ้านเลขที่" name="house_number" rules={[{ required: true, message: "กรุณากรอกบ้านเลขที่" }]}>
                <Input placeholder="บ้านเลขที่" />
              </Form.Item>

              <Form.Item label="ถนน" name="road" rules={[{ required: true, message: "กรุณากรอกถนน" }]}>
                <Input placeholder="ถนน" />
              </Form.Item>

              <Form.Item label="ตำบล/แขวง" name="sub_district" rules={[{ required: true, message: "กรุณากรอกตำบล/แขวง" }]}>
                <Input placeholder="ตำบล/แขวง" />
              </Form.Item>

              <Form.Item label="อำเภอ/เขต" name="district" rules={[{ required: true, message: "กรุณากรอกอำเภอ/เขต" }]}>
                <Input placeholder="อำเภอ/เขต" />
              </Form.Item>

              <Form.Item label="จังหวัด" name="province" rules={[{ required: true, message: "กรุณากรอกจังหวัด" }]}>
                <Input placeholder="จังหวัด" />
              </Form.Item>

              <Form.Item label="รหัสไปรษณีย์" name="postal_code" rules={[
                { required: true, message: "กรุณากรอกรหัสไปรษณีย์" },
                { pattern: /^[0-9]{5}$/, message: "รหัสไปรษณีย์ต้องมี 5 หลัก" },
              ]}>
                <Input placeholder="รหัสไปรษณีย์" maxLength={5} />
              </Form.Item>

              <Divider />

              <Form.Item>
                <Button type="primary" htmlType="submit" className="student-address-submit-button">
                  บันทึกข้อมูลที่อยู่
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AddressForm;
