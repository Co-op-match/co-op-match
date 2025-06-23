import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Select,
  Input,
  Checkbox,
  Typography,
  Tag,
  Space,
  Avatar,
  Row,
  Col,
  Button,
  Flex,
  Segmented,
  Table,
  Modal,
  Image,
} from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import AdminHeader from "../../Component/AdminNavbar";
import Title from "antd/es/typography/Title";
import "./Companies.css";

const initialData = [
  {
    key: 1,
    id: 1,
    date: "20/05/2568",
    company: "ไฮเทค โซลูชั่นส์ จำกัด",
    detail: "ทำคลิปวิดีโอ...",
    status: "รับรอง",
    image: "https://via.placeholder.com/150",
  },
  {
    key: 2,
    id: 2,
    date: "20/05/2568",
    company: "สมาร์ทวิชั่น อินโนเวชั่น จำกัด",
    detail: "ทำคลิปวิดีโอ...",
    status: "รอรับรอง",
    image: "https://via.placeholder.com/150",
  },
];

const Company: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("รอรับรอง");
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState(initialData);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const openDetailModal = (record: any) => {
    setSelectedRow(record);
    setShowDetailModal(true);
  };

  const confirmVerification = () => {
    setShowDetailModal(false);
    setShowConfirmModal(true);
  };

  const finalizeVerification = () => {
    setData((prev: any) =>
      prev.map((item: any) =>
        item.key === selectedRow.key ? { ...item, status: "รับรอง" } : item
      )
    );
    setShowConfirmModal(false);
  };

  // ตัวอย่างคอลัมน์และข้อมูลในตาราง
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "วันที่สมัคร",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "บริษัท",
      dataIndex: "company",
      key: "company",
    },
    {
      title: "รายละเอียด",
      dataIndex: "detail",
      key: "detail",
    },
    {
      title: "การรับรอง",
      key: "status",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Button
          onClick={() => openDetailModal(record)}
          style={{
            width: 100,
            borderRadius: 12,
            backgroundColor: record.status === "รับรอง" ? "#007AFF" : "#fff",
            color: record.status === "รับรอง" ? "#fff" : "#000",
            border:
              record.status === "รับรอง" ? "none" : "1px solid rgba(0,0,0,0.2)",
          }}
        >
          {record.status}
        </Button>
      ),
    },
    {
      title: "สถานะ",
      key: "action",
      render: () => (
        <Space>
          <EditOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
          /
          <DeleteOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
        </Space>
      ),
    },
  ];

  const getTableData = () => {
    let filtered = data;

    // 1. filter by tab
    if (activeTab !== "ทั้งหมด") {
      filtered = filtered.filter((item) => item.status === activeTab);
    }

    // 2. filter by search
    if (searchText.trim() !== "") {
      filtered = filtered.filter((item) =>
        [item.id, item.company, item.detail, item.date].some((field) =>
          String(field).toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    return filtered;
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />

      <Layout style={{ margin: "2rem" }}>
        <Row>
          <Col span={20}>
            <Title level={3} style={{ margin: 0 }}>
              บริษัท
            </Title>
          </Col>
          <Col span={4} style={{ justifyItems: "end" }}>
            <Flex align="center" gap={16}>
              จำนวน
              <Card size="small">
                <div style={{ fontSize: "18px", fontWeight: "bolder" }}>
                  256
                </div>
              </Card>
            </Flex>
          </Col>
        </Row>
        <Flex
          justify="center"
          align="center"
          gap={"5vw"}
          style={{ marginBottom: "1rem" }}
        >
          <div className="backgroundTabChooseVerify">
            {["รอรับรอง", "รับรอง", "ทั้งหมด"].map((tab) => (
              <div
                key={tab}
                className={`tabChooseVerify ${
                  activeTab === tab ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* ✅ ช่องค้นหา */}
          <div className="searchContainer">
            <Input
              placeholder="ค้นหา..."
              suffix={<SearchOutlined style={{ color: "#999" }} />}
              className="searchInput"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setActiveTab("ทั้งหมด");
              }}
            />
          </div>
        </Flex>

        {/* ตารางตาม tab ที่เลือก */}
        <Table
          columns={columns}
          dataSource={getTableData()}
          pagination={{ pageSize: 5 }}
        />

        {/* Modal แสดงรายละเอียด */}
        <Modal
          open={showDetailModal}
          onCancel={() => setShowDetailModal(false)}
          onOk={confirmVerification}
          okText="ยืนยัน"
          cancelText="ยกเลิก"
          title="รายละเอียดการรับรอง"
        >
          <p>
            <strong>บริษัท:</strong> {selectedRow?.company}
          </p>
          <p>
            <strong>รายละเอียด:</strong> {selectedRow?.detail}
          </p>
          <Image width={200} src={selectedRow?.image} alt="แนบภาพ" />
        </Modal>

        {/* Modal ยืนยันซ้ำ */}
        <Modal
          open={showConfirmModal}
          onCancel={() => setShowConfirmModal(false)}
          onOk={finalizeVerification}
          okText="ยืนยัน"
          cancelText="ยกเลิก"
          title="ยืนยันการรับรองอีกครั้ง"
        >
          <p>คุณแน่ใจหรือไม่ว่าจะรับรองบริษัทนี้?</p>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default Company;
