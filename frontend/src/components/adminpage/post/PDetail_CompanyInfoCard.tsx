import React from "react";
import { Card, Avatar, Typography, Divider, Space } from "antd";
import { TeamOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, FacebookOutlined } from "@ant-design/icons";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";
import { fileURL } from "@/config/env";

const { Title, Text, Link } = Typography;

type Props = { post: IntershipPostInterface };

/* ---------- helpers: ทำให้ URL ใช้งานได้จริง ---------- */
const hasProtocol = (s: string) => /^https?:\/\//i.test(s);
const isLikelyDomain = (s: string) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s); // มี .tld

const normalizeWebsite = (raw?: string | null) => {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (hasProtocol(t)) return t;
  if (/^\/\//.test(t)) return "https:" + t; // //example.com
  if (isLikelyDomain(t)) return "https://" + t; // www.site.com → https://www.site.com
  return null; // ไม่ใช่โดเมน ไม่ใส่ลิงก์
};

const normalizeFacebook = (raw?: string | null) => {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (hasProtocol(t)) return t;
  if (/^facebook\.com\//i.test(t)) return "https://" + t; // facebook.com/page
  // ถ้าเป็น slug (5–50 ตัว, ตัวอักษร/ตัวเลข/.)
  if (/^[a-zA-Z0-9.]{5,50}$/.test(t)) return `https://facebook.com/${t}`;
  return null;
};

/* ---------- helper: postcode กัน [object Object] ---------- */
const extractZip = (postCode: any) => {
  if (!postCode) return undefined;
  if (typeof postCode === "string" || typeof postCode === "number") return String(postCode);
  // เผื่อ backend ส่งมาเป็น object หลายแบบ
  return (
    postCode.code ||
    postCode.postcode ||
    postCode.zipcode ||
    postCode.zip_code ||
    postCode.Postcode ||
    undefined
  );
};

const CompanyInfoCard: React.FC<Props> = ({ post }) => {
  const company = post.Company;
  const contact = company?.Contact;
  const address = company?.Address;

  const zip = extractZip(address?.Postcode);

  const fullAddress =
    [
      address?.house_number,
      address?.village,
      address?.street,
      address?.sub_street,
      address?.SubDistrict?.name_th,
      address?.District?.name_th,
      address?.Province?.name_th,
      zip,
    ]
      .map((v) => (v == null ? "" : String(v)))
      .filter((v) => v && v !== "[object Object]")
      .join(" ") || "ไม่ระบุ";

  const websiteUrl = normalizeWebsite(contact?.website);
  const facebookUrl = normalizeFacebook(contact?.facebook);

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
        <Avatar size={80} src={fileURL(company?.logo)} style={{ marginBottom: 12 }}>
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
        <Text style={{ color: "#8c8c8c", fontSize: 13, lineHeight: 1.5 }}>{fullAddress}</Text>
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
              {websiteUrl ? (
                <Link
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13 }}
                >
                  {contact.website}
                </Link>
              ) : (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {contact.website} {/* แสดงข้อความเฉย ๆ ถ้าไม่ใช่โดเมน/URL */}
                </Text>
              )}
            </div>
          )}

          {contact?.facebook && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FacebookOutlined style={{ color: "#1877f2", fontSize: 14 }} />
              {facebookUrl ? (
                <Link
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13 }}
                >
                  {contact.facebook}
                </Link>
              ) : (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {contact.facebook} {/* ไม่เข้าเงื่อนไข → ไม่ทำเป็นลิงก์ */}
                </Text>
              )}
            </div>
          )}

          {!contact && <Text type="secondary">ไม่พบข้อมูลการติดต่อ</Text>}
        </Space>
      </div>
    </Card>
  );
};

export default CompanyInfoCard;