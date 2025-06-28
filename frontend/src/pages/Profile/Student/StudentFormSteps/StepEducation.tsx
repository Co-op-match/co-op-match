import React from 'react';
import { Form, Input, InputNumber, Row, Col, Select } from 'antd';
import type { FormInstance } from 'antd';

export interface StepEducationProps {
  form: FormInstance<any>;
  formData: any;
}

const StepEducation: React.FC<StepEducationProps> = ({ form }) => {
  return (
    <>
      <div className="form-section-title">ข้อมูลการศึกษา</div>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="มหาวิทยาลัย"
            name="university"
            rules={[{ required: true, message: 'กรุณากรอกชื่อมหาวิทยาลัย' }]}
          >
            <Input placeholder="ชื่อมหาวิทยาลัย" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="คณะ"
            name="faculty"
            rules={[{ required: true, message: 'กรุณากรอกชื่อคณะ' }]}
          >
            <Input placeholder="ชื่อคณะ" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="สาขา"
            name="major"
            rules={[{ required: true, message: 'กรุณากรอกชื่อสาขา' }]}
          >
            <Input placeholder="ชื่อสาขา" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="ระดับการศึกษา"
            name="education_level"
            rules={[{ required: true, message: 'กรุณาเลือกระดับการศึกษา' }]}
          >
            <Select placeholder="เลือกระดับการศึกษา">
              <Select.Option value="ปริญญาตรี">ปริญญาตรี</Select.Option>
              <Select.Option value="ปวส.">ปวส.</Select.Option>
              <Select.Option value="ปริญญาโท">ปริญญาโท</Select.Option>
              <Select.Option value="อื่นๆ">อื่นๆ</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="ชั้นปี"
            name="year"
            rules={[{ required: true, message: 'กรุณากรอกชั้นปี' }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="ชั้นปี" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="เกรดเฉลี่ย (GPAX)"
            name="grade"
            rules={[
              { required: true, message: 'กรุณากรอกเกรดเฉลี่ย' },
              {
                type: 'number',
                min: 0,
                max: 4,
                message: 'เกรดต้องอยู่ระหว่าง 0 - 4.00',
              },
            ]}
          >
            <InputNumber step={0.01} style={{ width: '100%' }} placeholder="เช่น 3.25" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StepEducation;
