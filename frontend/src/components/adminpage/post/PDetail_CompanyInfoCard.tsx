import React from "react";
import { Card, Avatar, Typography, Divider, Space } from "antd";
import { TeamOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, FacebookOutlined } from "@ant-design/icons";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";

const { Title, Text } = Typography;

type Props = { post: IntershipPostInterface; };

const CompanyInfoCard: React.FC<Props> = ({ post }) => {

  const company = post.Company;
  const contact = company?.Contact;
  const address = company?.Address;

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <TeamOutlined style={{ color: "#1677ff" }} />
          <span>ข้อมูลบริษัท</span>
        </div>
      }
      style={{
        marginBottom: "1.5rem",
        borderRadius: "12px",
        border: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <Avatar
          size={80}
          src={company?.logo}
          style={{ backgroundColor: "#1677ff", marginBottom: "12px" }}
        >
          {company?.company_name?.charAt(0)}
        </Avatar>
        <Title level={5} style={{ margin: 0, color: "#1677ff" }}>
          {company?.company_name}
        </Title>
      </div>

      <Divider />

      <div style={{ marginBottom: "1rem" }}>
        <Text
          strong
          style={{ color: "#595959", display: "block", marginBottom: "8px" }}
        >
          <EnvironmentOutlined style={{ marginRight: "6px", color: "#1677ff" }} />
          ที่อยู่
        </Text>
        <Text style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: 1.5 }}>
          {[
            address?.house_number,
            address?.village,
            address?.street,
            address?.sub_street,
            address?.SubDistrict?.name_th,
            address?.District?.name_th,
            address?.Province?.name_th,
          ]
            .filter(Boolean)
            .join(" ")}
        </Text>
      </div>

      <Divider />

      <div style={{ marginBottom: "1rem" }}>
        <Text
          strong
          style={{ color: "#595959", display: "block", marginBottom: "12px" }}
        >
          ช่องทางติดต่อ
        </Text>
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          {contact?.phone_number && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <PhoneOutlined style={{ color: "#52c41a", fontSize: "14px" }} />
              <Text style={{ fontSize: "13px" }}>{contact.phone_number}</Text>
            </div>
          )}
          {contact?.email && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MailOutlined style={{ color: "#1677ff", fontSize: "14px" }} />
              <Text style={{ fontSize: "13px" }}>{contact.email}</Text>
            </div>
          )}
          {contact?.website && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <GlobalOutlined style={{ color: "#722ed1", fontSize: "14px" }} />
              <Text style={{ fontSize: "13px" }}>{contact.website}</Text>
            </div>
          )}
          {contact?.facebook && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FacebookOutlined style={{ color: "#1877f2", fontSize: "14px" }} />
              <Text style={{ fontSize: "13px" }}>{contact.facebook}</Text>
            </div>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default CompanyInfoCard;