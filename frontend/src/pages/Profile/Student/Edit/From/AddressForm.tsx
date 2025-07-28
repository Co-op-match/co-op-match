import React from "react";
import { Form, Input } from "antd";

const AddressForm: React.FC<{ form: any }> = ({ form }) => (
  <>
    <Form.Item label="บ้านเลขที่" name={["Address", "house_number"]}>
      <Input />
    </Form.Item>
    <Form.Item label="หมู่บ้าน" name={["Address", "village"]}>
      <Input />
    </Form.Item>
    <Form.Item label="ถนน" name={["Address", "street"]}>
      <Input />
    </Form.Item>
    <Form.Item label="ตำบล" name={["Address", "SubDistrict", "name_th"]}>
      <Input disabled />
    </Form.Item>
    <Form.Item label="อำเภอ" name={["Address", "District", "name_th"]}>
      <Input disabled />
    </Form.Item>
    <Form.Item label="จังหวัด" name={["Address", "Province", "name_th"]}>
      <Input disabled />
    </Form.Item>
    <Form.Item label="รหัสไปรษณีย์" name={["Address", "Postcode", "post_code"]}>
      <Input disabled />
    </Form.Item>
  </>
);

export default AddressForm;
