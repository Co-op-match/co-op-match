import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  DatePicker,
  Select,
  Table,
  Space,
  Typography,
  Spin,
  Alert,
  Layout,
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBar,
  LabelList,
} from "recharts";
import dayjs, { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  GetApplicationsByProgram,
  GetApplicationTrend,
  GetCompanyReviewReport,
  GetKPIs,
} from "../../../services/https";
import AdminHeader from "../../Component/AdminCoopMatchHeaderDefault";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// ---------- Types ----------
interface KPIs {
  total_applications: number;
  matching_success_rate: number; // 0..1
  avg_company_review_score: number;
  active_users_7d: number;
}

interface TimeSeriesPoint {
  date: string; // ISO
  value: number;
}
interface ApplicationTrendResp {
  series: TimeSeriesPoint[];
}

interface ProgramStat {
  program_id: number;
  program_name: string;
  count: number;
}
interface ApplicationByProgramResp {
  start: string;
  end: string;
  top_n: number;
  results: ProgramStat[];
}

interface CompanyRatingRow {
  company_id: number;
  company_name: string;
  avg_rating: number;
  reviews: number;
}
interface ReviewDistributionBin {
  stars: number;
  count: number;
}
interface CompanyReviewReport {
  overall_average: number;
  distribution: ReviewDistributionBin[];
  top_companies: CompanyRatingRow[];
}

// ---------- Styles ----------
const adminPageLayoutStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: "24px",
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 248, 255, 1) 25%, rgba(207, 234, 250, 1) 60%, rgba(159, 218, 252, 1) 100%)",
};

const cardStyle: React.CSSProperties = {
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  backdropFilter: "blur(10px)",
  background: "rgba(255, 255, 255, 0.85)",
  height: "100%",
};

const kpiCardStyle: React.CSSProperties = {
  ...cardStyle,
  textAlign: "center" as const,
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
};

