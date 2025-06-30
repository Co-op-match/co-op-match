import React, { useEffect, useState } from "react";
import {
  Layout,
  Input,
  Row,
  Col,
  Table,
  Card,
  Space,
  Typography,
  Popconfirm,
  Modal,
  Form,
  DatePicker,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import AdminHeader from "../../../Component/AdminNavbar";
import "../users.css";

const { Title } = Typography;

const initialAdminData = [
  {
    key: "1",
    id: 1,
    name: "สิริรัตน์ สายใจ",
    birthday: "01/01/2535",
    email: "sirirat@example.com",
    userId: "1",
  },
  {
    key: "2",
    id: 2,
    name: "พีรพงศ์ พรหมลิขิต",
    birthday: "15/05/2532",
    email: "peeraphong@example.com",
    userId: "2",
  },
];

const AdminList: React.FC = () => {
  const [adminData, setAdminData] = useState(initialAdminData);
  const [searchText, setSearchText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [editForm] = Form.useForm();

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "ชื่อ-นามสกุล", dataIndex: "name", key: "name" },
    { title: "วันเกิด", dataIndex: "birthday", key: "birthday" },
    { title: "อีเมล", dataIndex: "email", key: "email" },
    { title: "เลขประจำตัวผู้ใช้", dataIndex: "userId", key: "userId" },
    {
      title: "การจัดการ",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <EditOutlined
            style={{ cursor: "pointer" }}
            onClick={() => openEditModal(record)}
          />
          /
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDeleteCard(record.id)}
          >
            <DeleteOutlined />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    if (editingAdmin) {
      const birthday = editingAdmin.birthday;
      const parsedBirthday = dayjs.isDayjs(birthday)
        ? birthday
        : dayjs(birthday, "DD/MM/YYYY");

      editForm.setFieldsValue({
        ...editingAdmin,
        birthday: parsedBirthday.isValid() ? parsedBirthday : null,
      });
    }
  }, [editingAdmin, editForm]);

  const filteredData = adminData.filter((item) =>
    Object.values(item).some(
      (val) =>
        typeof val === "string" &&
        val.toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const openEditModal = (record: any) => {
    setEditingAdmin(record);
    // editForm.setFieldsValue(record);
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    editForm.validateFields().then((values) => {
      const updated = {
        ...editingAdmin,
        ...values,
        birthday: values.birthday.format("DD/MM/YYYY"),
      };
      const updatedData = adminData.map((admin) =>
        admin.id === updated.id ? updated : admin
      );
      setAdminData(updatedData);
      setShowEditModal(false);
    });
  };

  const handleDeleteCard = (id: string | number) => {
    setAdminData((prev) => prev.filter((admin) => admin.id !== id));
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3}>ผู้ดูแลระบบ (Admins)</Title>
          </Col>
          <Col>
            <Space>
              <span style={{ fontWeight: "bold" }}>จำนวน</span>
              <Card
                size="small"
                style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
              >
                <div style={{ fontSize: 18, fontWeight: "bold" }}>
                  {adminData.length}
                </div>
              </Card>
            </Space>
          </Col>
        </Row>

        <Row justify="center" style={{ margin: "1.5rem 0" }}>
          <Input
            placeholder="ค้นหา Admin..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="searchInput2"
          />
        </Row>

        <Table
          className="custom-table"
          dataSource={filteredData}
          columns={columns}
          pagination={{ pageSize: 5 }}
          size="middle"
        />

        <Modal
          title="แก้ไขข้อมูลผู้ดูแลระบบ"
          open={showEditModal}
          onOk={handleEditSubmit}
          onCancel={() => setShowEditModal(false)}
          okText="บันทึก"
          cancelText="ยกเลิก"
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              label="ชื่อ - นามสกุล"
              name="name"
              rules={[{ required: true, message: "กรุณากรอกชื่อ-นามสกุล" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="วันเกิด"
              name="birthday"
              rules={[{ required: true, message: "กรุณาเลือกวันเกิด" }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="อีเมล"
              name="email"
              rules={[{ required: true, message: "กรุณากรอกอีเมล" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="เลขประจำตัวผู้ใช้"
              name="userId"
              rules={[{ required: true, message: "กรุณากรอก User ID" }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default AdminList;
