import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Tag,
  Space,
  Typography,
  Descriptions,
  Image,
  Input,
  message,
  Row,
  Col,
  Avatar,
  Divider,
  Badge,
  Tooltip,
  Timeline,
  Spin,
  Alert,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  BankOutlined,
  IdcardOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  BuildOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { GetAllVerifications } from "../../../services/https";
import type { StatusVerifyInterface } from "../../../interfaces/StatusVerify";
import type { VerifyInterface } from "../../../interfaces/Verify";
import { GetAllStatusVerify } from "../../../services/https/Admin";
import type { ColumnsType } from "antd/es/table";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CertificationReviewPage = () => {
  const [selectedRecord, setSelectedRecord] = useState<
    VerifyInterface | undefined
  >(undefined);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
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
  const [tableLoading, setTableLoading] = useState(true);

  // Fetch verifications from API
  const fetchVerifications = async () => {
    setTableLoading(true);
    try {
      // Replace with your actual API endpoint
      const [res_verify, res_status] = await Promise.all([
        GetAllVerifications(),
        GetAllStatusVerify(),
      ]);

      if (res_verify.status === 200) setVerifications(res_verify.data);
      if (res_status.status === 200) setStatusVerifications(res_status.data);
      
    } catch (error) {
      message.error(
        "เกิดข้อผิดพลาดในการดึงข้อมูล: " +
          ((error as Error).message || "Unknown error")
      );
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  useEffect(() => {
    console.log("verifications: ", verifications);
  }, [verifications]);

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
        details: "บุคลากรทางวิชาการ",
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
        text: "รอรับรอง",
        key: "pending",
      },
      รับรองแล้ว: {
        color: "#52c41a",
        bgColor: "#f6ffed",
        icon: <CheckCircleOutlined />,
        text: "รับรองแล้ว",
        key: "approved",
      },
      ปฏิเสธ: {
        color: "#ff4d4f",
        bgColor: "#fff2f0",
        icon: <StopOutlined />,
        text: "ปฏิเสธ",
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

  const getFileType = (filePath: string) => {
    const extension = filePath.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return "pdf";
    if (["png", "jpg", "jpeg", "webp"].includes(extension || ""))
      return "image";
    return "unknown";
  };

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleApprove = async () => {
    setLoading(true);
    try {
      /* const response = await fetch(`/api/verifications/${selectedRecord.ID}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified_at: new Date().toISOString(),
          StatusVerifyID: 1, // Assuming 1 is approved status
        }),
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถอนุมัติได้');
      }

      message.success('อนุมัติการรับรองเรียบร้อยแล้ว');
      setApproveModalVisible(false);
      setDetailModalVisible(false); */
      await fetchVerifications(); // Refresh data
    } catch (error) {
      message.error(
        "เกิดข้อผิดพลาด: " + ((error as Error).message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }

    setLoading(true);
    try {
      /* const response = await fetch(`/api/verifications/${selectedRecord.ID}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: rejectReason,
          StatusVerifyID: 3, // Assuming 3 is rejected status
        }),
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถปฏิเสธได้');
      }

      message.success('ปฏิเสธการรับรองเรียบร้อยแล้ว');
      setRejectModalVisible(false);
      setDetailModalVisible(false);
      setRejectReason(''); */
      await fetchVerifications(); // Refresh data
    } catch (error) {
      message.error(
        "เกิดข้อผิดพลาด: " + ((error as Error).message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<VerifyInterface> = [
    {
      title: "ผู้ขอรับรอง",
      key: "User",
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
              <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                {userInfo.details}
              </div>
              {userInfo.position && (
                <div style={{ fontSize: "12px", color: "#595959" }}>
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
                fontSize: "13px",
                color: "#595959",
                marginBottom: "4px",
              }}
            >
              อีเมล: {record.User?.Email}
            </div>
            {userInfo.department && (
              <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
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
        <Text code style={{ fontSize: "12px" }}>
          VERIFY-{record.ID?.toString().padStart(4, "0")}
        </Text>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 120,
      render: (_, record) => {
        const config = getStatusConfig(record.StatusVerify);
        return (
          <Badge
            color={config.color}
            text={
              <span style={{ color: config.color, fontWeight: 500 }}>
                {config.text}
              </span>
            }
          />
        );
      },
    },
    {
      title: "วันที่ส่ง",
      key: "createdAt",
      width: 120,
      render: (_, record) => (
        <div style={{ fontSize: "13px" }}>
          {new Date(record.CreatedAt!).toLocaleDateString("th-TH")}
        </div>
      ),
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              style={{ borderRadius: "6px" }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <Title level={2} style={{ margin: 0, color: "#262626" }}>
            <BankOutlined style={{ marginRight: "12px", color: "#1677ff" }} />
            ตรวจสอบการรับรอง
          </Title>
          <Text type="secondary" style={{ fontSize: "16px" }}>
            ระบบตรวจสอบและอนุมัติการรับรองบุคลากรทางวิชาการและบริษัท
          </Text>
        </div>

        <Card
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "none",
          }}
        >
          <Table
            columns={columns}
            dataSource={verifications}
            rowKey="ID"
            loading={tableLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            }}
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* Detail Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FileTextOutlined
                style={{ color: "#1677ff", fontSize: "20px" }}
              />
              <span>รายละเอียดการรับรอง</span>
            </div>
          }
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={900}
          footer={
            selectedRecord?.StatusVerify?.status_verify === "รอรับรอง" ? (
              <Space>
                <Button
                  onClick={() => setDetailModalVisible(false)}
                  style={{ borderRadius: "8px" }}
                >
                  ปิด
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setRejectModalVisible(true);
                    setDetailModalVisible(false);
                  }}
                  style={{ borderRadius: "8px" }}
                >
                  ปฏิเสธ
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    setApproveModalVisible(true);
                    setDetailModalVisible(false);
                  }}
                  style={{
                    background:
                      "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
                    borderColor: "transparent",
                    borderRadius: "8px",
                  }}
                >
                  อนุมัติ
                </Button>
              </Space>
            ) : (
              <Button
                onClick={() => setDetailModalVisible(false)}
                style={{ borderRadius: "8px" }}
              >
                ปิด
              </Button>
            )
          }
        >
          {selectedRecord && (
            <div>
              <Row gutter={24}>
                <Col span={16}>
                  <Card
                    title="ข้อมูลผู้ขอรับรอง"
                    size="small"
                    style={{ marginBottom: "16px", borderRadius: "8px" }}
                  >
                    {(() => {
                      const userInfo = getUserInfo(selectedRecord.User);
                      const profileImage =
                        selectedRecord.User?.ProfileImage?.[0]?.image_url;

                      return (
                        <Descriptions column={2} size="small">
                          <Descriptions.Item label="ชื่อ/ชื่อบริษัท" span={2}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <Avatar
                                src={
                                  userInfo.type === "company"
                                    ? userInfo.logo
                                    : profileImage
                                }
                                icon={userInfo.icon}
                                size={32}
                              />
                              <strong>{userInfo.name}</strong>
                            </div>
                          </Descriptions.Item>
                          <Descriptions.Item label="ประเภท">
                            {userInfo.details}
                          </Descriptions.Item>
                          <Descriptions.Item label="อีเมล">
                            {selectedRecord.User?.Email}
                          </Descriptions.Item>
                          {userInfo.position && (
                            <Descriptions.Item label="ตำแหน่ง" span={2}>
                              {userInfo.position}
                            </Descriptions.Item>
                          )}
                          {userInfo.department && (
                            <Descriptions.Item label="หน่วยงาน" span={2}>
                              {userInfo.department}
                            </Descriptions.Item>
                          )}
                          <Descriptions.Item label="รหัสการรับรอง" span={2}>
                            <Text code>
                              VERIFY-
                              {selectedRecord.ID?.toString().padStart(4, "0")}
                            </Text>
                          </Descriptions.Item>
                        </Descriptions>
                      );
                    })()}
                  </Card>

                  <Card
                    title="เอกสารแนบ"
                    size="small"
                    style={{ marginBottom: "16px", borderRadius: "8px" }}
                  >
                    <Row gutter={[12, 12]}>
                      <Col span={8}>
                        <Card
                          hoverable
                          size="small"
                          onClick={() =>
                            handleViewDocument(
                              selectedRecord.verification_document!
                            )
                          }
                          style={{
                            textAlign: "center",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ marginBottom: "8px" }}>
                            {selectedRecord.verification_document
                              ?.toLowerCase()
                              .includes(".pdf") ? (
                              <FilePdfOutlined
                                style={{ fontSize: "32px", color: "#ff4d4f" }}
                              />
                            ) : (
                              <FileImageOutlined
                                style={{ fontSize: "32px", color: "#1677ff" }}
                              />
                            )}
                          </div>
                          <div style={{ fontSize: "12px", fontWeight: 500 }}>
                            เอกสารประกอบการขอรับรอง
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                <Col span={8}>
                  <Card
                    title="สถานะ"
                    size="small"
                    style={{ marginBottom: "16px", borderRadius: "8px" }}
                  >
                    <div style={{ textAlign: "center", marginBottom: "16px" }}>
                      {(() => {
                        const config = getStatusConfig(
                          selectedRecord.StatusVerify
                        );
                        return (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "8px 16px",
                              borderRadius: "20px",
                              backgroundColor: config.bgColor,
                              color: config.color,
                              fontWeight: 600,
                            }}
                          >
                            {config.icon}
                            <span style={{ marginLeft: "8px" }}>
                              {config.text}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {selectedRecord.reason && (
                      <div style={{ marginTop: "12px" }}>
                        <Text strong style={{ color: "#ff4d4f" }}>
                          เหตุผลการปฏิเสธ:
                        </Text>
                        <Paragraph
                          style={{
                            marginTop: "8px",
                            padding: "8px",
                            backgroundColor: "#fff2f0",
                            borderRadius: "6px",
                            fontSize: "13px",
                          }}
                        >
                          {selectedRecord.reason}
                        </Paragraph>
                      </div>
                    )}

                    {selectedRecord.verified_at && (
                      <div style={{ marginTop: "12px" }}>
                        <Text strong>วันที่รับรอง:</Text>
                        <div style={{ fontSize: "13px", color: "#595959" }}>
                          {new Date(selectedRecord.verified_at).toLocaleString(
                            "th-TH"
                          )}
                        </div>
                      </div>
                    )}

                    {selectedRecord.Admin && (
                      <div style={{ marginTop: "12px" }}>
                        <Text strong>ผู้อนุมัติ:</Text>
                        <div style={{ fontSize: "13px", color: "#595959" }}>
                          {selectedRecord.Admin.first_name}{" "}
                          {selectedRecord.Admin.last_name}
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card
                    title="ข้อมูลเพิ่มเติม"
                    size="small"
                    style={{ borderRadius: "8px" }}
                  >
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="วันที่ส่งคำขอ">
                        {new Date(selectedRecord.CreatedAt!).toLocaleString(
                          "th-TH"
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="ID ผู้ใช้">
                        {selectedRecord.UserID}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* Document Modal */}
        <Modal
          title={
            selectedDocument && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {selectedDocument.fileType === "pdf" ? (
                  <FilePdfOutlined
                    style={{ color: "#ff4d4f", fontSize: "20px" }}
                  />
                ) : (
                  <FileImageOutlined
                    style={{ color: "#1677ff", fontSize: "20px" }}
                  />
                )}
                <span>{selectedDocument.name}</span>
              </div>
            )
          }
          open={documentModalVisible}
          onCancel={() => setDocumentModalVisible(false)}
          width={800}
          footer={
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  if (selectedDocument?.url) {
                    const link = document.createElement("a");
                    link.href = selectedDocument.url;
                    link.download = selectedDocument.name;
                    link.click();
                    message.success("เริ่มดาวน์โหลดเอกสารแล้ว");
                  }
                }}
                style={{ borderRadius: "8px" }}
              >
                ดาวน์โหลด
              </Button>
              <Button
                onClick={() => setDocumentModalVisible(false)}
                style={{ borderRadius: "8px" }}
              >
                ปิด
              </Button>
            </Space>
          }
        >
          {selectedDocument && (
            <div style={{ textAlign: "center" }}>
              {selectedDocument.fileType === "pdf" ? (
                <iframe
                  src={selectedDocument.url}
                  title="Verification PDF"
                  width="100%"
                  height="500px"
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    background: "#f0f0f0",
                  }}
                />
              ) : selectedDocument.fileType === "image" ? (
                <Image
                  src={selectedDocument.url}
                  alt={selectedDocument.name}
                  style={{ maxWidth: "100%", borderRadius: "8px" }}
                />
              ) : (
                <div>ไม่สามารถแสดงเอกสารนี้ได้</div>
              )}
            </div>
          )}
        </Modal>

        {/* Approve Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <CheckOutlined style={{ color: "#52c41a", fontSize: "20px" }} />
              <span>ยืนยันการอนุมัติ</span>
            </div>
          }
          open={approveModalVisible}
          onOk={handleApprove}
          onCancel={() => setApproveModalVisible(false)}
          confirmLoading={loading}
          okText="อนุมัติ"
          cancelText="ยกเลิก"
          okButtonProps={{
            style: {
              background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
              borderColor: "transparent",
              borderRadius: "8px",
            },
          }}
          cancelButtonProps={{ style: { borderRadius: "8px" } }}
        >
          <p style={{ fontSize: "15px", margin: "16px 0" }}>
            คุณแน่ใจหรือไม่ว่าต้องการอนุมัติการรับรองสำหรับผู้ใช้คนนี้?
          </p>
          {selectedRecord && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f6ffed",
                borderRadius: "8px",
                border: "1px solid #b7eb8f",
              }}
            >
              <strong>{getUserInfo(selectedRecord.User).name}</strong>
              <br />
              <Text type="secondary">
                VERIFY-{selectedRecord.ID?.toString().padStart(4, "0")}
              </Text>
            </div>
          )}
        </Modal>

        {/* Reject Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <CloseOutlined style={{ color: "#ff4d4f", fontSize: "20px" }} />
              <span>ยืนยันการปฏิเสธ</span>
            </div>
          }
          open={rejectModalVisible}
          onOk={handleReject}
          onCancel={() => {
            setRejectModalVisible(false);
            setRejectReason("");
          }}
          confirmLoading={loading}
          okText="ปฏิเสธ"
          cancelText="ยกเลิก"
          okButtonProps={{
            danger: true,
            style: { borderRadius: "8px" },
          }}
          cancelButtonProps={{ style: { borderRadius: "8px" } }}
        >
          <p style={{ fontSize: "15px", margin: "16px 0" }}>
            กรุณาระบุเหตุผลในการปฏิเสธการรับรอง:
          </p>
          {selectedRecord && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fff2f0",
                borderRadius: "8px",
                border: "1px solid #ffccc7",
                marginBottom: "16px",
              }}
            >
              <strong>{getUserInfo(selectedRecord.User).name}</strong>
              <br />
              <Text type="secondary">
                VERIFY-{selectedRecord.ID?.toString().padStart(4, "0")}
              </Text>
            </div>
          )}
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="เช่น เอกสารไม่ชัดเจน, ข้อมูลไม่ครบถ้วน, คุณสมบัติไม่เป็นไปตามเกณฑ์"
            style={{ borderRadius: "8px" }}
          />
        </Modal>
      </div>
    </div>
  );
};

export default CertificationReviewPage;
