import React from "react";
import { Card, Avatar, Typography, Divider, Space } from "antd";
import { TeamOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, FacebookOutlined } from "@ant-design/icons";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";

const { Title, Text, Link } = Typography;

type Props = { post: IntershipPostInterface };

const CompanyInfoCard: React.FC<Props> = ({ post }) => {
  const company = post.Company;
  const contact = company?.Contact;
  const address = company?.Address;

  const fullAddress =
    [
      address?.house_number,
      address?.village,
      address?.street,
      address?.sub_street,
      address?.SubDistrict?.name_th,
      address?.District?.name_th,
      address?.Province?.name_th,
      address?.Postcode,
    ]
      .filter(Boolean)
      .join(" ") || "ไม่ระบุ";

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TeamOutlined style={{ color: "#1677ff" }} />
          <span>ข้อมูลบริษัท</span>
        </div>
      }
      style={{
        marginBottom: "1.5rem",
        borderRadius: 12,
        border: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {/* Logo + ชื่อบริษัท */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <Avatar
          size={80}
          src={company?.logo}
          style={{ backgroundColor: "#1677ff", marginBottom: 12 }}
        >
          {company?.company_name?.charAt(0)}
        </Avatar>
        <Title level={5} style={{ margin: 0, color: "#1677ff" }}>
          {company?.company_name || "ไม่ระบุชื่อบริษัท"}
        </Title>
      </div>

      <Divider />

      {/* Address */}
      <div style={{ marginBottom: "1rem" }}>
        <Text strong style={{ color: "#595959", display: "block", marginBottom: 8 }}>
          <EnvironmentOutlined style={{ marginRight: 6, color: "#1677ff" }} />
          ที่อยู่
        </Text>
        <Text style={{ color: "#8c8c8c", fontSize: 13, lineHeight: 1.5 }}>
          {fullAddress}
        </Text>
      </div>

      <Divider />

      {/* Contact */}
      <div>
        <Text strong style={{ color: "#595959", display: "block", marginBottom: 12 }}>
          ช่องทางติดต่อ
        </Text>
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          {contact?.phone_number && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PhoneOutlined style={{ color: "#52c41a", fontSize: 14 }} />
              <Link href={`tel:${contact.phone_number}`} style={{ fontSize: 13 }}>
                {contact.phone_number}
              </Link>
            </div>
          )}
          {contact?.email && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MailOutlined style={{ color: "#1677ff", fontSize: 14 }} />
              <Link href={`mailto:${contact.email}`} style={{ fontSize: 13 }}>
                {contact.email}
              </Link>
            </div>
          )}
          {contact?.website && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <GlobalOutlined style={{ color: "#722ed1", fontSize: 14 }} />
              <Link href={contact.website} target="_blank" style={{ fontSize: 13 }}>
                {contact.website}
              </Link>
            </div>
          )}
          {contact?.facebook && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FacebookOutlined style={{ color: "#1877f2", fontSize: 14 }} />
              <Link href={contact.facebook} target="_blank" style={{ fontSize: 13 }}>
                {contact.facebook}
              </Link>
            </div>
          )}
          {!contact && <Text type="secondary">ไม่พบข้อมูลการติดต่อ</Text>}
        </Space>
      </div>
    </Card>
  );
};

export default CompanyInfoCard;