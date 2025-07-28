import React from "react";
import { Modal, Form, Input, InputNumber, Row, Col, Button, Divider, Space } from "antd";
import { FileTextOutlined } from "@ant-design/icons";

const { TextArea } = Input;

interface EditPostModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  form: any;
   handleSubmit: (values: any) => void | Promise<void>;
  editingPost: any;
  loading: boolean;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  modalVisible,
  setModalVisible,
  form,
  handleSubmit,
  editingPost,
  loading,
}) => {
  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: "#1890ff" }} />
          <span>{editingPost ? "แก้ไขโพสต์" : "สร้างโพสต์ใหม่"}</span>
        </Space>
      }
      open={modalVisible}
      onCancel={() => {
        setModalVisible(false);
        form.resetFields();
      }}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <Divider />
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: "16px" }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="ชื่อตำแหน่ง"
              name="post_name"
              rules={[{ required: true, message: "กรุณากรอกชื่อตำแหน่ง" }]}
            >
              <Input placeholder="เช่น Frontend Developer Intern" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="รายละเอียดงาน"
              name="post_description"
              rules={[{ required: true, message: "กรุณากรอกรายละเอียดงาน" }]}
            >
              <TextArea
                rows={4}
                placeholder="อธิบายรายละเอียดงาน ความรับผิดชอบ และคุณสมบัติที่ต้องการ"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="จำนวนที่รับ"
              name="quantity"
              rules={[{ required: true, message: "กรุณากรอกจำนวนที่รับ" }]}
            >
              <InputNumber min={1} max={100} style={{ width: "100%" }} placeholder="จำนวนคน" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="เกรดเฉลี่ยขั้นต่ำ"
              name="min_gpa"
              rules={[{ required: true, message: "กรุณากรอกเกรดเฉลี่ยขั้นต่ำ" }]}
            >
              <InputNumber
                min={0}
                max={4}
                step={0.1}
                style={{ width: "100%" }}
                placeholder="เช่น 3.0"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="รายละเอียดที่ตั้ง"
              name="location_detail"
              rules={[{ required: true, message: "กรุณากรอกรายละเอียดที่ตั้ง" }]}
            >
              <Input placeholder="เช่น 123 ถนนสุขุมวิท" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="ตำบล/แขวง"
              name="subdistrict"
              rules={[{ required: true, message: "กรุณากรอกตำบล/แขวง" }]}
            >
              <Input placeholder="ตำบล/แขวง" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="อำเภอ/เขต"
              name="district"
              rules={[{ required: true, message: "กรุณากรอกอำเภอ/เขต" }]}
            >
              <Input placeholder="อำเภอ/เขต" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="จังหวัด"
              name="province"
              rules={[{ required: true, message: "กรุณากรอกจังหวัด" }]}
            >
              <Input placeholder="จังหวัด" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Space>
            <Button
              onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                background: "linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)",
                border: "none",
              }}
            >
              {editingPost ? "บันทึกการแก้ไข" : "สร้างโพสต์"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditPostModal;