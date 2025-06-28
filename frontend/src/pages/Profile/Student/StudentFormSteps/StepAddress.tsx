import React from 'react';
import { Form, Input, Row, Col } from 'antd';
import type { FormInstance } from 'antd';

export interface StepAddressProps {
  form: FormInstance<any>;
  formData: any;
}

const StepAddress: React.FC<StepAddressProps> = ({ form }) => {
  return (
    <>
      <div className="form-section-title">ข้อมูลที่อยู่</div>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="บ้านเลขที่"
            name="house_number"
            rules={[{ required: true, message: 'กรุณากรอกบ้านเลขที่' }]}
          >
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="หมู่บ้าน"
            name="village"
          >
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="ถนน"
            name="street"
          >
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="ซอย"
            name="sub_street"
          >
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="ตำบล / แขวง"
            name="subdistrict"
            rules={[{ required: true, message: 'กรุณากรอกตำบล/แขวง' }]}
          >
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="อำเภอ / เขต"
            name="district"
            rules={[{ required: true, message: 'กรุณากรอกอำเภอ/เขต' }]}
          >
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="จังหวัด"
            name="province"
            rules={[{ required: true, message: 'กรุณากรอกจังหวัด' }]}
          >
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="รหัสไปรษณีย์"
            name="post_code"
            rules={[
              { required: true, message: 'กรุณากรอกรหัสไปรษณีย์' },
              { len: 5, message: 'รหัสไปรษณีย์ต้องมี 5 หลัก' },
            ]}
          >
            <Input maxLength={5} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StepAddress;
