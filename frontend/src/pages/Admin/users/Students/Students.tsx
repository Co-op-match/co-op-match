// StudentList.tsx
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
  Button,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import AdminHeader from "../../../Component/AdminNavbar";

const { Title } = Typography;

const initialData = [
  {
    key: "1",
    id: 1,
    date: "20/05/2568",
    name: "กุลนิกา กระจ่างวงศ์",
    university: "ไฮเทค โซลูชั่นส์ จำกัด",
    major: "เทคโนโลยีสารสนเทศ",
  },
  {
    key: "2",
    id: 2,
    date: "20/05/2568",
    name: "พรรณวร วิชัยธายญ",
    university: "สมาร์ทวิชั่น อินโนเวชั่น จำกัด",
    major: "บริหารธุรกิจ",
  },
  // เพิ่มข้อมูลนักศึกษาอื่น ๆ ตามภาพ
];

const Students: React.FC = () => {
  const [searchText, setSearchText] = useState("");

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "วันที่สมัคร", dataIndex: "date", key: "date" },
    { title: "ชื่อ-นามสกุล", dataIndex: "name", key: "name" },
    { title: "มหาวิทยาลัย", dataIndex: "university", key: "university" },
    { title: "สาขา", dataIndex: "major", key: "major" },
    {
      title: "สถานะ",
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

  const filteredData = initialData.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3}>นักศึกษา</Title>
          </Col>
          <Col>
            <Space>
              <span style={{ fontWeight: "bold" }}>จำนวน</span>
              <Card
                size="small"
                style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
              >
                <div style={{ fontSize: 18, fontWeight: "bold" }}>
                  {initialData.length}
                </div>
              </Card>
            </Space>
          </Col>
        </Row>

        <Row justify="center" style={{ margin: "1.5rem 0" }}>
          <Input
            placeholder="ค้นหา..."
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

export default Students;
