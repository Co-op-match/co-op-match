import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  DatePicker,
  Space,
  Button,
  Tag,
  Table,
  Divider,
  ConfigProvider,
  message,
  Layout,
  Progress,
} from "antd";
import {
  DownloadOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FunnelPlotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  UserOutlined,
  CalendarOutlined,
  StarOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import type {
  InterviewStats,
  Overview,
  PipelineBucket,
  PostPerfRow,
} from "../../../interfaces/Analysis";
import {
  GetApplicationsByCompanyID,
  GetCompanyByUserID,
} from "../../../services/https/Application";
import { GetPostByCompanyId } from "../../../services/https/post";
import {
  getInterviewStats,
  getOverview,
  getPipeline,
  getPostPerf,
  getTrend,
} from "../../../services/https";
import CompanyHeader from "../../Component/CompanyHeader";

dayjs.extend(isBetween);

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

// Custom styles
const customStyles = `
  .adminpage-layout {
    display: flex;
    flex-direction: column;
    padding: 24px;
    min-height: 100vh;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 1) 0%,
      rgba(240, 248, 255, 1) 25%,
      rgba(207, 234, 250, 1) 60%,
      rgba(159, 218, 252, 1) 100%
    );
  }

  .gradient-card {
    background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%);
    border: 1px solid #e6f4ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.08);
    border-radius: 12px;
  }

  .gradient-card:hover {
    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.12);
    transform: translateY(-2px);
    transition: all 0.3s ease;
  }

  .kpi-card {
    background: linear-gradient(135deg, #ffffff 0%, #f6ffed 100%);
    border: 1px solid #d9f7be;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(82, 196, 26, 0.06);
  }

  .kpi-card.success {
    background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
    border-color: #b7eb8f;
  }

  .kpi-card.warning {
    background: linear-gradient(135deg, #fffbe6 0%, #ffffff 100%);
    border-color: #ffe58f;
  }

  .kpi-card.danger {
    background: linear-gradient(135deg, #fff2f0 0%, #ffffff 100%);
    border-color: #ffccc7;
  }

  .kpi-card.info {
    background: linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%);
    border-color: #bae0ff;
  }

  .chart-card {
    background: linear-gradient(135deg, #ffffff 0%, #f9f9ff 100%);
    border: 1px solid #e6f4ff;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(24, 144, 255, 0.08);
    overflow: hidden;
  }

  .chart-card .ant-card-head {
    background: linear-gradient(90deg, #1677ff 0%, #69b7ff 100%);
    border-bottom: none;
  }

  .chart-card .ant-card-head-title {
    color: white;
    font-weight: 600;
  }

  .chart-card .ant-card-extra {
    color: white;
  }

  .filter-card {
    background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%);
    border: 1px solid #d6e4ff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.04);
  }

  .header-title {
    background: linear-gradient(90deg, #1677ff 0%, #722ed1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
    margin-bottom: 24px !important;
  }

  .section-title {
    color: #1677ff;
    font-weight: 600;
    margin-bottom: 16px !important;
  }

  .custom-tag {
    border-radius: 8px;
    font-weight: 500;
    padding: 4px 12px;
  }

  .progress-card {
    background: linear-gradient(135deg, #ffffff 0%, #f9f0ff 100%);
    border: 1px solid #efdbff;
    border-radius: 12px;
  }

  .ant-statistic-title {
    font-weight: 500;
    color: #666;
  }

  .ant-statistic-content-value {
    font-weight: 600;
  }
`;

// -------------------- Utils --------------------
const toPercent = (v: number, digits = 2) =>
  `${((v ?? 0) * 100).toFixed(digits)}%`;

const ceilDay = (v?: number | null) => {
  const x = typeof v === "number" ? v : 0;
  return x > 0 ? Math.ceil(x) : 0;
};

function downloadCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(",")]
    .concat(
      rows.map((r) =>
        headers
          .map((h) => {
            const cell = (r as any)[h];
            if (cell === null || cell === undefined) return "";
            const s = typeof cell === "string" ? cell : JSON.stringify(cell);
            return `"${s.replaceAll('"', '""')}"`;
          })
          .join(",")
      )
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// -------------------- ทำให้กราฟ ครบวัน --------------------
function fillTrend(
  start: Dayjs,
  end: Dayjs,
  rows: { date: string; value: number }[]
) {
  const map = new Map(rows.map((r) => [r.date, r.value]));
  const totalDays = end.diff(start, "day") + 1;
  const out: { date: string; value: number }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = start.add(i, "day").format("YYYY-MM-DD");
    out.push({ date: d, value: map.get(d) ?? 0 });
  }
  return out;
}

