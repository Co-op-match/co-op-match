import React from "react";
import { Card, Typography, Divider, Space, Badge } from "antd";
import type { VerifyInterface } from "../../../../interfaces/Verify";

const { Title, Text } = Typography;

interface Props {
  record: VerifyInterface;
  getStatusConfig: (status: any) => {
    text: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  };
  getStatusColor: (status: string) => "success" | "error" | "warning" | undefined;
}

const CurrentStatusCard: React.FC<Props> = ({
  record,
  getStatusConfig,
  getStatusColor,
}) => {
  const statusText = record.StatusVerify?.status_verify || "";
  const config = getStatusConfig(record.StatusVerify);

  return (
    <Card
      style={{
        marginBottom: "20px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "none",
        background: "white",
        height: "100%"
      }}
      styles={{ body: { padding: "24px" } }}
    >
      <div style={{ marginBottom: "20px" }}>
        <Title
          level={5}
          style={{
            margin: 0,
            color: "#1677ff",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Badge status={getStatusColor(statusText)} />
          สถานะปัจจุบัน
        </Title>
      </div>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 20px",
            borderRadius: "25px",
            background: `linear-gradient(135deg, ${config.bgColor} 0%, ${config.bgColor}dd 100%)`,
            color: config.color,
            fontWeight: 700,
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: "120px",
          }}
        >
          {config.icon}
          <span style={{ marginLeft: "8px" }}>{config.text}</span>
        </div>
      </div>

      {record.reason && (
        <div style={{ marginTop: "16px" }}>
          <Text strong style={{ color: "#ff4d4f", fontSize: "14px" }}>
            เหตุผลการปฏิเสธ:
          </Text>
          <div
            style={{
              marginTop: "8px",
              padding: "12px",
              background: "linear-gradient(135deg, #fff2f0 0%, #ffebe8 100%)",
              borderRadius: "8px",
              border: "1px solid #ffa39e",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            {record.reason}
          </div>
        </div>
      )}

      <Divider style={{ margin: "20px 0" }} />

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {record.verified_at && (
          <div>
            <Text strong style={{ color: "#595959", fontSize: "14px" }}>
              วันที่รับรอง
            </Text>
            <div
              style={{
                fontSize: "14px",
                color: "#262626",
                marginTop: "4px",
                fontWeight: 500,
              }}
            >
              {new Date(record.verified_at).toLocaleString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}

        {record.Admin && (
          <div>
            <Text strong style={{ color: "#595959", fontSize: "14px" }}>
              ผู้อนุมัติ
            </Text>
            <div
              style={{
                fontSize: "14px",
                color: "#262626",
                marginTop: "4px",
                fontWeight: 500,
              }}
            >
              {record.Admin.first_name} {record.Admin.last_name}
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default CurrentStatusCard;