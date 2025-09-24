import React from "react";
import { Card, Space, Typography } from "antd";
import { FunnelPlotOutlined } from "@ant-design/icons";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, LabelList, Cell } from "recharts";
import type { PipelineBucketInterface } from "../../../interfaces/Analysis";
const { Title } = Typography;

type Props = {
  loading?: boolean;
  data: PipelineBucketInterface[]; // [{ name: string, value: number }]
  height?: number;
};

const PipelineHorizontalBar: React.FC<Props> = ({
  loading = false,
  data,
  height = 320,
}) => {
  // โทนฟ้า ไล่เฉด
  const colors = ["#1890ff", "#40a9ff", "#69c0ff", "#91d5ff", "#bae7ff", "#e6f7ff"];

  // Tooltip โทนฟ้า
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as PipelineBucketInterface;
      return (
        <div
          style={{
            background: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
            borderRadius: 8,
            padding: "8px 12px",
            color: "white",
            boxShadow: "0 4px 16px rgba(24,144,255,.2)",
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.name}</div>
          <div>จำนวน: <strong>{d.value?.toLocaleString("th-TH")}</strong> คน</div>
        </div>
      );
    }
    return null;
  };

  // label ปลายแท่ง: แสดงค่าแบบชัด ๆ
  const ValueLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value == null) return null;
    const textX = x + width + 8; // ชิดปลายแท่ง
    const textY = y + 12;        // กึ่งกลาง bar (barHeight ~ 24)
    return (
      <text x={textX} y={textY} fill="#1890ff" fontSize={12} fontWeight={600}>
        {Number(value).toLocaleString("th-TH")}
      </text>
    );
  };

  return (
    <Card
      loading={loading}
      className="chart-card"
      styles={{
        body: { padding: "12px 16px" }, // body บาง ๆ
        header: { borderBottom: "1px solid #f0f0f0", padding: "12px 16px" },
      }}
      title={
        <Space size={8}>
          <div className="icon-circle">
            <FunnelPlotOutlined className="inner-icon" />
          </div>
          <Title level={4} className="section-title" style={{ marginBottom: "0px" }}>
            สถานะการสมัครงาน
          </Title>
        </Space>
      }
      bodyStyle={{ padding: "12px 16px 16px 16px" }}
    >
      <div
        style={{
          height: height - 80,
          padding: "8px 0",
          borderRadius: 8,
          margin: "0 -8px",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 24, bottom: 8, left: 16 }}
            barCategoryGap={10}
          >
            <CartesianGrid horizontal={false} stroke="#f0f5ff" />
            {/* แกน Y เป็นชื่อสถานะ */}
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 12, fill: "#1f1f1f" }}
              axisLine={false}
              tickLine={false}
            />
            {/* แกน X เป็นตัวเลข */}
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#8c8c8c" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => Number(v).toLocaleString("th-TH")}
              allowDecimals={false}
            />
            <RTooltip content={<CustomTooltip />} />

            {/* ไล่เฉดต่อแท่งด้วย linearGradient แยก id */}
            <defs>
              {data.map((_, i) => (
                <linearGradient
                  key={`g-${i}`}
                  id={`bar-g-${i}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop
                    offset="0%"
                    stopColor={colors[i % colors.length]}
                    stopOpacity={0.85}
                  />
                  <stop
                    offset="100%"
                    stopColor={colors[i % colors.length]}
                    stopOpacity={0.45}
                  />
                </linearGradient>
              ))}
            </defs>

            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
              barSize={24}
              isAnimationActive
              animationDuration={900}
            >
              {data.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={`url(#bar-g-${i})`}
                  style={{ filter: "drop-shadow(0 1px 4px rgba(24,144,255,.15))" }}
                />
              ))}
              <LabelList dataKey="value" content={<ValueLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default PipelineHorizontalBar;