import React, { useState } from "react";
import {
  Layout,
  Card,
  Input,
  Space,
  Row,
  Col,
  Button,
  Flex,
  Table,
  Modal,
  Image,
  Form,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleTwoTone,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import AdminHeader from "../../../Component/AdminNavbar";
import Title from "antd/es/typography/Title";
import "../users.css"

const initialData = [
  {
    key: 1,
    id: 1,
    date: "20/05/2568",
    company: "ไฮเทค โซลูชั่นส์ จำกัด",
    detail: "ทำคลิปวิดีโอ...",
    status: "รับรอง",
    verification_document:
      "https://swr.co.th/wp-content/uploads/2019/02/Screen-Shot-2562-02-09-at-15.11.16.png",
  },
  {
    key: 2,
    id: 2,
    date: "20/05/2568",
    company: "สมาร์ทวิชั่น อินโนเวชั่น จำกัด",
    detail: "ทำคลิปวิดีโอ...",
    status: "รอรับรอง",
    verification_document:
      "https://swr.co.th/wp-content/uploads/2019/02/Screen-Shot-2562-02-09-at-15.11.16.png",
  },
];

const Companies: React.FC = () => {
  const [activeTab, setActiveTab] = useState("รอรับรอง");
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState(initialData);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm] = Form.useForm();

  const isPdfFile = (url: string) => {
    return url?.toLowerCase().endsWith(".pdf");
  };

  // ใช้เปิด Modal เพื่อแสดงรายละเอียดของบริษัทที่เลือก
  const openDetailModal = (record: any) => {
    setSelectedRow(record);
    setShowDetailModal(true);
  };

  // ใช้ปิด modal รายละเอียดและเปิด modal ยืนยันการรับรอง
  const confirmVerification = () => {
    setShowDetailModal(false);
    setShowConfirmModal(true);
  };

  // ฟังก์ชันนี้ใช้เปลี่ยนสถานะบริษัทเป็น 'รับรอง'
  const finalizeVerification = () => {
    setData((prev) =>
      prev.map((item) =>
        item.key === selectedRow.key ? { ...item, status: "รับรอง" } : item
      )
    );
    setShowConfirmModal(false);
  };

  // ใช้เปิด Modal แก้ไขบริษัท โดยเติมข้อมูลเดิมลงในฟอร์ม
  const openEditModal = (record: any) => {
    setSelectedRow(record);
    editForm.setFieldsValue(record);
    setShowEditModal(true);
  };

  // ใช้ validate และบันทึกการแก้ไขข้อมูลบริษัท
  const handleEditSubmit = () => {
    editForm.validateFields().then((values) => {
      setData((prev) =>
        prev.map((item) =>
          item.key === selectedRow.key ? { ...item, ...values } : item
        )
      );
      setShowEditModal(false);
    });
  };

  const handleDeleteCard = async (cardID: string) => {
    /*  try {
      const response = await DeleteParkingCard(cardID);
      if (response.status === 200) {
        message.success("Card deleted successfully.");
        setCards(cards.filter((card) => card.ID !== cardID));
        setReload(!reload);
      } else {
        message.error("Failed to delete card.");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      message.error("An error occurred while deleting the card.");
    } */
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "วันที่สมัคร", dataIndex: "date", key: "date" },
    {
      title: "บริษัท",
      key: "company",
      render: (_: any, record: any) => (
        <a href={`/company/${record.id}`} style={{ color: "#1677ff" }}>
          {record.company}
        </a>
      ),
    },
    { title: "รายละเอียด", dataIndex: "detail", key: "detail" },
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
      title: "การจัดการ",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <EditOutlined
            style={{ fontSize: "18px", cursor: "pointer" }}
            onClick={() => openEditModal(record)}
          />
          /
          {/* <DeleteOutlined
            style={{ fontSize: "18px", cursor: "pointer" }}
            onClick={() => openDeleteModal(record)}
          /> */}
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDeleteCard(record.ID || "")}
          >
            <DeleteOutlined />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getTableData = () => {
    let filtered = data;
    if (activeTab !== "ทั้งหมด") {
      filtered = filtered.filter((item) => item.status === activeTab);
    }
    if (searchText.trim()) {
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
            <Title level={3}>บริษัท (Companies)</Title>
          </Col>
          <Col span={4}>
            <Flex align="center" gap={16} justify="end">
              จำนวน
              <Card
                size="small"
                style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
              >
                <div style={{ fontSize: 18, fontWeight: "bolder" }}>
                  {data.length}
                </div>
              </Card>
            </Flex>
          </Col>
        </Row>

        <Flex
          justify="center"
          align="center"
          gap="5vw"
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
        </Flex>

        <Table
          className="custom-table"
          columns={columns}
          dataSource={getTableData()}
          pagination={{ pageSize: 6 }}
          size="middle"
        />

        <Modal
          open={showDetailModal}
          onCancel={() => setShowDetailModal(false)}
          title="รายละเอียดการรับรอง"
          footer={
            selectedRow?.status === "รับรอง"
              ? null // ❌ ไม่แสดง footer เลย
              : [
                  <Button
                    key="cancel"
                    onClick={() => setShowDetailModal(false)}
                  >
                    ยกเลิก
                  </Button>,
                  <Button
                    key="confirm"
                    type="primary"
                    onClick={confirmVerification}
                  >
                    ยืนยัน
                  </Button>,
                ]
          }
        >
          <p>
            <strong>บริษัท:</strong> {selectedRow?.company}
          </p>
          <p>
            <strong>รายละเอียด:</strong> {selectedRow?.detail}
          </p>
          {selectedRow?.verification_document &&
            (isPdfFile(selectedRow.verification_document) ? (
              <>
                <embed
                  src={selectedRow.verification_document}
                  width="100%"
                  height="500px"
                  type="application/pdf"
                />
                <a
                  href={selectedRow.verification_document}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", marginTop: 10 }}
                >
                  เปิดเอกสาร PDF
                </a>
              </>
            ) : (
              <Image
                src={selectedRow.verification_document}
                alt="แนบเอกสาร"
                width="100%"
                style={{ marginTop: 16, borderRadius: 8 }}
              />
            ))}
        </Modal>

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

        <Modal
          open={showEditModal}
          onCancel={() => setShowEditModal(false)}
          onOk={handleEditSubmit}
          okText="บันทึก"
          cancelText="ยกเลิก"
          title="แก้ไขข้อมูลบริษัท"
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              name="company"
              label="ชื่อบริษัท"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="detail"
              label="รายละเอียด"
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={3} />{" "}
            </Form.Item>
            <Form.Item
              name="date"
              label="วันที่สมัคร"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="verification_document" label="หนังสือรับรอง">
              {selectedRow?.verification_document &&
                (isPdfFile(selectedRow.verification_document) ? (
                  <>
                    <embed
                      src={selectedRow.verification_document}
                      width="100%"
                      height="500px"
                      type="application/pdf"
                    />
                    <a
                      href={selectedRow.verification_document}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "block", marginTop: 10 }}
                    >
                      เปิดเอกสาร PDF
                    </a>
                  </>
                ) : (
                  <Image
                    src={selectedRow.verification_document}
                    alt="แนบเอกสาร"
                    width="100%"
                    style={{ marginTop: 16, borderRadius: 8 }}
                  />
                ))}
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default Companies;
