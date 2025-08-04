import React, { useState } from "react";
import {
  Card,
  Descriptions,
  Typography,
  Tag,
  Space,
  Button,
  Modal,
  message,
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
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  const handleApproveOk = () => {
    setApproveModalVisible(false);
    handleApprove();
  };

  const handleRejectOk = () => {
    setRejectModalVisible(false);
    handleReject();
  };

  return (
    <>
      {" "}
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
              <CalendarOutlined
                style={{ marginRight: "6px", color: "#1677ff" }}
              />
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
              <DollarOutlined
                style={{ marginRight: "6px", color: "#faad14" }}
              />
              {post.Stipend?.stipend}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="สถานที่">
            <div>
              <EnvironmentOutlined
                style={{ marginRight: "6px", color: "#ff4d4f" }}
              />
              {[
                post.location_detail,
                post.subdistrict,
                post.district,
                post.province,
              ]
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
                onClick={() => setApproveModalVisible(true)}
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                  borderRadius: "8px",
                  padding: "18px",
                }}
              >
                {status.find((s) => s.status_post === "Open")?.status_post_th ||
                  "เปิดรับสมัคร"}
              </Button>
              <Button
                danger
                icon={<StopOutlined />}
                loading={actionLoading}
                onClick={() => setRejectModalVisible(true)}
                style={{ borderRadius: "8px", padding: "18px" }}
              >
                {status.find((s) => s.status_post === "Closed")
                  ?.status_post_th || "ปิดรับสมัคร"}
              </Button>
            </Space>
          )}
        </div>
      </Card>
      {/* Approve Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <CheckOutlined style={{ color: "#52c41a", fontSize: "20px" }} />
            <span>ยืนยันการเปิดรับสมัคร</span>
          </div>
        }
        open={approveModalVisible}
        onOk={handleApproveOk}
        onCancel={() => setApproveModalVisible(false)}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
            borderColor: "transparent",
            borderRadius: "8px",
            fontWeight: 600,
          },
        }}
        cancelButtonProps={{
          style: {
            borderRadius: "8px",
          },
        }}
        centered
      >
        <p style={{ fontSize: "15px", color: "#595959", margin: "16px 0" }}>
          คุณแน่ใจหรือไม่ว่าต้องการเปิดรับสมัครสำหรับโพสต์นี้?
        </p>
      </Modal>
      {/* Reject Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <StopOutlined style={{ color: "#ff4d4f", fontSize: "20px" }} />
            <span>ยืนยันการปิดรับสมัคร</span>
          </div>
        }
        open={rejectModalVisible}
        onOk={handleRejectOk}
        onCancel={() => setRejectModalVisible(false)}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{
          danger: true,
          style: {
            borderRadius: "8px",
            fontWeight: 600,
          },
        }}
        cancelButtonProps={{
          style: {
            borderRadius: "8px",
          },
        }}
        centered
      >
        <p style={{ fontSize: "15px", color: "#595959", margin: "16px 0" }}>
          คุณแน่ใจหรือไม่ว่าต้องการปิดรับสมัครสำหรับโพสต์นี้?
        </p>
      </Modal>
    </>
  );
};

export default PostInfoCard;
