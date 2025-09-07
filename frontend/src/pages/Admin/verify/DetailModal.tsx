import React, { useMemo } from "react";
import { Modal, Typography, Button } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { VerifyInterface } from "../../../interfaces/Verify";
import type { StatusVerifyInterface } from "../../../interfaces/StatusVerify";
import DocumentsCard from "./component/DocumentsCard";
import CurrentStatusCard from "./component/CurrentStatusCard";
import StatusSelectionCard from "./component/StatusSelectionCard";
import UserInformationCard from "./component/UserInformationCard";

const { Text, Title } = Typography;

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
  selectedStatus: StatusVerifyInterface | undefined;
  setSelectedStatus: React.Dispatch<React.SetStateAction<StatusVerifyInterface | undefined>>;
  statusVerifications: StatusVerifyInterface[];
  loading?: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isReadOnlyStatus?: boolean;
  verifyForm?: any;
  selectedDocument?: { url: string; name: string; fileType: "pdf" | "image" | "unknown" } | null;
  setRejectReason: (value: string) => void;
  rejectReason: string;
}

const containerWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 24,
};

const leftPaneStyle: React.CSSProperties = {
  flex: "1 1 520px",        // คอลัมน์ซ้ายกว้างขึ้นเล็กน้อย
  minWidth: 200,
  maxWidth: "100%",
};

const rightPaneStyle: React.CSSProperties = {
  flex: "1 1 360px",
  minWidth: 200,
  maxWidth: "100%",
};

const fullPaneStyle: React.CSSProperties = {
  flex: "1 1 100%",
  minWidth: 200,
  maxWidth: "100%",
};

const DetailModal: React.FC<DetailModalProps> = ({
  open,
  record,
  onClose,
  onSubmitVerify,
  getUserInfo,
  selectedStatus,
  setSelectedStatus,
  statusVerifications,
  loading,
  isReadOnlyStatus,
  verifyForm,
  setRejectReason,
  rejectReason,
}) => {
  // helpers
  const getStatusIcon = (status?: string) =>
    status === "รับรอง" ? (
      <CheckCircleOutlined style={{ color: "#52c41a" }} />
    ) : status === "ปฏิเสธ" ? (
      <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
    ) : (
      <ClockCircleOutlined style={{ color: "#faad14" }} />
    );

  const getStatusColor = (status?: string) =>
    status === "รับรอง" ? "success" : status === "ปฏิเสธ" ? "error" : "warning";

  const verifyIdText = useMemo(
    () => (record?.ID != null ? `VERIFY-${record.ID.toString().padStart(4, "0")}` : undefined),
    [record?.ID]
  );

  const isPending = record?.StatusVerify?.status_verify === "รอรับรอง";

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileTextOutlined style={{ color: "#fff", fontSize: 18 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: "#262626" }}>
              รายละเอียดการรับรอง
            </Title>
            {verifyIdText && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                รหัส: {verifyIdText}
              </Text>
            )}
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      style={{ top: 20 }}
      styles={{ body: { padding: 24, minHeight: 600 } }}
      footer={
        <div
          style={{
            padding: "16px 24px",
            background: "#fff",
            borderTop: "1px solid #f0f0f0",
            borderRadius: "0 0 8px 8px",
            display: "flex",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Button
            size="large"
            onClick={onClose}
            style={{ borderRadius: 12, height: 44, minWidth: 100, fontWeight: 500 }}
          >
            ปิด
          </Button>
          {isPending && (
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
                borderRadius: 12,
                height: 44,
                minWidth: 160,
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {getStatusIcon(selectedStatus?.status_verify)}
              <span style={{ marginLeft: 8 }}>
                ยืนยันการ{selectedStatus?.status_verify || "เลือกสถานะ"}
              </span>
            </Button>
          )}
        </div>
      }
    >
      {record && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Top Section: User Info + Current Status (wrap ได้) */}
          <div style={containerWrapStyle}>
            <div style={leftPaneStyle}>
              <UserInformationCard record={record} getUserInfo={getUserInfo} />
            </div>
            <div style={rightPaneStyle}>
              <CurrentStatusCard
                record={record}
                getStatusColor={getStatusColor}
                statusVerifications={statusVerifications}
              />
            </div>
          </div>

          {/* Middle Section: Documents + Status Selection (wrap ได้) */}
          {isPending ? (
            <div style={containerWrapStyle}>
              <div style={leftPaneStyle}>
                <DocumentsCard
                  documentUrl={record.verification_document ?? ""}
                />
              </div>
              <div style={rightPaneStyle}>
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
              </div>
            </div>
          ) : (
            <div style={containerWrapStyle}>
              <div style={fullPaneStyle}>
                <DocumentsCard
                  documentUrl={record.verification_document ?? ""}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default React.memo(DetailModal);