import React, { useState } from "react";
import {
  Layout,
  Table,
  Input,
  Row,
  Col,
  Button,
  Card,
  Flex,
  Space,
  Modal,
  Form,
  Popconfirm,
  Image,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import AdminHeader from "../../../Component/AdminNavbar";
import Title from "antd/es/typography/Title";
import "../Companies/Companies.css";

const { Content } = Layout;

const initialData = [
  {
    key: 1,
    id: 1,
    name: "กุลณิภา กระจ่างวงศ์",
    university: "ไฮเทค โซลูชั่นส์ จำกัด",
    faculty: "เทคโนโลยีสารสนเทศ",
    date: "20/05/2568",
    status: "รับรอง",
    academic_position: "รองศาสตราจารย์",
    department: "วิทยาการคอมพิวเตอร์",
    age: 45,
    verification_document:
      "https://www.dhr.nu.ac.th/wp-content/uploads/2023/02/FormE5.pdf",
  },
  {
    key: 2,
    id: 2,
    name: "พรรณวร วิเชียรชาย",
    university: "สมาร์ทวิชั่น อินโนเวชั่น จำกัด",
    faculty: "บริหารธุรกิจ",
    date: "20/05/2568",
    status: "รอรับรอง",
    academic_position: "ผู้ช่วยศาสตราจารย์",
    department: "การจัดการ",
    age: 50,
    verification_document:
      "https://www.dhr.nu.ac.th/wp-content/uploads/2023/02/FormE5.pdf",
  },
];

const AcademicStaff: React.FC = () => {
  const [activeTab, setActiveTab] = useState("รอรับรอง");
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState(initialData);
  const [editForm] = Form.useForm();
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
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
    setData((prev) =>
      prev.map((item) =>
        item.key === selectedRow.key ? { ...item, status: "รับรอง" } : item
      )
    );
    setShowConfirmModal(false);
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "วันที่สมัคร", dataIndex: "date", key: "date" },
    { title: "ชื่อ-นามสกุล", dataIndex: "name", key: "name" },
    { title: "มหาวิทยาลัย", dataIndex: "university", key: "university" },
    { title: "สาขา", dataIndex: "faculty", key: "faculty" },
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
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <EditOutlined
            style={{ cursor: "pointer" }}
            onClick={() => {
              setSelectedRow(record);
              editForm.setFieldsValue(record);
              setShowEditModal(true);
            }}
          />
          /
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

  const isPdfFile = (url: string) => {
    return url?.toLowerCase().endsWith(".pdf");
  };

  const getFilteredData = () => {
    let filtered = data;
    if (activeTab !== "ทั้งหมด") {
      filtered = filtered.filter((item) => item.status === activeTab);
    }
    if (searchText.trim()) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
    return filtered;
  };

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
    console.log("Delete card with ID:", cardID);
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <Row>
          <Col span={20}>
            <Title level={3}>อาจารย์</Title>
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
          dataSource={getFilteredData()}
          pagination={{ pageSize: 6 }}
          size="middle"
        />
        <Modal
          open={showEditModal}
          onCancel={() => setShowEditModal(false)}
          onOk={handleEditSubmit}
          okText="บันทึก"
          cancelText="ยกเลิก"
          title="แก้ไขข้อมูลอาจารย์"
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              name="name"
              label="ชื่อ-นามสกุล"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="university"
              label="มหาวิทยาลัย"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="faculty" label="สาขา" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="academic_position" label="ตำแหน่งทางวิชาการ">
              <Input />
            </Form.Item>
            <Form.Item name="department" label="ภาควิชา">
              <Input />
            </Form.Item>
            <Form.Item
              name="age"
              label="อายุ"
              rules={[{ type: "number", min: 0 }]}
            >
              <Input type="number" />
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

        <Modal
          open={showDetailModal}
          onCancel={() => setShowDetailModal(false)}
          title="รายละเอียดการรับรอง"
          footer={
            selectedRow?.status === "รับรอง"
              ? null
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
            <strong>ชื่อ:</strong> {selectedRow?.name}
          </p>
          <p>
            <strong>ตำแหน่งทางวิชาการ:</strong> {selectedRow?.academic_position}
          </p>
          <p>
            <strong>อายุ:</strong> {selectedRow?.age}
          </p>
          <p>
            <strong>คณะ:</strong> {selectedRow?.faculty}
          </p>
          <p>
            <strong>ภาควิชา:</strong> {selectedRow?.department}
          </p>
          <p>
            <strong>มหาวิทยาลัย:</strong> {selectedRow?.university}
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
          <p>คุณแน่ใจหรือไม่ว่าจะรับรองอาจารย์นี้?</p>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default AcademicStaff;
