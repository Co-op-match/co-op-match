import { useState, useEffect, useRef, useMemo } from "react";
import {
  Card, Row, Col, Statistic, Table, Input, Select, Button, message, Spin,
  Typography, Tag, Space, Badge, Modal, Dropdown, Layout, ConfigProvider,
  Empty, Tooltip, Skeleton, Segmented
} from "antd";
import {
  UserOutlined, FileTextOutlined, ReloadOutlined, EyeOutlined,
  ExportOutlined, FileExcelOutlined
} from "@ant-design/icons";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend
} from "recharts";
import { GetApplicationsByStudentID } from "../../services/https/Application";
import { getAcademicOverview, listAcademicApplications, listAcademicStudents } from "../../services/https";
import AcademicStaffHeader from "../Component/AcademicStaffHeader";

const { Title, Text } = Typography;
const { Option } = Select;

/* =============== Helpers (ย่อแถวเดียว) =============== */
type AnyRow = Record<string, unknown>;
const toArray = (v: any): any[] => (Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : Array.isArray(v?.data) ? v.data : []);
const convertToCSV = (data: AnyRow[]): string => !data?.length ? "" : (() => { const headers = Object.keys(data[0]); const esc = (val: unknown) => (val == null ? "" : /[",\n]/.test(String(val)) ? `"${String(val).replace(/"/g, '""')}"` : String(val)); return [headers.map(esc).join(","), ...data.map(r => headers.map(h => esc(r[h])).join(","))].join("\n"); })();
const exportToCSV = (data: AnyRow[], filename: string) => { const bom = "\uFEFF"; const blob = new Blob([bom + convertToCSV(data)], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.setAttribute("download", `${filename}.csv`); document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); };
const getStatusColor = (s: string) => ({ "รอการนัดสัมภาษณ์": "orange", "กำลังพิจารณา": "blue", "ไม่ได้รับเลือก": "red", "ผ่าน": "green", "นัดสัมภาษณ์แล้ว": "purple", "ไม่ผ่าน": "red" }[s] || "default");
const sumCounts = (arr?: any[]) => toArray(arr).reduce((s: number, it: any) => s + Number(it?.count || 0), 0);
const countByStatus = (arr?: any[], key?: string) => toArray(arr).reduce((s: number, it: any) => s + (String(it?.key) === key ? Number(it?.count || 0) : 0), 0);
const calcTotalAndDelta = (appsPerMonth?: any[]) => { const arr = toArray(appsPerMonth); const total = arr.reduce((sum: number, it: any) => sum + Number(it?.count || 0), 0); let deltaPct: number | null = null; if (arr.length >= 2) { const sorted = [...arr].sort((a, b) => String(a.period).localeCompare(String(b.period))); const last = Number(sorted.at(-1)?.count || 0), prev = Number(sorted.at(-2)?.count || 0); deltaPct = prev > 0 ? ((last - prev) / prev) * 100 : prev === 0 && last > 0 ? 100 : 0; } return { total, deltaPct }; };
const mapSeries = (arr?: any[], labelKey = "period", valueKey = "count") => toArray(arr).map((it: any) => ({ name: it?.[labelKey], value: Number(it?.[valueKey] ?? 0) }));

/* =============== Component =============== */
const AcademicDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [apps, setApps] = useState<any[]>([]);
  const [appsTotal, setAppsTotal] = useState(0);

  // pagination & filter
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [qTyping, setQTyping] = useState("");
  const [status, setStatus] = useState("");
  const [chartRange, setChartRange] = useState<string>("week");
  const [messageApi, contextHolder] = message.useMessage();
  const firstLoadRef = useRef(true);

  // modal
  const [studentApplicationsModal, setStudentApplicationsModal] = useState(false);
  const [selectedStudentApps, setSelectedStudentApps] = useState<any[]>([]);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<any>(null);
  const [loadingStudentApps, setLoadingStudentApps] = useState(false);

  const rawUserId = localStorage.getItem("id");
  const userID = Number.isFinite(Number(rawUserId)) ? Number(rawUserId) : 0;

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const toFileURL = (p?: string) => (!p ? "" : /^https?:\/\//i.test(p) ? p : `${API_BASE}${p}`);

  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("th-TH") : "-");
  const fmtDateTime = (d?: string) => (d ? new Date(d).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "-");
  const downloadFile = (src?: string) => { const url = toFileURL(src); if (!url) return; const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.download = ""; document.body.appendChild(a); a.click(); document.body.removeChild(a); };

  const viewStudentApplications = async (student: any) => {
    setSelectedStudentInfo(student); setLoadingStudentApps(true); setStudentApplicationsModal(true);
    try { const applications = await GetApplicationsByStudentID(student.id); setSelectedStudentApps(toArray(applications)); }
    catch (e) { messageApi.error("ไม่สามารถโหลดข้อมูลใบสมัครได้"); console.error(e); }
    finally { setLoadingStudentApps(false); }
  };

  const exportStudentsData = () => {
    const exportData = students.map((s: any) => ({
      ชื่อ: s.first_name, นามสกุล: s.last_name, อายุ: s.age, เพศ: s.gender,
      สาขา: s.program_name, คณะ: s.faculty_name, มหาวิทยาลัย: s.university_name, จำนวนใบสมัคร: s.applications_total,
    }));
    exportToCSV(exportData, "รายชื่อนักศึกษา");
  };
  const exportApplicationsData = () => {
    const exportData = apps.map((app: any) => ({
      ชื่อนักศึกษา: app.student_full_name, บริษัท: app.company_name, ตำแหน่ง: app.post_name, สถานะ: app.status,
      วันที่สมัคร: app.submit_at ? new Date(app.submit_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "",
      อัปเดตล่าสุด: app.updated_at ? new Date(app.updated_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "",
      หมายเหตุบริษัท: app.company_note || "", ResumeURL: app.resume_url ? toFileURL(app.resume_url) : "",
      TranscriptURL: app.transcript_url ? toFileURL(app.transcript_url) : "",
    }));
    exportToCSV(exportData, "ใบสมัครล่าสุด");
  };
  const exportMenuItems = useMemo(() => ([
    { key: "students", icon: <FileExcelOutlined />, label: "ส่งออกรายชื่อนักศึกษา (CSV)", onClick: exportStudentsData },
    { key: "applications", icon: <FileExcelOutlined />, label: "ส่งออกใบสมัครล่าสุด (CSV)", onClick: exportApplicationsData },
  ]), [students, apps]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [overview_res, students_res, application_res] = await Promise.all([
        getAcademicOverview(userID),
        listAcademicStudents(userID, { page, page_size: pageSize, q }),
        listAcademicApplications(userID, { page: 1, page_size: 8, status }),
      ]);
      setOverview(overview_res);
      setStudents(toArray(students_res?.items ?? students_res));
      setStudentsTotal(Number(students_res?.total ?? 0));
      setApps(toArray(application_res?.items ?? application_res));
      setAppsTotal(Number(application_res?.total ?? 0));
      if (firstLoadRef.current) { messageApi.success("โหลดข้อมูลวิเคราะห์สำเร็จ"); firstLoadRef.current = false; }
    } catch (err) { console.error(err); messageApi.error("โหลดข้อมูลวิเคราะห์ไม่สำเร็จ"); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(() => setQ(qTyping.trim()), 300); return () => clearTimeout(t); }, [qTyping]);
  useEffect(() => { if (!userID) { messageApi.error("ไม่พบข้อมูลของอาจารย์"); return; } fetchAll(); /* eslint-disable-next-line */ }, [userID, page, pageSize, q, status]);

  // series & delta
  const weeklySeries   = useMemo(() => mapSeries(overview?.apps_per_week), [overview?.apps_per_week]);
  const monthlySeries  = useMemo(() => mapSeries(overview?.apps_per_month), [overview?.apps_per_month]);
  const semesterSeries = useMemo(() => mapSeries(overview?.apps_per_semester), [overview?.apps_per_semester]);
  const applicationsTotalAndDelta = useMemo(() => calcTotalAndDelta(overview?.apps_per_month), [overview?.apps_per_month]);

  // columns
  const studentsColumns = useMemo(() => ([
    { title: "ชื่อ-นามสกุล", key: "name", ellipsis: true as any, render: (_: any, r: any) => <Text strong>{`${r.first_name} ${r.last_name}`}</Text> },
    { title: "อายุ", dataIndex: "age", key: "age", width: 80 },
    { title: "เพศ", dataIndex: "gender", key: "gender", width: 90 },
    { title: "สาขา", dataIndex: "program_name", key: "program_name", ellipsis: true as any },
    { title: "คณะ", dataIndex: "faculty_name", key: "faculty_name", ellipsis: true as any },
    { title: "จำนวนใบสมัคร", dataIndex: "applications_total", key: "applications_total", width: 140, render: (c: number) => <Badge count={c} showZero /> },
    { title: "การดำเนินการ", key: "action", width: 160, fixed: "right" as any, render: (_: any, r: any) => <Tooltip title="ดูใบสมัครของนักศึกษา"><Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => viewStudentApplications(r)} className="btn-primary-soft">ดูใบสมัคร</Button></Tooltip> },
  ]), []);
  const applicationsColumns = useMemo(() => ([
    { title: "ชื่อนักศึกษา", dataIndex: "student_full_name", key: "student_full_name", ellipsis: true as any },
    { title: "บริษัท", dataIndex: "company_name", key: "company_name", ellipsis: true as any },
    { title: "ตำแหน่ง", dataIndex: "post_name", key: "post_name", ellipsis: true as any },
    { title: "สถานะ", dataIndex: "status", key: "status", width: 160, render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag> },
    { title: "วันที่", key: "dates", width: 220, render: (_: any, r: any) => <div><div><Text type="secondary">สมัคร:</Text> {fmtDate(r.submit_at)}</div><div><Text type="secondary">อัปเดต:</Text> {fmtDateTime(r.updated_at)}</div></div> },
    { title: "หมายเหตุบริษัท", dataIndex: "company_note", key: "company_note", ellipsis: true as any, render: (t: string) => t ? <Tooltip title={t}><Text>{t}</Text></Tooltip> : <Text type="secondary">-</Text> },
    { title: "ไฟล์แนบ", key: "files", width: 260, render: (_: any, r: any) => { const resume = r.resume_url, transcript = r.transcript_url; return <Space wrap><Button size="small" icon={<EyeOutlined />} onClick={() => downloadFile(resume)} disabled={!resume}>Resume</Button><Button size="small" icon={<EyeOutlined />} onClick={() => downloadFile(transcript)} disabled={!transcript}>Transcript</Button></Space>; } },
  ]), []);

  const ChartBlock = (
    <Card title={<div className="card-head"><span>แนวโน้มการสมัคร</span></div>} className="section-card" style={{ marginBottom: 24 }}
      extra={<Segmented options={[{ label: "รายสัปดาห์", value: "week" }, { label: "รายเดือน", value: "month" }, { label: "รายเทอม", value: "semester" }]} value={chartRange} onChange={(v) => setChartRange(String(v))} />}>
      <div className="chart-wrap">
        {chartRange === "week" && (weeklySeries.length ? (
          <ResponsiveContainer><LineChart data={weeklySeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><RTooltip /><Legend /><Line type="monotone" dataKey="value" name="จำนวนใบสมัคร" dot /></LineChart></ResponsiveContainer>
        ) : <Empty description="ยังไม่มีข้อมูลรายสัปดาห์" />)}
        {chartRange === "month" && (monthlySeries.length ? (
          <ResponsiveContainer><LineChart data={monthlySeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><RTooltip /><Legend /><Line type="monotone" dataKey="value" name="จำนวนใบสมัคร" dot /></LineChart></ResponsiveContainer>
        ) : <Empty description="ยังไม่มีข้อมูลรายเดือน" />)}
        {chartRange === "semester" && (semesterSeries.length ? (
          <ResponsiveContainer><LineChart data={semesterSeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><RTooltip /><Legend /><Line type="monotone" dataKey="value" name="จำนวนใบสมัคร" dot /></LineChart></ResponsiveContainer>
        ) : <Empty description="ยังไม่มีข้อมูลรายเทอม" />)}
      </div>
    </Card>
  );

  // นับสถานะรวม (ใช้ในการ์ดที่ 3)
  const totalStatus = sumCounts(overview?.applications_by_status);

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#1677ff", colorInfo: "#1677ff", colorLink: "#1677ff", colorText: "#262626", colorBgLayout: "#f5f5f5", borderRadiusLG: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
        components: {
          Card: { headerBg: "transparent", boxShadowTertiary: "0 2px 8px rgba(0,0,0,0.12)", paddingLG: 16 },
          Table: { headerBg: "#fafafa", headerColor: "#262626", borderColor: "#d9d9d9", rowHoverBg: "#f5f5f5", cellPaddingBlockSM: 10 },
          Statistic: { titleColor: "#8c8c8c", contentFontSize: 24 },
          Badge: { colorBorderBg: "#f5f5f5" },
          Tag: { defaultBg: "#fafafa", defaultColor: "#262626" },
          Button: { controlHeight: 36 },
          Input: { activeShadow: "0 0 0 3px rgba(22, 119, 255, 0.16)" },
          Select: { activeBorderColor: "#1677ff" },
        },
      }}
    >
      <Layout style={{ background: "linear-gradient(180deg, #f0f5ff 0%, #fafafa 100%)" }}>
        <AcademicStaffHeader />
        <div className="adminpage-layout">
          {contextHolder}

          {/* TOP */}
          <div className="header-hero">
            <div>
              <Title level={2} style={{ margin: 0, color: "#262626" }}>📊 แดชบอร์ดอาจารย์</Title>
              <div className="page-subtitle">ภาพรวมการสมัครงานของนักศึกษาในที่ปรึกษา</div>
            </div>
            <Space>
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight" trigger={["click"]}>
                <Button icon={<ExportOutlined />} disabled={loading}>ส่งออก</Button>
              </Dropdown>
              <Button type="primary" icon={<ReloadOutlined />} onClick={fetchAll} loading={loading}>รีเฟรช</Button>
            </Space>
          </div>

          <Spin spinning={loading} indicator={<Skeleton.Avatar active size={32} shape="circle" />}>
            {/* KPI — ทำให้ “สูงเท่ากัน” จริง ๆ */}
            <Row gutter={[16, 16]} className="kpi-row" style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={8} className="kpi-col">
                <Card className="kpi-card">
                  <div className="kpi-inner">
                    <div className="stat-icon"><UserOutlined /></div>
                    <div className="stat-block">
                      <Statistic title="จำนวนนักศึกษา" value={overview?.students || 0} />
                      <div className="kpi-sub">ที่อยู่ในการดูแลของคุณ</div>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8} className="kpi-col">
                <Card className="kpi-card">
                  <div className="kpi-inner">
                    <div className="stat-icon green"><FileTextOutlined /></div>
                    <div className="stat-block">
                      <Statistic title="ใบสมัครทั้งหมด" value={sumCounts(overview?.applications_by_status)} />
                      <div className="kpi-sub">
                        เทียบเดือนก่อน{" "}
                        {applicationsTotalAndDelta.deltaPct !== null ? (
                          <Tag color={applicationsTotalAndDelta.deltaPct >= 0 ? "green" : "red"} className="delta-chip">
                            {applicationsTotalAndDelta.deltaPct >= 0 ? "▲" : "▼"} {Math.abs(applicationsTotalAndDelta.deltaPct).toFixed(1)}%
                          </Tag>
                        ) : <Tag className="delta-chip">—</Tag>}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* การ์ดสถานะ — จัด 2 คอลัมน์ คงความสูงเท่ากัน */}
              <Col xs={24} sm={24} lg={8} className="kpi-col">
                <Card className="kpi-card">
                  <div className="kpi-inner status">

                    <div className="status-list">
                      <div className="row">
                        <div className="left">
                          <span className="dot green" />
                          ผ่าน
                        </div>
                        <div className="right">{countByStatus(overview?.applications_by_status, "ผ่าน").toLocaleString()}</div>
                      </div>

                      <div className="row">
                        <div className="left">
                          <span className="dot blue" />
                          กำลังพิจารณา
                        </div>
                        <div className="right">{countByStatus(overview?.applications_by_status, "กำลังพิจารณา").toLocaleString()}</div>
                      </div>

                      <div className="row">
                        <div className="left">
                          <span className="dot purple" />
                          นัดสัมภาษณ์แล้ว
                        </div>
                        <div className="right">{countByStatus(overview?.applications_by_status, "นัดสัมภาษณ์แล้ว").toLocaleString()}</div>
                      </div>

                      <div className="row">
                        <div className="left">
                          <span className="dot orange" />
                          รอการนัดสัมภาษณ์
                        </div>
                        <div className="right">{countByStatus(overview?.applications_by_status, "รอการนัดสัมภาษณ์").toLocaleString()}</div>
                      </div>

                      <div className="row">
                        <div className="left">
                          <span className="dot red" />
                          ไม่ผ่าน/ไม่ได้รับเลือก
                        </div>
                        <div className="right">
                          {(
                            countByStatus(overview?.applications_by_status, "ไม่ผ่าน") +
                            countByStatus(overview?.applications_by_status, "ไม่ได้รับเลือก")
                          ).toLocaleString()}
                        </div>
                      </div>

                      <div className="divider" />

                      <div className="row total">
                        <div className="left">รวมทั้งหมด</div>
                        <div className="right">{totalStatus.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {ChartBlock}

            {/* Top Companies */}
            <Card title="บริษัทที่นักศึกษาสมัครมากที่สุด" className="section-card" style={{ marginBottom: 24 }}>
              {toArray(overview?.top_companies).length ? (
                <Row gutter={[16, 16]}>
                  {toArray(overview.top_companies).map((c: any, i: number) => (
                    <Col key={i} xs={24} md={12} lg={8}>
                      <Card size="small" className="mini-card">
                        <div className="company-line">
                          <div className="company-name">{c.CompanyName || "ไม่ทราบชื่อบริษัท"}</div>
                          <Tag color="blue">{(c.Count ?? 0).toLocaleString()} ใบสมัคร</Tag>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : <Empty description="ยังไม่มีข้อมูลบริษัท" />}
            </Card>

            {/* Students */}
            <Card
              title={<span className="card-title">รายชื่อนักศึกษา</span>}
              className="section-card"
              extra={
                <Space>
                  <Input allowClear prefix={<ReloadOutlined rotate={90} style={{ opacity: 0 }} />} placeholder="ค้นหานักศึกษา..." style={{ width: 260 }}
                    value={qTyping} onChange={(e) => setQTyping(e.target.value)} onPressEnter={(e) => setQ((e.target as HTMLInputElement).value.trim())}/>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Table size="middle" sticky scroll={{ x: true }} dataSource={students} columns={studentsColumns} rowKey="id"
                className="nice-table" locale={{ emptyText: <Empty description="ยังไม่มีข้อมูลนักศึกษา" /> }}
                pagination={{
                  current: page, pageSize, total: studentsTotal, showSizeChanger: true, showQuickJumper: true,
                  showTotal: (t, r) => `${r[0]}-${r[1]} จาก ${t} รายการ`,
                  onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                }}
              />
            </Card>

            {/* Applications */}
            <Card
              title={<span className="card-title">ใบสมัครล่าสุด</span>}
              className="section-card"
              extra={
                <Space>
                  <Select placeholder="เลือกสถานะ" allowClear style={{ width: 240 }} value={status || undefined} onChange={(v) => setStatus(v || "")}>
                    <Option value="รอการนัดสัมภาษณ์">รอการนัดสัมภาษณ์</Option>
                    <Option value="กำลังพิจารณา">กำลังพิจารณา</Option>
                    <Option value="ไม่ได้รับเลือก">ไม่ได้รับเลือก</Option>
                    <Option value="ผ่าน">ผ่าน</Option>
                    <Option value="นัดสัมภาษณ์แล้ว">นัดสัมภาษณ์แล้ว</Option>
                    <Option value="ไม่ผ่าน">ไม่ผ่าน</Option>
                  </Select>
                </Space>
              }
            >
              <div style={{ marginBottom: 12 }}>
                <Space wrap>
                  {[
                    { label: "ทั้งหมด", value: "" },
                    { label: "รอการนัดสัมภาษณ์", value: "รอการนัดสัมภาษณ์" },
                    { label: "กำลังพิจารณา", value: "กำลังพิจารณา" },
                    { label: "ไม่ได้รับเลือก", value: "ไม่ได้รับเลือก" },
                    { label: "ผ่าน", value: "ผ่าน" },
                    { label: "นัดสัมภาษณ์แล้ว", value: "นัดสัมภาษณ์แล้ว" },
                    { label: "ไม่ผ่าน", value: "ไม่ผ่าน" },
                  ].map((opt) => (
                    <Button key={opt.value || "all"} size="small" type={status === opt.value ? "primary" : "default"} onClick={() => setStatus(opt.value)}>
                      {opt.label}
                    </Button>
                  ))}
                </Space>
              </div>
              <Table size="middle" sticky scroll={{ x: true }} dataSource={apps} columns={applicationsColumns} rowKey="id"
                className="nice-table" locale={{ emptyText: <Empty description="ยังไม่มีข้อมูลใบสมัคร" /> }}
                pagination={{ total: appsTotal, pageSize: 8, showTotal: (t, r) => `${r[0]}-${r[1]} จาก ${t} รายการ` }}
              />
            </Card>
          </Spin>
        </div>

        {/* Modal */}
        <Modal
          open={studentApplicationsModal}
          title={<span>ใบสมัครของ <b>{selectedStudentInfo ? `${selectedStudentInfo.first_name} ${selectedStudentInfo.last_name}` : "นักศึกษา"}</b></span>}
          width={900}
          onCancel={() => { setStudentApplicationsModal(false); setSelectedStudentApps([]); setSelectedStudentInfo(null); }}
          className="fade-modal"
          footer={[
            <Button key="export" type="primary" onClick={() => {
              const data = (Array.isArray(selectedStudentApps) ? selectedStudentApps : []).map((app: any) => ({
                บริษัท: app.company_name || app.company || "-", ตำแหน่ง: app.position || app.post_name || "-",
                สถานะ: app.status || "-", วันที่สมัคร: fmtDate(app.date || app.submit_at),
              }));
              exportToCSV(data, `ใบสมัคร_${selectedStudentInfo?.first_name || ""}_${selectedStudentInfo?.last_name || ""}`);
            }}>ส่งออก (CSV)</Button>,
            <Button key="close" onClick={() => setStudentApplicationsModal(false)}>ปิด</Button>,
          ]}
        >
          <Spin spinning={loadingStudentApps}>
            <Table size="middle" dataSource={Array.isArray(selectedStudentApps) ? selectedStudentApps : []} rowKey="id"
              pagination={{ pageSize: 8 }} locale={{ emptyText: <Empty description="ยังไม่มีข้อมูลใบสมัครของนักศึกษาคนนี้" /> }}
              columns={[
                { title: "บริษัท", key: "company", ellipsis: true as any, render: (_: any, r: any) => r.company_name || r.company || "-" },
                { title: "ตำแหน่ง", key: "position", ellipsis: true as any, render: (_: any, r: any) => r.position || r.post_name || "-" },
                { title: "สถานะ", dataIndex: "status", key: "status", width: 140, render: (s: string) => <Tag color={getStatusColor(s)}>{s || "-"}</Tag> },
                { title: "วันที่สมัคร", key: "date", width: 140, render: (_: any, r: any) => fmtDate(r.date || r.submit_at) },
                { title: "ไฟล์แนบ", key: "files", render: (_: any, r: any) => { const resume = r.resume || r.resume_url, transcript = r.transcript || r.transcript_url; return <Space wrap><Button size="small" icon={<EyeOutlined />} onClick={() => downloadFile(resume)} disabled={!resume}>Resume</Button><Button size="small" icon={<EyeOutlined />} onClick={() => downloadFile(transcript)} disabled={!transcript}>Transcript</Button></Space>; } },
              ]}
            />
          </Spin>
        </Modal>

        {/* Styles */}
        <style jsx>{`
          .adminpage-layout { display:flex; flex-direction:column; padding:24px; min-height:100vh; background:linear-gradient(180deg,#f0f5ff 0%,#fafafa 100%); animation:fadeIn .6s ease-in-out; }
          .header-hero { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding:20px 24px; margin-bottom:20px; background:#fff; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,.08); position:sticky; top:0; z-index:2; }
          .page-subtitle { color:#8c8c8c; margin-top:4px; font-size:14px; }

          /* ====== Make KPI equal height ====== */
          .kpi-row .kpi-col { display:flex; }
          .kpi-card { flex:1; display:flex; }
          .kpi-card .ant-card-body { display:flex; width:100%; padding:18px; }
          .kpi-inner { display:flex; align-items:center; gap:14px; width:100%; }
          .kpi-inner.status { align-items:flex-start; }
          .stat-icon { display:inline-flex; align-items:center; justify-content:center; width:46px; height:46px; border-radius:50%; background:#e6f7ff; color:#1677ff; font-size:20px; flex:0 0 46px; }
          .stat-icon.green { background:#f6ffed; color:#52c41a; }
          .stat-block { display:flex; flex-direction:column; gap:6px; }
          .kpi-sub { font-size:12px; color:#8c8c8c; }

          /* Status list (balanced & aligned) */
          .status-title { font-weight:600; color:#262626; margin-bottom:8px; }
          .status-list { display:flex; flex-direction:column; gap:8px; width:100%; }
          .status-list .row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
          .status-list .row.total { font-weight:600; }
          .status-list .divider { height:1px; background:rgba(0,0,0,.06); margin:4px 0; }
          .left { display:flex; align-items:center; gap:8px; color:#595959; }
          .right { color:#262626; min-width:48px; text-align:right; }
          .dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
          .dot.green { background:#52c41a; } .dot.blue { background:#1677ff; } .dot.purple { background:#722ed1; } .dot.orange { background:#faad14; } .dot.red { background:#ff4d4f; }

          .section-card { border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,.08); }
          .mini-card { border-radius:10px; }
          .company-line { display:flex; align-items:center; justify-content:space-between; }
          .company-name { color:#262626; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70%; }

          .nice-table :where(.ant-table) { border-radius:10px; overflow:hidden; }
          .nice-table .ant-table-tbody > tr:hover > td { background:#f0f7ff !important; }

          .btn-primary-soft { background:#e6f7ff; color:#1677ff; border:1px solid #91d5ff; }
          .card-head { display:flex; align-items:center; gap:10px; font-weight:600; }
          .chart-wrap { width:100%; height:320px; }

          .fade-modal .ant-modal-content { border-radius:12px; }
          @keyframes fadeIn { from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }
        `}</style>
      </Layout>
    </ConfigProvider>
  );
};

export default AcademicDashboard;
