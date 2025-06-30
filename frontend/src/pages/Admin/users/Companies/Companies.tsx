import React, { useEffect, useState } from "react";
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
  message,
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
import dayjs from "dayjs";
import "../users.css";

import { GetAllCompany, GetAllUser } from "../../../../services/https";

import type { CompanyInterface } from "../../../../interfaces/Company";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";

const Companies: React.FC = () => {
  const [companyData, setCompanyData] = useState<CompanyInterface[]>([]);
  const [selectedRow, setSelectedRow] = useState<CompanyInterface | null>(null);

  const [activeTab, setActiveTab] = useState("รอรับรอง");
  const [searchText, setSearchText] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    const fetchCompanies = async () => {
      const resUser = await GetAllCompany();
      if (resUser.status === 200) {
        const companiesWithStatus = resUser.data.map((item: any) => ({
          ...item,
          // สมมุติว่ามี verifications: Verify[] ที่ดึงมาจาก backend
          status:
            item.verifications?.[0]?.status?.name === "รับรอง"
              ? "รับรอง"
              : "รอรับรอง",
          verify: item.verifications?.[0]?.status?.name === "รับรอง",
        }));
        setCompanyData(companiesWithStatus);
      } else {
        message.error("ไม่พบข้อมูลบริษัท กรุณาลองใหม่อีกครั้ง");
      }
    };

    fetchCompanies();
  }, []);

  // ฟังก์ชันนี้ใช้เปลี่ยนสถานะบริษัทเป็น 'รับรอง'
  const finalizeVerification = async () => {
    try {
      await axios.put(`http://localhost:8000/verify/${selectedRow?.ID}`, {
        status_id: 1, // สมมุติว่า 1 คือ "รับรอง"
      });

      setCompanyData((prev) =>
        prev?.map((item) =>
          item.ID === selectedRow?.ID
            ? { ...item, status: "รับรอง", verify: true }
            : item
        )
      );
      setShowConfirmModal(false);
      message.success("รับรองบริษัทเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Error updating verification:", err);
      message.error("เกิดข้อผิดพลาดในการรับรองบริษัท");
    }
  };

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
          item.ID === selectedRow?.ID ? { ...item, ...values } : item
        )
      );
      setShowEditModal(false);
    });
  };

  const handleDelete = (companyID: number) => {
    setCompanyData((prev) =>
      prev.filter((company) => company.ID !== companyID)
    );
  };

  const columns: ColumnsType<CompanyInterface /*  & { status?: string } */> = [
    { title: "ID", dataIndex: "ID", key: "ID" },
    {
      title: "วันที่สมัคร",
      dataIndex: "CreatedAt",
      key: "CreatedAt",
      render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "โลโก้",
      key: "logo",
      render: (_: any, record: CompanyInterface) => (
        <Avatar shape="square" size="large" src={record.logo || undefined}>
          {record.company_name?.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: "บริษัท",
      key: "company",
      render: (_: any, record: CompanyInterface) => (
        <a href={`/company/${record.ID}`} style={{ color: "#1677ff" }}>
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
      const isVerified = activeTab === "รับรอง";
      filtered = filtered?.filter((item) => item.verify === isVerified);
    }

    if (searchText.trim()) {
      filtered = filtered?.filter((item) =>
        [item.ID, item.company_name, item.created_at].some((field) =>
          String(field).toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    return (filtered || []).map((item) => ({
      ...item,
      status: item.verify ? "รับรอง" : "รอรับรอง",
    }));
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
            <Form.Item name="created_at" label="วันที่สมัคร"></Form.Item>
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
