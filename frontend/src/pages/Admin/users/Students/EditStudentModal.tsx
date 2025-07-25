import React from "react";
import { Modal, Form, Input, DatePicker, Select, message } from "antd";
//import { UpdateStudent } from "../../../../services/https/Admin";
import type { StudentInterface } from "../../../../interfaces/Student";
import dayjs from "dayjs";

interface EditStudentFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  student: StudentInterface;
}

const EditStudentForm: React.FC<EditStudentFormProps> = ({ visible, onCancel, student }) => {
  const [form] = Form.useForm();

  const handleFinish = async (values: any) => {
    try {
      /* const res = await UpdateStudent(student.ID!, values);
      if (res.status === 200) {
        message.success("แก้ไขนักศึกษาสำเร็จ");
        onSuccess();
      } else {
        message.error("เกิดข้อผิดพลาดในการแก้ไข");
      } */
    } catch {
      message.error("ไม่สามารถแก้ไขนักศึกษาได้");
    }
  };

  return (
    <Modal
      title="แก้ไขนักศึกษา"
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          ...student,
          birthday: student.birthday ? dayjs(student.birthday) : null,
        }}
      >
        <Form.Item name="first_name" label="ชื่อ" rules={[{ required: true }]}> <Input /> </Form.Item>
        <Form.Item name="last_name" label="นามสกุล" rules={[{ required: true }]}> <Input /> </Form.Item>
        <Form.Item name="birthday" label="วันเกิด" rules={[{ required: true }]}> <DatePicker style={{ width: '100%' }} /> </Form.Item>
        <Form.Item name="age" label="อายุ" rules={[{ required: true }]}> <Input type="number" /> </Form.Item>
        <Form.Item name="gender_id" label="เพศ" rules={[{ required: true }]}> <Select options={[{ value: 1, label: "ชาย" }, { value: 2, label: "หญิง" }]} /> </Form.Item>
        <Form.Item name="phone_number" label="เบอร์โทรศัพท์"> <Input /> </Form.Item>
        <Form.Item name="nationality" label="สัญชาติ"> <Input /> </Form.Item>
        <Form.Item name="religion" label="ศาสนา"> <Input /> </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditStudentForm;