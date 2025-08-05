import React from "react";
import {
  Modal,
  Row,
  Col,
  Card,
  Descriptions,
  Avatar,
  Typography,
  Space,
  Button,
  Radio,
  Badge,
  Divider,
  Tag,
  Input,
  Form,
  Flex,
} from "antd";
import {
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { VerifyInterface } from "../../../interfaces/Verify";
import type { StatusVerifyInterface } from "../../../interfaces/StatusVerify";
import DocumentsCard from "./component/DocumentsCard";
import CurrentStatusCard from "./component/CurrentStatusCard";
import StatusSelectionCard from "./component/StatusSelectionCard";
import UserInformationCard from "./component/UserInformationCard";

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;

interface DetailModalProps {
  open: boolean;
  record: VerifyInterface | undefined;
  onClose: () => void;
  onSubmitVerify: () => void;
  getUserInfo: (user: any) => {
    name: string;
    details: string;
    icon: React.ReactNode;
    logo?: string;
    type?: string;
    position?: string;
    department?: string;
  };
  handleViewDocument: (url: string) => void;
  getStatusConfig: (status: any) => {
    text: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  };
  selectedStatus: StatusVerifyInterface | undefined;
  setSelectedStatus: React.Dispatch<
    React.SetStateAction<StatusVerifyInterface | undefined>
  >;
  statusVerifications: StatusVerifyInterface[];
  loading?: boolean;
  isReadOnlyStatus?: boolean;
  verifyForm?: any;
  selectedDocument: {
    url: string;
    name: string;
    fileType: "pdf" | "image" | "unknown";
  } | null;
  setRejectReason: (value: string) => void;
  rejectReason: string;
}

const DetailModal: React.FC<DetailModalProps> = ({
  open,
  record,
  onClose,
  onSubmitVerify,
  getUserInfo,
  handleViewDocument,
  getStatusConfig,
  selectedStatus,
  setSelectedStatus,
  statusVerifications,
  loading,
  isReadOnlyStatus,
  verifyForm,
  selectedDocument,
  setRejectReason,
  rejectReason,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "รับรอง":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "ปฏิเสธ":
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <ClockCircleOutlined style={{ color: "#faad14" }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "รับรอง":
        return "success";
      case "ปฏิเสธ":
        return "error";
      default:
        return "warning";
    }
  };

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 0",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileTextOutlined style={{ color: "white", fontSize: "18px" }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: "#262626" }}>
              รายละเอียดการรับรอง
            </Title>
            {record && (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                รหัส: VERIFY-{record.ID?.toString().padStart(4, "0")}
              </Text>
            )}
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      style={{ top: 20 }}
      styles={{
        body: {
          padding: "24px",
          minHeight: "600px",
        },
      }}
      footer={
        <div
          style={{
            padding: "16px 24px",
            background: "white",
            borderTop: "1px solid #f0f0f0",
            borderRadius: "0 0 8px 8px",
          }}
        >
          {record?.StatusVerify?.status_verify === "รอรับรอง" ? (
            <Space size="middle">
              <Button
                size="large"
                onClick={onClose}
                style={{
                  borderRadius: "12px",
                  height: "44px",
                  minWidth: "100px",
                  fontWeight: 500,
                }}
              >
                ปิด
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={onSubmitVerify}
                disabled={!selectedStatus || loading}
                loading={loading}
                style={{
                  background:
                    selectedStatus?.status_verify === "ปฏิเสธ"
                      ? "linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)"
                      : "linear-gradient(135deg, #52c41a 0%, #95de64 100%)",
                  borderColor: "transparent",
                  borderRadius: "12px",
                  height: "44px",
                  minWidth: "120px",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                {getStatusIcon(selectedStatus?.status_verify || "")}
                <span style={{ marginLeft: "8px" }}>
                  ยืนยันการ{selectedStatus?.status_verify || "เลือกสถานะ"}
                </span>
              </Button>
            </Space>
          ) : (
            <Button
              size="large"
              onClick={onClose}
              style={{
                borderRadius: "12px",
                height: "44px",
                minWidth: "100px",
                fontWeight: 500,
              }}
            >
              ปิด
            </Button>
          )}
        </div>
      }
    >
      {record && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Section: User Info + Current Status */}
          <Row gutter={24}>
            <Col span={14}>
              <UserInformationCard record={record} getUserInfo={getUserInfo} />
            </Col>
            <Col span={10}>
              <CurrentStatusCard
                record={record}
                getStatusConfig={getStatusConfig}
                getStatusColor={getStatusColor}
              />
            </Col>
          </Row>

          {/* Middle Section: Document + Status Selection */}
          {record.StatusVerify?.status_verify === "รอรับรอง" ? (
            <Row gutter={24}>
              <Col span={14}>
                <DocumentsCard
                  documentUrl={record.verification_document!}
                  onView={handleViewDocument}
                />
              </Col>
              <Col span={10}>
                <StatusSelectionCard
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  statusVerifications={statusVerifications}
                  loading={loading}
                  isReadOnlyStatus={isReadOnlyStatus}
                  verifyForm={verifyForm}
                  rejectReason={rejectReason}
                  setRejectReason={setRejectReason}
                />
              </Col>
            </Row>
          ) : (
            <Row>
              <Col span={24}>
                <DocumentsCard
                  documentUrl={record.verification_document!}
                  onView={handleViewDocument}
                />
              </Col>
            </Row>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DetailModal;
