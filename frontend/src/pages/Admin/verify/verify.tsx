import { useState, useEffect, useMemo } from "react";
import { Card, Table, Button, Typography, Input, message, Row, Col, Avatar, Tooltip, Layout, Form, Select } from "antd";
import {
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  BuildOutlined,
  TeamOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { GetAdminByUserId, GetAllStatusVerify, GetAllVerifications, SendEmailVerify, UpdateVerifyStatus } from "../../../services/https";
import type { StatusVerifyInterface } from "../../../interfaces/StatusVerify";
import type { VerifyInterface } from "../../../interfaces/Verify";
import type { ColumnsType } from "antd/es/table";
import AdminHeader from "../../Component/AdminCoopMatchHeaderDefault";
import DocumentModal from "./DocumentModal";
import DetailModal from "./DetailModal";
import { getStatusStyle } from "../../../components/adminpage/statusStyle";
import type { AdminInterface } from "../../../interfaces/Admin";
import { fileURL } from "@/config/env";

const { Title, Text } = Typography;
const user_id = Number(localStorage.getItem("id") || 0);

const CertificationReviewPage: React.FC = () => {
  const [verifyForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // ===== state =====
  const [admin, setAdmin] = useState<AdminInterface>();
  const [selectedRecord, setSelectedRecord] = useState<VerifyInterface>();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    url: string;
    name: string;
    fileType: "pdf" | "image" | "unknown";
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifications, setVerifications] = useState<VerifyInterface[]>([]);
  const [statusVerifications, setStatusVerifications] = useState<StatusVerifyInterface[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusVerifyInterface>();

  const [selectedFilterStatuses, setSelectedFilterStatuses] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [pagination, setPagination] = useState({ current: 1, pageSize: 6 });

  // ===== api =====
  const fetchVerifications = async () => {
    setLoading(true);
    try {
      console.log("user_id: ", user_id);
      const [res_verify, res_status, res_admin] = await Promise.all([
        GetAllVerifications(),
        GetAllStatusVerify(),
        GetAdminByUserId(user_id),
      ]);
      if (res_verify.status === 200) setVerifications(res_verify.data);
      if (res_status.status === 200) setStatusVerifications(res_status.data);
      if (res_admin.status === 200) setAdmin(res_admin.data);
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูล: " + ((error as Error).message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVerifications(); }, []);

  // reset ฟอร์มเมื่อปิด detail modal
  useEffect(() => {
    if (!detailModalVisible) {
      verifyForm.resetFields();
      setSelectedStatus(undefined);
    }
  }, [detailModalVisible, verifyForm]);

  // ===== selectors / memo =====
  const filteredVerifications = useMemo(() => {
    const keyword = searchKeyword.toLowerCase();
    return verifications.filter((v) => {
      const status = v.StatusVerify?.status_verify || "รอรับรอง";
      const matchStatus = selectedFilterStatuses.length === 0 || selectedFilterStatuses.includes(status);

      const companyName = v?.User?.Company?.[0]?.company_name?.toLowerCase() || "";
      const staffFirstName = v?.User?.AcademicStaff?.[0]?.first_name?.toLowerCase() || "";
      const staffLastName = v?.User?.AcademicStaff?.[0]?.last_name?.toLowerCase() || "";
      const email = v?.User?.Email?.toLowerCase() || "";
      const id = `verify-${v.ID?.toString().padStart(4, "0")}`;

      const matchKeyword =
        companyName.includes(keyword) ||
        staffFirstName.includes(keyword) ||
        staffLastName.includes(keyword) ||
        email.includes(keyword) ||
        id.includes(keyword);

      return matchStatus && matchKeyword;
    });
  }, [verifications, selectedFilterStatuses, searchKeyword]);

  const sortedVerifications = useMemo(() => {
    const priority: Record<string, number> = { "รอรับรอง": 0, "รับรอง": 1, "ปฏิเสธ": 2, "ยังไม่ได้ส่งคำขอ": 3 };
    return [...filteredVerifications].sort((a, b) => {
      const statusA = a.StatusVerify?.status_verify || "รอรับรอง";
      const statusB = b.StatusVerify?.status_verify || "รอรับรอง";
      return priority[statusA] - priority[statusB];
    });
  }, [filteredVerifications]);

  // ===== helpers =====
  const getUserInfo = (user: any) =>
    user?.Company?.length
      ? { type: "company", name: user.Company[0]?.company_name, logo: fileURL(user.Company[0]?.logo), details: "บริษัท", icon: <BuildOutlined /> }
      : user?.AcademicStaff?.length
      ? {
          type: "academic",
          name: `${user.AcademicStaff[0]?.first_name} ${user.AcademicStaff[0]?.last_name}`,
          position: user.AcademicStaff[0]?.position,
          department: user.AcademicStaff[0]?.department,
          details: user?.Role?.role,
          icon: <TeamOutlined />,
        }
      : { type: "unknown", name: user?.Email, details: "ไม่ระบุประเภท", icon: <UserOutlined /> };

  const handleViewDetail = (record: VerifyInterface) => { setSelectedRecord(record); setDetailModalVisible(true); };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    verifyForm.resetFields();
    setSelectedStatus(undefined);
    setSelectedDocument(null);
  };

  const handleViewDocument = (documentPath: string) => {
    const fileType = documentPath?.toLowerCase().includes(".pdf") ? "pdf" : "image";
    setSelectedDocument({ name: "เอกสารประกอบการขอรับรอง", url: documentPath, fileType });
    setDocumentModalVisible(true);
  };

  const handleSubmitVerify = async () => {
    if (!selectedRecord || !selectedStatus?.ID) return messageApi.error("กรุณาเลือกสถานะและรายการก่อนยืนยัน");

    try {
      await verifyForm.validateFields();
      const values = verifyForm.getFieldsValue();

      const statusObj = statusVerifications.find((s) => s.ID === selectedStatus.ID);
      if (!statusObj) return messageApi.error("ไม่พบสถานะที่เลือก");

      const updateData: VerifyInterface = {
        StatusVerifyID: selectedStatus.ID,
        AdminID: admin?.ID,
        reason: statusObj.status_verify === "ปฏิเสธ" ? values.reason : "",
      };

      setLoading(true);

      // Update ก่อน
      try {
        const updateResponse = await UpdateVerifyStatus(selectedRecord.ID!, updateData);
        if (!updateResponse || updateResponse.status !== 200) throw new Error("Update failed or unexpected response");
      } catch (err) {
        console.error("❌ Update failed:", err);
        messageApi.error("อัปเดตสถานะล้มเหลว");
        return;
      }

      // ส่งอีเมลภายหลัง
      try {
        const emailRes = await SendEmailVerify(selectedRecord.UserID!);
        if (!emailRes || emailRes.status !== 202) throw new Error("Email sending failed");
      } catch (err) {
        console.error("❌ Email failed:", err);
        messageApi.warning("อัปเดตสำเร็จ แต่ส่งอีเมลไม่สำเร็จ");
      }

      messageApi.success(`${statusObj.status_verify} เรียบร้อยแล้ว`);
      verifyForm.resetFields();
      setRejectReason("");
      setSelectedRecord(undefined);
      setSelectedStatus(undefined);
      setSelectedDocument(null);
      setDetailModalVisible(false);
      await fetchVerifications();
    } catch (error) {
      console.error("Unknown error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ===== table columns =====
  const columns: ColumnsType<VerifyInterface> = [
    {
      title: "ผู้ขอรับรอง",
      key: "user",
      width: 250,
      render: (_, record) => {
        const userInfo = getUserInfo(record.User);
        const profileImage = fileURL(record?.User?.ProfileImage?.[0]?.image_url);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar size={48} src={userInfo.type === "company" ? userInfo.logo : profileImage} icon={userInfo.icon} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: "#262626" }}>{userInfo.name}</div>
              <div style={{ fontSize: 13, color: "#8c8c8c" }}>{userInfo.details}</div>
              {userInfo.position && <div style={{ fontSize: 13, color: "#595959" }}>{userInfo.position}</div>}
            </div>
          </div>
        );
      },
    },
    {
      title: "ข้อมูลเพิ่มเติม",
      key: "details",
      width: 200,
      render: (_, record) => {
        const userInfo = getUserInfo(record.User);
        return (
          <div>
            <div style={{ fontSize: 14, color: "#595959", marginBottom: 4 }}>อีเมล: {record.User?.Email}</div>
            {userInfo.department && <div style={{ fontSize: 13, color: "#8c8c8c" }}>{userInfo.department}</div>}
          </div>
        );
      },
    },
    {
      title: "รหัสการรับรอง",
      key: "id",
      width: 120,
      render: (_, record) => <Text code style={{ fontSize: 13 }}>VERIFY-{record.ID?.toString().padStart(4, "0")}</Text>,
    },
    {
      title: "วันที่ส่ง",
      key: "createdAt",
      width: 120,
      render: (_, record) => <div style={{ fontSize: 14 }}>{new Date(record.CreatedAt as any).toLocaleDateString("th-TH")}</div>,
    },
    {
      title: "สถานะ",
      key: "status",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_, record) => {
        const statusText = record.StatusVerify?.status_verify || "รอรับรอง";
        const { bgColor, textColor, border } = getStatusStyle(statusText);
        return (
          <Button
            className="adminpage-verify-status-button"
            style={{ background: bgColor, color: textColor, border, borderRadius: 16, width: "60%", cursor: "default" }}
          >
            {statusText}
          </Button>
        );
      },
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 120,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Tooltip
          title={record.StatusVerify?.status_verify === "ยังไม่ได้ส่งคำขอ" ? "ยังไม่ได้ส่งคำขอ (ไม่สามารถดูรายละเอียดได้)" : "ดูรายละเอียด"}
        >
          <Button
            type="primary"
            size="middle"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            disabled={record.StatusVerify?.status_verify === "ยังไม่ได้ส่งคำขอ"}
            style={{ borderRadius: 16, width: "50%" }}
          />
        </Tooltip>
      ),
    },
  ];

  // ===== render =====
  return (
    <Layout>
      <AdminHeader />
      {contextHolder}
      <style>{customStyle}</style>
      <Layout className="adminpage-layout">
        <div className="adminpost-header-box">
          <Row justify="space-between" align="middle" style={{ position: "relative", zIndex: 1 }}>
            <Col>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 20,
                  padding: 20,
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)"
                }}>
                  <FileTextOutlined style={{ 
                    fontSize: 40, 
                    color: "white",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  }} />
                </div>
                <div>
                  <Title level={1} style={{ 
                    margin: 0, 
                    color: "white", 
                    fontSize: 36,
                    fontWeight: 700,
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    letterSpacing: "-0.5px"
                  }}>
                    ตรวจสอบการรับรอง
                  </Title>
                  <Text style={{ 
                    color: "rgba(255, 255, 255, 0.9)", 
                    fontSize: 18,
                    fontWeight: 400,
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                  }}>
                    ระบบตรวจสอบและอนุมัติการรับรองบุคลากรทางวิชาการและบริษัท
                  </Text>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <Card style={{ 
          borderRadius: 20, 
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)", 
          border: "1px solid rgba(59, 130, 246, 0.1)",
          overflow: "hidden"
        }}>
          {/* Enhanced Filter Section */}
          <div style={{ marginBottom: 32 }}>
            <Card style={{
              background: "linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: 16,
              backdropFilter: "blur(10px)"
            }}>
              <Row gutter={[24, 24]} align="middle">
                <Col xs={24} md={12}>
                  <div style={{
                    marginBottom: 12,
                    fontWeight: 600,
                    color: "rgb(30, 58, 138)",
                    fontSize: 16
                  }}>
                    กรองตามสถานะ
                  </div>
                  <Select
                    mode="multiple"
                    value={selectedFilterStatuses}
                    onChange={(values) => {
                      if (values.includes("ทั้งหมด")) {
                        const allStatuses = statusVerifications.map((s) => s.status_verify);
                        const isAllSelected = selectedFilterStatuses.length === allStatuses.length && allStatuses.every((s) => selectedFilterStatuses.includes(s));
                        setSelectedFilterStatuses(isAllSelected ? [] : allStatuses);
                      } else setSelectedFilterStatuses(values);
                    }}
                    style={{ width: "100%" }}
                    size="large"
                    options={[
                      { label: "ทั้งหมด", value: "ทั้งหมด" }, 
                      ...statusVerifications.map((s) => ({ label: s.status_verify, value: s.status_verify }))
                    ]}
                    placeholder="เลือกสถานะที่ต้องการแสดง"
                    allowClear
                    maxTagCount="responsive"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <div style={{
                    marginBottom: 12,
                    fontWeight: 600,
                    color: "rgb(30, 58, 138)",
                    fontSize: 16
                  }}>
                    ค้นหาผู้ขอรับรอง
                  </div>
                  <Input
                    placeholder="ค้นหาชื่อบริษัท, Email หรือ ID..."
                    suffix={<SearchOutlined style={{ color: "#bfbfbf", fontSize: 16 }} />}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    size="large"
                    style={{
                      borderRadius: 12,
                      border: "2px solid rgba(59, 130, 246, 0.2)",
                      transition: "all 0.3s ease"
                    }}
                  />
                </Col>
              </Row>
            </Card>
          </div>

          <Table
            columns={columns}
            rowKey="ID"
            loading={loading}
            dataSource={sortedVerifications}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
              onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
            }}
            size="middle"
            scroll={{ x: 800 }}
            style={{
              borderRadius: 12,
            }}
          />
        </Card>
      </Layout>

        <DetailModal
          open={detailModalVisible}
          record={selectedRecord}
          onClose={handleCloseDetailModal}
          onSubmitVerify={handleSubmitVerify}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          statusVerifications={statusVerifications}
          loading={loading}
          setLoading={setLoading}
          isReadOnlyStatus={false}
          verifyForm={verifyForm}
          getUserInfo={getUserInfo}
          handleViewDocument={handleViewDocument}
          selectedDocument={selectedDocument}
          setRejectReason={setRejectReason}
          rejectReason={rejectReason}
        />

        <DocumentModal open={documentModalVisible} selectedDocument={selectedDocument} onCancel={() => setDocumentModalVisible(false)} />
      </Layout>
  );
};

export default CertificationReviewPage;


const customStyle = `
  @keyframes float {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(5deg);
    }
  }

  .ant-table-thead > tr > th {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%) !important;
    border-bottom: 2px solid rgba(59, 130, 246, 0.2) !important;
    color: rgb(30, 58, 138) !important;
    font-weight: 600 !important;
  }

  .ant-table-tbody > tr:hover > td {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.02) 0%, rgba(59, 130, 246, 0.02) 100%) !important;
  }

  .ant-select-selector {
    border-radius: 12px !important;
    border: 2px solid rgba(59, 130, 246, 0.2) !important;
    transition: all 0.3s ease !important;
  }

  .ant-select-focused .ant-select-selector {
    border-color: rgb(59, 130, 246) !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
  }

  .ant-input:focus {
    border-color: rgb(59, 130, 246) !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
  }

  .ant-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4) !important;
  }

  .ant-card {
    transition: all 0.3s ease;
  }

  .ant-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important;
  }
`