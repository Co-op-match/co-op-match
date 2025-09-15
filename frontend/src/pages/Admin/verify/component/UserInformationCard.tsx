import React, { useMemo } from "react";
import { Card, Typography, Avatar, Descriptions, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { VerifyInterface } from "../../../../interfaces/Verify";

const { Title, Text } = Typography;

interface Props {
  record: VerifyInterface;
  getUserInfo: (user: any) => {
    name: string;
    details: string;
    icon: React.ReactNode;
    logo?: string;
    type?: string;
    position?: string;
    department?: string;
  };
}

const UserInformationCard: React.FC<Props> = ({ record, getUserInfo }) => {
  const userInfo = useMemo(() => getUserInfo(record.User), [record.User, getUserInfo]);
  const profileImage = record?.User?.ProfileImage?.[0]?.image_url ?? undefined;

  const createdAtText = useMemo(() => {
    const d = record?.CreatedAt ? new Date(record.CreatedAt as any) : null;
    return d
      ? d.toLocaleString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
  }, [record?.CreatedAt]);

  return (
    <Card
      style={{
        marginBottom: 20,
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "none",
        background: "#fff",
        height: "100%",
      }}
      styles={{ body: { padding: 24 } }}
    >
      <div style={{ marginBottom: 20 }}>
        <Title level={5} style={{ margin: 0, color: "rgb(30, 58, 138) ", display: "flex", alignItems: "center", gap: 8 }}>
          <UserOutlined />
          ข้อมูลผู้ขอรับรอง
        </Title>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          padding: 16,
          background: "linear-gradient(135deg, #f8f9ff 0%, rgba(232, 238, 255, 1) 100%)",
          borderRadius: 12,
          border: "1px solid #e6f7ff",
        }}
      >
        <Avatar
          src={userInfo.type === "company" ? userInfo.logo : profileImage}
          icon={userInfo.icon}
          size={64}
          style={{ border: "3px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        />
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ margin: 0, color: "#262626" }}>
            {userInfo.name}
          </Title>
          <Tag color="blue" style={{ marginTop: 4, borderRadius: 6, fontSize: 14 }}>
            {userInfo.details}
          </Tag>
        </div>
      </div>

      {/* Details */}
      <Descriptions
        column={2}
        size="middle"
        styles={{
          label: { fontWeight: 600, color: "#595959", fontSize: 14 },
          content: { color: "#262626", fontSize: 14 },
        }}
      >
        <Descriptions.Item label="อีเมล" span={2}>
          <Text copyable style={{ color: "rgb(30, 58, 138) " }}>{record?.User?.Email ?? "-"}</Text>
        </Descriptions.Item>

        {userInfo.position && (
          <Descriptions.Item label="ตำแหน่ง" span={2}>{userInfo.position}</Descriptions.Item>
        )}
        {userInfo.department && (
          <Descriptions.Item label="หน่วยงาน" span={2}>{userInfo.department}</Descriptions.Item>
        )}

        <Descriptions.Item label="รหัสผู้ใช้" span={2}>
          <Text code style={{ borderRadius: 6, fontSize: 14 }}>{record?.UserID ?? "-"}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="วันที่ส่งคำขอ">{createdAtText}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default React.memo(UserInformationCard);