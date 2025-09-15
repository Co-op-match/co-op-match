// StatCards.tsx
import React, { useMemo } from "react";
import { Row, Col, Card } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  LoginOutlined,
} from "@ant-design/icons";

/* ---------- Fixed only height; width auto & equal ---------- */
const CARD_HEIGHT = 110;
const COL_MIN_WIDTH = 280; // การ์ดแต่ละใบจะพยายามไม่เล็กกว่านี้ และกว้างเท่ากันในแถว

/* ---------- Shared styles ---------- */
const STAT_CARD_STYLES = `
  @keyframes countUp { from { transform: scale(.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes slideInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .enhanced-stat-card { border-radius:14px; border:none; position:relative; overflow:hidden; height:${CARD_HEIGHT}px; min-height:${CARD_HEIGHT}px; }
  .enhanced-stat-card::before{
    content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);
    transition:left .6s;
  }
  .enhanced-stat-card:hover::before{ left:100%; }

  .stat-card-content{
    display:flex; align-items:center; justify-content:space-between;
    gap:16px; height:100%; width:100%; position:relative; z-index:1;
  }

  .stat-number{
    font-size:28px; font-weight:800; line-height:1; margin-bottom:4px;
    animation:countUp .8s ease-out .3s both;
    background:linear-gradient(135deg,currentColor 0%,currentColor 100%);
    -webkit-background-clip:text; background-clip:text;
  }
  .stat-label{ font-size:14px; font-weight:600; margin:0; } /* สี set inline */

  .stat-icon-container{
    width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex:0 0 auto;
  }
  .stat-icon{ font-size:20px; color:#fff; }

  /* ให้คอลัมน์กว้างเท่ากันในแถวเดียวกัน + wrap ได้ */
  .stat-row { margin-bottom:32px; }
  .stat-col { display:flex; }
  .stat-col .ant-card { width:100%; } /* width การ์ดเท่ากับคอลัมน์ */
`;

const StatIcon = (node: React.ReactNode, bg: string) => (
  <div className="stat-icon-container" style={{ background: bg }}>
    <span className="stat-icon">{node}</span>
  </div>
);

/* =======================================================
   1) VERIFY STAT CARD
======================================================= */
export type VerifyStatProps = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  notSubmitted?: number;
  showTotalCard?: boolean;
};

export const Verify_StatCard: React.FC<VerifyStatProps> = ({
  total,
  pending,
  approved,
  rejected,
  showTotalCard = true,
}) => {
  const cards = useMemo(
    () => [
      {
        key: "approved",
        bg: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
        color: "#389e0d",
        icon: StatIcon(<CheckCircleOutlined />, "linear-gradient(135deg, #52c41a, #73d13d)"),
        label: "รับรองแล้ว",
        count: approved,
        delay: 0,
      },
      {
        key: "pending",
        bg: "linear-gradient(135deg, #fff7e6 0%, #fffbda 100%)",
        color: "#d97706",
        icon: StatIcon(<ClockCircleOutlined />, "linear-gradient(135deg, #f59e0b, #d97706)"),
        label: "รอรับรอง",
        count: pending,
        delay: 100,
      },
      {
        key: "rejected",
        bg: "linear-gradient(135deg, #fff1f0 0%, #ffe6e6 100%)",
        color: "#dc2626",
        icon: StatIcon(<CloseOutlined />, "linear-gradient(135deg, #ef4444, #dc2626)"),
        label: "ปฏิเสธ",
        count: rejected,
        delay: 200,
      },
    ],
    [approved, pending, rejected]
  );

  return (
    <>
      <style>{STAT_CARD_STYLES}</style>
      <Row gutter={[20, 20]} wrap className="stat-row" justify="start">
        {showTotalCard && (
          <Col
            flex={`1 1 ${COL_MIN_WIDTH}px`}
            style={{ minWidth: COL_MIN_WIDTH }}
            className="stat-col"
            key="__verify_total__"
          >
            <Card
              className="enhanced-stat-card"
              style={{
                background: "#fff",
                border: "1px solid #eef2f7",
                boxShadow: "0 10px 24px #d9d9d9",
                padding: "initial",
              }}
            >
              <div className="stat-card-content">
                <div>
                  <div className="stat-label" style={{ color: "#475569" }}>ทั้งหมด</div>
                  <div className="stat-number" style={{ color: "#0f172a" }}>{total.toLocaleString()}</div>
                </div>
                <div className="stat-icon-container" style={{ background: "linear-gradient(135deg, rgb(30,58,138), rgb(59,130,246))" }}>
                  <FileTextOutlined className="stat-icon" />
                </div>
              </div>
            </Card>
          </Col>
        )}

        {cards.map((c) => (
          <Col
            key={c.key}
            flex={`1 1 ${COL_MIN_WIDTH}px`}
            style={{ minWidth: COL_MIN_WIDTH }}
            className="stat-col"
          >
            <div style={{ animation: "slideInUp .8s ease-out both", animationDelay: `${c.delay}ms`, width: "100%" }}>
              <Card
                className="enhanced-stat-card"
                style={{
                  background: c.bg,
                  border: "none",
                  boxShadow: "0 12px 32px #d9d9d9",
                }}
              >
                <div className="stat-card-content">
                  <div>
                    <div className="stat-label" style={{ color: c.color }}>{c.label}</div>
                    <div className="stat-number" style={{ color: c.color }}>{c.count.toLocaleString()}</div>
                  </div>
                  {c.icon}
                </div>
              </Card>
            </div>
          </Col>
        ))}
      </Row>
    </>
  );
};

