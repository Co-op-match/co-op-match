import React, { useEffect, useState, useMemo } from "react";
import {
  Card, Avatar, Tag, Button, Space, Skeleton, Empty, Typography, Tooltip, Badge
} from "antd";
import {
  UserOutlined, EyeOutlined, CalendarOutlined, PhoneOutlined, ScheduleOutlined,
  ClockCircleOutlined, UserSwitchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import { useNavigate } from "react-router-dom";
import type { LatestPendingApplicantInterface } from "@/interfaces/Analysis";
import { getLatestPendingApplicants } from "@/services/https";
import { fileURL } from "@/config/env";
const { Text, Title } = Typography;

dayjs.extend(relativeTime);
dayjs.locale("th");

interface Props {
  companyId?: number;
  loadingGlobal?: boolean;
  onViewApplication?: (postId: number) => void;
}

/* ---------- helpers ---------- */
const cleanStatus = (s?: string) =>
  (s || "").replace(/\u200B|\u200C|\u200D|\u00A0/g, "").replace(/\s+/g, "").trim();

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  "กำลังพิจารณา": { color: "#1890ff", icon: <ClockCircleOutlined /> },
  "รอการนัดสัมภาษณ์": { color: "#faad14", icon: <ScheduleOutlined /> },
  "นัดสัมภาษณ์แล้ว": { color: "#13c2c2", icon: <UserSwitchOutlined /> },
  "ผ่าน": { color: "#52c41a", icon: <UserOutlined /> },
  "ไม่ผ่าน": { color: "#ff4d4f", icon: <UserOutlined /> },
  "ไม่ได้รับเลือก": { color: "#ff4d4f", icon: <UserOutlined /> },
};
const getStatusConfig = (status?: string) =>
  STATUS_CONFIG[cleanStatus(status)] ?? { color: "#d9d9d9", icon: <UserOutlined /> };
const compactDate = (iso: string) => dayjs(iso).fromNow();

