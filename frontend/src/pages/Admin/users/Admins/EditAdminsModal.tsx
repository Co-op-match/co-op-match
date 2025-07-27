import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Row,
  Col,
  Card,
  Divider,
  Space,
  Avatar,
  Typography,
  InputNumber,
  Spin,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  TeamOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
//import { UpdateStudent } from "../../../../services/https/Admin";
import type { StudentInterface } from "../../../../interfaces/Student";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface EditStudentFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  student: StudentInterface;
}

const EditStudentForm: React.FC<EditStudentFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  student,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && student) {
      form.setFieldsValue({
        first_name: student.first_name,
        last_name: student.last_name,
        birthday: student.birthday ? dayjs(student.birthday) : null,
        age: student.age,
        gender_id: student.Gender?.ID,
        phone_number: student.phone_number,
        nationality: student.nationality,
        religion: student.religion,
        height: student.height,
        weight: student.weight,
      });
    }
  }, [visible, student, form]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      // Format birthday if exists
      const formattedValues = {
        ...values,
        birthday: values.birthday ? values.birthday.format("YYYY-MM-DD") : null,
      };

      /* 
      const res = await UpdateStudent(student.ID!, formattedValues);
      if (res.status === 200) {
        message.success("แก้ไขข้อมูลนักศึกษาสำเร็จ");
        onSuccess();
        handleCancel();
      } else {
        message.error("เกิดข้อผิดพลาดในการแก้ไข");
      }
      */

      // Simulate API call for demo
      await new Promise((resolve) => setTimeout(resolve, 1500));
      message.success("แก้ไขข้อมูลนักศึกษาสำเร็จ");
      onSuccess();
      handleCancel();
    } catch (error) {
      console.error("Error updating student:", error);
      message.error("ไม่สามารถแก้ไขข้อมูลนักศึกษาได้");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const genderOptions = [
    { value: 1, label: "ชาย" },
    { value: 2, label: "หญิง" },
    { value: 3, label: "อื่นๆ" },
  ];

  const nationalityOptions = [
    { value: "ไทย", label: "ไทย" },
    { value: "จีน", label: "จีน" },
    { value: "ญี่ปุ่น", label: "ญี่ปุ่น" },
    { value: "เกาหลี", label: "เกาหลี" },
    { value: "อเมริกัน", label: "อเมริกัน" },
    { value: "อื่นๆ", label: "อื่นๆ" },
  ];

  const religionOptions = [
    { value: "พุทธ", label: "พุทธ" },
    { value: "คริสต์", label: "คริสต์" },
    { value: "อิสลาม", label: "อิสลาม" },
    { value: "ฮินดู", label: "ฮินดู" },
    { value: "อื่นๆ", label: "อื่นๆ" },
  ];

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 0",
          }}
        >
          <Avatar
            size={40}
            icon={<EditOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          />
          <div>
            <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
              แก้ไขข้อมูลนักศึกษา
            </Title>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              ID: {student.ID} | {student.first_name} {student.last_name}
            </Text>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      width={800}
      style={{ top: 20 }}
      okText={
        <Space>
          <SaveOutlined />
          {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
        </Space>
      }
      cancelText={
        <Space>
          <CloseOutlined />
          ยกเลิก
        </Space>
      }
      okButtonProps={{
        loading: loading,
        disabled: loading,
        size: "large",
        style: {
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
        },
      }}
      cancelButtonProps={{
        disabled: loading,
        size: "large",
        style: { borderRadius: "8px" },
      }}
      destroyOnClose
      maskClosable={!loading}
      closable={!loading}
    >
      <Spin spinning={loading} tip="กำลังบันทึกข้อมูล...">
        <div
          style={{ maxHeight: "70vh", overflowY: "auto", padding: "16px 0" }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            size="large"
            requiredMark={false}
          >
            {/* ข้อมูลส่วนตัว */}
            <Card
              size="small"
              title={
                <Space>
                  <UserOutlined style={{ color: "#1890ff" }} />
                  <span style={{ color: "#1890ff", fontWeight: 600 }}>
                    ข้อมูลส่วนตัว
                  </span>
                </Space>
              }
              style={{
                marginBottom: "20px",
                borderRadius: "12px",
                border: "1px solid #e6f7ff",
              }}
              styles={{
                header: {
                  backgroundColor: "#f0f9ff",
                  borderRadius: "12px 12px 0 0",
                },
              }}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="first_name"
                    label={
                      <Space>
                        <UserOutlined />
                        <span>ชื่อ</span>
                      </Space>
                    }
                    rules={[
                      { required: true, message: "กรุณากรอกชื่อ" },
                      { min: 2, message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร" },
                    ]}
                  >
                    <Input
                      placeholder="กรอกชื่อ"
                      style={{ borderRadius: "8px" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="last_name"
                    label={
                      <Space>
                        <UserOutlined />
                        <span>นามสกุล</span>
                      </Space>
                    }
                    rules={[
                      { required: true, message: "กรุณากรอกนามสกุล" },
                      { min: 2, message: "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร" },
                    ]}
                  >
                    <Input
                      placeholder="กรอกนามสกุล"
                      style={{ borderRadius: "8px" }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="birthday"
                    label={
                      <Space>
                        <CalendarOutlined />
                        <span>วันเกิด</span>
                      </Space>
                    }
                    rules={[{ required: true, message: "กรุณาเลือกวันเกิด" }]}
                  >
                    <DatePicker
                      style={{ width: "100%", borderRadius: "8px" }}
                      placeholder="เลือกวันเกิด"
                      format="DD/MM/YYYY"
                      disabledDate={(current) =>
                        current && current > dayjs().subtract(15, "year")
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="age"
                    label="อายุ (ปี)"
                    rules={[
                      { required: true, message: "กรุณากรอกอายุ" },
                      {
                        type: "number",
                        min: 15,
                        max: 100,
                        message: "อายุต้องอยู่ระหว่าง 15-100 ปี",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%", borderRadius: "8px" }}
                      placeholder="กรอกอายุ"
                      min={15}
                      max={100}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="gender_id"
                    label={
                      <Space>
                        <TeamOutlined />
                        <span>เพศ</span>
                      </Space>
                    }
                    rules={[{ required: true, message: "กรุณาเลือกเพศ" }]}
                  >
                    <Select
                      options={genderOptions}
                      placeholder="เลือกเพศ"
                      style={{ borderRadius: "8px" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone_number"
                    label={
                      <Space>
                        <PhoneOutlined />
                        <span>เบอร์โทรศัพท์</span>
                      </Space>
                    }
                    rules={[
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก",
                      },
                    ]}
                  >
                    <Input
                      placeholder="กรอกเบอร์โทรศัพท์ (10 หลัก)"
                      maxLength={10}
                      style={{ borderRadius: "8px" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* ข้อมูลทั่วไป */}
            <Card
              size="small"
              title={
                <Space>
                  <TeamOutlined style={{ color: "#1890ff" }} />
                  <span style={{ color: "#1890ff", fontWeight: 600 }}>
                    ข้อมูลทั่วไป
                  </span>
                </Space>
              }
              style={{
                marginBottom: "20px",
                borderRadius: "12px",
                border: "1px solid #e6f7ff",
              }}
              styles={{
                header: {
                  backgroundColor: "#e6f7ff",
                  borderRadius: "12px 12px 0 0",
                },
              }}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item name="nationality" label="สัญชาติ">
                    <Select
                      options={nationalityOptions}
                      placeholder="เลือกสัญชาติ"
                      showSearch
                      allowClear
                      style={{ borderRadius: "8px" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="religion" label="ศาสนา">
                    <Select
                      options={religionOptions}
                      placeholder="เลือกศาสนา"
                      showSearch
                      allowClear
                      style={{ borderRadius: "8px" }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="height"
                    label="ส่วนสูง (ซม.)"
                    rules={[
                      {
                        type: "number",
                        min: 100,
                        max: 250,
                        message: "ส่วนสูงต้องอยู่ระหว่าง 100-250 ซม.",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%", borderRadius: "8px" }}
                      placeholder="กรอกส่วนสูง (ซม.)"
                      min={100}
                      max={250}
                      addonAfter="ซม."
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="weight"
                    label="น้ำหนัก (กิโลกรัม)"
                    rules={[
                      {
                        type: "number",
                        min: 30,
                        max: 200,
                        message: "น้ำหนักต้องอยู่ระหว่าง 30-200 กิโลกรัม",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%", borderRadius: "8px" }}
                      placeholder="กรอกน้ำหนัก (กก.)"
                      min={30}
                      max={200}
                      addonAfter="กก."
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* ข้อมูลติดต่อปัจจุบัน */}
            <Card
              size="small"
              title={
                <Space>
                  <MailOutlined style={{ color: "#1890ff" }} />
                  <span style={{ color: "#1890ff", fontWeight: 600 }}>
                    ข้อมูลติดต่อปัจจุบัน
                  </span>
                </Space>
              }
              style={{
                borderRadius: "12px",
                border: "1px solid #e6f7ff",
              }}
              styles={{
                header: {
                  backgroundColor: "#e6f7ff",
                  borderRadius: "12px 12px 0 0",
                },
              }}
            >
              <Row gutter={[16, 0]}>
                <Col span={24}>
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#fafafa",
                      borderRadius: "8px",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Space direction="vertical" size="small">
                      <Text strong>อีเมล:</Text>
                      <Text copyable style={{ fontSize: "16px" }}>
                        {student.User?.Email || "ไม่มีข้อมูล"}
                      </Text>
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>
          </Form>
        </div>
      </Spin>
    </Modal>
  );
};

export default EditStudentForm;
