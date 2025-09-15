import React, { useMemo } from "react";
import { Row, Col, Card } from "antd";
import { TeamOutlined, CheckCircleOutlined, CloseCircleOutlined, LoginOutlined } from "@ant-design/icons";

type Props = {
  total: number;
  online: number;
  offline: number;
  loginsToday: number;
  showTotalCard?: boolean;
};

const iconBox = (node: React.ReactNode, bg: string) => (
  <div className="stat-icon-container" style={{ background: bg }}>
    <span className="stat-icon">{node}</span>
  </div>
);

const User_StatCard: React.FC<Props> = ({ total, online, offline, loginsToday, showTotalCard = true }) => {
  const cards = useMemo(
    () => [
      {
        key: "online",
        bg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        color: "#0c7b5c",
        shadow: "rgba(16,185,129,0.2)",
        icon: iconBox(<CheckCircleOutlined />, "linear-gradient(135deg, #10b981 0%, #059669 100%)"),
        label: "ออนไลน์",
        count: online,
        delay: 0,
      },
      {
        key: "offline",
        bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
        color: "#dc2626",
        shadow: "rgba(239,68,68,0.2)",
        icon: iconBox(<CloseCircleOutlined />, "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"),
        label: "ออฟไลน์",
        count: offline,
        delay: 120,
      },
      {
        key: "login_today",
        bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        color: "#d97706",
        shadow: "rgba(245,158,11,0.2)",
        icon: iconBox(<LoginOutlined />, "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"),
        label: "เข้าสู่ระบบวันนี้",
        count: loginsToday,
        delay: 240,
      },
    ],
    [online, offline, loginsToday]
  );

  return (
    <>
      <style>{enhancedCardStyles}</style>
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        {showTotalCard && (
          <Col xs={24} sm={12} md={6} className="stat-col" key="__total__">
            <div className="animate-fadeInUp" style={{ animationDelay: "0ms", width: "100%" }}>
              <Card
                className="enhanced-stat-card total-stat-card"
                style={{ background: "#fff", width: "100%", border: "1px solid #eef2f7", boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)" }}
              >
                <div className="stat-card-content">
                  <div>
                    <div className="stat-label" style={{ color: "#475569" }}>ผู้ใช้ทั้งหมด</div>
                    <div className="stat-number" style={{ color: "#0f172a" }}>{total.toLocaleString()}</div>
                  </div>
                  <div className="stat-icon-container" style={{ background: "linear-gradient(135deg, rgb(30,58,138) 0%, rgb(59,130,246) 100%)" }}>
                    <TeamOutlined className="stat-icon" />
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        )}

        {cards.map((c) => (
          <Col key={c.key} xs={24} sm={12} md={6} className="stat-col">
            <div className="animate-fadeInUp" style={{ animationDelay: `${c.delay}ms`, width: "100%" }}>
              <Card className="enhanced-stat-card" style={{ background: c.bg, boxShadow: `0 12px 32px ${c.shadow}`, border: "none" }}>
                <div className="stat-card-content">
                  <div>
                    <div className="stat-label">{c.label}</div>
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

export default User_StatCard;

/* same animation & style system used in Post_StatCard */
const enhancedCardStyles = `
  @keyframes countUp { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes slideInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

  .animate-fadeInUp { animation: slideInUp .6s ease-out both; }
  .enhanced-stat-card{ border-radius:14px; border:none; position:relative; overflow:hidden; cursor:pointer; }
  .enhanced-stat-card::before{ content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent); transition:left .6s; }
  .enhanced-stat-card:hover::before{ left:100%; }

  .stat-card-content{ display:flex; align-items:center; justify-content:space-between; gap:24px; padding:20px 28px; height:100%; width:100%; position:relative; z-index:1; }
  @media (min-width: 992px) { .stat-card-content { gap: 28px; padding: 24px 32px; } }

  .stat-number{ font-size:36px; font-weight:800; line-height:1; margin-bottom:8px; animation:countUp .8s ease-out .3s both; background:linear-gradient(135deg,currentColor 0%,currentColor 100%); -webkit-background-clip:text; background-clip:text; }
  .stat-label{ font-size:15px; font-weight:600; color:#4a5568; margin:0; }

  .stat-icon-container{ width:56px; height:56px; padding:0; border-radius:12px; display:flex; align-items:center; justify-content:center; flex:0 0 auto; }
  .stat-icon{ font-size:24px; color:white; }

  .stat-col{ display:flex; } .stat-col .ant-card{ flex:1 1 auto; height:100%; }
  .enhanced-stat-card, .total-stat-card{ min-height:140px; }
  @media (max-width:576px){ .enhanced-stat-card, .total-stat-card{ min-height:128px; } }
  .enhanced-stat-card .ant-card-body, .total-stat-card .ant-card-body{ height:100%; display:flex; padding:16px; }
`;