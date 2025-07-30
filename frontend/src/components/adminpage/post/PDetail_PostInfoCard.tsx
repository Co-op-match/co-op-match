import React from "react";
import {
  Card,
  Descriptions,
  Typography,
  Tag,
  Space,
  Button,
} from "antd";
import {
  EditOutlined,
  UserOutlined,
  StarOutlined,
  DesktopOutlined,
  CalendarOutlined,
  GiftOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  CheckOutlined,
  StopOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface PostInfoCardProps {
  post: any;
  statusStyle: {
    bgColor: string;
    textColor: string;
    border: string;
  };
  statusIcon: React.ReactNode;
  actionLoading: boolean;
  handleApprove: () => void;
  handleReject: () => void;
  status: { status_post: string; status_post_th: string }[];
}

const PostInfoCard: React.FC<PostInfoCardProps> = ({
  post,
  statusStyle,
  statusIcon,
  actionLoading,
  handleApprove,
  handleReject,
  status,
}) => {
  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <EditOutlined style={{ color: "#1677ff" }} />
          <span>ข้อมูลโพสต์</span>
        </div>
      }
      style={{
        marginBottom: "1.5rem",
        borderRadius: "12px",
        border: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <Title
            level={4}
            style={{
              color: "#1677ff",
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {post.post_name}
          </Title>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 16px",
            borderRadius: "999px",
            background: statusStyle.bgColor,
            color: statusStyle.textColor,
            border: statusStyle.border,
            fontSize: "13px",
            fontWeight: 600,
            marginTop: "12px",
          }}
        >
          {statusIcon}
          <span style={{ marginLeft: "6px" }}>
            {post.StatusPost?.status_post_th}
          </span>
        </div>
      </div>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="รายละเอียดงาน">
          <Paragraph style={{ margin: 0, lineHeight: 1.6 }}>
            {post.post_description}
          </Paragraph>
        </Descriptions.Item>
        <Descriptions.Item label="ประเภทงาน">
          <Tag color="blue">{post.JobType?.job_type}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="จำนวนรับสมัคร">
          <span style={{ fontWeight: 600 }}>
            <UserOutlined style={{ marginRight: "6px", color: "#1677ff" }} />
            {post.quantity} คน
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="เกรดขั้นต่ำ">
          <span style={{ fontWeight: 600 }}>
            <StarOutlined style={{ marginRight: "6px", color: "#faad14" }} />
            GPA {Number(post.min_gpa).toFixed(1)}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="รูปแบบการทำงาน">
          <Tag icon={<DesktopOutlined />} color="geekblue">
            {post.WorkMode?.work_mode}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="วันทำงาน">
          <span>
            <CalendarOutlined style={{ marginRight: "6px", color: "#1677ff" }} />
            {post.WorkDay?.work_day}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="สวัสดิการ">
          <span>
            <GiftOutlined style={{ marginRight: "6px", color: "#52c41a" }} />
            {post.Benefit?.benefit}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="ค่าตอบแทน">
          <span>
            <DollarOutlined style={{ marginRight: "6px", color: "#faad14" }} />
            {post.Stipend?.stipend}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="สถานที่">
          <div>
            <EnvironmentOutlined style={{ marginRight: "6px", color: "#ff4d4f" }} />
            {[post.location_detail, post.subdistrict, post.district, post.province]
              .filter(Boolean)
              .join(", ")}
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="วันที่สร้าง">
          {new Date(post.CreatedAt).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: "20px", justifySelf: "end" }}>
        {post.StatusPost?.status_post === "Pending Approval" && (
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={actionLoading}
              onClick={handleApprove}
              style={{
                backgroundColor: "#52c41a",
                borderColor: "#52c41a",
                borderRadius: "8px",
                padding: "18px",
              }}
            >
              {status.find((s) => s.status_post === "Open")?.status_post_th || "อนุมัติ"}
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              loading={actionLoading}
              onClick={handleReject}
              style={{ borderRadius: "8px", padding: "18px" }}
            >
              {status.find((s) => s.status_post === "Closed")?.status_post_th || "ปฏิเสธ"}
            </Button>
          </Space>
        )}
      </div>
    </Card>
  );
};

export default PostInfoCard;