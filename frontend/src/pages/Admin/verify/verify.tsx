import { useState, useEffect } from "react";
import { Card, Table, Button, Typography, Input, message, Row, Col, Avatar, Tooltip, Layout, Form, Select } from "antd";
import { EyeOutlined, FileTextOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, StopOutlined, BuildOutlined, TeamOutlined, SearchOutlined } from "@ant-design/icons";
import { GetAdminByUserId, GetAllStatusVerify, GetAllVerifications, SendEmailVerify, UpdateVerifyStatus } from "../../../services/https";
import type { StatusVerifyInterface } from "../../../interfaces/StatusVerify";
import type { VerifyInterface } from "../../../interfaces/Verify";
import type { ColumnsType } from "antd/es/table";
import AdminHeader from "../../Component/AdminHeader";
import DocumentModal from "./DocumentModal";
import DetailModal from "./DetailModal";
import { getStatusStyle } from "../../../components/adminpage/statusStyle";
import type { AdminInterface } from "../../../interfaces/Admin";

const { Title, Text } = Typography;

const user_id = Number(localStorage.getItem("id") || 0);

const CertificationReviewPage = () => {
  const [verifyForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [admin, setAdmin] = useState<AdminInterface | undefined>(undefined);
  const [selectedRecord, setSelectedRecord] = useState<
    VerifyInterface | undefined
  >(undefined);
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
  const [statusVerifications, setStatusVerifications] = useState<
    StatusVerifyInterface[]
  >([]);
  const [selectedStatus, setSelectedStatus] = useState<
    StatusVerifyInterface | undefined
  >(undefined);

  const [selectedFilterStatuses, setSelectedFilterStatuses] = useState<
    string[]
  >([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 6,
  });

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const [res_verify, res_status, res_admin] = await Promise.all([
        GetAllVerifications(),
        GetAllStatusVerify(),
        GetAdminByUserId(user_id),
      ]);
      if (res_verify.status === 200) setVerifications(res_verify.data);
      if (res_status.status === 200) setStatusVerifications(res_status.data);
      if (res_admin.status === 200) setAdmin(res_admin.data);
    } catch (error) {
      messageApi.error(
        "เกิดข้อผิดพลาดในการดึงข้อมูล: " +
          ((error as Error).message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  useEffect(() => {
    if (!open) {
      verifyForm.resetFields();
      setSelectedStatus(undefined);
    }
  }, [open]);

  const filteredVerifications = verifications.filter((v) => {
    const status = v.StatusVerify?.status_verify || "รอรับรอง";

    const matchStatus =
      selectedFilterStatuses.length === 0 ||
      selectedFilterStatuses.includes(status);

    const keyword = searchKeyword.toLowerCase();

    const companyName =
      v?.User?.Company?.[0]?.company_name?.toLowerCase() || "";

    const staffFirstName =
      v?.User?.AcademicStaff?.[0]?.first_name?.toLowerCase() || "";
    const staffLastName =
      v?.User?.AcademicStaff?.[0]?.last_name?.toLowerCase() || "";

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

  const sortedVerifications = [...filteredVerifications].sort((a, b) => {
    const priority: Record<string, number> = {
      รอรับรอง: 0,
      รับรอง: 1,
      ปฏิเสธ: 2,
    };

    const statusA = a.StatusVerify?.status_verify || "รอรับรอง";
    const statusB = b.StatusVerify?.status_verify || "รอรับรอง";

    return priority[statusA] - priority[statusB];
  });

  const handleSubmitVerify = async () => {
    if (!selectedRecord || !selectedStatus?.ID) {
      messageApi.error("กรุณาเลือกสถานะและรายการก่อนยืนยัน");
      return;
    }

    try {
      await verifyForm.validateFields();
      const values = verifyForm.getFieldsValue();

      const statusObj = statusVerifications.find(
        (s) => s.ID === selectedStatus?.ID
      );
      if (!statusObj) {
        messageApi.error("ไม่พบสถานะที่เลือก");
        return;
      }

      const updateData: VerifyInterface = {
        StatusVerifyID: selectedStatus?.ID,
        AdminID: admin?.ID,
        reason: statusObj.status_verify === "ปฏิเสธ" ? values.reason : "",
      };

      setLoading(true);

      // ✅ แยก try/catch สำหรับ Update
      let updateResponse;
      try {
        updateResponse = await UpdateVerifyStatus(
          selectedRecord.ID!,
          updateData
        );
        if (!updateResponse || updateResponse.status !== 200) {
          throw new Error("Update failed or unexpected response");
        }
      } catch (err) {
        console.error("❌ Update failed:", err);
        messageApi.error("อัปเดตสถานะล้มเหลว");
        return; // ❌ หยุดทำงานทันที ไม่ไปส่งอีเมล
      }

      // ✅ ถ้า update ผ่าน ค่อยส่งอีเมล
      try {
        const emailRes = await SendEmailVerify(selectedRecord.UserID!);
        if (!emailRes || emailRes.status !== 200) {
          throw new Error("Email sending failed");
        }
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
      messageApi.error(
        "เกิดข้อผิดพลาด: " + ((error as Error).message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  // Get user type and details
  const getUserInfo = (user: any) => {
    if (user.Company && user.Company.length > 0) {
      const company = user.Company[0];
      return {
        type: "company",
        name: company.company_name,
        logo: company.logo,
        details: "บริษัท",
        icon: <BuildOutlined />,
      };
    } else if (user.AcademicStaff && user.AcademicStaff.length > 0) {
      const staff = user.AcademicStaff[0];
      return {
        type: "academic",
        name: `${staff.first_name} ${staff.last_name}`,
        position: staff.position,
        department: staff.department,
        details: user.Role.role,
        icon: <TeamOutlined />,
      };
    }
    return {
      type: "unknown",
      name: user.Email,
      details: "ไม่ระบุประเภท",
      icon: <UserOutlined />,
    };
  };

  // Get status configuration
  const getStatusConfig = (statusVerify?: StatusVerifyInterface) => {
    const statusMap = {
      รอรับรอง: {
        color: "#faad14",
        bgColor: "#fff7e6",
        icon: <ClockCircleOutlined />,
        text:
          statusVerifications.find((s) => s.status_verify === "รอรับรอง")
            ?.status_verify || "รอรับรอง",
        key: "pending",
      },
      รับรอง: {
        color: "#52c41a",
        bgColor: "#f6ffed",
        icon: <CheckCircleOutlined />,
        text:
          statusVerifications.find((s) => s.status_verify === "รับรอง")
            ?.status_verify || "รับรอง",
        key: "approved",
      },
      ปฏิเสธ: {
        color: "#ff4d4f",
        bgColor: "#fff2f0",
        icon: <StopOutlined />,
        text:
          statusVerifications.find((s) => s.status_verify === "ปฏิเสธ")
            ?.status_verify || "ปฏิเสธ",
        key: "rejected",
      },
    };
    return (
      statusMap[statusVerify?.status_verify as keyof typeof statusMap] ||
      statusMap["รอรับรอง"]
    );
  };

  const handleViewDetail = (record: VerifyInterface) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false); // ปิด modal
    verifyForm.resetFields(); // รีเซ็ตฟอร์ม
    setSelectedStatus(undefined); // เคลียร์สถานะที่เลือก
    setSelectedDocument(null); // เคลียร์เอกสารที่เลือก
  };

  const handleViewDocument = (documentPath: string) => {
    const fileType = documentPath.toLowerCase().includes(".pdf")
      ? "pdf"
      : "image";

    const document: {
      name: string;
      url: string;
      fileType: "pdf" | "image" | "unknown";
    } = {
      name: "เอกสารประกอบการขอรับรอง",
      url: documentPath,
      fileType: fileType,
    };

    setSelectedDocument(document);

    setDocumentModalVisible(true);
  };

  const columns: ColumnsType<VerifyInterface> = [
    {
      title: "ผู้ขอรับรอง",
      key: "user",
      width: 250,
      render: (_, record) => {
        const userInfo = getUserInfo(record.User);
        const profileImage = record?.User?.ProfileImage?.[0]?.image_url;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Avatar
              size={48}
              src={userInfo.type === "company" ? userInfo.logo : profileImage}
              icon={userInfo.icon}
              style={{ flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 600, color: "#262626" }}>
                {userInfo.name}
              </div>
              <div style={{ fontSize: "13px", color: "#8c8c8c" }}>
                {userInfo.details}
              </div>
              {userInfo.position && (
                <div style={{ fontSize: "13px", color: "#595959" }}>
                  {userInfo.position}
                </div>
              )}
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
            <div
              style={{
                fontSize: "14px",
                color: "#595959",
                marginBottom: "4px",
              }}
            >
              อีเมล: {record.User?.Email}
            </div>
            {userInfo.department && (
              <div style={{ fontSize: "13px", color: "#8c8c8c" }}>
                {userInfo.department}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "รหัสการรับรอง",
      key: "id",
      width: 120,
      render: (_, record) => (
        <Text code style={{ fontSize: "13px" }}>
          VERIFY-{record.ID?.toString().padStart(4, "0")}
        </Text>
      ),
    },

    {
      title: "วันที่ส่ง",
      key: "createdAt",
      width: 120,
      render: (_, record) => (
        <div style={{ fontSize: "14px" }}>
          {new Date(record.CreatedAt!).toLocaleDateString("th-TH")}
        </div>
      ),
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
            style={{
              background: bgColor,
              color: textColor,
              border,
              borderRadius: "16px",
              width: "60%",
              cursor: "default",
            }}
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
        <Tooltip title="ดูรายละเอียด">
          <Button
            type="primary"
            size="middle"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            style={{ borderRadius: "16px", width: "50%" }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Layout>
      <AdminHeader />
      {contextHolder}
      <Layout className="adminpage-layout">
        <div className="adminpost-header-box">
          <Row justify="space-between" align="middle">
            <Col>
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    backgroundColor: "#e6f4ff",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                >
                  <FileTextOutlined
                    style={{ fontSize: "32px", color: "#1677ff" }}
                  />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, color: "#1677ff" }}>
                    ตรวจสอบการรับรอง
                  </Title>
                  <Text style={{ color: "#555", fontSize: "16px" }}>
                    ระบบตรวจสอบและอนุมัติการรับรองบุคลากรทางวิชาการและบริษัท
                  </Text>
                </div>
              </div>
            </Col>
            <Col></Col>
          </Row>
        </div>

        <Card
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "none",
          }}
        >
          {/* Filter Section */}
          <div style={{ marginBottom: 24 }}>
            <Card
              className="adminpage-filter-card"
              styles={{ body: { padding: 20 } }}
            >
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12}>
                  <div className="adminpage-filter-label">กรองตามสถานะ</div>
                  <Select
                    mode="multiple"
                    value={selectedFilterStatuses}
                    onChange={(values) => {
                      if (values.includes("ทั้งหมด")) {
                        const allStatuses = statusVerifications.map(
                          (s) => s.status_verify
                        );
                        const isAllSelected =
                          selectedFilterStatuses.length ===
                            allStatuses.length &&
                          allStatuses.every((s) =>
                            selectedFilterStatuses.includes(s)
                          );

                        if (isAllSelected) {
                          setSelectedFilterStatuses([]); // ยกเลิกทั้งหมด
                        } else {
                          setSelectedFilterStatuses(allStatuses); // เลือกทั้งหมด
                        }
                      } else {
                        setSelectedFilterStatuses(values);
                      }
                    }}
                    style={{ width: "100%" }}
                    size="large"
                    options={[
                      { label: "ทั้งหมด", value: "ทั้งหมด" },
                      ...statusVerifications.map((s) => ({
                        label: s.status_verify,
                        value: s.status_verify,
                      })),
                    ]}
                    placeholder="เลือกสถานะที่ต้องการแสดง"
                    allowClear
                    maxTagCount="responsive"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <div className="adminpage-filter-label">ค้นหาผู้ขอรับรอง</div>
                  <Input
                    placeholder="ค้นหาชื่อบริษัท, Email หรือ ID..."
                    suffix={
                      <SearchOutlined
                        style={{ color: "#bfbfbf", fontSize: "16px" }}
                      />
                    }
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    size="large"
                    className="adminpage-search-input"
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
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} จาก ${total} รายการ`,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
              },
            }}
            size="middle"
            scroll={{ x: 800 }}
          />
        </Card>

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
          getStatusConfig={getStatusConfig}
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
    </Layout>
  );
};

export default CertificationReviewPage;