// ---------- Component ----------
const AnalysisDashboard: React.FC = () => {
  // States
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [trend, setTrend] = useState<ApplicationTrendResp | null>(null);
  const [appsByProgram, setAppsByProgram] =
    useState<ApplicationByProgramResp | null>(null);
  const [reviewReport, setReviewReport] = useState<CompanyReviewReport | null>(
    null
  );

  const [days, setDays] = useState<number>(30);
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().add(-29, "day"),
    dayjs(),
  ]);
  const [topN, setTopN] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [kpisRes, trendRes, byProgramRes, reviewRes] = await Promise.all([
          GetKPIs(),
          GetApplicationTrend(days),
          GetApplicationsByProgram({
            start: range[0].format("YYYY-MM-DD"),
            end: range[1].format("YYYY-MM-DD"),
            top: topN,
          }),
          GetCompanyReviewReport(),
        ]);

        // ตั้งชื่อเองได้เลย
        setKpis(kpisRes.data);
        setTrend(trendRes.data);
        setAppsByProgram(byProgramRes.data);
        setReviewReport(reviewRes.data);
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [days, range, topN]);

  const trendData = useMemo(
    () => (trend?.series || []).map((s) => ({ date: s.date, value: s.value })),
    [trend]
  );

  const programChartData = useMemo(
    () =>
      (appsByProgram?.results || []).map((r) => ({
        name: r.program_name,
        count: r.count,
      })),
    [appsByProgram]
  );

  const distributionData = useMemo(
    () =>
      (reviewReport?.distribution || []).map((d) => ({
        name: `${d.stars} ดาว`,
        value: d.count,
      })),
    [reviewReport]
  );

  const columns: ColumnsType<CompanyRatingRow> = [
    {
      title: "บริษัท",
      dataIndex: "company_name",
      key: "company_name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "รีวิว",
      dataIndex: "reviews",
      key: "reviews",
      width: 100,
      align: "center" as const,
    },
    {
      title: "เรตติ้งเฉลี่ย",
      dataIndex: "avg_rating",
      key: "avg_rating",
      width: 140,
      align: "center" as const,
      render: (v: number) => (
        <Text strong style={{ color: "#1890ff" }}>
          {v.toFixed(2)}
        </Text>
      ),
    },
  ];

  const pieColors = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];

  const renderCountPercentLabel = (props: {
    name?: string;
    value?: number;
    percent?: number;
    x?: number;
    y?: number;
  }) => {
    const { name, value = 0, percent = 0, x = 0, y = 0 } = props;
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fill="#222"
      >
        {`${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <Layout>
      <AdminHeader />
      <Layout style={adminPageLayoutStyle}>
        <Title
          level={2}
          style={{
            marginBottom: 24,
            color: "#1e40af",
            textAlign: "center",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          📊 ระบบวิเคราะห์และรายงานผล
        </Title>

        {err && (
          <Alert
            type="error"
            message="เกิดข้อผิดพลาด"
            description={err}
            style={{
              marginBottom: 16,
              borderRadius: "8px",
              ...cardStyle,
            }}
            showIcon
          />
        )}

        <Spin spinning={loading}>
          {/* KPIs */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={6}>
              <Card style={kpiCardStyle}>
                <Statistic
                  title={
                    <Text style={{ fontSize: "14px", fontWeight: 500 }}>
                      จำนวนการสมัครทั้งหมด
                    </Text>
                  }
                  value={kpis?.total_applications ?? 0}
                  valueStyle={{
                    color: "#1890ff",
                    fontSize: "28px",
                    fontWeight: "bold",
                  }}
                  prefix="📝"
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card style={kpiCardStyle}>
                <Statistic
                  title={
                    <Text style={{ fontSize: "14px", fontWeight: 500 }}>
                      อัตราการจับคู่สำเร็จ
                    </Text>
                  }
                  value={((kpis?.matching_success_rate ?? 0) * 100).toFixed(2)}
                  suffix="%"
                  valueStyle={{
                    color: "#52c41a",
                    fontSize: "28px",
                    fontWeight: "bold",
                  }}
                  prefix="🎯"
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card style={kpiCardStyle}>
                <Statistic
                  title={
                    <Text style={{ fontSize: "14px", fontWeight: 500 }}>
                      คะแนนรีวิวเฉลี่ยบริษัท
                    </Text>
                  }
                  value={(kpis?.avg_company_review_score ?? 0).toFixed(2)}
                  valueStyle={{
                    color: "#faad14",
                    fontSize: "28px",
                    fontWeight: "bold",
                  }}
                  prefix="⭐"
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card style={kpiCardStyle}>
                <Statistic
                  title={
                    <Text style={{ fontSize: "14px", fontWeight: 500 }}>
                      ผู้ใช้งาน (7 วันล่าสุด)
                    </Text>
                  }
                  value={kpis?.active_users_7d ?? 0}
                  valueStyle={{
                    color: "#722ed1",
                    fontSize: "28px",
                    fontWeight: "bold",
                  }}
                  prefix="👥"
                />
              </Card>
            </Col>
          </Row>

          {/* Trend + controls */}
          <Card style={{ ...cardStyle, marginBottom: 24 }}>
            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: 16 }}
            >
              <Title level={4} style={{ margin: 0, color: "#1e40af" }}>
                📈 แนวโน้มจำนวนการสมัคร
              </Title>
              <Space>
                <Text strong>ช่วงเวลา</Text>
                <Select
                  value={days}
                  onChange={setDays}
                  options={[
                    { label: "7 วัน", value: 7 },
                    { label: "1 เดือน", value: 30 },
                    { label: "3 เดือน", value: 90 },
                    { label: "6 เดือน", value: 180 },
                    { label: "1 ปี", value: 365 },
                  ]}
                  style={{ width: 120, borderRadius: "8px" }}
                />
              </Space>
            </Row>
            <div
              style={{
                width: "100%",
                height: 300,
                background: "rgba(255, 255, 255, 0.5)",
                borderRadius: "8px",
                padding: "8px",
              }}
            >
              <ResponsiveContainer>
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => dayjs(v).format("DD MMM")}
                    minTickGap={12}
                    interval="preserveStartEnd"
                    stroke="#666"
                  />
                  <YAxis allowDecimals={false} stroke="#666" />
                  <Tooltip
                    labelFormatter={(label) =>
                      dayjs(label).format("DD MMM YYYY")
                    }
                    formatter={(value: number) => [value, "จำนวน"]} 
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    dot={false}
                    stroke="#1890ff"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Applications by Program */}
          <Card style={{ ...cardStyle, marginBottom: 24 }}>
            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: 16 }}
            >
              <Title level={4} style={{ margin: 0, color: "#1e40af" }}>
                🎓 จำนวนการสมัครตามสาขา/หลักสูตร
              </Title>
              <Space>
                <Text strong>ช่วงวันที่</Text>
                <RangePicker
                  value={range}
                  onChange={(v) => v && setRange(v as [Dayjs, Dayjs])}
                  allowClear={false}
                  format="YYYY-MM-DD"
                  style={{ borderRadius: "8px" }}
                />
                <Text strong>Top</Text>
                <Select
                  value={topN}
                  onChange={setTopN}
                  options={[5, 10, 15, 20].map((v) => ({ label: v, value: v }))}
                  style={{ width: 90, borderRadius: "8px" }}
                />
              </Space>
            </Row>
            <div
              style={{
                width: "100%",
                height: 320,
                background: "rgba(255, 255, 255, 0.5)",
                borderRadius: "8px",
                padding: "8px",
              }}
            >
              <ResponsiveContainer>
                <BarChart data={programChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                    stroke="#666"
                  />
                  <YAxis allowDecimals={false} stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Bar dataKey="count" fill="#1890ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Review report */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={10}>
              <Card style={cardStyle}>
                <Title level={4} style={{ marginBottom: 16, color: "#1e40af" }}>
                  📊 สรุปผลการประเมินจากบริษัท
                </Title>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: 16,
                    padding: "12px",
                    background:
                      "linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(82, 196, 26, 0.1) 100%)",
                    borderRadius: "8px",
                  }}
                >
                  <Text style={{ fontSize: "16px" }}>
                    คะแนนเฉลี่ยรวม:{" "}
                    <Text strong style={{ fontSize: "20px", color: "#1890ff" }}>
                      {reviewReport &&
                      typeof reviewReport.overall_average === "number"
                        ? reviewReport.overall_average.toFixed(2)
                        : "-"}
                    </Text>
                  </Text>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 260,
                    background: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                >
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={distributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        labelLine={false}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          index,
                        }) => {
                          const RAD = Math.PI / 180;
                          const r =
                            innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + r * Math.cos(-midAngle! * RAD);
                          const y = cy + r * Math.sin(-midAngle! * RAD);
                          const text = distributionData[index!].value; // ใช้จำนวนจริง
                          return (
                            <text
                              x={x}
                              y={y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize={12}
                              fill="#fff"
                            >
                              {text}
                            </text>
                          );
                        }}
                      >
                        {distributionData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={pieColors[idx % pieColors.length]}
                          />
                        ))}
                      </Pie>

                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: "10px" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={14}>
              <Card style={cardStyle}>
                <Title level={4} style={{ marginBottom: 16, color: "#1e40af" }}>
                  🏆 บริษัทคะแนนสูงสุด (เฉลี่ย)
                </Title>
                <Table
                  size="small"
                  rowKey="company_id"
                  columns={columns}
                  dataSource={reviewReport?.top_companies || []}
                  pagination={{
                    pageSize: 5,
                    showSizeChanger: false,
                    style: { marginTop: "16px" },
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "8px",
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      </Layout>
    </Layout>
  );
};

export default AnalysisDashboard;