// -------------------- Component --------------------
export default function CompanyAnalysis() {
  const [messageApi, contextHolder] = message.useMessage();

  const [days, setDays] = useState<number>(30);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(29, "day").startOf("day"),
    dayjs().startOf("day"),
  ]);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<number[]>([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState<number[]>([]);
  const [customRange, setCustomRange] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);

  // data states
  const [overview, setOverview] = useState<Overview | null>(null);
  const [funnelData, setFunnelData] = useState<PipelineBucket[]>([]);
  const [postPerf, setPostPerf] = useState<PostPerfRow[]>([]);
  const [interview, setInterview] = useState<InterviewStats | null>(null);
  const [trendData, setTrendData] = useState<{ date: string; value: number }[]>(
    []
  );

  // ----- state สำหรับ options -----
  const [postOptions, setPostOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [jobTypeOptions, setJobTypeOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [workModeOptions, setWorkModeOptions] = useState<
    { label: string; value: number }[]
  >([]);

  const [companyId, setCompanyId] = useState<number | null>(null);

  // สรุปสถานะโพสต์ (นับจากรายการโพสต์จริงของบริษัท)
  const [postStatusCounts, setPostStatusCounts] = useState({
    open: 0,
    closed: 0,
    pending: 0,
  });

  // โหลดนับสถานะโพสต์ (อิงจากโพสต์จริง)
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      try {
        const res = await GetPostByCompanyId(companyId);
        if (res?.status === 200 && Array.isArray(res.data)) {
          const open = res.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Open"
          ).length;
          const closed = res.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Closed"
          ).length;
          const pending = res.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Pending Approval"
          ).length;
          setPostStatusCounts({ open, closed, pending });
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [companyId]);

  // โหลดข้อมูล analysis ทั้งชุด
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 1) หา companyId จาก user ปัจจุบัน
        const userId = Number(localStorage.getItem("id"));
        if (!userId) {
          messageApi.error("ไม่พบ user id ใน localStorage");
          return;
        }
        const compRes = await GetCompanyByUserID(userId);
        const cid = Number(compRes.ID);
        if (!cid) {
          messageApi.error("ดึงข้อมูลบริษัทไม่สำเร็จ");
          return;
        }
        setCompanyId(cid);

        // 2) เตรียมช่วงเวลา
        const [s, e] = range || ([] as any);
        const startStr = s ? s.format("YYYY-MM-DD") : undefined;
        const endStr = e ? e.format("YYYY-MM-DD") : undefined;

        // 3) ยิงทุก analytics พร้อมกัน + ดึงโพสต์เพื่อนับสถานะ
        const [
          overview,
          trend,
          pipeline,
          postPerf,
          interviewStats,
          postByCompanyId,
        ] = await Promise.all([
          getOverview(cid, days),
          getTrend(cid, startStr, endStr, days),
          getPipeline(cid, days),
          getPostPerf(cid, days),
          getInterviewStats(cid, days),
          GetPostByCompanyId(cid),
        ]);

        // 4) เซ็ต state
        setOverview(overview ?? null);
        setTrendData(Array.isArray(trend) ? trend : []);
        setFunnelData(Array.isArray(pipeline) ? pipeline : []);
        setPostPerf(Array.isArray(postPerf) ? postPerf : []);
        setInterview(interviewStats ?? null);

        if (
          postByCompanyId?.status === 200 &&
          Array.isArray(postByCompanyId.data)
        ) {
          const open = postByCompanyId.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Open"
          ).length;
          const closed = postByCompanyId.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Closed"
          ).length;
          const pending = postByCompanyId.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Pending Approval"
          ).length;
          setPostStatusCounts({ open, closed, pending });

          // 1) ตัวเลือกโพสต์
          setPostOptions(
            postByCompanyId.data.map((p: any) => ({
              label: p?.post_name ?? p?.PostName ?? `#${p?.ID}`,
              value: Number(p?.ID), // 🟢 ให้เป็น number ให้ตรงกับ selectedPosts: number[]
            }))
          );

          // 2) ตัวเลือกประเภทงาน (unique)
          const jtMap = new Map<number, string>();
          postByCompanyId.data.forEach((p: any) => {
            const id = Number(p?.JobType?.ID);
            const name = p?.JobType?.job_type;
            if (id && name && !jtMap.has(id)) jtMap.set(id, name);
          });
          setJobTypeOptions(
            Array.from(jtMap, ([value, label]) => ({ value, label }))
          );

          // 3) ตัวเลือกรูปแบบการทำงาน (unique)
          const wmMap = new Map<number, string>();
          postByCompanyId.data.forEach((p: any) => {
            const id = Number(p?.WorkMode?.ID);
            const name = p?.WorkMode?.work_mode;
            if (id && name && !wmMap.has(id)) wmMap.set(id, name);
          });
          setWorkModeOptions(
            Array.from(wmMap, ([value, label]) => ({ value, label }))
          );
        }
      } catch (err) {
        console.error(err);
        messageApi.error("โหลดข้อมูลวิเคราะห์ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [days, range?.[0]?.valueOf(), range?.[1]?.valueOf()]);

  const extraLabel = useMemo(() => {
    if (customRange && range && range[0] && range[1]) {
      const [s, e] = range;
      const same = s.isSame(e, "day");
      return same
        ? s.format("DD MMM YYYY")
        : `${s.format("DD MMM YYYY")} – ${e.format("DD MMM YYYY")}`;
    }
    return `${days} วัน`;
  }, [customRange, range, days]);

  const onExportPosts = () => downloadCSV("posts_performance.csv", postPerf);
  const onExportTrend = () => downloadCSV("applications_trend.csv", trendData);

  return (
    <Layout>
      <CompanyHeader />
      <Layout className="adminpage-layout">
        <style>{customStyles}</style>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#1677ff",
              colorInfo: "#1677ff",
              colorLink: "#1677ff",
              colorSuccess: "#52c41a",
              colorWarning: "#faad14",
              colorError: "#ff4d4f",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.08)",
            },
            components: {
              Card: {
                borderRadiusLG: 16,
              },
              Button: {
                borderRadius: 8,
              },
              Tag: {
                borderRadius: 8,
              },
            },
          }}
        >
          {contextHolder}
          <div style={{ padding: "0 8px" }}>
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              {/* HEADER */}
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <Title level={2} className="header-title">
                  📊 รายงานผลและวิเคราะห์ — บริษัท
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  ภาพรวมผลการดำเนินงานและแนวโน้มการเติบโต
                </Text>
              </div>

              {/* FILTERS */}
              <Card className="filter-card">
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} lg={10}>
                    <Space wrap>
                      <Text strong style={{ color: "#1677ff" }}>
                        <CalendarOutlined /> ช่วงเวลา
                      </Text>
                      <Select
                        value={days}
                        onChange={(v) => {
                          setDays(v);
                          setCustomRange(false);
                          setRange([dayjs().subtract(v - 1, "day"), dayjs()]);
                        }}
                        style={{ width: 140 }}
                        options={[
                          { label: "7 วัน", value: 7 },
                          { label: "30 วัน", value: 30 },
                          { label: "90 วัน", value: 90 },
                          { label: "180 วัน", value: 180 },
                          { label: "1 ปี", value: 365 },
                        ]}
                      />
                      <RangePicker
                        value={range as any}
                        onChange={(v) => {
                          if (v && v[0] && v[1]) {
                            setCustomRange(true);
                            setRange([
                              v[0].startOf("day"),
                              v[1].startOf("day"),
                            ] as any);
                          } else {
                            setCustomRange(false);
                            setRange(null);
                          }
                        }}
                        allowClear
                      />
                    </Space>
                  </Col>
                  <Col xs={24} lg={14}>
                    <Space wrap style={{ width: "100%" }}>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={onExportTrend}
                        style={{ borderRadius: 8 }}
                      >
                        Export CSV
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>

              {/* OVERVIEW */}
              <Card className="gradient-card" loading={loading}>
                <Title level={4} className="section-title">
                  🎯 ภาพรวมผลการดำเนินงาน
                </Title>
                <Row gutter={[16, 16]}>
                  {/* KPI 4 ใบแถวบน */}
                  <Col xs={12} sm={12} md={6}>
                    <Card size="small" className="kpi-card info">
                      <Statistic
                        title="ผู้สมัครรวม"
                        value={overview?.totalApplications ?? 0}
                        prefix={<UserOutlined style={{ color: "#1677ff" }} />}
                        valueStyle={{ color: "#1677ff", fontWeight: 600 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <Card size="small" className="kpi-card success">
                      <Statistic
                        title="อัตรานัดสัมภาษณ์"
                        value={toPercent(overview?.interviewRate ?? 0)}
                        prefix={<RiseOutlined style={{ color: "#52c41a" }} />}
                        valueStyle={{ color: "#52c41a", fontWeight: 600 }}
                      />
                      <Progress
                        percent={(overview?.interviewRate ?? 0) * 100}
                        showInfo={false}
                        strokeColor="#52c41a"
                        size="small"
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <Card size="small" className="kpi-card success">
                      <Statistic
                        title="อัตราผ่านคัดเลือก"
                        value={toPercent(overview?.offerRate ?? 0)}
                        prefix={<TrophyOutlined style={{ color: "#52c41a" }} />}
                        valueStyle={{ color: "#52c41a", fontWeight: 600 }}
                      />
                      <Progress
                        percent={(overview?.offerRate ?? 0) * 100}
                        showInfo={false}
                        strokeColor="#52c41a"
                        size="small"
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <Card size="small" className="kpi-card danger">
                      <Statistic
                        title="อัตราปฏิเสธ"
                        value={toPercent(overview?.rejectRate ?? 0)}
                        prefix={<FallOutlined style={{ color: "#ff4d4f" }} />}
                        valueStyle={{ color: "#ff4d4f", fontWeight: 600 }}
                      />
                      <Progress
                        percent={(overview?.rejectRate ?? 0) * 100}
                        showInfo={false}
                        strokeColor="#ff4d4f"
                        size="small"
                      />
                    </Card>
                  </Col>

                  {/* แถวล่าง: คะแนนรีวิว + สถานะโพสต์ */}
                  <Col xs={24} md={6}>
                    <Card size="small" className="kpi-card warning">
                      <Statistic
                        title="คะแนนรีวิวเฉลี่ย"
                        value={overview?.avgReviewScore?.toFixed(2) ?? 0}
                        suffix="/ 5.00"
                        prefix={<StarOutlined style={{ color: "#faad14" }} />}
                        valueStyle={{ color: "#faad14", fontWeight: 600 }}
                      />
                      <Progress
                        percent={((overview?.avgReviewScore ?? 0) / 5) * 100}
                        showInfo={false}
                        strokeColor="#faad14"
                        size="small"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={18}>
                    <Row gutter={[12, 12]}>
                      <Col xs={24} sm={8}>
                        <Card size="small" className="kpi-card success">
                          <Statistic
                            title="เปิดรับสมัคร"
                            value={postStatusCounts.open}
                            prefix={
                              <CheckCircleOutlined
                                style={{ color: "#52c41a" }}
                              />
                            }
                            valueStyle={{ color: "#52c41a", fontWeight: 600 }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Card size="small" className="kpi-card">
                          <Statistic
                            title="ปิดรับสมัคร"
                            value={postStatusCounts.closed}
                            prefix={
                              <CloseCircleOutlined
                                style={{ color: "#8c8c8c" }}
                              />
                            }
                            valueStyle={{ color: "#8c8c8c", fontWeight: 600 }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Card size="small" className="kpi-card warning">
                          <Statistic
                            title="รอตรวจสอบ"
                            value={postStatusCounts.pending}
                            prefix={
                              <ClockCircleOutlined
                                style={{ color: "#faad14" }}
                              />
                            }
                            valueStyle={{ color: "#faad14", fontWeight: 600 }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>

              {/* TREND + PIPELINE */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Card
                    loading={loading}
                    className="chart-card"
                    title={
                      <Space>
                        <LineChartOutlined /> <span>📈 แนวโน้มการสมัครงาน</span>
                      </Space>
                    }
                    extra={
                      <Tag
                        className="custom-tag"
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          border: "1px solid rgba(255,255,255,0.3)",
                          color: "white",
                        }}
                      >
                        {extraLabel}
                      </Tag>
                    }
                  >
                    <div style={{ height: 320, padding: "20px 0" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trendData}
                          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(v) => dayjs(v).format("DD MMM")}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                          />
                          <RTooltip
                            formatter={(v: any) => [v, "ผู้สมัคร"]}
                            labelFormatter={(l) =>
                              dayjs(l).format("DD MMM YYYY")
                            }
                            contentStyle={{
                              background: "rgba(255,255,255,0.95)",
                              border: "1px solid #d9d9d9",
                              borderRadius: 8,
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name="จำนวนการสมัคร"
                            stroke="#1677ff"
                            strokeWidth={3}
                            dot={{ fill: "#1677ff", strokeWidth: 2, r: 4 }}
                            activeDot={{
                              r: 6,
                              stroke: "#1677ff",
                              strokeWidth: 2,
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card
                    loading={loading}
                    className="chart-card"
                    title={
                      <Space>
                        <FunnelPlotOutlined />{" "}
                        <span>🔄 Pipeline การสมัครงาน</span>
                      </Space>
                    }
                  >
                    <div style={{ height: 280, padding: "10px 0" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                          <RTooltip
                            contentStyle={{
                              background: "rgba(255,255,255,0.95)",
                              border: "1px solid #d9d9d9",
                              borderRadius: 8,
                            }}
                          />
                          <Funnel
                            dataKey="value"
                            data={funnelData}
                            isAnimationActive
                          >
                            <LabelList
                              position="right"
                              fill="#000"
                              stroke="none"
                              dataKey="name"
                              style={{ fontSize: 12 }}
                            />
                            <LabelList
                              position="inside"
                              dataKey="value"
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                fill: "white",
                              }}
                            />
                          </Funnel>
                        </FunnelChart>
                      </ResponsiveContainer>
                    </div>
                    <Divider style={{ margin: "16px 0" }} />
                    {overview?.topPost && (
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)",
                          padding: 16,
                          borderRadius: 8,
                          border: "1px solid #d9f7be",
                        }}
                      >
                        <Space direction="vertical" size={8}>
                          <Text type="secondary" style={{ fontWeight: 500 }}>
                            🏆 โพสต์ยอดนิยม
                          </Text>
                          <div>
                            <Tag
                              color="processing"
                              style={{ borderRadius: 6, marginRight: 8 }}
                            >
                              #{overview.topPost.postId}
                            </Tag>
                            <Text strong style={{ color: "#1677ff" }}>
                              {overview.topPost.postName}
                            </Text>
                          </div>
                          <Text style={{ color: "#52c41a", fontWeight: 600 }}>
                            📊 {overview.topPost.applications} ใบสมัคร
                          </Text>
                        </Space>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>

              {/* POSTS PERFORMANCE + INTERVIEW */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                  <Card
                    loading={loading}
                    className="chart-card"
                    title={
                      <Space>
                        <BarChartOutlined /> <span>📋 ประสิทธิภาพการโพสต์</span>
                      </Space>
                    }
                    extra={
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={onExportPosts}
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          border: "1px solid rgba(255,255,255,0.3)",
                          borderRadius: 8,
                        }}
                      >
                        Export CSV
                      </Button>
                    }
                  >
                    <Table
                      size="middle"
                      dataSource={postPerf}
                      pagination={{ pageSize: 5, showSizeChanger: false }}
                      rowKey={(r) => String(r.post_id)}
                      scroll={{ x: 800 }}
                      columns={[
                        {
                          title: "โพสต์",
                          dataIndex: "post_name",
                          key: "post_name",
                          render: (t) => (
                            <Text strong style={{ color: "#1677ff" }}>
                              {t}
                            </Text>
                          ),
                        },
                        {
                          title: "จำนวนสมัคร",
                          dataIndex: "applications",
                          key: "applications",
                          sorter: (a: any, b: any) =>
                            a.applications - b.applications,
                          render: (v) => (
                            <Tag color="blue" className="custom-tag">
                              {v}
                            </Tag>
                          ),
                        },
                        {
                          title: "ผ่าน",
                          dataIndex: "passed",
                          key: "passed",
                          sorter: (a: any, b: any) => a.passed - b.passed,
                          render: (v) => (
                            <Tag color="gold" className="custom-tag">
                              {v}
                            </Tag>
                          ),
                        },
                        {
                          title: "เฉลี่ย (วัน)",
                          dataIndex: "avg_time_to_decision_days",
                          key: "ttd",
                          render: (v: number) =>
                            typeof v === "number" ? (
                              <Text style={{ fontWeight: 500 }}>
                                {ceilDay(v)}
                              </Text>
                            ) : (
                              <Text type="secondary">—</Text>
                            ),
                        },
                        {
                          title: "GPA (เฉลี่ย/ต่ำสุด)",
                          key: "gpa",
                          render: (_: any, r: any) => (
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
                          render: (t) => (
                            <Tag color="purple" className="custom-tag">
                              {t || "ไม่ระบุ"}
                            </Tag>
                          ),
                        },
                      ]}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={10}>
                  <Card
                    loading={loading}
                    className="chart-card"
                    title={
                      <Space>
                        <UserOutlined /> <span>👥 สถิติการสัมภาษณ์</span>
                      </Space>
                    }
                  >
                    <Space
                      size={20}
                      direction="vertical"
                      style={{ width: "100%", padding: "0 8px" }}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)",
                              padding: 16,
                              borderRadius: 12,
                              border: "1px solid #d9f7be",
                              textAlign: "center",
                            }}
                          >
                            <Statistic
                              title="นัดสัมภาษณ์"
                              value={interview?.scheduled ?? 0}
                              valueStyle={{ color: "#52c41a", fontWeight: 600 }}
                            />
                          </div>
                        </Col>
                        <Col span={12}>
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #fff2f0 0%, #ffffff 100%)",
                              padding: 16,
                              borderRadius: 12,
                              border: "1px solid #ffccc7",
                              textAlign: "center",
                            }}
                          >
                            <Statistic
                              title="อัตราไม่มาร่วม"
                              value={
                                interview && interview.scheduled
                                  ? `${Math.round(
                                      ((interview.no_show || 0) /
                                        (interview.scheduled || 1)) *
                                        100
                                    )}%`
                                  : "0%"
                              }
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
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="mode"
                              tick={{ fontSize: 11 }}
                              interval={0}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fontSize: 11 }}
                            />
                            <RTooltip
                              contentStyle={{
                                background: "rgba(255,255,255,0.95)",
                                border: "1px solid #d9d9d9",
                                borderRadius: 8,
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="count"
                              name="จำนวนสัมภาษณ์"
                              fill="url(#barGradient)"
                              radius={[4, 4, 0, 0]}
                            />
                            <defs>
                              <linearGradient
                                id="barGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#1677ff"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#69c0ff"
                                  stopOpacity={0.6}
                                />
                              </linearGradient>
                            </defs>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <Row gutter={16}>
                        <Col span={12}>
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%)",
                              padding: 16,
                              borderRadius: 12,
                              border: "1px solid #bae0ff",
                              textAlign: "center",
                            }}
                          >
                            <Statistic
                              title="เฉลี่ย สมัคร→นัด"
                              value={ceilDay(
                                interview?.avg_days_submit_to_schedule
                              )}
                              suffix="วัน"
                              valueStyle={{ color: "#1677ff", fontWeight: 600 }}
                            />
                          </div>
                        </Col>
                        <Col span={12}>
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)",
                              padding: 16,
                              borderRadius: 12,
                              border: "1px solid #efdbff",
                              textAlign: "center",
                            }}
                          >
                            <Statistic
                              title="เฉลี่ย นัด→สรุปผล"
                              value={ceilDay(
                                interview?.avg_days_schedule_to_decision
                              )}
                              suffix="วัน"
                              valueStyle={{ color: "#722ed1", fontWeight: 600 }}
                            />
                          </div>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Space>
          </div>
        </ConfigProvider>
      </Layout>
    </Layout>
  );
}
