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
};

type Props = {
  statusList: StatusPostInterface[];
  totalPosts: number;
  pendingPosts: number;
  approvedPosts: number;
  rejectedPosts: number;
  showTotalCard?: boolean;
};

const icon24 = (node: React.ReactNode) => <span style={{ fontSize: 24 }}>{node}</span>;

const getStatusCardProps = (
  statusTh: string,
  cnt: { total: number; pending: number; approved: number; rejected: number }
): StatusCardProps => {
  const MAP: Record<string, StatusCardProps> = {
    "เปิดรับสมัคร": { bg: "#f6ffed", border: "1px solid #b7eb8f", color: "#389e0d", icon: icon24(<CheckCircleOutlined style={{ color: "#389e0d" }} />), count: cnt.approved, label: "อนุมัติแล้ว" },
    "ปิดรับสมัคร": { bg: "#fff1f0", border: "1px solid #ffa39e", color: "#cf1322", icon: icon24(<CloseOutlined style={{ color: "#cf1322" }} />), count: cnt.rejected, label: "ปฏิเสธแล้ว" },
    "รอตรวจสอบ": { bg: "#fffbe6", border: "1px solid #ffe58f", color: "#d48806", icon: icon24(<ClockCircleOutlined style={{ color: "#d48806" }} />), count: cnt.pending, label: "รอตรวจสอบ" },
  };
  return MAP[statusTh] ?? { bg: "#e6f7ff", border: "1px solid #91d5ff", color: "#1677ff", icon: icon24(<FileTextOutlined style={{ color: "#1677ff" }} />), count: cnt.total, label: "โพสต์ทั้งหมด" };
};

const cardBox = (bg: string, border: string) => ({ backgroundColor: bg, border, borderRadius: 12 } as const);
const numText = (color: string) => ({ fontSize: 28, fontWeight: 700, color } as const);

const Post_StatCard: React.FC<Props> = ({ statusList, totalPosts, pendingPosts, approvedPosts, rejectedPosts, showTotalCard = true }) => {
  const counts = useMemo(() => ({ total: totalPosts, pending: pendingPosts, approved: approvedPosts, rejected: rejectedPosts }), [totalPosts, pendingPosts, approvedPosts, rejectedPosts]);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {showTotalCard && (
        <Col xs={24} sm={12} md={6} key="__all__">
          <Card style={cardBox("#e6f7ff", "1px solid #91d5ff")}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={numText("#1677ff")}>{totalPosts}</div>
                <div style={{ fontSize: 14, color: "#333" }}>โพสต์ทั้งหมด</div>
              </div>
              {icon24(<FileTextOutlined style={{ color: "#1677ff" }} />)}
            </div>
          </Card>
        </Col>
      )}

      {statusList?.map((s) => {
        const nameTH = s.status_post_th || "";
        const p = getStatusCardProps(nameTH, counts);
        return (
          <Col xs={24} sm={12} md={6} key={nameTH || Math.random()}>
            <Card style={cardBox(p.bg, p.border)}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={numText(p.color)}>{p.count}</div>
                  <div style={{ fontSize: 14, color: "#333" }}>{p.label}</div>
                </div>
                {p.icon}
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default Post_StatCard;