const LatestPendingApplicants: React.FC<Props> = ({
  companyId,
  loadingGlobal,
  onViewApplication,
}) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LatestPendingApplicantInterface[]>([]);
  const navigate = useNavigate();
  const isLoading = Boolean(loadingGlobal || loading);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getLatestPendingApplicants(companyId); // backend คืน "ทั้งหมด"
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  const handleViewByStatus = (it: LatestPendingApplicantInterface) => {
    const key = cleanStatus(it.status || "กำลังพิจารณา");
    if (key === "กำลังพิจารณา") return navigate(`/applications/post/${it.post_id}`);
    if (key === "รอการนัดสัมภาษณ์") return navigate(`/company/interview_appointments`);
    if (key === "นัดสัมภาษณ์แล้ว") return navigate(`/company/interview_appointments/confirm`);
    return onViewApplication ? onViewApplication(it.post_id) : navigate(`/applications/post/${it.post_id}`);
  };

  const listBody = useMemo(() => {
    if (isLoading) {
      return (
        <div style={{ padding: "12px 0" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <Skeleton
                active
                avatar={{ size: 48 }}
                paragraph={{ rows: 2 }}
                style={{
                  padding: "12px 16px",
                  background: "#fafafa",
                  borderRadius: 12,
                  border: "1px solid #f0f0f0",
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    if (!items.length) {
      return (
        <div style={{ padding: "24px 12px", textAlign: "center" }}>
          <Empty
            description={
              <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                ยังไม่มีผู้สมัครที่กำลังพิจารณา
              </Typography.Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return (
      <div style={{ padding: "8px 0" }}>
        {items.map((it) => {
          const statusConfig = getStatusConfig(it.status);
          const studentImage =
            ("student_image_url" in it ? (it as any).student_image_url : undefined) ??
            ("studentImageUrl" in it ? (it as any).studentImageUrl : undefined);
          const avatarSrc = studentImage ? fileURL(studentImage) : undefined;

          return (
            <div key={it.application_id}>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid #f0f0f0",
                  background: "#fff",
                  cursor: "pointer",
                  transition: "box-shadow .2s, border-color .2s",
                  marginBottom: 10,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
                onClick={() => handleViewByStatus(it)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#91caff")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f0f0f0")}
              >
                {/* header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <Badge dot color={statusConfig.color} offset={[-4, 4]}>
                      <Avatar
                        src={avatarSrc}
                        icon={!avatarSrc && <UserOutlined />}
                        size={44}
                        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "2px solid #fff" }}
                      />
                    </Badge>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong style={{ fontSize: 14, color: "#1f2937" }} ellipsis>
                        {it.student_full_name}
                      </Typography.Text>
                      <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <Tag color="blue" style={{ margin: 0, borderRadius: 6, fontSize: 12, padding: "0 8px", border: "none" }}>
                          {it.post_name}
                        </Tag>
                        <Tag color={statusConfig.color} style={{ margin: 0, borderRadius: 999, fontSize: 12, padding: "0 10px", border: "none" }}>
                          {it.status || "กำลังพิจารณา"}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<EyeOutlined />}
                    style={{ borderRadius: 8, height: 30, fontSize: 12, fontWeight: 500 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewByStatus(it);
                    }}
                  >
                    ดูรายละเอียด
                  </Button>
                </div>

                {/* meta */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <Tooltip title="วันที่สมัคร">
                    <Typography.Text type="secondary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <CalendarOutlined />
                      {compactDate(it.submit_at)}
                    </Typography.Text>
                  </Tooltip>

                  {it.interview_id && it.interview_at && (
                    <Tooltip title="วันนัดสัมภาษณ์">
                      <Typography.Text style={{ fontSize: 12, color: "#fa8c16", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                        <ScheduleOutlined />
                        {dayjs(it.interview_at).format("DD/MM HH:mm")} น.
                      </Typography.Text>
                    </Tooltip>
                  )}

                  {!!it.student_phone && (
                    <Tooltip title="เบอร์โทรศัพท์">
                      <Typography.Text type="secondary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <PhoneOutlined />
                        {it.student_phone}
                      </Typography.Text>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [isLoading, items, navigate, onViewApplication]);

  const pendingCount = items.length;
  const urgentCount = items.filter((it) => {
    const status = cleanStatus(it.status);
    return status === "รอการนัดสัมภาษณ์" || status === "นัดสัมภาษณ์แล้ว";
  }).length;

  return (
    <Card
      className="chart-card"
      size="small"
      style={{ borderRadius: 16, border: "1px solid #e8f4fd", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", height: "100%" }}
      styles={{
        body: { padding: "12px 16px" }, // body บาง ๆ
        header: { borderBottom: "1px solid #f0f0f0", padding: "12px 16px" },
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="icon-circle">
            <UserSwitchOutlined className="inner-icon" />
          </div>
          <div>
            <Title level={4} className="section-title" style={{ marginBottom: "0px" }}>
              ผู้สมัครที่รอการคัดเลือก
            </Title>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: "lighter" }}>
              รายการผู้สมัครที่ต้องดำเนินการ
            </Text>
          </div>
        </div>
      }
      extra={
        <Space>
          {urgentCount > 0 && (
            <Tag color="orange" style={{ borderRadius: 12, padding: "2px 10px", fontSize: 12, border: "none" }}>
              <ScheduleOutlined style={{ marginRight: 4 }} />
              เร่งด่วน {urgentCount}
            </Tag>
          )}
          <Tag color="blue" style={{ borderRadius: 12, padding: "2px 10px", fontSize: 12, border: "none" }}>
            ทั้งหมด {pendingCount} รายการ
          </Tag>
        </Space>
      }
    >
      <div
        style={{
          overflowY: "auto",
          paddingRight: 6,         // กันชน scrollbar
          scrollBehavior: "smooth",
        }}
      >
        {listBody}
      </div>
    </Card>
  );
};

export default LatestPendingApplicants;