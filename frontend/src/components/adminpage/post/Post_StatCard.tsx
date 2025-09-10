import React, { useMemo } from "react";
import { Row, Col, Card } from "antd";
import { FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseOutlined } from "@ant-design/icons";
import type { StatusPostInterface } from "../../../interface/IStatusPost";

type StatusCardProps = {
  bg: string;
  border: string;
  color: string;
  icon: React.ReactNode;
  count: number;
  label: string;
  gradient: string;
  shadowColor: string;
};

type Props = {
  statusList: StatusPostInterface[];
  totalPosts: number;
  pendingPosts: number;
  approvedPosts: number;
  rejectedPosts: number;
  showTotalCard?: boolean;
};

const icon32 = (node: React.ReactNode, bgGradient: string) => (
  <div 
    className="stat-icon-container"
    style={{ background: bgGradient }}
  >
    <span className="stat-icon">{node}</span>
  </div>
);

const getStatusCardProps = (
  statusTh: string,
  cnt: { total: number; pending: number; approved: number; rejected: number }
): StatusCardProps => {
  const MAP: Record<string, StatusCardProps> = {
    "เปิดรับสมัคร": { 
      bg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", 
      border: "none", 
      color: "#0c7b5c", 
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      shadowColor: "rgba(16, 185, 129, 0.2)",
      icon: icon32(<CheckCircleOutlined />, "linear-gradient(135deg, #10b981 0%, #059669 100%)"), 
      count: cnt.approved, 
      label: "อนุมัติแล้ว" 
    },
    "ปิดรับสมัคร": { 
      bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)", 
      border: "none", 
      color: "#dc2626", 
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      shadowColor: "rgba(239, 68, 68, 0.2)",
      icon: icon32(<CloseOutlined />, "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"), 
      count: cnt.rejected, 
      label: "ปฏิเสธแล้ว" 
    },
    "รอตรวจสอบ": { 
      bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", 
      border: "none", 
      color: "#d97706", 
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      shadowColor: "rgba(245, 158, 11, 0.2)",
      icon: icon32(<ClockCircleOutlined />, "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"), 
      count: cnt.pending, 
      label: "รอตรวจสอบ" 
    },
  };
  return MAP[statusTh] ?? { 
    bg: "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1)", 
    border: "none", 
    color: "white", 
    gradient: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
    shadowColor: "rgba(59, 130, 246, 0.3)",
    icon: icon32(<FileTextOutlined />, "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)"), 
    count: cnt.total, 
    label: "โพสต์ทั้งหมด" 
  };
};

const Post_StatCard: React.FC<Props> = ({ statusList, totalPosts, pendingPosts, approvedPosts, rejectedPosts, showTotalCard = true }) => {
  const counts = useMemo(() => ({ total: totalPosts, pending: pendingPosts, approved: approvedPosts, rejected: rejectedPosts }), [totalPosts, pendingPosts, approvedPosts, rejectedPosts]);

  return (
    <>
      <style>{enhancedCardStyles}</style>
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        {showTotalCard && (
          <Col xs={24} sm={12} md={6} key="__all__">
            <Card
              className="enhanced-stat-card total-stat-card"
              style={{
                background: "#fff",
                border: "1px solid #eef2f7",
                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
              }}
            >
              <div className="stat-card-content">
                <div>
                  <div className="stat-number" style={{ color: "#0f172a" }}>
                    {totalPosts.toLocaleString()}
                  </div>
                  <div className="stat-label" style={{ color: "#475569" }}>
                    โพสต์ทั้งหมด
                  </div>
                </div>
                <div
                  className="stat-icon-container"
                  style={{ background: "linear-gradient(135deg, rgb(30,58,138) 0%, rgb(59,130,246) 100%)" }}
                >
                  <FileTextOutlined className="stat-icon" />
                </div>
              </div>
            </Card>
          </Col>
        )}

        {statusList?.map((s) => {
          const nameTH = s.status_post_th || "";
          const p = getStatusCardProps(nameTH, counts);
          return (
            <Col xs={24} sm={12} md={6} key={nameTH || Math.random()}>
              <Card 
                className="enhanced-stat-card"
                style={{ 
                  background: p.bg,
                  boxShadow: `0 12px 32px ${p.shadowColor}`,
                  border: p.border,
                  "--gradient": p.gradient
                } as React.CSSProperties & { "--gradient": string }}
              >
                <div className="stat-card-content">
                  <div>
                    <div className="stat-number" style={{ color: p.color }}>
                      {p.count.toLocaleString()}
                    </div>
                    <div className="stat-label">
                      {p.label}
                    </div>
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

export default Post_StatCard;

// Enhanced styles with gradient and animations
const enhancedCardStyles = `
  @keyframes countUp {
    from {
      transform: scale(0.5);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes slideInUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .enhanced-stat-card {
    border-radius: 14px;
    border: none;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
    
  .enhanced-stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.6s;
  }

  .enhanced-stat-card:hover::before {
    left: 100%;
  }

  .stat-card-content {
    padding: 16px;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .stat-number {
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 8px;
    animation: countUp 0.8s ease-out 0.3s both;
    background: linear-gradient(135deg, currentColor 0%, currentColor 100%);
    background-clip: text;
    -webkit-background-clip: text;
  }

  .stat-label {
    font-size: 15px;
    font-weight: 600;
    color: #4a5568;
    margin: 0;
  }

  .stat-icon-container {
    padding: 12px;
    border-radius: 12px;
    position: relative;
    animation: pulse 2s infinite;
  }

  .stat-icon {
    font-size: 24px;
    color: white;
  }

  /* Gradient borders */
  .gradient-border {
    position: relative;
    background: white;
  }

  .gradient-border::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 20px;
    padding: 3px;
    background: var(--gradient);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask-composite: xor;
    z-index: -1;
  }
`;