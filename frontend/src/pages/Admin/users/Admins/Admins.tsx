// AdminList.tsx
import React, { useState } from "react";
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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
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
  const [searchText, setSearchText] = useState("");

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "ชื่อ-นามสกุล", dataIndex: "name", key: "name" },
    { title: "วันเกิด", dataIndex: "birthday", key: "birthday" },
    { title: "อีเมล", dataIndex: "email", key: "email" }, // ✅ เพิ่มคอลัมน์ Email
    { title: "เลขประจำตัวผู้ใช้", dataIndex: "userId", key: "userId" },
    {
      title: "การจัดการ",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <EditOutlined style={{ cursor: "pointer" }} />/
          <Popconfirm
            title="แน่ใจหรือไม่ว่าจะลบ?"
            onConfirm={() => console.log("ลบ", record.id)}
          >
            <DeleteOutlined style={{ cursor: "pointer" }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredData = initialAdminData.filter((item) =>
    Object.values(item).some(
      (val) =>
        typeof val === "string" &&
        val.toLowerCase().includes(searchText.toLowerCase())
    )
  );

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
                  {initialAdminData.length}
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
      </Layout>
    </Layout>
  );
};

export default AdminList;
