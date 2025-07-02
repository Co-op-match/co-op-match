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
  Select,
  Radio,
  Image,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import dayjs from "dayjs";
import AdminHeader from "../../../Component/AdminNavbar";
import {
  GetAllCompany,
  GetAllStatusVerify,
  UpdateCompany,
  UpdateVerifyStatus,
} from "../../../../services/https/aum";
import type { CompanyInterface } from "../../../../interfaces/Company";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import "../users.css";
import type { StatusVerifyInterface } from "../../../../interfaces/StatusVerify";
import type { VerifyInterface } from "../../../../interfaces/Verify";

const Companies: React.FC = () => {
  const [form] = Form.useForm();

  const [companies, setCompanies] = useState<CompanyInterface[]>([]);
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyInterface | null>(null);

  const statusCountMap: Record<string, number> = {};

  const [status, setStatus] = useState<StatusVerifyInterface[]>([]);
  const [statusTabs, setStatusTabs] = useState<string[]>([]);

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const [activeTab, setActiveTab] = useState("รอรับรอง");

  const [searchText, setSearchText] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [res_company, res_status] = await Promise.all([
          GetAllCompany(),
          GetAllStatusVerify(),
        ]);
        if (res_company.status === 200) {
          setCompanies(res_company.data);
        } else {
          message.error("ไม่พบข้อมูลบริษัท กรุณาลองใหม่อีกครั้ง");
        }
        if (res_status.status === 200) {
          setStatus(res_status.data);
          const names = res_status.data.map((s: any) => s.status_verify);
          setStatusTabs([...names, "ทั้งหมด"]);
          console.log("names ", names);

          /*แสดงจำนวนบริษัทแต่ละสถานะบนปุ่ม tab*/
          companies.forEach((company) => {
            const status = getLatestStatus(company);
            statusCountMap[status] = (statusCountMap[status] || 0) + 1;
          });
          statusCountMap["ทั้งหมด"] = companies.length;
        } else {
          message.error("ไม่พบข้อมูลสถานะการรับรอง กรุณาลองใหม่อีกครั้ง");
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
        message.error("เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท");
      }
    };

    fetchAllData();
  }, []);

  const getLatestStatus = (company: CompanyInterface) => {
    if (!company || !company.User) return "ยังไม่ได้ส่งคำขอ";
    const verifications = company.User.Verifications || [];
    const latest = verifications.length
      ? verifications.sort(
          (a, b) =>
            new Date(b.CreatedAt || "").getTime() -
            new Date(a.CreatedAt || "").getTime()
        )[0]
      : null;
    return latest?.StatusVerify?.status_verify || "ยังไม่ได้ส่งคำขอ";
  };

  const getLatestVerification = (company: CompanyInterface) => {
    if (!company?.User?.Verifications?.length) return null;
    return [...company.User.Verifications].sort(
      (a, b) =>
        new Date(b.CreatedAt || "").getTime() -
        new Date(a.CreatedAt || "").getTime()
    )[0];
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

  const handleSubmitDecision = async (reason: string) => {
    const latest = getLatestVerification(selectedCompany!);
    if (!latest) return;

    const selectedStatusObj = status.find(
      (s) => s.status_verify === selectedStatus
    );
    if (!selectedStatusObj) return;

    console.log("selectedStatusObj: ", selectedStatusObj);

    const updateVerifyData: VerifyInterface = {
      StatusVerifyID: selectedStatusObj.ID,
      AdminID: 1,
      reason: selectedStatus === "ปฏิเสธ" ? reason : "",
    };

    try {
      await UpdateVerifyStatus(latest.ID!, updateVerifyData);
      message.success(`${selectedStatus} บริษัทเรียบร้อยแล้ว`);
      setShowDetailModal(false);
      const res = await GetAllCompany();
      if (res.status === 200) setCompanies(res.data);
    } catch (err) {
      console.error(err);
      message.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
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

  /*   const handleEditSubmit = () => {
    editForm.validateFields().then((values) => {
      setCompanies((prev) =>
        prev.map((item) =>
          item.ID === selectedCompany?.ID ? { ...item, ...values } : item
        )
      );
      setShowEditModal(false);
    });
  }; */
  const handleEditSubmit = async (values: any) => {
    try {
      const response = await UpdateCompany(selectedCompany?.ID!, values);
      if (response.status === 200) {
        message.success("อัปเดตข้อมูลบริษัทเรียบร้อยแล้ว");
        setShowEditModal(false);
        /* loadCompanyList(); // reload data */
      }
    } catch (err) {
      console.error(err);
      message.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูลบริษัท");
    }
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
              border:
                status === "รับรอง" ? "none" : "1px solid rgba(0,0,0,0.2)",
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
              <Card
                size="small"
                style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
              >
                <div style={{ fontSize: 18, fontWeight: "bold" }}>
                  {companies.length}
                </div>
              </Card>
            </Flex>
          </Col>
        </Row>

        <Flex
          justify="center"
          align="center"
          gap="5vw"
          style={{ margin: "1rem 0" }}
        >
          <Select
            value={activeTab}
            onChange={(value) => setActiveTab(value)}
            style={{ width: 200 }}
            options={statusTabs.map((status) => ({
              label: status,
              value: status,
            }))}
            placeholder="เลือกสถานะ"
          />

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
          title="รายละเอียดการรับรอง"
          onCancel={() => {
            setShowDetailModal(false);
            form.resetFields(); // ✅ รีเซ็ต TextArea
            setSelectedStatus(""); // ✅ รีเซ็ต Radio
          }}
          onOk={async () => {
            try {
              if (selectedStatus === "ปฏิเสธ") {
                await form.validateFields(); // ✅ ตรวจสอบว่ากรอกเหตุผล
              }
              const reason = form.getFieldValue("rejectReason") || "";
              await handleSubmitDecision(reason);
            } catch (err) {
              // error จะทำให้ Input มีขอบแดงอัตโนมัติ
            }
          }}
          okText="ยืนยัน"
          cancelText="ยกเลิก"
        >
          <Form form={form} layout="vertical">
            <p>
              <strong>บริษัท:</strong> {selectedCompany?.company_name}
            </p>

            {(() => {
              const latest = getLatestVerification(selectedCompany!);
              if (!latest) return <p>ยังไม่มีการส่งคำขอรับรอง</p>;

              return (
                <>
                  <p>
                    <strong>สถานะ:</strong>{" "}
                    {latest?.StatusVerify?.status_verify || "ไม่ทราบสถานะ"}
                  </p>
                  <p>
                    <strong>วันที่ส่งคำขอ:</strong>{" "}
                    {dayjs(latest?.CreatedAt).format("DD/MM/YYYY HH:mm")}
                  </p>
                  <p>
                    <strong>เอกสารการยืนยัน:</strong>
                  </p>

                  {(() => {
                    const url = latest.verification_document;
                    const ext = url?.split(".").pop()?.toLowerCase();

                    if (!url)
                      return <p style={{ color: "gray" }}>ไม่มีเอกสาร</p>;

                    if (["png", "jpg", "jpeg", "webp"].includes(ext!)) {
                      return (
                        <img
                          src={url}
                          alt="Verification Document"
                          style={{
                            maxWidth: "100%",
                            maxHeight: 400,
                            borderRadius: 8,
                          }}
                        />
                      );
                    } else if (ext === "pdf") {
                      return (
                        <iframe
                          src={url}
                          title="PDF Document"
                          width="100%"
                          height="500px"
                          style={{ border: "1px solid #ccc", borderRadius: 8 }}
                        />
                      );
                    } else {
                      return (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          คลิกเพื่อเปิดเอกสาร
                        </a>
                      );
                    }
                  })()}

                  <Radio.Group
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      if (e.target.value !== "ปฏิเสธ") {
                        form.resetFields(["rejectReason"]);
                      }
                    }}
                    value={selectedStatus}
                    style={{ marginTop: 16 }}
                  >
                    <Radio value="รับรอง">รับรอง</Radio>
                    <Radio value="ปฏิเสธ">ปฏิเสธ</Radio>
                  </Radio.Group>

                  {selectedStatus === "ปฏิเสธ" && (
                    <Form.Item
                      name="rejectReason"
                      rules={[
                        {
                          required: true,
                          message: "กรุณาระบุเหตุผลในการปฏิเสธ",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder="กรุณาระบุเหตุผลในการปฏิเสธ"
                      />
                    </Form.Item>
                  )}
                </>
              );
            })()}
          </Form>
        </Modal>

        <Modal
          title="แก้ไขข้อมูลบริษัท"
          open={showEditModal}
          onOk={() => editForm.submit()}
          onCancel={() => setShowEditModal(false)}
          okText="บันทึก"
          cancelText="ยกเลิก"
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditSubmit}
            initialValues={{
              company_name: selectedCompany?.company_name,
              logo: selectedCompany?.logo,
              address_id: selectedCompany?.address_id,
              admin_id: selectedCompany?.admin_id,
              created_at: selectedCompany?.CreatedAt,
            }}
          >
            <Form.Item
              name="company_name"
              label="ชื่อบริษัท"
              rules={[{ required: true, message: "กรุณาระบุชื่อบริษัท" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="logo"
              label="โลโก้ (URL)"
              rules={[{ type: "url", message: "URL โลโก้ไม่ถูกต้อง" }]}
            >
              <Input placeholder="https://example.com/logo.png" />
            </Form.Item>

            {/* แสดงตัวอย่างโลโก้ที่ใส่ไว้ */}
            {editForm.getFieldValue("logo") && (
              <div style={{ marginBottom: 16 }}>
                <p>ตัวอย่างโลโก้:</p>
                <Image
                  src={editForm.getFieldValue("logo")}
                  alt="โลโก้บริษัท"
                  width={150}
                  height={150}
                  style={{
                    objectFit: "contain",
                    border: "1px solid #ccc",
                    padding: 8,
                  }}
                />
              </div>
            )}

            <Form.Item
              name="address_id"
              label="รหัสที่อยู่ (Address ID)"
              rules={[{ required: true, message: "กรุณาระบุที่อยู่" }]}
            >
              <Input type="number" />
            </Form.Item>

            <Form.Item
              name="admin_id"
              label="รหัสผู้ดูแล (Admin ID)"
              rules={[{ required: true, message: "กรุณาระบุผู้ดูแล" }]}
            >
              <Input type="number" />
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
