import React from "react";
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
  const userInfo = getUserInfo(record.User);
  const profileImage = record.User?.ProfileImage?.[0]?.image_url;

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
          <UserOutlined />
          ข้อมูลผู้ขอรับรอง
        </Title>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
          padding: "16px",
          background: "linear-gradient(135deg, #f8f9ff 0%, #e6f7ff 100%)",
          borderRadius: "12px",
          border: "1px solid #e6f7ff",
        }}
      >
        <Avatar
          src={userInfo.type === "company" ? userInfo.logo : profileImage}
          icon={userInfo.icon}
          size={64}
          style={{
            border: "3px solid white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        />
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ margin: 0, color: "#262626" }}>
            {userInfo.name}
          </Title>
          <Tag
            color="blue"
            style={{
              marginTop: "4px",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {userInfo.details}
          </Tag>
        </div>
      </div>

      {/* Details */}
      <Descriptions
        column={2}
        size="middle"
        styles={{
          label: {
            fontWeight: 600,
            color: "#595959",
            fontSize: "14px",
          },
          content: {
            color: "#262626",
            fontSize: "14px",
          },
        }}
      >
        <Descriptions.Item label="อีเมล" span={2}>
          <Text copyable style={{ color: "#1677ff" }}>
            {record.User?.Email}
          </Text>
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
        <Descriptions.Item label="รหัสผู้ใช้" span={2}>
          <Text code style={{ borderRadius: "6px", fontSize: "14px" }}>
            {record.UserID}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="วันที่ส่งคำขอ">
          {new Date(record.CreatedAt!).toLocaleString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default UserInformationCard;