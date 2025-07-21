import React from "react";
import { Modal, Form, Input, DatePicker, Select, message } from "antd";
//import { CreateStudent } from "../../../../services/https/aum";
import type { StudentInterface } from "../../../../interfaces/Student";

interface AddStudentFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();

  const handleFinish = async (values: any) => {
    try {
      /* const res = await CreateStudent(values);
      if (res.status === 200) {
        message.success("เพิ่มนักศึกษาสำเร็จ");
        onSuccess();
        form.resetFields();
      } else {
        message.error("เกิดข้อผิดพลาดในการเพิ่มนักศึกษา");
      } */
    } catch {
      message.error("ไม่สามารถเพิ่มนักศึกษาได้");
    }
  };

  return (
    <Modal
      title="เพิ่มนักศึกษา"
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="first_name" label="ชื่อ" rules={[{ required: true }]}> <Input /> </Form.Item>
        <Form.Item name="last_name" label="นามสกุล" rules={[{ required: true }]}> <Input /> </Form.Item>
        <Form.Item name="birthday" label="วันเกิด" rules={[{ required: true }]}> <DatePicker style={{ width: '100%' }} /> </Form.Item>
        <Form.Item name="age" label="อายุ" rules={[{ required: true }]}> <Input type="number" /> </Form.Item>
        <Form.Item name="gender_id" label="เพศ" rules={[{ required: true }]}> <Select options={[{ value: 1, label: "ชาย" }, { value: 2, label: "หญิง" }]} /> </Form.Item>
        <Form.Item name="phone_number" label="เบอร์โทรศัพท์"> <Input /> </Form.Item>
        <Form.Item name="nationality" label="สัญชาติ"> <Input /> </Form.Item>
        <Form.Item name="religion" label="ศาสนา"> <Input /> </Form.Item>
        {/* Add more fields as needed */}
      </Form>
    </Modal>
  );
};

export default AddStudentForm;