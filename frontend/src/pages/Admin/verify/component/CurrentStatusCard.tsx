import React from "react";
import { Card, Typography, Divider, Space, Badge } from "antd";
import { ClockCircleOutlined, CheckCircleOutlined, StopOutlined, MinusCircleOutlined } from "@ant-design/icons";
import type { VerifyInterface } from "../../../../interfaces/Verify";
import type { StatusVerifyInterface } from "../../../../interfaces/StatusVerify";

const { Title, Text } = Typography;

interface Props {
  record: VerifyInterface;
  getStatusColor: (status: string) => "success" | "error" | "warning" | undefined;
  statusVerifications: StatusVerifyInterface[];
}

const CurrentStatusCard: React.FC<Props> = ({ record, getStatusColor, statusVerifications }) => {
  // helper: ดึง label ของสถานะจากรายการที่มีอยู่ ถ้าไม่มีให้ใช้ข้อความเดิม
  const label = (s: string) => statusVerifications.find((x) => x.status_verify === s)?.status_verify ?? s;

  const STATUS = {
    NOT_REQUESTED: "ยังไม่ได้ส่งคำขอ",
    PENDING: "รอรับรอง",
    APPROVED: "รับรอง",
    REJECTED: "ปฏิเสธ",
  } as const;

  // map config ของแต่ละสถานะ (one-liner properties)
  const STATUS_CONFIG = {
    [STATUS.NOT_REQUESTED]: { color: "#8c8c8c", bgColor: "#fafafa", icon: <MinusCircleOutlined />, text: label(STATUS.NOT_REQUESTED), key: "not_requested" },
    [STATUS.PENDING]:      { color: "#faad14", bgColor: "#fff7e6", icon: <ClockCircleOutlined />, text: label(STATUS.PENDING),        key: "pending" },
    [STATUS.APPROVED]:     { color: "#52c41a", bgColor: "#f6ffed", icon: <CheckCircleOutlined />, text: label(STATUS.APPROVED),       key: "approved" },
    [STATUS.REJECTED]:     { color: "#ff4d4f", bgColor: "#fff2f0", icon: <StopOutlined />,        text: label(STATUS.REJECTED),       key: "rejected" },
  } as const;

  const statusText = record.StatusVerify?.status_verify || STATUS.NOT_REQUESTED;
  const config = STATUS_CONFIG[statusText as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG[STATUS.NOT_REQUESTED];

  return (
    <Card
      style={{ marginBottom: 20, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "none", background: "#fff", height: "100%" }}
      styles={{ body: { padding: 24 } }}
    >
      <div style={{ marginBottom: 20 }}>
        <Title level={5} style={{ margin: 0, color: "#1677ff", display: "flex", alignItems: "center", gap: 8 }}>
          <Badge status={getStatusColor(statusText)} />
          สถานะปัจจุบัน
        </Title>
      </div>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 20px",
            borderRadius: 25,
            background: `linear-gradient(135deg, ${config.bgColor} 0%, ${config.bgColor}dd 100%)`,
            color: config.color,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: 120,
          }}
        >
          {config.icon}
          <span style={{ marginLeft: 8 }}>{config.text}</span>
        </div>
      </div>

      {record.reason && (
        <div style={{ marginTop: 16 }}>
          <Text strong style={{ color: "#ff4d4f", fontSize: 14 }}>เหตุผลการปฏิเสธ:</Text>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: "linear-gradient(135deg, #fff2f0 0%, #ffebe8 100%)",
              borderRadius: 8,
              border: "1px solid #ffa39e",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {record.reason}
          </div>
        </div>
      )}

      <Divider style={{ margin: "20px 0" }} />

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {record.verified_at && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div>
              <Text strong style={{ color: "#595959", fontSize: 14, marginRight: 16 }}>
                วันที่รับรอง
              </Text>
              <span style={{ fontSize: 14, color: "#262626", fontWeight: 500 }}>
                {new Date(record.verified_at).toLocaleString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        )}

        {record.Admin && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div>
              <Text strong style={{ color: "#595959", fontSize: 14, marginRight: 35 }}>
                ผู้อนุมัติ
              </Text>
              <span style={{ fontSize: 14, color: "#262626", fontWeight: 500 }}>
                {record.Admin.first_name} {record.Admin.last_name}
              </span>
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default CurrentStatusCard;