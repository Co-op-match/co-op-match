import React, { useMemo } from "react";
import { Card, Row, Col } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";

type Props = { post: IntershipPostInterface };

const fmt = (n: unknown) =>
  Number.isFinite(Number(n)) ? Number(n as number).toLocaleString() : "0";

const QuickStatsCard: React.FC<Props> = ({ post }) => {
  const apps = useMemo(() => post?.Applications ?? [], [post]);
  const quantity = useMemo(() => post?.quantity ?? 0, [post]);

  const cards = useMemo(
    () => [
      {
        label: "ใบสมัคร",
        value: fmt(apps.length),
        bg: "#f0f9ff",
        color: "#1677ff",
      },
      {
        label: "ตำแหน่ง",
        value: fmt(quantity),
        bg: "#f6ffed",
        color: "#52c41a",
      },
    ],
    [apps.length, quantity]
  );

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SafetyCertificateOutlined style={{ color: "#1677ff" }} />
          <span>สถิติด่วน</span>
        </div>
      }
      style={{
        borderRadius: 12,
        border: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
      bodyStyle={{ paddingTop: 12 }}
    >
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col span={12} key={c.label}>
            <div
              role="group"
              aria-label={c.label}
              style={{
                textAlign: "center",
                padding: "1rem",
                background: c.bg,
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>
                {c.value}
              </div>
              <div style={{ fontSize: 12, color: "#595959" }}>{c.label}</div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default QuickStatsCard;