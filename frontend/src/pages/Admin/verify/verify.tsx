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
import { GetAdminByUserId, GetAllStatusVerify, GetAllVerifications, GetVerifyStats, SendEmailVerify, UpdateVerifyStatus } from "../../../services/https";
import type { StatusVerifyInterface } from "../../../interfaces/StatusVerify";
import type { VerifyInterface } from "../../../interfaces/Verify";
import type { ColumnsType } from "antd/es/table";
import AdminHeader from "../../Component/AdminCoopMatchHeaderDefault";
import DocumentModal from "./DocumentModal";
import DetailModal from "./DetailModal";
import { getStatusStyle } from "../../../components/adminpage/statusStyle";
import type { AdminInterface } from "../../../interfaces/Admin";
import { fileURL } from "@/config/env";
import AdminSectionHeader from "../AdminSectionHeader";
import { Verify_StatCard } from "../StatCard";

const { Text } = Typography;
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
  const [verifyStat, setVerifyStat] = useState({ total: 0, not_submitted: 0, pending: 0, approved: 0, rejected: 0 });

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

  useEffect(() => {
    (async () => {
      try {
        const d = await GetVerifyStats();
        setVerifyStat({
          total: d.total,
          not_submitted: d.not_submitted,
          pending: d.pending,
          approved: d.approved,
          rejected: d.rejected,
        });
      } catch (e) { console.error(e); }
    })();
  }, []);

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

  const shouldIgnoreRowClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    // กันคลิกจากปุ่ม ลิงก์ อินพุต ดรอปดาวน์ ฯลฯ
    return !!el.closest(
      'button, a, .ant-btn, .ant-select, .ant-dropdown, .ant-input, .ant-checkbox, .ant-switch, .ant-radio'
    );
  };

  // ===== table columns =====
  const columns: ColumnsType<VerifyInterface> = [
    {
      title: "ผู้ขอรับรอง",
      key: "user",
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
      render: (_, record) => <Text code style={{ fontSize: 13 }}>VERIFY-{record.ID?.toString().padStart(4, "0")}</Text>,
    },
    {
      title: "วันที่ส่ง",
      key: "createdAt",
      render: (_, record) => <div style={{ fontSize: 14 }}>{new Date(record.CreatedAt as any).toLocaleDateString("th-TH")}</div>,
    },
    {
      title: "สถานะ",
      key: "status",
      align: "center",
      fixed: "right",
      width: 150,
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
            onClick={(e) => {
              e.stopPropagation();       // กันไปทริกเกอร์ onRow
              handleViewDetail(record);
            }}
            disabled={record.StatusVerify?.status_verify === "ยังไม่ได้ส่งคำขอ"}
            className="action-button"
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
      <Layout className="adminpage-layout" style={{ padding: 16 }}>
        <div style={{ margin: 32, marginTop: 8 }}>
          <AdminSectionHeader
            icon={<FileTextOutlined style={{ fontSize: 32, color: "white" }} />}
            title="ตรวจสอบการรับรอง"
            subtitle="ระบบตรวจสอบและอนุมัติการรับรองบุคลากรทางวิชาการและบริษัท"
          />

          <Verify_StatCard
            total={verifyStat.total}
            notSubmitted={verifyStat.not_submitted}
            pending={verifyStat.pending}
            approved={verifyStat.approved}
            rejected={verifyStat.rejected}
            showTotalCard
          />
        
          {/* Main Content Card */}
          <Card className="main-content-card">
            {/* Enhanced Filter Section */}
            <div className="filter-section">
              <Card className="filter-card">
                <Row gutter={[24, 24]} align="middle">
                  <Col xs={24} md={12}>
                    <div className="input-label">
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
                      className="enhanced-select"
                      size="large"
                      options={[
                        { label: "ทั้งหมด", value: "ทั้งหมด" }, 
                        ...statusVerifications.map((s) => ({ label: s.status_verify, value: s.status_verify }))
                      ]}
                      placeholder="เลือกสถานะที่ต้องการแสดง"
                      allowClear
                      maxTagCount="responsive"
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="input-label">
                      ค้นหาผู้ขอรับรอง
                    </div>
                    <Input
                      placeholder="ค้นหาชื่อบริษัท, Email หรือ ID..."
                      suffix={<SearchOutlined className="search-icon" />}
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      size="large"
                      className="enhanced-input"
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </Card>
            </div>

            {/* Enhanced Table */}
            <div className="table-container">
              <Table
                columns={columns}
                rowKey="ID"
                loading={loading}
                dataSource={sortedVerifications}
                onRow={(record) => ({
                  onClick: (e) => {
                    if (shouldIgnoreRowClick(e)) return; // ข้ามถ้าคลิกปุ่ม/อินพุต
                    // ไม่ให้เปิดสำหรับ "ยังไม่ได้ส่งคำขอ"
                    const status = record.StatusVerify?.status_verify || "รอรับรอง";
                    if (status === "ยังไม่ได้ส่งคำขอ") return;
                    handleViewDetail(record);
                  },
                })}
                rowClassName={(record) => {
                  const status = record.StatusVerify?.status_verify || "รอรับรอง";
                  return status === "ยังไม่ได้ส่งคำขอ" ? "row-disabled" : "row-clickable";
                }}
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
                  onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
                }}
                size="middle"
                scroll={{ x: 'max-content' }}
                className="enhanced-table"
              />
            </div>
          </Card>
        </div>
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

      <DocumentModal 
        open={documentModalVisible} 
        selectedDocument={selectedDocument} 
        onCancel={() => setDocumentModalVisible(false)} 
      />
    </Layout>
  );
};

