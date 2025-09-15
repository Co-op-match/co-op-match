import React, { useMemo } from "react";
import { Row, Col, Card } from "antd";
import { FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseOutlined } from "@ant-design/icons";

type Props = {
  notSubmitted: number;
  pending: number;
  approved: number;
  rejected: number;
};

const iconBox = (node: React.ReactNode, bg: string) => (
  <div className="stat-icon-container" style={{ background: bg }}>
    <span className="stat-icon">{node}</span>
  </div>
);

const Verify_StatCard: React.FC<Props> = ({ notSubmitted, pending, approved, rejected }) => {
  const cards = useMemo(
    () => [
      {
        key: "approved",
        bg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        color: "#0c7b5c",
        shadow: "rgba(16,185,129,0.2)",
        icon: iconBox(<CheckCircleOutlined />, "linear-gradient(135deg, #10b981 0%, #059669 100%)"),
        label: "รับรองแล้ว",
        count: approved,
        delay: 0,
      },
      {
        key: "pending",
        bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        color: "#d97706",
        shadow: "rgba(245,158,11,0.2)",
        icon: iconBox(<ClockCircleOutlined />, "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"),
        label: "รอรับรอง",
        count: pending,
        delay: 100,
      },
      {
        key: "rejected",
        bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
        color: "#dc2626",
        shadow: "rgba(239,68,68,0.2)",
        icon: iconBox(<CloseOutlined />, "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"),
        label: "ปฏิเสธ",
        count: rejected,
        delay: 200,
      },
      {
        key: "not_submitted",
        bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
        color: "#6d28d9",
        shadow: "rgba(109,40,217,0.2)",
        icon: iconBox(<FileTextOutlined />, "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"),
        label: "ยังไม่ได้ส่งคำขอ",
        count: notSubmitted,
        delay: 300,
      },
    ],
    [approved, pending, rejected, notSubmitted]
  );

  return (
    <>
      <style>{styles}</style>
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        {cards.map((c) => (
          <Col key={c.key} xs={24} sm={12} md={6} className="stat-col">
            {/* ใช้ slideInUp + delay แบบเดียวกับ Post_StatCard */}
            <div style={{ animation: "slideInUp 0.8s ease-out both", animationDelay: `${c.delay}ms`, width: "100%" }}>
              <Card
                className="enhanced-stat-card"
                style={{ background: c.bg, boxShadow: `0 12px 32px ${c.shadow}`, border: "none" }}
              >
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

export default Verify_StatCard;

/* === styles เหมือน Post_StatCard (slideInUp / countUp / shimmer) === */
const styles = `
  @keyframes countUp {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }
  @keyframes slideInUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .enhanced-stat-card { border-radius: 14px; border: none; position: relative; overflow: hidden; cursor: pointer; }
  .enhanced-stat-card::before {
    content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: left 0.6s;
  }
  .enhanced-stat-card:hover::before { left: 100%; }

  .stat-card-content {
    display: flex; align-items: center; justify-content: space-between;
    gap: 24px; padding: 20px 28px; height: 100%; width: 100%; position: relative; z-index: 1;
  }
  @media (min-width: 992px) { .stat-card-content { gap: 28px; padding: 24px 32px; } }

  .stat-number {
    font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 8px;
    animation: countUp 0.8s ease-out 0.3s both;
    background: linear-gradient(135deg, currentColor 0%, currentColor 100%);
    -webkit-background-clip: text; background-clip: text;
  }
  .stat-label { font-size: 15px; font-weight: 600; color: #4a5568; margin: 0; }

  .stat-icon-container{
    width: 56px; height: 56px; padding: 0; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
  }
  .stat-icon { font-size: 24px; color: white; }

  .stat-col { display: flex; }
  .stat-col .ant-card { flex: 1 1 auto; height: 100%; }

  .enhanced-stat-card, .total-stat-card { min-height: 140px; }
  @media (max-width: 576px) {
    .enhanced-stat-card, .total-stat-card { min-height: 128px; }
  }
  .enhanced-stat-card .ant-card-body, .total-stat-card .ant-card-body {
    height: 100%; display: flex; padding: 16px;
  }
`;