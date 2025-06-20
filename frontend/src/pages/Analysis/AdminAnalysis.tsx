import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Avatar,
  message,
  Button,
  Statistic,
  Typography,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FallOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { GetAdminByUserId } from "../../services/https";
import type { AdminInterface } from "../../interfaces/Admin";
import "./AdminAnalysis.css";

const { Meta } = Card;

interface CustomStatCardProps {
  title: string;
  value: number;
  percentChange: number; // เป็น + หรือ - ได้
}

const Profile: React.FC<{
  adminData?: AdminInterface;
  formatDate: (input?: string | Date) => string;
}> = ({ adminData, formatDate }) => (
  <Card className="profile-card" variant="borderless">
    <Button
      type="primary"
      icon={<EditOutlined />}
      className="profile-edit-button"
    >
      แก้ไข
    </Button>
    <Meta
      avatar={
        <Avatar
          size={80}
          style={{ backgroundColor: "#096dd9" }}
          icon={<UserOutlined />}
        />
      }
      title={`${adminData?.first_name ?? ""} ${adminData?.last_name ?? ""}`}
      description={`BirthDay: ${formatDate(adminData?.birthday)}\nEmail: ${
        adminData?.User?.Email ?? "-"
      }`}
      style={{ whiteSpace: "pre-line" }}
    />
  </Card>
);

const StatCardTop: React.FC<CustomStatCardProps> = ({
  title,
  value,
  percentChange,
}) => {
  const isPositive = percentChange >= 0;

  return (
    <div className="custom-stat-card">
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Typography.Text>{title}</Typography.Text>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="stat-value">{value}</div>
          <div
            className={`stat-change ${isPositive ? "positive" : "negative"}`}
          >
            {isPositive ? <RiseOutlined /> : <FallOutlined />}
            {Math.abs(percentChange)}%
          </div>
        </div>
      </div>
      <div className="card-icon">
        <UserOutlined style={{ fontSize: "24px", color: "#4096ff" }} />
      </div>
    </div>
  );
};

const Analysis: React.FC = () => {
  const [adminData, setAdminData] = useState<AdminInterface>();
  const user_id = localStorage.getItem("id");

  useEffect(() => {
    fetchAdminDetail();
  }, []);

  const fetchAdminDetail = async () => {
    try {
      const res_admin = await GetAdminByUserId(Number(user_id));
      if (res_admin.status === 200) {
        setAdminData(res_admin.data);
      } else {
        message.error("Failed to fetch admin data.");
      }
    } catch (error) {
      message.error("Error fetching admin data.");
    }
  };

  const formatDate = (input?: string | Date): string => {
    if (!input) return "-";

    const date = typeof input === "string" ? new Date(input) : input;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div className="profile_statistic_top">
        <Profile adminData={adminData} formatDate={formatDate} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="statistic_card_top">
            <StatCardTop title="สัมภาษณ์" value={20} percentChange={20} />
            <StatCardTop title="รับสมัครงาน" value={256} percentChange={20} />
          </div>
          <div className="statistic_card_top">
            <StatCardTop title="ฝึกงานสำเร็จ" value={10} percentChange={20} />
            <StatCardTop title="ถูกว่าจ้าง" value={6} percentChange={-6} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analysis;
