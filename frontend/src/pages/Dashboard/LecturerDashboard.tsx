import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  message,
  Spin,
  Typography,
  Tag,
  Space,
  Badge,
  Modal,
  Dropdown,
  ConfigProvider,
  Empty,
  Tooltip,
  Segmented,
  Drawer,
  Select,
  DatePicker,
  Layout,
} from "antd";
import {
  UsergroupAddOutlined,
  FileTextOutlined,
  ReloadOutlined,
  ExportOutlined,
  FileExcelOutlined,
  ShopOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import dayjs, { Dayjs } from "dayjs";
import { TrendingUpIcon } from "lucide-react";
import {
  getAcademicOverview,
  GetAcademicStaffByUserIdForNewCompany,
  getAcademicTrend,
  listAcademicApplications,
  listAcademicStudents,
} from "@/services/https";
import { useNavigate } from "react-router-dom";
import AcademicStaffHeader from "../Component/AcademicStaffHeader";

const { Text, Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

/* ================= Helpers & constants (compact) ================= */
type AnyRow = Record<string, unknown>;
type PresetValue = "7d" | "30d" | "90d" | "custom";

const PRESETS: { label: string; value: PresetValue }[] = [
  { label: "7 วัน", value: "7d" },
  { label: "30 วัน", value: "30d" },
  { label: "90 วัน", value: "90d" },
  { label: "กำหนดเอง", value: "custom" },
];

const toArray = (v: any): any[] =>
  Array.isArray(v)
    ? v
    : Array.isArray(v?.items)
    ? v.items
    : Array.isArray(v?.data)
    ? v.data
    : [];
const convertToCSV = (data: Record<string, any>[]) => {
  if (!data?.length) return "";
  const headers = Object.keys(data[0]),
    esc = (val: unknown) =>
      val == null
        ? ""
        : /[",\n]/.test(String(val))
        ? `"${String(val).replace(/"/g, '""')}"`
        : String(val);
  return [
    headers.map(esc).join(","),
    ...data.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
};
const exportToCSV = (data: Record<string, any>[] = [], filename: string) => {
  const blob = new Blob(["\uFEFF" + convertToCSV(data)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
const getStatusColor = (s: string) =>
  ({
    รอการนัดสัมภาษณ์: "orange",
    กำลังพิจารณา: "blue",
    ไม่ได้รับเลือก: "red",
    ผ่าน: "green",
    นัดสัมภาษณ์แล้ว: "purple",
    ไม่ผ่าน: "red",
  }[s] || "default");
const sumCounts = (arr?: any[]) =>
  toArray(arr).reduce((s: number, it: any) => s + Number(it?.count || 0), 0);
const countByStatus = (arr?: any[], key?: string) =>
  toArray(arr).reduce(
    (s: number, it: any) =>
      s + (String(it?.key) === key ? Number(it?.count || 0) : 0),
    0
  );

const STATUS_STROKES: Record<string, string> = {
  ผ่าน: "#22c55e",
  กำลังพิจารณา: "#3b82f6",
  นัดสัมภาษณ์แล้ว: "#6366f1",
  รอการนัดสัมภาษณ์: "#f59e0b",
  ไม่ผ่าน: "#ef4444",
  ไม่ได้รับเลือก: "#dc2626",
};
const FAIL_LABEL = "ไม่ผ่าน/ไม่ได้รับเลือก";

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("th-TH") : "-";
const fmtDateTime = (d?: string) =>
  d
    ? new Date(d).toLocaleString("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

/* ================= Component ================= */
const AcademicDashboard = () => {
  const navigate = useNavigate();
  const userID = Number(localStorage.getItem("id"));

  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>();
  const [students, setStudents] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState(""); // reserved for future search box
  const [status, setStatus] = useState("");

  // ===== Daily trend filters
  const [preset, setPreset] = useState<PresetValue>("30d");
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  // Drawer / Modal
  const [appsDrawerOpen, setAppsDrawerOpen] = useState(false);
  const [appsDrawerStatus, setAppsDrawerStatus] = useState<string>("");
  const [studentApplicationsModal, setStudentApplicationsModal] =
    useState(false);
  const [selectedStudentApps, setSelectedStudentApps] = useState<any[]>([]);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<any>(null);
  const [loadingStudentApps, setLoadingStudentApps] = useState(false);

  const refreshTimerRef = useRef<number | null>(null); // (kept if you want to add auto-refresh later)

  const fetchAll = useCallback(async () => {
    setLoading(true);

    if (!userID) {
      messageApi.error("ไม่พบ user id ใน localStorage");
      return;
    }

    const staffRes = await GetAcademicStaffByUserIdForNewCompany(userID);

    // ⬇️ ไม่พบอาจารย์ → เด้งไปหน้าเพิ่มอาจารย์ทันที และหยุดทำงานที่เหลือ
    if (!staffRes) {
      navigate("/lecturer/add-lecturer", { replace: true });
      messageApi.info("โปรดเพิ่มข้อมูลอาจารย์ก่อนใช้งานแดชบอร์ด");
      return;
    }

    if (!userID) return messageApi.error("ไม่พบข้อมูลของอาจารย์");

    try {
      const [overview_res, students_res, application_res] = await Promise.all([
        getAcademicOverview(userID),
        listAcademicStudents(userID, { page, page_size: pageSize, q }),
        listAcademicApplications(userID, { page: 1, page_size: 1000, status }),
      ]);
      setOverview(overview_res);
      setStudents(toArray(students_res?.items ?? students_res));
      setApps(toArray(application_res?.items ?? application_res));
    } catch (err) {
      console.error(err);
      messageApi.error("โหลดข้อมูลวิเคราะห์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [userID, page, pageSize, q, status, messageApi]);

  const fetchDailyTrend = useCallback(async () => {
    if (!userID) return;
    let start: string | undefined,
      end: string | undefined,
      days: number | undefined;
    if (preset !== "custom")
      days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    else if (range) {
      start = range[0].format("YYYY-MM-DD");
      end = range[1].format("YYYY-MM-DD");
    } else days = 30;

    try {
      const data = await getAcademicTrend(userID, { start, end, days });
      const normalized = (Array.isArray(data) ? data : []).map((p: any) => ({
        date: p.date,
        total: Number(p.total || 0),
        pass: Number(p.pass || 0),
        review: Number(p.review || 0),
        interviewed: Number(p.interviewed || 0),
        waiting_schedule: Number(
          (p as any).waiting_schedule ?? (p as any).waiting ?? 0
        ),
        fail: Number(p.fail || 0),
      }));
      setDailyTrend(normalized);
    } catch (e) {
      console.error(e);
      messageApi.error("โหลดกราฟรายวันไม่สำเร็จ");
    }
  }, [userID, preset, range, messageApi]);

  // initial load
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  // daily trend load
  useEffect(() => {
    fetchDailyTrend();
  }, [fetchDailyTrend]);
  // (optional) auto-refresh hook placeholder (disabled)
  useEffect(
    () => () => {
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    },
    []
  );

  /* ===== Daily series for Recharts ===== */
  const dailyChartData = useMemo(
    () =>
      dailyTrend.map((p: any) => ({
        name: p.date,
        total: Number(p.total || 0),
        ผ่าน: Number(p.pass || 0),
        กำลังพิจารณา: Number(p.review || 0),
        นัดสัมภาษณ์แล้ว: Number(p.interviewed || 0),
        รอการนัดสัมภาษณ์: Number(p.waiting_schedule || p.waiting || 0),
        [FAIL_LABEL]: Number(p.fail || 0),
      })),
    [dailyTrend]
  );

  /* ===== Companies derived from apps ===== */
  const companiesCoop = useMemo(() => {
    const map = new Map<
      string,
      { company_name: string; applicants: any[]; last_apply_at?: string }
    >();
    toArray(apps).forEach((a: any) => {
      const cname = a.company_name || "ไม่ระบุบริษัท";
      if (!map.has(cname))
        map.set(cname, {
          company_name: cname,
          applicants: [],
          last_apply_at: undefined,
        });
      const bucket = map.get(cname)!;
      bucket.applicants.push(a);
      const t = a.updated_at || a.submit_at;
      if (
        t &&
        (!bucket.last_apply_at || new Date(t) > new Date(bucket.last_apply_at))
      )
        bucket.last_apply_at = t;
    });
    return Array.from(map.values())
      .map((v) => ({
        key: v.company_name,
        company_name: v.company_name,
        applicants_count: v.applicants.length,
        last_apply_at: v.last_apply_at,
      }))
      .sort((a, b) => b.applicants_count - a.applicants_count);
  }, [apps]);

  /* ===== ล่าสุด 5 คน (ไม่ซ้ำ) ===== */
  const latest5UniqueAdvisees = useMemo(() => {
    const sorted = [...toArray(apps)].sort(
      (a: any, b: any) =>
        new Date(b.updated_at || b.submit_at || 0).getTime() -
        new Date(a.updated_at || a.submit_at || 0).getTime()
    );
    const seen = new Map<number | string, any>();
    for (const a of sorted) {
      const key = (a.student_id ?? a.student_full_name) as number | string;
      if (!seen.has(key)) seen.set(key, a);
      if (seen.size >= 5) break;
    }
    return Array.from(seen.values()).map((a: any) => ({
      student_id: a.student_id,
      name: a.student_full_name,
      status: a.status,
      updated_at: a.updated_at || a.submit_at,
      company_name: a.company_name,
      post_name: a.post_name,
    }));
  }, [apps]);

  /* ===== Export menu ===== */
  const exportMenuItems = [
    {
      key: "students",
      icon: <FileExcelOutlined />,
      label: "ส่งออกรายชื่อนักศึกษา (CSV)",
      onClick: () =>
        exportToCSV(
          students?.map((s: any) => ({
            ชื่อ: s.first_name,
            นามสกุล: s.last_name,
            อายุ: s.age,
            เพศ: s.gender,
            สาขา: s.program_name,
            คณะ: s.faculty_name,
            มหาวิทยาลัย: s.university_name,
            จำนวนใบสมัคร: s.applications_total,
          })) ?? [],
          "รายชื่อนักศึกษา"
        ),
    },
    {
      key: "companies",
      icon: <FileExcelOutlined />,
      label: "ส่งออกบริษัทร่วม Co-op (CSV)",
      onClick: () =>
        exportToCSV(
          companiesCoop?.map((c: any) => ({
            บริษัท: c.company_name,
            จำนวนนักศึกษาที่สมัคร: c.applicants_count,
            ล่าสุดเมื่อ: c.last_apply_at
              ? new Date(c.last_apply_at).toLocaleString("th-TH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "",
          })) ?? [],
          "บริษัทร่วม Co-op"
        ),
    },
    {
      key: "series",
      icon: <ExportOutlined />,
      label: "ส่งออกกราฟรายวัน (CSV)",
      onClick: () =>
        exportToCSV(
          dailyChartData as AnyRow[],
          `แนวโน้มรายวัน_${dayjs().format("YYYYMMDD")}`
        ),
    },
  ];

  /* ===== Table columns ===== */
  const applicationsColumns = [
    {
      title: "ชื่อนักศึกษา",
      dataIndex: "student_full_name",
      key: "student_full_name",
      ellipsis: true,
      render: (t: string) => <Tooltip title={t}>{t}</Tooltip>,
    },
    {
      title: "บริษัท",
      dataIndex: "company_name",
      key: "company_name",
      ellipsis: true,
      render: (t: string) => <Tooltip title={t}>{t}</Tooltip>,
    },
    {
      title: "ตำแหน่ง",
      dataIndex: "post_name",
      key: "post_name",
      ellipsis: true,
      render: (t: string) => <Tooltip title={t}>{t}</Tooltip>,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (s: string) => (
        <Tag
          color={getStatusColor(s)}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          {s}
        </Tag>
      ),
    },
    {
      title: "สมัครเมื่อ",
      dataIndex: "submit_at",
      key: "submit_at",
      width: 140,
      render: (d: string) => fmtDate(d),
    },
  ];

  const statuses = [
    "รอการนัดสัมภาษณ์",
    "กำลังพิจารณา",
    "นัดสัมภาษณ์แล้ว",
    "ผ่าน",
    "ไม่ผ่าน",
    "ไม่ได้รับเลือก",
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          fontWeightStrong: 600,
          colorPrimary: "#1677ff",
          colorInfo: "#1677ff",
          colorSuccess: "#22c55e",
          colorWarning: "#f59e0b",
          colorError: "#ef4444",
          colorText: "#0f172a",
          colorTextSecondary: "#475569",
          colorBorder: "#e2e8f0",
          colorBgLayout: "#ffffff",
          colorBgContainer: "#ffffff",
          borderRadiusLG: 20,
          borderRadius: 12,
          fontSize: 14,
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Noto Sans Thai', 'Prompt', sans-serif",
          lineHeight: 1.6,
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
          boxShadowSecondary:
            "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
          boxShadowTertiary:
            "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
        },
        components: {
          Card: {
            headerBg: "transparent",
            paddingLG: 24,
            boxShadow:
              "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)",
          },
          Table: {
            headerBg: "#f1f5f9",
            headerColor: "#1f2937",
            cellPaddingBlockSM: 12,
            rowHoverBg: "#f8fafc",
            borderColor: "#e2e8f0",
          },
          Button: { controlHeight: 40, borderRadius: 10, fontWeight: 500 },
          Segmented: {
            itemSelectedBg: "rgba(22, 119, 255, 0.12)",
            borderRadius: 10,
          },
          Modal: { borderRadiusLG: 16 },
          Tag: { borderRadius: 8 },
        },
      }}
    >
      <Layout>
        <AcademicStaffHeader />
        <div className="dashboard-container">
          {contextHolder}
          <style>{customStyles}</style>

          {/* Header */}
          <div className="dashboard-header">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div>
                <Title level={1} className="dashboard-title">
                  <DashboardOutlined
                    style={{ marginRight: 12, color: "#1677ff" }}
                  />
                  แดชบอร์ดอาจารย์
                </Title>
                <div className="dashboard-subtitle">
                  ภาพรวมการสมัคร บริษัทที่ร่วมโครงการ Co-op
                  และข้อมูลนักศึกษาทั้งหมด
                </div>
              </div>
              <Space size={16} wrap>
                <Dropdown menu={{ items: exportMenuItems }} trigger={["click"]}>
                  <Button
                    className="secondary-button"
                    size="large"
                    icon={<ExportOutlined />}
                  >
                    ส่งออกข้อมูล
                  </Button>
                </Dropdown>
                <Button
                  className="action-button"
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={fetchAll}
                  loading={loading}
                >
                  รีเฟรชข้อมูล
                </Button>
              </Space>
            </div>
          </div>

          <Spin spinning={loading}>
            {/* KPI Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              <Col xs={24} sm={12} lg={8}>
                <div className="kpi-card" style={{ animationDelay: ".02s" }}>
                  <div className="kpi-content">
                    <div className="kpi-icon">
                      <UsergroupAddOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Statistic
                        title={
                          <span
                            style={{
                              color: "#475569",
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            จำนวนนักศึกษา
                          </span>
                        }
                        value={overview?.students || 0}
                        valueStyle={{
                          color: "#0f172a",
                          fontSize: 28,
                          fontWeight: 800,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <div className="kpi-card" style={{ animationDelay: ".08s" }}>
                  <div className="kpi-content">
                    <div className="kpi-icon">
                      <FileTextOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Statistic
                        title={
                          <span
                            style={{
                              color: "#475569",
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            ใบสมัครทั้งหมด
                          </span>
                        }
                        value={sumCounts(overview?.applications_by_status)}
                        valueStyle={{
                          color: "#0f172a",
                          fontSize: 28,
                          fontWeight: 800,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Lists Section */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              <Col xs={24} md={12} xl={8}>
                <Card
                  className="list-card"
                  title={
                    <Space>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background:
                            "linear-gradient(135deg, #f59e0b, #d97706)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                        }}
                      >
                        <ShopOutlined />
                      </div>
                      <span className="gradient-text">
                        บริษัทที่คนสมัครเยอะสุด
                      </span>
                    </Space>
                  }
                  extra={
                    <Button
                      type="link"
                      icon={<ArrowRightOutlined />}
                      style={{ color: "#1677ff", fontWeight: 600 }}
                      onClick={() => navigate("/lecturer/profile")}
                    >
                      ดูทั้งหมด
                    </Button>
                  }
                  bodyStyle={{ padding: 0 }}
                >
                  {companiesCoop.slice(0, 5).length ? (
                    companiesCoop.slice(0, 5).map((c: any, i: number) => (
                      <div key={c.key} className="list-item">
                        <div className="list-item-header">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                background: `linear-gradient(135deg, ${
                                  [
                                    "#1677ff",
                                    "#0ea5e9",
                                    "#22c55e",
                                    "#f59e0b",
                                    "#3b82f6",
                                  ][i % 5]
                                }, ${
                                  [
                                    "#1d4ed8",
                                    "#0284c7",
                                    "#16a34a",
                                    "#d97706",
                                    "#1e40af",
                                  ][i % 5]
                                })`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {i + 1}
                            </div>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>
                              {c.company_name}
                            </div>
                          </div>
                          <Badge
                            count={c.applicants_count}
                            showZero
                            style={{
                              backgroundColor: "#1677ff",
                              boxShadow: "0 2px 4px rgba(22,119,255,.3)",
                            }}
                          />
                        </div>
                        <div className="list-item-meta">
                          <Text type="secondary">
                            อัปเดตล่าสุด:{" "}
                            {c.last_apply_at
                              ? fmtDateTime(c.last_apply_at)
                              : "-"}
                          </Text>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 40 }}>
                      <Empty description="ยังไม่มีข้อมูลบริษัท" />
                    </div>
                  )}
                </Card>
              </Col>

              <Col xs={24} md={12} xl={8}>
                <Card
                  className="list-card"
                  title={
                    <Space>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background:
                            "linear-gradient(135deg, #22c55e, #16a34a)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                        }}
                      >
                        <TeamOutlined />
                      </div>
                      <span className="gradient-text">การสมัครงานล่าสุด</span>
                    </Space>
                  }
                  extra={
                    <Button
                      type="link"
                      icon={<ArrowRightOutlined />}
                      style={{ color: "#1677ff", fontWeight: 600 }}
                      onClick={() => navigate("/lecturer/profile")}
                    >
                      ดูทั้งหมด
                    </Button>
                  }
                  bodyStyle={{ padding: 0 }}
                >
                  {latest5UniqueAdvisees.length ? (
                    <Row>
                      {latest5UniqueAdvisees.map((r: any) => (
                        <div
                          key={`${r.student_id}-${r.updated_at}`}
                          className="list-item"
                        >
                          <div className="list-item-header">
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>
                              {r.name}
                            </div>
                            <Tag
                              color={getStatusColor(r.status)}
                              style={{
                                margin: 0,
                                borderRadius: 8,
                                fontWeight: 600,
                              }}
                            >
                              {r.status}
                            </Tag>
                          </div>
                          <div className="list-item-meta">
                            <Text type="secondary">{r.company_name}</Text>
                            <span>•</span>
                            <Text type="secondary">
                              อัปเดตล่าสุด:{" "}
                              {r.updated_at ? fmtDateTime(r.updated_at) : "-"}
                            </Text>
                          </div>
                        </div>
                      ))}
                    </Row>
                  ) : (
                    <div style={{ padding: 40 }}>
                      <Empty description="ยังไม่มีการอัปเดตสำหรับนักศึกษาที่อยู่ในการดูแล" />
                    </div>
                  )}
                </Card>
              </Col>

              <Col xs={24} sm={24} lg={8}>
                <div
                  className="status-overview-card"
                  style={{ animationDelay: ".14s" }}
                >
                  <div style={{ marginBottom: 14 }}>
                    <div
                      className="gradient-text"
                      style={{ fontSize: 16, fontWeight: 700 }}
                    >
                      สถานะใบสมัคร
                    </div>
                  </div>
                  <div>
                    <div className="status-item">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="status-indicator green"></span>ผ่าน
                      </div>
                      <div style={{ fontWeight: 800, color: "#22c55e" }}>
                        {countByStatus(
                          overview?.applications_by_status,
                          "ผ่าน"
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="status-item">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="status-indicator blue"></span>
                        กำลังพิจารณา
                      </div>
                      <div style={{ fontWeight: 800, color: "#3b82f6" }}>
                        {countByStatus(
                          overview?.applications_by_status,
                          "กำลังพิจารณา"
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="status-item">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="status-indicator purple"></span>
                        นัดสัมภาษณ์แล้ว
                      </div>
                      <div style={{ fontWeight: 800, color: "#6366f1" }}>
                        {countByStatus(
                          overview?.applications_by_status,
                          "นัดสัมภาษณ์แล้ว"
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="status-item">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="status-indicator orange"></span>
                        รอการนัดสัมภาษณ์
                      </div>
                      <div style={{ fontWeight: 800, color: "#f59e0b" }}>
                        {countByStatus(
                          overview?.applications_by_status,
                          "รอการนัดสัมภาษณ์"
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="status-item">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="status-indicator red"></span>
                        ไม่ผ่าน/ไม่ได้รับเลือก
                      </div>
                      <div style={{ fontWeight: 800, color: "#ef4444" }}>
                        {(
                          countByStatus(
                            overview?.applications_by_status,
                            "ไม่ผ่าน"
                          ) +
                          countByStatus(
                            overview?.applications_by_status,
                            "ไม่ได้รับเลือก"
                          )
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="status-item">
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>
                        รวมทั้งหมด
                      </div>
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: 16,
                          color: "#0f172a",
                        }}
                      >
                        {sumCounts(
                          overview?.applications_by_status
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* ======== Chart Section (Daily Trend) ======== */}
            <Card
              className="chart-card"
              title={
                <Space>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <TrendingUpIcon />
                  </div>
                  <span className="gradient-text">แนวโน้มการสมัคร</span>
                </Space>
              }
              extra={
                <Space size={12} wrap>
                  <Segmented<PresetValue>
                    options={PRESETS as any}
                    value={preset}
                    onChange={(val) => {
                      setPreset(val as PresetValue);
                      if (val !== "custom") setRange(null);
                    }}
                    style={{ borderRadius: 8 }}
                  />
                  {preset === "custom" && (
                    <RangePicker
                      value={range ?? undefined}
                      onChange={(vals) =>
                        setRange(vals ? [vals[0]!, vals[1]!] : null)
                      }
                      format="YYYY-MM-DD"
                      allowClear
                      style={{ borderRadius: 8 }}
                    />
                  )}
                  <Tooltip title="ส่งออก (CSV)">
                    <Button
                      className="secondary-button"
                      icon={<ExportOutlined />}
                      onClick={() =>
                        exportToCSV(
                          dailyChartData as AnyRow[],
                          `แนวโน้มรายวัน_${dayjs().format("YYYYMMDD")}`
                        )
                      }
                    />
                  </Tooltip>
                </Space>
              }
              bodyStyle={{ padding: 0 }}
            >
              <div
                style={{
                  background: "#fafbfc",
                  borderRadius: 12,
                  padding: "20px 24px",
                  margin: "0 16px 12px 16px",
                  border: "1px solid #f0f0f0",
                }}
              />
              <div className="chart-container">
                {!dailyChartData?.length ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <Empty
                      description="ยังไม่มีข้อมูลช่วงนี้"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RLineChart
                      data={dailyChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorTotal"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#1677ff"
                            stopOpacity={0.32}
                          />
                          <stop
                            offset="95%"
                            stopColor="#1677ff"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        stroke="#475569"
                        fontSize={12}
                        fontWeight={600}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#475569"
                        fontSize={12}
                        fontWeight={600}
                      />
                      <RTooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.95)",
                          border: "1px solid #e2e8f0",
                          borderRadius: 12,
                        }}
                      />
                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="total"
                        name="รวม (รายวัน)"
                        stroke="#1677ff"
                        strokeWidth={3}
                        strokeDasharray="6 6"
                        fill="url(#colorTotal)"
                        dot={{
                          fill: "#1677ff",
                          strokeWidth: 2,
                          stroke: "#ffffff",
                          r: 5,
                        }}
                        activeDot={{
                          r: 7,
                          fill: "#1677ff",
                          stroke: "#ffffff",
                          strokeWidth: 3,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="ผ่าน"
                        name="ผ่าน"
                        stroke={STATUS_STROKES["ผ่าน"]}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="กำลังพิจารณา"
                        name="กำลังพิจารณา"
                        stroke={STATUS_STROKES["กำลังพิจารณา"]}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="นัดสัมภาษณ์แล้ว"
                        name="นัดสัมภาษณ์แล้ว"
                        stroke={STATUS_STROKES["นัดสัมภาษณ์แล้ว"]}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="รอการนัดสัมภาษณ์"
                        name="รอการนัดสัมภาษณ์"
                        stroke={STATUS_STROKES["รอการนัดสัมภาษณ์"]}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey={FAIL_LABEL}
                        name={FAIL_LABEL}
                        stroke="#dc2626"
                        strokeWidth={2}
                        dot={false}
                      />
                    </RLineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </Spin>

          {/* Applications Drawer */}
          <Drawer
            open={appsDrawerOpen}
            onClose={() => setAppsDrawerOpen(false)}
            width={980}
            title={
              <Space>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "linear-gradient(135deg, #1677ff, #1d4ed8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <FileTextOutlined />
                </div>
                <span className="gradient-text">ใบสมัครทั้งหมด</span>
              </Space>
            }
            extra={
              <Space wrap>
                <Text type="secondary" style={{ fontWeight: 600 }}>
                  สถานะ:
                </Text>
                <Select
                  allowClear
                  placeholder="ทั้งหมด"
                  style={{ width: 220 }}
                  value={appsDrawerStatus || undefined}
                  onChange={(v) => setAppsDrawerStatus(v || "")}
                >
                  {statuses.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
                <Button
                  className="secondary-button"
                  onClick={() =>
                    exportToCSV(
                      (appsDrawerStatus
                        ? apps.filter((a) => a.status === appsDrawerStatus)
                        : apps) ?? [],
                      "ใบสมัครทั้งหมด"
                    )
                  }
                >
                  ส่งออก CSV
                </Button>
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ padding: 24 }}>
              <Table
                size="middle"
                scroll={{ x: true, y: 520 }}
                sticky
                dataSource={
                  (appsDrawerStatus
                    ? apps.filter((a) => a.status === appsDrawerStatus)
                    : apps) ?? []
                }
                columns={applicationsColumns}
                rowKey="id"
                pagination={{
                  pageSize: 12,
                  showTotal: (t, r) => `${r[0]}-${r[1]} จาก ${t} รายการ`,
                  showSizeChanger: true,
                  showQuickJumper: true,
                }}
                locale={{
                  emptyText: <Empty description="ยังไม่มีข้อมูลใบสมัคร" />,
                }}
              />
            </div>
          </Drawer>

          {/* Student Applications Modal */}
          <Modal
            open={studentApplicationsModal}
            title={
              <span style={{ fontSize: 16, fontWeight: 700 }}>
                ใบสมัครของ{" "}
                <span className="gradient-text">
                  {selectedStudentInfo
                    ? `${selectedStudentInfo.first_name} ${selectedStudentInfo.last_name}`
                    : "นักศึกษา"}
                </span>
              </span>
            }
            width={900}
            onCancel={() => {
              setStudentApplicationsModal(false);
              setSelectedStudentApps([]);
              setSelectedStudentInfo(null);
            }}
            footer={[
              <Button
                key="export"
                className="action-button"
                onClick={() => {
                  const data = (
                    Array.isArray(selectedStudentApps)
                      ? selectedStudentApps
                      : []
                  ).map((app: any) => ({
                    บริษัท: app.company_name || app.company || "-",
                    ตำแหน่ง: app.position || app.post_name || "-",
                    สถานะ: app.status || "-",
                    วันที่สมัคร: fmtDate(app.date || app.submit_at),
                  }));
                  exportToCSV(
                    data,
                    `ใบสมัคร_${selectedStudentInfo?.first_name || ""}_${
                      selectedStudentInfo?.last_name || ""
                    }`
                  );
                }}
              >
                ส่งออก (CSV)
              </Button>,
              <Button
                key="close"
                className="secondary-button"
                onClick={() => setStudentApplicationsModal(false)}
              >
                ปิด
              </Button>,
            ]}
          >
            <Spin spinning={loadingStudentApps}>
              <Table
                size="middle"
                scroll={{ x: true, y: 420 }}
                sticky
                dataSource={
                  Array.isArray(selectedStudentApps) ? selectedStudentApps : []
                }
                rowKey="id"
                pagination={{ pageSize: 8 }}
                locale={{
                  emptyText: (
                    <Empty description="ยังไม่มีข้อมูลใบสมัครของนักศึกษาคนนี้" />
                  ),
                }}
                columns={[
                  {
                    title: "บริษัท",
                    key: "company",
                    ellipsis: true,
                    render: (_: any, r: any) => (
                      <Tooltip title={r.company_name || r.company || "-"}>
                        {r.company_name || r.company || "-"}
                      </Tooltip>
                    ),
                  },
                  {
                    title: "ตำแหน่ง",
                    key: "position",
                    ellipsis: true,
                    render: (_: any, r: any) => (
                      <Tooltip title={r.position || r.post_name || "-"}>
                        {r.position || r.post_name || "-"}
                      </Tooltip>
                    ),
                  },
                  {
                    title: "สถานะ",
                    dataIndex: "status",
                    key: "status",
                    width: 140,
                    render: (s: string) => (
                      <Tag
                        color={getStatusColor(s)}
                        style={{ borderRadius: 8, fontWeight: 600 }}
                      >
                        {s || "-"}
                      </Tag>
                    ),
                  },
                  {
                    title: "วันที่สมัคร",
                    key: "date",
                    width: 140,
                    render: (_: any, r: any) => fmtDate(r.date || r.submit_at),
                  },
                ]}
              />
            </Spin>
          </Modal>
        </div>
      </Layout>
    </ConfigProvider>
  );
};

export default AcademicDashboard;

const customStyles = `
  body { background: linear-gradient(135deg, #e6f2ff 0%, #f5faff 100%); min-height: 100vh; }
  .dashboard-container { background: linear-gradient(135deg, #eef6ff 0%, #ffffff 100%); min-height: 100vh; padding: 32px; }
  .dashboard-header { background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%); border-radius: 24px; padding: 28px 24px; margin-bottom: 32px;
    box-shadow: 0 10px 25px -5px rgba(22, 119, 255, 0.12), 0 10px 10px -5px rgba(22, 119, 255, 0.06); border: 1px solid rgba(22, 119, 255, 0.12); backdrop-filter: blur(10px); animation: fadeIn .5s ease both; }
  .dashboard-title { background: linear-gradient(135deg, #1677ff 0%, #1d4ed8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    font-size: clamp(22px, 2.4vw, 30px); font-weight: 800; margin: 0 !important; letter-spacing: -0.02em; }
  .dashboard-subtitle { color: #475569; font-size: clamp(13px, 1.4vw, 16px); margin-top: 6px; font-weight: 400; }
  .action-button { background: linear-gradient(135deg, #1677ff 0%, #1d4ed8 100%); border: none; border-radius: 12px; color: white; font-weight: 600; transition: transform .25s ease, box-shadow .25s ease; box-shadow: 0 8px 18px rgba(22, 119, 255, 0.25); }
  .action-button:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(22, 119, 255, 0.35); }
  .secondary-button { background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%); border: 1px solid rgba(22, 119, 255, 0.16); border-radius: 12px; font-weight: 600;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, color .2s ease; }
  .secondary-button:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(22, 119, 255, 0.18); border-color: #1677ff; color: #1677ff; }

  .kpi-card { background: linear-gradient(135deg, #ffffff 0%, #f9fbff 100%); border-radius: 20px; padding: 24px; border: 1px solid rgba(22, 119, 255, 0.10);
    box-shadow: 0 4px 20px -2px rgba(22, 119, 255, 0.12); transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; position: relative; overflow: hidden; animation: slideUp .6s ease both; height: 100%; }
  .kpi-card::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 3px; background: linear-gradient(90deg, #1677ff, #0ea5e9, #1d4ed8); }
  .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px -6px rgba(22, 119, 255, 0.22); border-color: rgba(22, 119, 255, 0.18); }
  .kpi-content { display: flex; gap: 18px; align-items: flex-start; }
  .kpi-icon { width: 48px; height: 48px; border-radius: 16px; background: linear-gradient(135deg, #1677ff, #1d4ed8); display: grid; place-items: center; color: white; font-size: 20px; }

  .status-overview-card { background: linear-gradient(135deg, #ffffff 0%, #f9fbff 100%); border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px -2px rgba(22, 119, 255, 0.12);
    border: 1px solid rgba(22, 119, 255, 0.10); position: relative; overflow: hidden; animation: slideUp .65s ease both; }
  .status-overview-card::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 3px; background: linear-gradient(90deg, #22c55e, #16a34a); }
  .status-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
  .status-item:last-child { border-bottom: none; margin-top: 8px; padding-top: 16px; border-top: 2px solid #e2e8f0; font-weight: 700; }
  .status-indicator { width: 10px; height: 10px; border-radius: 50%; margin-right: 10px; }
  .status-indicator.green { background: #22c55e; } .status-indicator.blue { background: #3b82f6; } .status-indicator.purple { background: #6366f1; }
  .status-indicator.orange { background: #f59e0b; } .status-indicator.red { background: #ef4444; }

  .list-card { background: linear-gradient(135deg, #ffffff 0%, #f9fbff 100%); border-radius: 20px; border: 1px solid rgba(22, 119, 255, 0.10);
    box-shadow: 0 4px 20px -2px rgba(22, 119, 255, 0.12); transition: transform .2s ease, box-shadow .2s ease; height: 100%; }
  .list-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.18); }
  .list-item { padding: 16px; border-bottom: 1px solid #e2e8f0; cursor: default; transition: background .2s ease; }
  .list-item:hover { background: linear-gradient(135deg, #f8fbff 0%, #f1f5f9 100%); }
  .list-item:last-child { border-bottom: none; }
  .list-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .list-item-meta { display: flex; align-items: center; gap: 10px; color: #475569; font-size: 13px; }

  .chart-card { background: linear-gradient(135deg, #ffffff 0%, #f9fbff 100%); border-radius: 20px; border: 1px solid rgba(22, 119, 255, 0.10); animation: fadeIn .5s ease both; }
  .chart-container { height: clamp(280px, 48vh, 440px); padding: 10px 16px 20px 16px; }

  .ant-table-thead > tr > th { background: linear-gradient(135deg, #f1f5f9 0%, #eaf2ff 100%) !important; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; }
  .ant-table-tbody > tr:hover > td { background: linear-gradient(135deg, #f8fbff 0%, #f1f5f9 100%) !important; }

  .ant-segmented { background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border: 1px solid rgba(22,119,255,0.12); }

  .gradient-text { background: linear-gradient(135deg, #1677ff 0%, #1d4ed8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 700; }

  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }

  @media (max-width: 991px) { .dashboard-container { padding: 20px; } .dashboard-header { padding: 20px; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;
