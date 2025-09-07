import React, { useMemo, useState } from "react";
import { Card, Descriptions, Typography, Tag, Space, Button, Modal } from "antd";
import { EditOutlined, UserOutlined, StarOutlined, DesktopOutlined, CalendarOutlined, GiftOutlined, DollarOutlined, EnvironmentOutlined, CheckOutlined, StopOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

interface PostInfoCardProps {
  post: any;
  statusStyle: { bgColor: string; textColor: string; border: string };
  statusIcon: React.ReactNode;
  actionLoading: boolean;
  handleApprove: () => void;
  handleReject: () => void;
  status: { status_post: string; status_post_th: string }[];
}

const formatThaiDateTime = (dt?: string | Date) =>
  dt
    ? new Date(dt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const PostInfoCard: React.FC<PostInfoCardProps> = ({
  post,
  statusStyle,
  statusIcon,
  actionLoading,
  handleApprove,
  handleReject,
  status,
}) => {
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  const stOpen = useMemo(() => status.find((s) => s.status_post === "Open"), [status]);
  const stClosed = useMemo(() => status.find((s) => s.status_post === "Closed"), [status]);

  const isPending = post?.StatusPost?.status_post === "Pending Approval";

  const approveLabel = stOpen?.status_post_th || "เปิดรับสมัคร";
  const rejectLabel = stClosed?.status_post_th || "ปิดรับสมัคร";

  const minGPA = Number.isFinite(Number(post?.min_gpa))
    ? Number(post.min_gpa).toFixed(1)
    : "-";

  const workMode = post?.WorkMode?.work_mode ?? "-";
  const workDay = post?.WorkDay?.work_day ?? "-";
  const jobType = post?.JobType?.job_type ?? "-";
  const stipend = post?.Stipend?.stipend ?? "-";

  const benefitsText = useMemo(() => {
    // รองรับทั้งรูปแบบเดิม (Benefit?.benefit) และแบบอาเรย์ (Benefits)
    const single = post?.Benefit?.benefit as string | undefined;
    const list = (post?.Benefits ?? []) as Array<{ benefit?: string }>;
    const fromList = list.map((b) => b?.benefit).filter(Boolean) as string[];
    const merged = [...(single ? [single] : []), ...fromList];
    return merged.length ? merged.join(", ") : "-";
  }, [post]);

  const locationText = useMemo(
    () =>
      [post?.location_detail, post?.subdistrict, post?.district, post?.province]
        .filter(Boolean)
        .join(", ") || "-",
    [post]
  );

  const approvalInfo = useMemo(() => {
    const approvedOrClosed =
      post?.StatusPost?.status_post === "Open" || post?.StatusPost?.status_post === "Closed";
    if (!approvedOrClosed) return null;

    const admin = post?.Admin || post?.StatusPost?.Admin;
    const updatedAt = post?.StatusPost?.UpdatedAt || post?.UpdatedAt;

    return {
      adminName: admin ? `${admin.first_name ?? ""} ${admin.last_name ?? ""}`.trim() : "",
      adminId: admin?.id ?? admin?.ID,
      time: formatThaiDateTime(updatedAt),
    };
  }, [post]);

  return (
    <>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <EditOutlined style={{ color: "#1677ff" }} />
            <span>ข้อมูลโพสต์</span>
          </div>
        }
        style={{
          marginBottom: "1.5rem",
          borderRadius: 12,
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Title level={4} style={{ color: "#1677ff", margin: 0, fontSize: 18, fontWeight: 600, lineHeight: 1.4 }}>
              {post?.post_name ?? "-"}
            </Title>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 16px",
              borderRadius: 999,
              background: statusStyle.bgColor,
              color: statusStyle.textColor,
              border: statusStyle.border,
              fontSize: 13,
              fontWeight: 600,
              marginTop: 12,
            }}
          >
            {statusIcon}
            <span style={{ marginLeft: 6 }}>{post?.StatusPost?.status_post_th ?? "-"}</span>
          </div>
        </div>

        {/* Details */}
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="รายละเอียดงาน">
            <Paragraph style={{ margin: 0, lineHeight: 1.6 }}>
              {post?.post_description ?? "-"}
            </Paragraph>
          </Descriptions.Item>

          <Descriptions.Item label="ประเภทงาน">
            <Tag color="blue">{jobType}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="จำนวนรับสมัคร">
            <span style={{ fontWeight: 600 }}>
              <UserOutlined style={{ marginRight: 6, color: "#1677ff" }} />
              {Number.isFinite(Number(post?.quantity)) ? `${post.quantity} คน` : "-"}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="เกรดขั้นต่ำ">
            <span style={{ fontWeight: 600 }}>
              <StarOutlined style={{ marginRight: 6, color: "#faad14" }} />
              {minGPA !== "-" ? `GPA ${minGPA}` : "-"}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="รูปแบบการทำงาน">
            <Tag icon={<DesktopOutlined />} color="geekblue">
              {workMode}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="วันทำงาน">
            <span>
              <CalendarOutlined style={{ marginRight: 6, color: "#1677ff" }} />
              {workDay}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="สวัสดิการ">
            <span>
              <GiftOutlined style={{ marginRight: 6, color: "#52c41a" }} />
              {benefitsText}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="ค่าตอบแทน">
            <span>
              <DollarOutlined style={{ marginRight: 6, color: "#faad14" }} />
              {stipend}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="สถานที่">
            <div>
              <EnvironmentOutlined style={{ marginRight: 6, color: "#ff4d4f" }} />
              {locationText}
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="วันที่สร้าง">
            {formatThaiDateTime(post?.CreatedAt)}
          </Descriptions.Item>

          {/* ผู้อนุมัติ/เวลาอนุมัติ */}
          {approvalInfo?.adminName ? (
            <Descriptions.Item label="ผู้อนุมัติ">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div>
                  <Text>{approvalInfo.adminName}</Text>
                  <br />
                  {approvalInfo.adminId ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      รหัสประจำตัว: {approvalInfo.adminId}
                    </Text>
                  ) : null}
                </div>
              </div>
            </Descriptions.Item>
          ) : null}

          {approvalInfo?.time ? (
            <Descriptions.Item label="วันที่อนุมัติ">{approvalInfo.time}</Descriptions.Item>
          ) : null}
        </Descriptions>

        {/* Actions */}
        {isPending && (
          <div style={{ marginTop: 20 }}>
            <Space>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={actionLoading}
                onClick={() => setApproveModalVisible(true)}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a", borderRadius: 8, padding: 18 }}
              >
                {approveLabel}
              </Button>
              <Button
                danger
                icon={<StopOutlined />}
                loading={actionLoading}
                onClick={() => setRejectModalVisible(true)}
                style={{ borderRadius: 8, padding: 18 }}
              >
                {rejectLabel}
              </Button>
            </Space>
          </div>
        )}
      </Card>

      {/* Approve Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CheckOutlined style={{ color: "#52c41a", fontSize: 20 }} />
            <span>ยืนยันการเปิดรับสมัคร</span>
          </div>
        }
        open={approveModalVisible}
        onOk={() => {
          setApproveModalVisible(false);
          handleApprove();
        }}
        onCancel={() => setApproveModalVisible(false)}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
            borderColor: "transparent",
            borderRadius: 8,
            fontWeight: 600,
          },
        }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        centered
      >
        <p style={{ fontSize: 15, color: "#595959", margin: "16px 0" }}>
          คุณแน่ใจหรือไม่ว่าต้องการเปิดรับสมัครสำหรับโพสต์นี้?
        </p>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StopOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
            <span>ยืนยันการปิดรับสมัคร</span>
          </div>
        }
        open={rejectModalVisible}
        onOk={() => {
          setRejectModalVisible(false);
          handleReject();
        }}
        onCancel={() => setRejectModalVisible(false)}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{ danger: true, style: { borderRadius: 8, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        centered
      >
        <p style={{ fontSize: 15, color: "#595959", margin: "16px 0" }}>
          คุณแน่ใจหรือไม่ว่าต้องการปิดรับสมัครสำหรับโพสต์นี้?
        </p>
      </Modal>
    </>
  );
};

export default PostInfoCard;