import React from "react";
import { Card, Col, Row, Space, Statistic } from "antd";
import { UserOutlined } from "@ant-design/icons";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
} from "recharts";
import type { InterviewStatsInterface } from "../../../interfaces/Analysis";

type Props = {
  loading?: boolean;
  interview: InterviewStatsInterface | null;
};

const ceilDay = (v?: number | null) => {
  const x = typeof v === "number" ? v : 0;
  return x > 0 ? Math.ceil(x) : 0;
};

const InterviewStatsCard: React.FC<Props> = ({ loading = false, interview }) => {
  const scheduled = interview?.scheduled ?? 0;
  const noShow = interview?.no_show ?? 0;
  const noShowRate =
    scheduled > 0 ? `${Math.round((noShow / scheduled) * 100)}%` : "0%";

  return (
    <Card
      loading={loading}
      className="chart-card"
      title={
        <Space>
          <UserOutlined /> <span>สถิติการสัมภาษณ์</span>
        </Space>
      }
    >
      <Space size={20} direction="vertical" style={{ width: "100%", padding: "0 8px" }}>
        <Row gutter={16}>
          <Col span={12}>
            <div
              style={{
                background: "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #d9f7be",
                textAlign: "center",
              }}
            >
              <Statistic
                title="นัดสัมภาษณ์"
                value={scheduled}
                valueStyle={{ color: "#52c41a", fontWeight: 600 }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div
              style={{
                background: "linear-gradient(135deg, #fff2f0 0%, #ffffff 100%)",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #ffccc7",
                textAlign: "center",
              }}
            >
              <Statistic
                title="อัตราไม่มาร่วม"
                value={noShowRate}
                valueStyle={{ color: "#ff4d4f", fontWeight: 600 }}
              />
            </div>
          </Col>
        </Row>

        <div
          style={{
            height: 200,
            background: "rgba(255,255,255,0.8)",
            borderRadius: 12,
            padding: 8,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={interview?.mode || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mode" tick={{ fontSize: 11 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <RTooltip
                contentStyle={{
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid #d9d9d9",
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Bar dataKey="count" name="จำนวนสัมภาษณ์" fill="#1677ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <div
              style={{
                background: "linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%)",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #bae0ff",
                textAlign: "center",
              }}
            >
              <Statistic
                title="เฉลี่ย สมัคร→นัด"
                value={ceilDay(interview?.avg_days_submit_to_schedule)}
                suffix="วัน"
                valueStyle={{ color: "#1677ff", fontWeight: 600 }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div
              style={{
                background: "linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #efdbff",
                textAlign: "center",
              }}
            >
              <Statistic
                title="เฉลี่ย นัด→สรุปผล"
                value={ceilDay(interview?.avg_days_schedule_to_decision)}
                suffix="วัน"
                valueStyle={{ color: "#722ed1", fontWeight: 600 }}
              />
            </div>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

export default InterviewStatsCard;