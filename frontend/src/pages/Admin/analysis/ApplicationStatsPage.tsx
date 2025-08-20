import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Tag, Table, message } from "antd";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type AppPoint = {
  month: string;
  applications: number;
  interviews: number;
  approved: number;
};

type LocationState = {
  applicationData?: AppPoint[];
};

const ApplicationStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  // รับ data จาก AdminDashboard ผ่าน navigate state
  const applicationData: AppPoint[] = useMemo(() => {
    if (Array.isArray(state.applicationData)) return state.applicationData;
    // ถ้าไม่มี state ให้ fallback เป็น array ว่าง (หรือจะใส่ default sample data ไว้ก็ได้)
    return [];
  }, [state.applicationData]);

  const exportToCSV = () => {
    if (!applicationData || applicationData.length === 0) {
      message.warning("ยังไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const headers = ["เดือน", "การสมัคร", "การสัมภาษณ์", "ผ่านการคัดเลือก"];
    const rows = applicationData.map((r) => [
      r.month,
      r.applications,
      r.interviews,
      r.approved,
    ]);

    const csv = [headers, ...rows]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "applications_monthly_stats.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 16 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            ย้อนกลับ
          </Button>
        </Col>
        <Col>
          <Button icon={<DownloadOutlined />} onClick={exportToCSV}>
            Export CSV
          </Button>
        </Col>
      </Row>

      <Card
        title="รายละเอียดการสมัครงานรายเดือน"
        className="adminpage-dashboard-chart-card"
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={applicationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="applications"
              stroke="#1890ff"
              name="การสมัคร"
            />
            <Line
              type="monotone"
              dataKey="interviews"
              stroke="#52c41a"
              name="การสัมภาษณ์"
            />
            <Line
              type="monotone"
              dataKey="approved"
              stroke="#722ed1"
              name="ผ่านการคัดเลือก"
            />
          </LineChart>
        </ResponsiveContainer>

        <div style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col>
              <Tag color="#1890ff">🟦 การสมัคร</Tag>
            </Col>
            <Col>
              <Tag color="#52c41a">🟩 การสัมภาษณ์</Tag>
            </Col>
            <Col>
              <Tag color="#722ed1">🟪 ผ่านการคัดเลือก</Tag>
            </Col>
          </Row>
        </div>

        <Table
          style={{ marginTop: 16 }}
          size="small"
          pagination={false}
          dataSource={applicationData.map((item, idx) => ({ key: idx, ...item }))}
          columns={[
            { title: "เดือน", dataIndex: "month", key: "month" },
            { title: "การสมัคร", dataIndex: "applications", key: "applications" },
            { title: "การสัมภาษณ์", dataIndex: "interviews", key: "interviews" },
            { title: "ผ่านการคัดเลือก", dataIndex: "approved", key: "approved" },
          ]}
        />
      </Card>
    </div>
  );
};

export default ApplicationStatsPage;