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
  Avatar,
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
import "../users.css";

import type { CompanyInterface } from "../../../../interfaces/Company";

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

const initialCompanyData: CompanyInterface[] = [
  {
    id: 1,
    company_name: "ไฮเทค โซลูชั่นส์ จำกัด",
    logo: "https://static.vecteezy.com/system/resources/thumbnails/023/654/784/small_2x/golden-logo-template-free-png.png",
    verify: true,
    user_id: 1,
    address_id: 1,
    admin_id: 1,
    contact: [],
    intership_posts: [],
    interview_appointments: [],
    reviews: [],
    created_at: "2025-05-20",
  },
  {
    id: 2,
    company_name: "สมาร์ทวิชั่น อินโนเวชั่น จำกัด",
    logo: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.vecteezy.com%2Ffree-png%2Flogo&psig=AOvVaw2hsd0es5eXgAJsuF0WuBlC&ust=1751357533766000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCIjy47_ZmI4DFQAAAAAdAAAAABAu",
    verify: false,
    user_id: 2,
    address_id: 2,
    admin_id: 2,
    contact: [],
    intership_posts: [],
    interview_appointments: [],
    reviews: [],
    created_at: "2025-05-20",
  },
];

const Companies: React.FC = () => {
  const [companyData, setCompanyData] =
    useState<CompanyInterface[]>(initialCompanyData);
  const [selectedRow, setSelectedRow] = useState<CompanyInterface | null>(null);

  const [activeTab, setActiveTab] = useState("รอรับรอง");
  const [searchText, setSearchText] = useState("");
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
    setCompanyData((prev) =>
      prev.map((item) =>
        item.id === selectedRow?.id ? { ...item, status: "รับรอง" } : item
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
      setCompanyData((prev) =>
        prev.map((item) =>
          item.key === selectedRow.key ? { ...item, ...values } : item
        )
      );
      setShowEditModal(false);
    });
  };

  const handleDelete = async (cardID: string) => {
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
    setSelectedRow((prev) => prev.filter((company) => company.id !== id));
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "วันที่สมัคร", dataIndex: "create_at", key: "create_at" },
    {
      title: "โลโก้",
      key: "logo",
      render: (_: any, record: CompanyInterface) => (
        <Avatar shape="square" size="large" src={record.logo || undefined}>
          {record.company_name}
        </Avatar>
      ),
    },

    {
      title: "บริษัท",
      key: "company",
      render: (_: any, record: CompanyInterface) => (
        <a href={`/company/${record.id}`} style={{ color: "#1677ff" }}>
          {record.company_name}
        </a>
      ),
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
            onConfirm={() => handleDelete(record.id)}
          >
            <DeleteOutlined />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getTableData = () => {
    let filtered = companyData;
    if (activeTab !== "ทั้งหมด") {
      filtered = filtered.filter((item) => item.status === activeTab);
    }
    if (searchText.trim()) {
      filtered = filtered.filter((item) =>
        [item.id, item.company_name, item.created_at].some((field) =>
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
                  {companyData.length}
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
            <strong>บริษัท:</strong> {selectedRow?.company_name}
          </p>
          <p></p>
          {/*  {selectedRow?.verification_document &&
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
            ))} */}
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
          title="แก้ไขข้อมูลบริษัท"
          open={showEditModal}
          onOk={handleEditSubmit}
          onCancel={() => setShowEditModal(false)}
          okText="บันทึก"
          cancelText="ยกเลิก"
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              name="company_name"
              label="ชื่อบริษัท"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="create_at"
              label="วันที่สมัคร"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
{/*             <Form.Item name="verification_document" label="หนังสือรับรอง">
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
            </Form.Item> */}
          </Form>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default Companies;
