import { useEffect, useState } from "react";
import {
  Row, Col, Typography, Space, ConfigProvider, message, Layout,
  Badge, Popover, List, Tag, Empty, Avatar
} from "antd";
import {
  CalendarOutlined, DashboardOutlined, BuildOutlined, PhoneOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import type {
  OverviewInterface, PipelineBucketInterface, TopPostItem
} from "../../interfaces/Analysis";
import { GetPostByCompanyId } from "../../services/https/post";
import {
  GetCompanyByUserIdForNewCompany,
  getOverview,
  getStatusApplication,
  getLatestPendingApplicants, // ดึง latest-pending
} from "../../services/https";
import Overview from "../company/analysis/Overview";
import TrendChart from "../company/analysis/TrendChart";
import PipelineFunnel from "../company/analysis/PipelineFunnel";
import type { CompanyInterface } from "../../interfaces/Company";
import CompanyHeader from "../Component/CompanyHeader";
import TopPostsCard from "../company/analysis/TopPostsCard";
import LatestPendingApplicants from "../company/analysis/LatestPendingApplicants";
import { useNavigate } from "react-router-dom";
import { fileURL } from "@/config/env"; // ใช้กับ avatar

dayjs.extend(isBetween);

const { Text, Title } = Typography;

type TodayAppt = {
  id?: number | string;
  time: string;         // ISO e.g. 2025-09-16T13:00:00+07:00
  candidate?: string;
  postName?: string;
  mode?: string;
  note?: string;
  phone?: string;
  avatarUrl?: string;
};

const CompanyDashboard = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  // data states
  const [overview, setOverview] = useState<OverviewInterface | null>(null);
  const [funnelData, setFunnelData] = useState<PipelineBucketInterface[]>([]);
  const [company, setCompany] = useState<CompanyInterface>();

  // โพสต์ตามสถานะ (จากโพสต์จริงของบริษัท)
  const [postStatusCounts, setPostStatusCounts] = useState({ open: 0, closed: 0, pending: 0 });

  // นัดสัมภาษณ์วันนี้
  const [todayAll, setTodayAll] = useState<TodayAppt[]>([]);   // ทั้งหมดของวันนี้
  const [todayList, setTodayList] = useState<TodayAppt[]>([]); // เฉพาะที่ "จะถึง"
  const [appointmentsToday, setAppointmentsToday] = useState<number>(0);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const navigate = useNavigate();

  const topPosts: TopPostItem[] =
    overview?.topPosts ??
    (overview?.topPost
      ? [{ postId: overview.topPost.postId, postName: overview.topPost.postName, applications: overview.topPost.applications }]
      : []);

  // โหลดนับสถานะโพสต์จริง
  useEffect(() => {
    if (!company?.ID) return;
    (async () => {
      try {
        const res = await GetPostByCompanyId(Number(company?.ID));
        if (res?.status === 200 && Array.isArray(res.data)) {
          const open = res.data.filter((p: any) => p?.StatusPost?.status_post === "Open").length;
          const closed = res.data.filter((p: any) => p?.StatusPost?.status_post === "Closed").length;
          const pending = res.data.filter((p: any) => p?.StatusPost?.status_post === "Pending Approval").length;
          setPostStatusCounts({ open, closed, pending });
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [company?.ID]);

  // โหลดภาพรวม + pipeline
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const userId = Number(localStorage.getItem("id"));
        if (!userId) {
          messageApi.error("ไม่พบ user id ใน localStorage");
          return;
        }

        const compRes = await GetCompanyByUserIdForNewCompany(userId);
        if (!compRes) {
          navigate("/company/add-company", { replace: true });
          messageApi.info("โปรดเพิ่มข้อมูลบริษัทก่อนใช้งานแดชบอร์ด");
          return;
        }
        setCompany(compRes);

        const [ov, statusApp, postsRes] = await Promise.all([
          getOverview(compRes.ID!),
          getStatusApplication(compRes.ID!),
          GetPostByCompanyId(compRes.ID!),
        ]);

        setOverview((ov as OverviewInterface) ?? null);
        setFunnelData(Array.isArray(statusApp) ? statusApp : []);

        if (postsRes?.status === 200 && Array.isArray(postsRes.data)) {
          const open = postsRes.data.filter((p: any) => p?.StatusPost?.status_post === "Open").length;
          const closed = postsRes.data.filter((p: any) => p?.StatusPost?.status_post === "Closed").length;
          const pending = postsRes.data.filter((p: any) => p?.StatusPost?.status_post === "Pending Approval").length;
          setPostStatusCounts({ open, closed, pending });
        }
      } catch (err) {
        console.error(err);
        messageApi.error("โหลดข้อมูลวิเคราะห์ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // โหลด "นัดสัมภาษณ์วันนี้" จาก latest-pending
  useEffect(() => {
    if (!company?.ID) return;
    (async () => {
      try {
        const res = await getLatestPendingApplicants(Number(company.ID));
        const raw = Array.isArray(res) ? res : res?.data ?? [];

        // กรอง "วันนี้" และสถานะที่มีคำว่า "นัดสัมภาษณ์"
        const allToday: TodayAppt[] = raw
          .filter((it: any) =>
            it?.interview_at &&
            dayjs(it.interview_at).isSame(dayjs(), "day") &&
            String(it?.status || "").includes("นัดสัมภาษณ์")
          )
          .map((it: any, idx: number): TodayAppt => ({
            id: it.interview_id ?? it.application_id ?? idx,
            time: it.interview_at,
            candidate: it.student_full_name,
            postName: it.post_name,
            mode: it.mode,
            note: it.company_note,
            phone: it.student_phone,
            avatarUrl: it.student_image_url ? fileURL(it.student_image_url) : undefined,
          }))
          .sort((a: TodayAppt, b: TodayAppt) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());

        setTodayAll(allToday);

        // คัดเฉพาะ "จะถึง" (after now)
        const now = dayjs();
        const upcoming = allToday.filter(a => dayjs(a.time).isAfter(now));
        setTodayList(upcoming);
        setAppointmentsToday(upcoming.length);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [company?.ID]);

  // อัปเดตตัวเลขและลิสต์อัตโนมัติทุก 60 วินาที (ลบรายการที่ผ่านเวลาแล้ว)
  useEffect(() => {
    if (todayAll.length === 0) return;
    const timer = setInterval(() => {
      const now = dayjs();
      const upcoming = todayAll
        .filter(a => dayjs(a.time).isAfter(now))
        .sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());
      setTodayList(upcoming);
      setAppointmentsToday(upcoming.length);
    }, 60_000);
    return () => clearInterval(timer);
  }, [todayAll]);

  // เนื้อหาใน Popover
  const popContent = (
    <div className="today-popover">
      {todayList.length === 0 ? (
        <Empty description="ไม่มีนัดสัมภาษณ์ที่กำลังจะถึงในวันนี้" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={todayList}
          renderItem={(item) => {
            const t = dayjs(item.time);
            return (
              <List.Item className="today-item">
                <List.Item.Meta
                  avatar={
                    item.avatarUrl
                      ? <Avatar src={item.avatarUrl} size={40} />
                      : <Avatar size={40}>{item.candidate?.charAt(0) ?? "?"}</Avatar>
                  }
                  title={
                    <div className="today-row">
                      <span className="today-time">
                        <CalendarOutlined /> {t.format("HH:mm")}
                      </span>
                      {item.mode && <Tag className="today-mode" color="blue">{item.mode}</Tag>}
                    </div>
                  }
                  description={
                    <div className="today-desc">
                      <div className="line"><strong>ผู้สมัคร:</strong> {item.candidate ?? "-"}</div>
                      <div className="line"><strong>ตำแหน่ง:</strong> {item.postName ?? "-"}</div>
                      {item.phone && (
                        <div className="line">
                          <PhoneOutlined /> <a href={`tel:${item.phone}`}>{item.phone}</a>
                        </div>
                      )}
                      {item.note && <div className="line note">{item.note}</div>}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );

  const hasToday = appointmentsToday > 0;

  return (
    <Layout>
      <CompanyHeader />
      <div className="adminpage-layout">
        <style>{customStyles}</style>
        {contextHolder}
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#1677ff",
              colorInfo: "#1677ff",
              colorLink: "#1677ff",
              colorSuccess: "#52c41a",
              colorWarning: "#faad14",
              colorError: "#ff4d4f",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.08)",
            },
            components: {
              Card: { borderRadiusLG: 16 },
              Button: { borderRadius: 8 },
              Tag: { borderRadius: 8 },
            },
          }}
        >
          <div style={{ padding: "0 8px" }}>
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              {/* HEADER */}
              <div className="dashboard-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "300px" }}>
                    <Title level={1} className="dashboard-title">
                      <DashboardOutlined style={{ marginRight: 12, color: "#1677ff" }} />
                      ภาพรวมบริษัท <span>{company?.company_name || "—"}</span>
                    </Title>
                    <Text className="dashboard-subtitle">แดชบอร์ดสำหรับวิเคราะห์และติดตามผลการดำเนินงาน</Text>

                    <div className="dashboard-meta">
                      <div className="dashboard-meta-item">
                        <CalendarOutlined />
                        <span>อัปเดตล่าสุด: {dayjs().format("DD/MM/YYYY HH:mm")} น.</span>
                      </div>
                      <div className="dashboard-meta-item">
                        <BuildOutlined />
                        <span>รหัสบริษัท: #{company?.ID || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* ปุ่ม + Popover นัดวันนี้ */}
                  <div className="dash-actions">
                    <Popover
                      open={popoverOpen}
                      onOpenChange={setPopoverOpen}
                      trigger="click"
                      placement="bottomRight"
                      content={popContent}
                      overlayClassName="today-popover-overlay"
                      overlayStyle={{ width: 380, maxWidth: 'min(90vw, 420px)' }} // ป้องกันบีบ
                    >
                      <button
                        className={`today-interview-pill ${hasToday ? "is-alert" : "is-neutral"}`}
                        type="button"
                        aria-label="นัดสัมภาษณ์วันนี้"
                      >
                        {/* Badge วางมุมบนซ้ายของปุ่ม ไม่ทับไอคอน/ข้อความ */}
                        <Badge count={appointmentsToday} className="pill-badge" overflowCount={99} />

                        <span className="pill-icon">
                          <CalendarOutlined />
                        </span>
                        <span className="pill-text">นัดสัมภาษณ์วันนี้</span>
                        <span className="pill-date">{dayjs().format("DD MMM YYYY")}</span>
                      </button>
                    </Popover>

                  
                  </div>
                </div>
              </div>

              {/* OVERVIEW + PIPELINE */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Overview loading={loading} overview={overview} postStatusCounts={postStatusCounts} />
                </Col>
                <Col xs={24} lg={8}>
                  <PipelineFunnel loading={loading} data={funnelData} />
                </Col>
              </Row>

              {/* POSTS + LATEST APPLICANTS */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <LatestPendingApplicants
                    companyId={Number(company?.ID)}
                    loadingGlobal={loading}
                    onViewApplication={(postId) => navigate(`/applications/post/${postId}`)}
                  />
                </Col>
                <Col xs={24} lg={8}>
                  <TopPostsCard
                    loading={loading}
                    topPosts={topPosts}
                    title="Top Posts (ยอดนิยม)"
                    onViewApplicants={(postId) => navigate(`/applications/post/${postId}`)}
                    maxItems={5}
                  />
                </Col>
              </Row>

              <TrendChart companyId={Number(company?.ID)} />
            </Space>
          </div>
        </ConfigProvider>
      </div>
    </Layout>
  );
};

export default CompanyDashboard;

const customStyles = `
  .adminpage-layout {
    display: flex; flex-direction: column; padding: 24px; min-height: 100vh;
    background: linear-gradient(135deg,#fff 0%,#f0f8ff 25%,#cfeafa 60%,#9fdafc 100%);
    position: relative;
  }
  .adminpage-layout::before {
    content: ''; position: absolute; inset: 0;
    background-image:
      radial-gradient(circle at 20% 50%, rgba(24,144,255,.03) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(135,208,104,.02) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(24,144,255,.02) 0%, transparent 50%);
    pointer-events: none; z-index: 0;
  }
  .adminpage-layout > * { position: relative; z-index: 1; }

  .dashboard-header {
    background: linear-gradient(135deg, rgba(255,255,255,.95) 0%, rgba(240,248,255,.9) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,.4);
    border-radius: 20px; padding: 32px 40px; margin-bottom: 24px;
    box-shadow: 0 16px 48px rgba(24,144,255,.12); position: relative; overflow: hidden;
  }
  .dashboard-header::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg,#1677ff 0%,#722ed1 50%,#52c41a 100%);
    border-radius: 20px 20px 0 0;
  }
  .dashboard-title {
    background: linear-gradient(135deg,#1677ff 0%,#722ed1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    margin-bottom: 8px !important; font-weight: 700; font-size: 2.5rem !important; line-height: 1.2;
  }
  .dashboard-subtitle { font-size: 18px !important; color: rgba(0,0,0,.65); margin-bottom: 16px !important; }
  .dashboard-meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 8px; }
  .dashboard-meta-item {
    display: flex; align-items: center; gap: 6px; padding: 6px 12px;
    background: rgba(24,144,255,.05); border: 1px solid rgba(24,144,255,.1);
    border-radius: 8px; font-size: 14px; color: rgba(0,0,0,.75);
  }
  .dashboard-meta-item .anticon { color: #1677ff; font-size: 16px; }

  .chart-card { backdrop-filter: blur(10px); background: rgba(255,255,255,.9) !important; border: 1px solid rgba(255,255,255,.3); box-shadow: 0 8px 32px rgba(24,144,255,.1); height: 100%; }
  .chart-card .ant-card-head { background: linear-gradient(135deg, rgba(24,144,255,.05) 0%, rgba(255,255,255,.02) 100%); border-bottom: 1px solid rgba(24,144,255,.1); }

  /* ====== Header right actions ====== */
  .dash-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: flex-end; min-width: 260px; }

  /* ปุ่มพื้นฐาน */
  .today-interview-pill {
    position: relative; /* สำหรับปัก badge */
    display: inline-flex; align-items: center; gap: 10px; padding: 10px 14px;
    border-radius: 999px; cursor: pointer; transition: all .2s ease; outline: none; border: 1px solid transparent;
  }
  .today-interview-pill .pill-icon {
    width: 28px; height: 28px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
  }
  .today-interview-pill .pill-text { font-weight: 600; white-space: nowrap; }
  .today-interview-pill .pill-date { font-size: 12px; padding-left: 6px; border-left: 1px solid rgba(0,0,0,.08); white-space: nowrap; }

  /* โหมดสี: ไม่มีนัด (neutral) */
  .today-interview-pill.is-neutral {
    background: linear-gradient(135deg, rgba(22,119,255,.06), rgba(105,192,255,.10));
    border-color: rgba(22,119,255,.22);
    box-shadow: 0 4px 12px rgba(24,144,255,.10);
  }
  .today-interview-pill.is-neutral .pill-icon { background: linear-gradient(135deg, #1677ff, #69c0ff); color: #fff; }
  .today-interview-pill.is-neutral .pill-text { color: #0f1a2a; }
  .today-interview-pill.is-neutral .pill-date { color: rgba(0,0,0,.55); }

  /* โหมดสี: มีนัด (alert) */
  @keyframes pillPulse {
    0% { box-shadow: 0 0 0 0 rgba(255,77,79,.36); }
    70% { box-shadow: 0 0 0 10px rgba(255,77,79,0); }
    100% { box-shadow: 0 0 0 0 rgba(255,77,79,0); }
  }
  .today-interview-pill.is-alert {
    background: linear-gradient(135deg, #ff4d4f, #faad14);
    border-color: rgba(0,0,0,.08);
    color: #fff;
    animation: pillPulse 2.5s ease-out infinite;
  }
  .today-interview-pill.is-alert .pill-icon { background: #fff; color: #ff4d4f !important; }
  .today-interview-pill.is-alert .pill-text { color: #fff; }
  .today-interview-pill.is-alert .pill-date { color: rgba(255,255,255,.9); border-left-color: rgba(255,255,255,.35); }

  .today-interview-pill:hover { transform: translateY(-1px); }
  .today-interview-pill.is-neutral:hover { box-shadow: 0 8px 20px rgba(24,144,255,.16); border-color: rgba(22,119,255,.28); }
  .today-interview-pill.is-alert:hover { filter: brightness(1.02); }
  .today-interview-pill:active { transform: translateY(0); }

  /* ====== Badge: ปักมุมบนซ้ายของปุ่ม ไม่ทับไอคอน/ข้อความ ====== */
  .pill-badge { position: absolute; top: -8px; left: 10px; pointer-events: none; z-index: 2; }
  .pill-badge .ant-badge-count {
    min-width: 20px; height: 20px; line-height: 20px; font-size: 12px; font-weight: 700;
    padding: 0 6px; border-radius: 999px;
    box-shadow: 0 0 0 2px rgba(255,255,255,.95), 0 2px 8px rgba(0,0,0,.12);
  }
  .today-interview-pill.is-neutral .pill-badge .ant-badge-count { background: #ff4d4f; color: #fff; }
  .today-interview-pill.is-alert .pill-badge .ant-badge-count {
    background: #fff !important; color: #ff4d4f !important; border: 1px solid rgba(0,0,0,.06);
    box-shadow: 0 0 0 2px rgba(255,255,255,1), 0 2px 8px rgba(0,0,0,.15);
  }

  /* ====== Popover: แก้ปัญหาบีบความกว้าง/ตัดคำ ====== */
  .today-popover-overlay .ant-popover-inner { max-width: none !important; width: auto; }
  .today-popover { width: 100%; max-height: 360px; overflow: auto; white-space: normal; word-break: break-word; }
  .today-popover .today-item,
  .today-popover .today-desc,
  .today-popover .ant-list-item-meta,
  .today-popover .ant-list-item-meta-content,
  .today-popover .ant-list-item-meta-title { white-space: normal; word-break: break-word; }
  .today-popover .ant-list-item-meta { align-items: flex-start; }
  .today-popover .today-row { display: flex; align-items: center; gap: 8px; }
  .today-popover .today-time { font-weight: 600; color: #001d66; display: inline-flex; align-items: center; gap: 6px; }
  .today-popover .today-mode { margin-left: auto; }
  .today-popover .today-desc .line { font-size: 13px; color: rgba(0,0,0,.75); }
  .today-popover .today-desc .note { color: rgba(0,0,0,.65); }

  @media (max-width: 768px) {
    .dashboard-header { padding: 24px 20px; }
    .dashboard-title { font-size: 2rem !important; }
    .dashboard-meta { flex-direction: column; align-items: flex-start; gap: 8px; }

    .dash-actions { width: 100%; justify-content: flex-start; min-width: 0; }
    .today-interview-pill { width: 100%; justify-content: flex-start; }

    .today-popover-overlay .ant-popover-inner { width: min(90vw, 420px) !important; }
    .today-popover { max-width: min(90vw, 420px); }

    .pill-badge { top: -7px; left: 8px; }
    .pill-badge .ant-badge-count { min-width: 18px; height: 18px; line-height: 18px; font-size: 11px; }
  }

  .section-title{
    background: linear-gradient(135deg, #1677ff 0%, #722ed1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .section-title .section-title__icon,
  .section-title .anticon {
    background: none !important;
    -webkit-text-fill-color: initial !important;
    color: #1677ff;
  }

  .icon-circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1677ff, #69c0ff);
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-circle .inner-icon {
    color: #fff;
    font-size: 18px;
  }
`;