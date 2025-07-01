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
  Avatar,
  Form,
  Popconfirm,
  message,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import dayjs from "dayjs";
import AdminHeader from "../../../Component/AdminNavbar";
import { GetAllCompany } from "../../../../services/https";
import type { CompanyInterface } from "../../../../interfaces/Company";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import "../users.css";

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyInterface[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyInterface | null>(null);
  const [activeTab, setActiveTab] = useState("รอรับรอง");
  const [searchText, setSearchText] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await GetAllCompany();
        if (response.status === 200) {
          setCompanies(response.data);
        } else {
          message.error("ไม่พบข้อมูลบริษัท กรุณาลองใหม่อีกครั้ง");
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
        message.error("เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท");
      }
    };

    fetchCompanies();
  }, []);

  const getLatestStatus = (company: CompanyInterface) => {
    if (!company || !company.User) return "ยังไม่ได้ส่งคำขอ";
    const verifications = company.User.Verifications || [];
    const latest = verifications.length ? verifications.sort((a, b) => new Date(b.CreatedAt || '').getTime() - new Date(a.CreatedAt || '').getTime())[0] : null;
    return latest?.status?.status || "ยังไม่ได้ส่งคำขอ";
  };

  const handleVerify = async () => {
    try {
      await axios.put(`http://localhost:8000/verify/${selectedCompany?.ID}`, {
        status_id: 1,
      });

      setCompanies((prev) =>
        prev.map((item) =>
          item.ID === selectedCompany?.ID ? { ...item } : item
        )
      );
      setShowConfirmModal(false);
      message.success("รับรองบริษัทเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error verifying company:", error);
      message.error("เกิดข้อผิดพลาดในการรับรองบริษัท");
    }
  };

  const handleConfirmFromDetailModal = () => {
    setShowDetailModal(false);
    setShowConfirmModal(true);
  };

  const openDetailModal = (record: CompanyInterface) => {
    setSelectedCompany(record);
    setShowDetailModal(true);
  };

  const openEditModal = (record: CompanyInterface) => {
    setSelectedCompany(record);
    editForm.setFieldsValue(record);
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    editForm.validateFields().then((values) => {
      setCompanies((prev) =>
        prev.map((item) =>
          item.ID === selectedCompany?.ID ? { ...item, ...values } : item
        )
      );
      setShowEditModal(false);
    });
  };

  const handleDelete = (companyID: number) => {
    setCompanies((prev) => prev.filter((item) => item.ID !== companyID));
  };

  const filteredData = companies.filter((item) => {
    const status = getLatestStatus(item);
    if (activeTab !== "ทั้งหมด" && status !== activeTab) {
      if (!status && activeTab === "ยังไม่ได้ส่งคำขอ") return true;
      return false;
    }
    if (searchText.trim()) {
      return [item.ID, item.company_name, item.CreatedAt].some((field) =>
        String(field).toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return true;
  });

  const columns: ColumnsType<CompanyInterface> = [
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
      render: (_, record) => (
        <Avatar shape="square" size="large" src={record.logo || undefined}>
          {record.company_name?.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: "บริษัท",
      key: "company",
      render: (_, record) => (
        <a href={`/company/${record.ID}`} style={{ color: "#1677ff" }}>
          {record.company_name}
        </a>
      ),
    },
    {
      title: "การรับรอง",
      key: "status",
      align: "center",
      render: (_, record) => {
        const status = getLatestStatus(record);
        return (
          <Button
            onClick={() => openDetailModal(record)}
            style={{
              width: 100,
              borderRadius: 12,
              backgroundColor: status === "รับรอง" ? "#007AFF" : "#fff",
              color: status === "รับรอง" ? "#fff" : "#000",
              border: status === "รับรอง" ? "none" : "1px solid rgba(0,0,0,0.2)",
            }}
          >
            {status}
          </Button>
        );
      },
    },
    {
      title: "การจัดการ",
      key: "action",
      render: (_, record) => (
        <Space>
          <EditOutlined
            style={{ fontSize: 18, cursor: "pointer" }}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="คุณแน่ใจหรือไม่ที่จะลบ?"
            onConfirm={() => handleDelete(record.ID || 0)}
          >
            <DeleteOutlined style={{ cursor: "pointer" }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <Row justify="space-between">
          <Col>
            <Title level={3}>บริษัท (Companies)</Title>
          </Col>
          <Col>
            <Flex align="center" gap={16}>
              จำนวน
              <Card size="small" style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}>
                <div style={{ fontSize: 18, fontWeight: "bold" }}>{companies.length}</div>
              </Card>
            </Flex>
          </Col>
        </Row>

        <Flex justify="center" align="center" gap="5vw" style={{ margin: "1rem 0" }}>
          <div className="backgroundTabChooseVerify">
            {["ยังไม่ได้ส่งคำขอ", "รอรับรอง", "รับรอง", "ทั้งหมด"].map((tab) => (
              <div
                key={tab}
                className={`tabChooseVerify ${activeTab === tab ? "active" : ""}`}
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
          dataSource={filteredData}
          pagination={{ pageSize: 6 }}
          size="middle"
        />

        <Modal
          open={showDetailModal}
          onCancel={() => setShowDetailModal(false)}
          title="รายละเอียดการรับรอง"
          footer={
            getLatestStatus(selectedCompany!) === "รับรอง"
              ? null
              : [
                  <Button key="cancel" onClick={() => setShowDetailModal(false)}>
                    ยกเลิก
                  </Button>,
                  <Button key="confirm" type="primary" onClick={handleConfirmFromDetailModal}>
                    ยืนยัน
                  </Button>,
                ]
          }
        >
          <p><strong>บริษัท:</strong> {selectedCompany?.company_name}</p>
        </Modal>

        <Modal
          open={showConfirmModal}
          onCancel={() => setShowConfirmModal(false)}
          onOk={handleVerify}
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
            <Form.Item name="company_name" label="ชื่อบริษัท" rules={[{ required: true }]}> 
              <Input />
            </Form.Item>
            <Form.Item name="created_at" label="วันที่สมัคร">
              <Input disabled />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default Companies;