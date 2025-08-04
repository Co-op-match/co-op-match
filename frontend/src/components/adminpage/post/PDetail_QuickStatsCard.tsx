import React from "react";
import { Card, Row, Col } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";

type QuickStatsCardProps = { post: IntershipPostInterface; };

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({ post }) => {
  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <SafetyCertificateOutlined style={{ color: "#1677ff" }} />
          <span>สถิติด่วน</span>
        </div>
      }
      style={{
        borderRadius: "12px",
        border: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <div
            style={{
              textAlign: "center",
              padding: "1rem",
              background: "#f0f9ff",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1677ff",
              }}
            >
              {post.Applications?.length || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#595959" }}>ใบสมัคร</div>
          </div>
        </Col>
        <Col span={12}>
          <div
            style={{
              textAlign: "center",
              padding: "1rem",
              background: "#f6ffed",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#52c41a",
              }}
            >
              {post.quantity}
            </div>
            <div style={{ fontSize: "12px", color: "#595959" }}>ตำแหน่ง</div>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default QuickStatsCard;