/* =======================================================
   2) POST STAT CARD
======================================================= */
type StatusPostTH = { status_post_th?: string };

export type PostStatProps = {
  statusList: StatusPostTH[];
  totalPosts: number;
  pendingPosts: number;
  approvedPosts: number;
  rejectedPosts: number;
  showTotalCard?: boolean;
};

const PostIcon = (node: React.ReactNode, bg: string) => StatIcon(node, bg);

export const Post_StatCard: React.FC<PostStatProps> = ({
  statusList,
  totalPosts,
  pendingPosts,
  approvedPosts,
  rejectedPosts,
  showTotalCard = true,
}) => {
  const counts = useMemo(
    () => ({ total: totalPosts, pending: pendingPosts, approved: approvedPosts, rejected: rejectedPosts }),
    [totalPosts, pendingPosts, approvedPosts, rejectedPosts]
  );

  const getStatusCardProps = (statusTh: string) => {
    const MAP: Record<string, any> = {
      "เปิดรับสมัคร": {
        bg: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
        color: "#389e0d",
        icon: PostIcon(<CheckCircleOutlined />, "linear-gradient(135deg, #52c41a, #73d13d)"),
        count: counts.approved,
        label: "อนุมัติแล้ว",
      },
      "ปิดรับสมัคร": {
        bg: "linear-gradient(135deg, #fff1f0 0%, #ffe6e6 100%)",
        color: "#dc2626",
        icon: PostIcon(<CloseOutlined />, "linear-gradient(135deg, #ef4444, #dc2626)"),
        count: counts.rejected,
        label: "ปฏิเสธแล้ว",
      },
      "รอตรวจสอบ": {
        bg: "linear-gradient(135deg, #fff7e6 0%, #fffbda 100%)",
        color: "#d97706",
        icon: PostIcon(<ClockCircleOutlined />, "linear-gradient(135deg, #f59e0b, #d97706)"),
        count: counts.pending,
        label: "รอตรวจสอบ",
      },
    };
    return MAP[statusTh] ?? {
      bg: "#fff",
      color: "#0f172a",
      icon: PostIcon(<FileTextOutlined />, "linear-gradient(135deg, rgb(30,58,138), rgb(59,130,246))"),
      count: counts.total,
      label: "โพสต์ทั้งหมด",
    };
  };

  return (
    <>
      <style>{STAT_CARD_STYLES}</style>
      <Row gutter={[20, 20]} wrap className="stat-row" justify="start">
        {showTotalCard && (
          <Col
            flex={`1 1 ${COL_MIN_WIDTH}px`}
            style={{ minWidth: COL_MIN_WIDTH }}
            className="stat-col"
            key="__post_total__"
          >
            <Card
              className="enhanced-stat-card"
              style={{
                background: "#fff",
                border: "1px solid #eef2f7",
                boxShadow: "0 10px 24px #d9d9d9",
              }}
            >
              <div className="stat-card-content">
                <div>
                  <div className="stat-label" style={{ color: "#475569" }}>โพสต์ทั้งหมด</div>
                  <div className="stat-number" style={{ color: "#0f172a" }}>{totalPosts.toLocaleString()}</div>
                </div>
                <div className="stat-icon-container" style={{ background: "linear-gradient(135deg, rgb(30,58,138), rgb(59,130,246))" }}>
                  <FileTextOutlined className="stat-icon" />
                </div>
              </div>
            </Card>
          </Col>
        )}

        {statusList?.map((s, i) => {
          const p = getStatusCardProps(s.status_post_th || "");
          return (
            <Col
              key={`${s.status_post_th || "all"}-${i}`}
              flex={`1 1 ${COL_MIN_WIDTH}px`}
              style={{ minWidth: COL_MIN_WIDTH }}
              className="stat-col"
            >
              <Card
                className="enhanced-stat-card"
                style={{
                  background: p.bg,
                  border: "none",
                  boxShadow: "0 12px 32px #d9d9d9",
                }}
              >
                <div className="stat-card-content">
                  <div>
                    <div className="stat-label" style={{ color: p.color }}>{p.label}</div>
                    <div className="stat-number" style={{ color: p.color }}>{p.count.toLocaleString()}</div>
                  </div>
                  {p.icon}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </>
  );
};

/* =======================================================
   3) USER STAT CARD
======================================================= */
export type UserStatProps = {
  total: number;
  online: number;
  offline: number;
  loginsToday: number;
  showTotalCard?: boolean;
};

export const User_StatCard: React.FC<UserStatProps> = ({
  total,
  online,
  offline,
  loginsToday,
  showTotalCard = true,
}) => {
  const cards = useMemo(
    () => [
      {
        key: "online",
        bg: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
        color: "#389e0d",
        icon: StatIcon(<CheckCircleOutlined />, "linear-gradient(135deg, #52c41a, #73d13d)"),
        label: "ออนไลน์",
        count: online,
        delay: 0,
      },
      {
        key: "offline",
        bg: "linear-gradient(135deg, #fff1f0 0%, #ffe6e6 100%)",
        color: "#dc2626",
        icon: StatIcon(<CloseCircleOutlined />, "linear-gradient(135deg, #ef4444, #dc2626)"),
        label: "ออฟไลน์",
        count: offline,
        delay: 120,
      },
      {
        key: "login_today",
        bg: "linear-gradient(135deg, #fff7e6 0%, #fffbda 100%)",
        color: "#d97706",
        icon: StatIcon(<LoginOutlined />, "linear-gradient(135deg, #f59e0b, #d97706)"),
        label: "เข้าสู่ระบบวันนี้",
        count: loginsToday,
        delay: 240,
      },
    ],
    [online, offline, loginsToday]
  );

  return (
    <>
      <style>{STAT_CARD_STYLES}</style>
      <Row gutter={[20, 20]} wrap className="stat-row" justify="start">
        {showTotalCard && (
          <Col
            flex={`1 1 ${COL_MIN_WIDTH}px`}
            style={{ minWidth: COL_MIN_WIDTH }}
            className="stat-col"
            key="__user_total__"
          >
            <Card
              className="enhanced-stat-card"
              style={{
                background: "#fff",
                border: "1px solid #eef2f7",
                boxShadow: "0 10px 24px #d9d9d9",
              }}
            >
              <div className="stat-card-content">
                <div>
                  <div className="stat-label" style={{ color: "#475569" }}>ผู้ใช้ทั้งหมด</div>
                  <div className="stat-number" style={{ color: "#0f172a" }}>{total.toLocaleString()}</div>
                </div>
                <div className="stat-icon-container" style={{ background: "linear-gradient(135deg, rgb(30,58,138), rgb(59,130,246))" }}>
                  <TeamOutlined className="stat-icon" />
                </div>
              </div>
            </Card>
          </Col>
        )}

        {cards.map((c) => (
          <Col
            key={c.key}
            flex={`1 1 ${COL_MIN_WIDTH}px`}
            style={{ minWidth: COL_MIN_WIDTH }}
            className="stat-col"
          >
            <div style={{ animation: "slideInUp .8s ease-out both", animationDelay: `${c.delay}ms`, width: "100%" }}>
              <Card
                className="enhanced-stat-card"
                style={{
                  background: c.bg,
                  border: "none",
                  boxShadow: "0 12px 32px #d9d9d9",
                }}
              >
                <div className="stat-card-content">
                  <div>
                    <div className="stat-label" style={{ color: c.color }}>{c.label}</div>
                    <div className="stat-number" style={{ color: c.color }}>{c.count.toLocaleString()}</div>
                  </div>
                  {c.icon}
                </div>
              </Card>
            </div>
          </Col>
        ))}
      </Row>
    </>
  );
};