export default CertificationReviewPage;

const customStyle = `

  /* Main Content Card */
  .main-content-card {
    border-radius: 24px !important;
    box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important;
    border: 2px solid rgba(59, 130, 246, 0.1) !important;
    overflow: hidden !important;
    animation: fadeInUp 1s ease-out 0.2s both;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  }

  /* Filter Section */
  .filter-section {
    margin-bottom: 32px;
  }

  .filter-card {
    background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%) !important;
    border-radius: 8px !important;
    backdrop-filter: blur(10px);
    animation: fadeInUp 1s ease-out 0.4s both;
    position: relative;
    overflow: hidden;
  }

  .filter-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: shimmer 3s infinite;
  }

  .filter-header {
    margin-bottom: 20px;
    text-align: left;
  }

  .input-label {
    margin-bottom: 12px;
    font-weight: 600;
    background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 16px;
  }

  /* Enhanced Form Controls */
  .enhanced-select .ant-select-selector {
    border-radius: 16px !important;
    border: 2px solid rgba(59, 130, 246, 0.3) !important;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1) !important;
  }

  .enhanced-input {
    border-radius: 16px !important;
    border: 2px solid rgba(59, 130, 246, 0.3) !important;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1) !important;
  }

  .enhanced-input:focus {
    border-color: rgb(59, 130, 246) !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), 0 8px 24px rgba(59, 130, 246, 0.2) !important;
    transform: translateY(-2px) !important;
  }

  .search-icon {
    color: rgb(59, 130, 246) !important;
    font-size: 16px !important;
    display: contents;
  }

  /* Enhanced Table */
  .table-container {
    animation: fadeInUp 1s ease-out 0.6s both;
  }

  /* Action Button */
  .action-button {
    background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%) !important;
    border: none !important;
    border-radius: 16px !important;
    width: 50% !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
    position: relative !important;
    overflow: hidden !important;
  }

  .action-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }

  .action-button:hover::before {
    left: 100%;
  }

  .action-button:hover {
    transform: translateY(-3px) scale(1.05) !important;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4) !important;
  }

  .action-button:active {
    transform: translateY(-1px) scale(1.02) !important;
  }

  /* Status Button Enhancements */
  .adminpage-verify-status-button {
    border-radius: 20px !important;
    width: 60% !important;
    cursor: default !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    font-size: 12px !important;
    transition: all 0.3s ease !important;
    position: relative !important;
    overflow: hidden !important;
  }

  .adminpage-verify-status-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    animation: shimmer 3s infinite;
  }

  /* Pagination Enhancements */
  .enhanced-table .ant-pagination {
    margin-top: 24px !important;
  }

  .enhanced-table .ant-pagination .ant-pagination-item {
    border-radius: 12px !important;
    border: 2px solid rgba(59, 130, 246, 0.2) !important;
    transition: all 0.3s ease !important;
  }

  .enhanced-table .ant-pagination .ant-pagination-item:hover {
    border-color: rgb(59, 130, 246) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
  }

  .enhanced-table .ant-pagination .ant-pagination-item-active {
    background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%) !important;
    border-color: transparent !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3) !important;
  }

  .enhanced-table .ant-pagination .ant-pagination-item-active a {
    color: white !important;
    font-weight: 600 !important;
  }

  /* Loading Enhancements */
  .ant-spin-dot-item {
    background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%) !important;
  }

  /* Tooltip Enhancements */
  .ant-tooltip {
    backdrop-filter: blur(10px) !important;
  }

  .ant-tooltip-inner {
    background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%) !important;
    border-radius: 12px !important;
    padding: 8px 12px !important;
    font-weight: 500 !important;
  }

  .ant-tooltip-arrow::before {
    background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%) !important;
  }

  /* Avatar Enhancements */
  .ant-avatar {
    transition: all 0.3s ease !important;
  }

  /* Code Text Enhancements */
  .ant-typography code {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%) !important;
    border: 1px solid rgba(59, 130, 246, 0.2) !important;
    border-radius: 8px !important;
    color: rgb(30, 58, 138) !important;
    font-weight: 600 !important;
    padding: 4px 8px !important;
  }

  @media (max-width: 576px) {

    .main-content-card {
      border-radius: 16px !important;
    }
    
    .filter-card {
      border-radius: 16px !important;
    }
  }

  /* แถวคลิกได้ */
  .row-clickable td {
    cursor: pointer;
  }

  /* แถวปิดการคลิก */
  .row-disabled td {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;