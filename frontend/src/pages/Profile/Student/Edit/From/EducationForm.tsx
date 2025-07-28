import React from "react";
import { Form, Input, InputNumber } from "antd";

const EducationForm: React.FC<{ form: any }> = ({ form }) => (
  <>
    <Form.Item label="GPAX" name={["Education", 0, "grade"]}>
      <Input />
    </Form.Item>
    <Form.Item label="คณะ" name={["Education", 0, "Faculty", "name_th"]}>
      <Input disabled />
    </Form.Item>
    <Form.Item label="สาขา" name={["Education", 0, "Program", "name_th"]}>
      <Input disabled />
    </Form.Item>
    <Form.Item label="ระดับการศึกษา" name={["Education", 0, "EducationLevel", "name"]}>
      <Input disabled />
    </Form.Item>
    <Form.Item label="ชั้นปี" name={["Education", 0, "year"]}>
      <InputNumber />
    </Form.Item>
  </>
);

export default EducationForm;
