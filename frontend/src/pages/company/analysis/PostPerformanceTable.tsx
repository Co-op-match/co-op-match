import React from "react";
import { Card, Table, Tag, Typography, Space, Button } from "antd";
import { BarChartOutlined, DownloadOutlined } from "@ant-design/icons";
import type { PostPerfRowInterface } from "../../../interfaces/Analysis";

const { Text } = Typography;

type Props = {
  loading?: boolean;
  data: PostPerfRowInterface[];
  onExport?: () => void;
  height?: number; // เผื่ออนาคต
};

// ยก util มารวมใน component ให้จบในตัว (จะไม่ชนกับของหน้าใหญ่)
const ceilDay = (v?: number | null) => {
  const x = typeof v === "number" ? v : 0;
  return x > 0 ? Math.ceil(x) : 0;
};

const PostPerformanceTable: React.FC<Props> = ({
  loading = false,
  data,
  onExport,
}) => {
  return (
    <Card
      loading={loading}
      className="chart-card"
      title={
        <Space>
          <BarChartOutlined /> <span>ประสิทธิภาพการโพสต์</span>
        </Space>
      }
      extra={
        onExport ? (
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={onExport}
            style={{ borderRadius: 8 }}
          >
            Export
          </Button>
        ) : null
      }
    >
      <Table<PostPerfRowInterface>
        size="middle"
        dataSource={data}
        pagination={{ pageSize: 5, showSizeChanger: false }}
        rowKey={(r) => String(r.post_id)}
        scroll={{ x: 800 }}
        columns={[
          {
            title: "โพสต์",
            dataIndex: "post_name",
            key: "post_name",
            render: (text) => (
              <span style={{ color: "#1677ff", fontWeight: 600 }}>{text}</span>
            ),
          },
          {
            title: "จำนวนสมัคร",
            dataIndex: "applications",
            key: "applications",
            sorter: (a, b) => (a.applications ?? 0) - (b.applications ?? 0),
            render: (v) => (
              <Tag color="blue" className="custom-tag">
                {v ?? 0}
              </Tag>
            ),
          },
          {
            title: "ผ่าน",
            dataIndex: "passed",
            key: "passed",
            sorter: (a, b) => (a.passed ?? 0) - (b.passed ?? 0),
            render: (v) => (
              <Tag color="gold" className="custom-tag">
                {v ?? 0}
              </Tag>
            ),
          },
          {
            title: "เฉลี่ย (วัน)",
            dataIndex: "avg_time_to_decision_days",
            key: "ttd",
            render: (v: number | null | undefined) =>
              typeof v === "number" ? (
                <Text style={{ fontWeight: 500 }}>{ceilDay(v)}</Text>
              ) : (
                <Text type="secondary">—</Text>
              ),
          },
          {
            title: "GPA (เฉลี่ย/ต่ำสุด)",
            key: "gpa",
            render: (_, r) => (
              <Space direction="vertical" size={2}>
                <Text style={{ fontSize: 12, color: "#52c41a" }}>
                  เฉลี่ย: {(r.avg_gpa ?? 0).toFixed(2)}
                </Text>
                <Text style={{ fontSize: 12, color: "#fa8c16" }}>
                  ต่ำสุด: {(r.min_gpa ?? 0).toFixed(2)}
                </Text>
              </Space>
            ),
          },
          {
            title: "รูปแบบงาน",
            dataIndex: "work_mode",
            key: "work_mode",
            render: (t: string | null | undefined) => (
              <Tag color="purple" className="custom-tag">
                {t || "ไม่ระบุ"}
              </Tag>
            ),
          },
        ]}
      />
    </Card>
  );
};

export default PostPerformanceTable;
