import React, { useMemo, useState } from "react";
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
} from "antd";
import {
  DownloadOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FunnelPlotOutlined,
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

dayjs.extend(isBetween);

const { Text } = Typography;
const { RangePicker } = DatePicker;

// -------------------- Mock Data (ใช้เท่าที่จำเป็น) --------------------
const MOCK_POSTS = [
  { id: 1, name: "ฝึกงาน Frontend (React)" },
  { id: 2, name: "ฝึกงาน วิศวกรข้อมูล" },
  { id: 3, name: "ฝึกงาน QA/ทดสอบ" },
];

const MOCK_JOB_TYPES = [
  { id: 1, label: "เต็มเวลา" },
  { id: 2, label: "พาร์ทไทม์" },
];

const MOCK_WORK_MODES = [
  { id: 1, label: "ออนไซต์" },
  { id: 2, label: "ผสม" },
  { id: 3, label: "ทางไกล" },
];

const MOCK_KPIS = {
  totalApplications: 128,
  interviewRate: 0.37,
  offerRate: 0.18,
  rejectRate: 0.41,
  timeToDecisionAvgDays: 9.2,
  avgReviewScore: 4.1,
  topPost: { postId: 1, postName: "ฝึกงาน Frontend (React)", applications: 35 },
};

const MOCK_FUNNEL = [
  { name: "สมัครทั้งหมด", value: 128 },
  { name: "กำลังพิจารณา", value: 52 },
  { name: "รอการนัดสัมภาษณ์", value: 31 },
  { name: "นัดสัมภาษณ์แล้ว", value: 25 },
  { name: "ผ่าน", value: 23 },
  { name: "ไม่ผ่าน/ไม่ได้รับเลือก", value: 28 },
];

const MOCK_POST_PERF = [
  {
    key: 1,
    post_id: 1,
    post_name: "ฝึกงาน Frontend (React)",
    applications: 35,
    interviewed: 12,
    passed: 6,
    avg_time_to_decision_days: 8.4,
    avg_gpa: 3.32,
    min_gpa: 3.0,
    work_mode: "ผสม",
  },
  {
    key: 2,
    post_id: 2,
    post_name: "ฝึกงาน วิศวกรข้อมูล",
    applications: 22,
    interviewed: 8,
    passed: 4,
    avg_time_to_decision_days: 10.5,
    avg_gpa: 3.21,
    min_gpa: 3.0,
    work_mode: "ออนไซต์",
  },
  {
    key: 3,
    post_id: 3,
    post_name: "ฝึกงาน QA/ทดสอบ",
    applications: 18,
    interviewed: 5,
    passed: 3,
    avg_time_to_decision_days: 7.3,
    avg_gpa: 3.05,
    min_gpa: 2.75,
    work_mode: "ทางไกล",
  },
];

const MOCK_INTERVIEW = {
  scheduled: 25,
  no_show: 3,
  mode: [
    { mode: "ออนไลน์", count: 15, pass_rate: 0.6 },
    { mode: "ออนไซต์", count: 10, pass_rate: 0.5 },
  ],
  avg_days_submit_to_schedule: 3.1,
  avg_days_schedule_to_decision: 4.7,
};

// -------------- Utils --------------
const toPercent = (v: number) => `${(v * 100).toFixed(0)}%`;

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
    .join("");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// -------------------- Component --------------------
export default function CompanyAnalysisMock() {
  const [days, setDays] = useState<number>(30);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(29, "day").startOf("day"),
    dayjs().startOf("day"),
  ]);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<number[]>([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState<number[]>([]);

  // --- สร้างข้อมูลแนวโน้มตามช่วงวันที่เลือก ---
  const [trendData, setTrendData] = useState<{ date: string; value: number }[]>(
    []
  );

  const generateTrend = (start: Dayjs, end: Dayjs) => {
    const totalDays = Math.max(end.diff(start, "day") + 1, 0);
    return Array.from({ length: totalDays }).map((_, i) => {
      const d = start.add(i, "day");
      return {
        date: d.format("YYYY-MM-DD"),
        value: 3 + Math.round(Math.random() * 6),
      };
    });
  };

  React.useEffect(() => {
    if (!range) return;
    const [start, end] = range;
    if (!start || !end) return;
    setTrendData(generateTrend(start.startOf("day"), end.startOf("day")));
  }, [
    range && range[0] && range[0].valueOf(),
    range && range[1] && range[1].valueOf(),
  ]);

  const funnelData = useMemo(() => MOCK_FUNNEL.map((f) => ({ ...f })), []);

  const onExportPosts = () => downloadCSV("ผลการโพสต์.csv", MOCK_POST_PERF);
  const onExportTrend = () => downloadCSV("แนวโน้มการสมัคร.csv", trendData);

  const [customRange, setCustomRange] = useState<boolean>(false);

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

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          colorInfo: "#1677ff",
          colorLink: "#1677ff",
        },
      }}
    >
      <div className="p-4">
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {/* ตัวกรอง */}
          <Card>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} lg={10}>
                <Space wrap>
                  <Text strong>ช่วงเวลา</Text>
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
                <Space wrap>
                  <Select
                    mode="multiple"
                    placeholder="เลือกโพสต์"
                    style={{ minWidth: 220 }}
                    value={selectedPosts}
                    onChange={setSelectedPosts}
                    options={MOCK_POSTS.map((p) => ({
                      label: p.name,
                      value: p.id,
                    }))}
                  />
                  <Select
                    mode="multiple"
                    placeholder="ประเภทงาน"
                    style={{ minWidth: 160 }}
                    value={selectedJobTypes}
                    onChange={setSelectedJobTypes}
                    options={MOCK_JOB_TYPES.map((j) => ({
                      label: j.label,
                      value: j.id,
                    }))}
                  />
                  <Select
                    mode="multiple"
                    placeholder="รูปแบบการทำงาน"
                    style={{ minWidth: 180 }}
                    value={selectedWorkModes}
                    onChange={setSelectedWorkModes}
                    options={MOCK_WORK_MODES.map((w) => ({
                      label: w.label,
                      value: w.id,
                    }))}
                  />
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={onExportTrend}
                  >
                    Export CSV (แนวโน้ม)
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* KPI */}
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="ผู้สมัครรวม"
                  value={MOCK_KPIS.totalApplications}
                  prefix={<LineChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="อัตรานัดสัมภาษณ์"
                  value={toPercent(MOCK_KPIS.interviewRate)}
                  prefix={<RiseOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="อัตราผ่านคัดเลือก"
                  value={toPercent(MOCK_KPIS.offerRate)}
                  prefix={<RiseOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="อัตราปฏิเสธ"
                  value={toPercent(MOCK_KPIS.rejectRate)}
                  prefix={<FallOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="เวลาเฉลี่ยจนได้ข้อสรุป"
                  value={MOCK_KPIS.timeToDecisionAvgDays}
                  suffix="วัน"
                />
              </Card>
            </Col>
            <Col xs={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="คะแนนรีวิวเฉลี่ย"
                  value={MOCK_KPIS.avgReviewScore}
                  suffix="/5"
                />
              </Card>
            </Col>
          </Row>

          {/* แนวโน้ม & กรวย Pipeline */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title={
                  <Space>
                    <LineChartOutlined /> <span>แนวโน้มจำนวนการสมัคร</span>
                  </Space>
                }
                extra={<Tag color="blue">{extraLabel}</Tag>}
              >
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => dayjs(v).format("DD MMM")}
                      />
                      <YAxis allowDecimals={false} />
                      <RTooltip
                        formatter={(v: any) => [v, "ผู้สมัคร"]}
                        labelFormatter={(l) => dayjs(l).format("DD MMM YYYY")}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="จำนวน"
                        stroke="#1677ff"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <Space>
                    <FunnelPlotOutlined /> <span>Pipeline</span>
                  </Space>
                }
              >
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <RTooltip />
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
                        />
                        <LabelList position="inside" dataKey="value" />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
                <Divider style={{ margin: "12px 0" }} />
                <Space direction="vertical" size={4}>
                  <Text type="secondary">โพสต์เด่น</Text>
                  <Text>
                    <Tag color="processing">#{MOCK_KPIS.topPost.postId}</Tag>{" "}
                    {MOCK_KPIS.topPost.postName} —{" "}
                    {MOCK_KPIS.topPost.applications} ใบสมัคร
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* ผลการโพสต์ + การสัมภาษณ์ */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined /> <span>ผลการโพสต์</span>
                  </Space>
                }
                extra={
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={onExportPosts}
                  >
                    Export CSV
                  </Button>
                }
              >
                <Table
                  size="middle"
                  dataSource={MOCK_POST_PERF}
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: "โพสต์",
                      dataIndex: "post_name",
                      key: "post_name",
                      render: (t) => <Text strong>{t}</Text>,
                    },
                    {
                      title: "จำนวนสมัคร",
                      dataIndex: "applications",
                      key: "applications",
                      sorter: (a, b) => a.applications - b.applications,
                    },
                    {
                      title: "นัดสัมภาษณ์",
                      dataIndex: "interviewed",
                      key: "interviewed",
                      sorter: (a, b) => a.interviewed - b.interviewed,
                    },
                    {
                      title: "ผ่าน",
                      dataIndex: "passed",
                      key: "passed",
                      sorter: (a, b) => a.passed - b.passed,
                    },
                    {
                      title: "Avg Days",
                      dataIndex: "avg_time_to_decision_days",
                      key: "ttd",
                      render: (v: number) => v.toFixed(1),
                    },
                    {
                      title: "GPA (avg/min)",
                      key: "gpa",
                      render: (_: any, r: any) =>
                        `${r.avg_gpa.toFixed(2)} / ${r.min_gpa.toFixed(2)}`,
                    },
                    {
                      title: "รูปแบบงาน",
                      dataIndex: "work_mode",
                      key: "work_mode",
                      render: (t) => <Tag>{t}</Tag>,
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="สถิติการสัมภาษณ์">
                <Space size={16} direction="vertical" style={{ width: "100%" }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="นัดสัมภาษณ์"
                        value={MOCK_INTERVIEW.scheduled}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="อัตราไม่มาเข้าร่วม"
                        value={`${(
                          (MOCK_INTERVIEW.no_show / MOCK_INTERVIEW.scheduled) *
                          100
                        ).toFixed(0)}%`}
                      />
                    </Col>
                  </Row>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_INTERVIEW.mode}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mode" />
                        <YAxis allowDecimals={false} />
                        <RTooltip />
                        <Legend />
                        <Bar
                          dataKey="count"
                          name="จำนวนสัมภาษณ์"
                          fill="#69c0ff"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="เฉลี่ย สมัคร→นัด"
                        value={MOCK_INTERVIEW.avg_days_submit_to_schedule}
                        suffix="วัน"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="เฉลี่ย นัด→สรุปผล"
                        value={MOCK_INTERVIEW.avg_days_schedule_to_decision}
                        suffix="วัน"
                      />
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    </ConfigProvider>
  );
}
