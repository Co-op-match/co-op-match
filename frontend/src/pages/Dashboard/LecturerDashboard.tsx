import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Input,
  Select,
  Button,
  message,
  Spin,
  Typography,
  Tag,
  Space,
  Badge,
  Modal,
  Dropdown,
  Menu,
  Layout,
  ConfigProvider,
  Empty,
  Tabs,
  Image,
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  StarOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ExportOutlined,
  FileExcelOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { GetApplicationsByStudentID } from "../../services/https/Application";
import {
  getAcademicOverview,
  listAcademicApplications,
  listAcademicStudents,
} from "../../services/https";
import AcademicStaffHeader from "../Component/AcademicStaffHeader";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// ===== helpers =====
type AnyRow = Record<string, unknown>;

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.items)) return v.items;
  if (Array.isArray(v?.data)) return v.data;
  return [];
};

const convertToCSV = (data: AnyRow[]): string => {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const escapeCell = (val: unknown) => {
    if (val == null) return "";
    let s = String(val).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const headerLine = headers.map(escapeCell).join(",");
  const rows = data.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(",")
  );
  return [headerLine, ...rows].join("\n");
};

const exportToCSV = (data: AnyRow[], filename: string) => {
  const bom = "\uFEFF";
  const blob = new Blob([bom + convertToCSV(data)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// map สีสำหรับสถานะ
const getStatusColor = (s: string) => {
  const statusColors: Record<string, string> = {
    รอการนัดสัมภาษณ์: "orange",
    กำลังพิจารณา: "blue",
    ไม่ได้รับเลือก: "red",
    ผ่าน: "green",
    นัดสัมภาษณ์แล้ว: "purple",
    ไม่ผ่าน: "red",
  };
  return statusColors[s] || "default";
};

// คำนวณ total applications + delta เทียบเดือนก่อน (จาก apps_per_month)
const calcTotalAndDelta = (appsPerMonth: any[] | undefined) => {
  const arr = toArray(appsPerMonth);
  const total = arr.reduce(
    (sum: number, it: any) => sum + Number(it?.count || 0),
    0
  );
  let deltaPct: number | null = null;

  if (arr.length >= 2) {
    // เอา 2 เดือนล่าสุด
    const sorted = [...arr].sort((a: any, b: any) =>
      String(a.period).localeCompare(String(b.period))
    );
    const last = Number(sorted[sorted.length - 1]?.count || 0);
    const prev = Number(sorted[sorted.length - 2]?.count || 0);
    if (prev > 0) {
      deltaPct = ((last - prev) / prev) * 100;
    } else if (prev === 0 && last > 0) {
      deltaPct = 100; // จาก 0 ไปเป็นค่าบวก
    } else {
      deltaPct = 0;
    }
  }
  return { total, deltaPct };
};

// ทำข้อมูลกราฟให้เหมาะกับ Recharts
const mapSeries = (
  arr: any[] | undefined,
  labelKey = "period",
  valueKey = "count"
) => {
  return toArray(arr).map((it: any) => ({
    name: it?.[labelKey],
    value: Number(it?.[valueKey] ?? 0),
  }));
};

const AcademicDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [apps, setApps] = useState<any[]>([]);
  const [appsTotal, setAppsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const firstLoadRef = useRef(true);

  // Modal states
  const [studentApplicationsModal, setStudentApplicationsModal] =
    useState(false);
  const [selectedStudentApps, setSelectedStudentApps] = useState<any[]>([]);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<any>(null);
  const [loadingStudentApps, setLoadingStudentApps] = useState(false);

  const userID = Number(localStorage.getItem("id"));

  const viewStudentApplications = async (student: any) => {
    setSelectedStudentInfo(student);
    setLoadingStudentApps(true);
    setStudentApplicationsModal(true);
    try {
      const applications = await GetApplicationsByStudentID(student.id);
      setSelectedStudentApps(toArray(applications));
    } catch (error) {
      messageApi.error("ไม่สามารถโหลดข้อมูลใบสมัครได้");
      console.error(error);
    } finally {
      setLoadingStudentApps(false);
    }
  };

  const exportStudentsData = () => {
    const exportData = students.map((student: any) => ({
      ชื่อ: student.first_name,
      นามสกุล: student.last_name,
      อายุ: student.age,
      เพศ: student.gender,
      สาขา: student.program_name,
      คณะ: student.faculty_name,
      มหาวิทยาลัย: student.university_name,
      จำนวนใบสมัคร: student.applications_total,
    }));
    exportToCSV(exportData, "รายชื่อนักศึกษา");
  };

  const exportApplicationsData = () => {
    const exportData = apps.map((app: any) => ({
      ชื่อนักศึกษา: app.student_full_name,
      บริษัท: app.company_name,
      ตำแหน่ง: app.post_name,
      สถานะ: app.status,
      วันที่สมัคร: app.submit_at
        ? new Date(app.submit_at).toLocaleDateString("th-TH")
        : "",
    }));
    exportToCSV(exportData, "ใบสมัครล่าสุด");
  };

  const exportMenu = (
    <Menu
      items={[
        {
          key: "students",
          icon: <FileExcelOutlined />,
          label: "ส่งออกรายชื่อนักศึกษา (CSV)",
          onClick: exportStudentsData,
        },
        {
          key: "applications",
          icon: <FileExcelOutlined />,
          label: "ส่งออกใบสมัครล่าสุด (CSV)",
          onClick: exportApplicationsData,
        },
      ]}
    />
  );

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

      if (firstLoadRef.current) {
        messageApi.success("โหลดข้อมูลวิเคราะห์สำเร็จ");
        firstLoadRef.current = false;
      }
    } catch (err) {
      console.error(err);
      messageApi.error("โหลดข้อมูลวิเคราะห์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userID) {
      messageApi.error("ไม่พบข้อมูลของอาจารย์");
      return;
    }
    fetchAll();
  }, [userID, page, pageSize, q, status]);

  // ====== Data for charts & KPI delta ======
  const weeklySeries = useMemo(
    () => mapSeries(overview?.apps_per_week),
    [overview?.apps_per_week]
  );
  const monthlySeries = useMemo(
    () => mapSeries(overview?.apps_per_month),
    [overview?.apps_per_month]
  );
  const semesterSeries = useMemo(
    () => mapSeries(overview?.apps_per_semester),
    [overview?.apps_per_semester]
  );

  const applicationsTotalAndDelta = useMemo(
    () => calcTotalAndDelta(overview?.apps_per_month),
    [overview?.apps_per_month]
  );

  /*****************************************************************/
  // ==== helpers สำหรับ preview ====
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

  const toFileURL = (p?: string) =>
    !p ? "" : /^https?:\/\//i.test(p) ? p : `${API_BASE}${p}`;
  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("th-TH") : "-";

  type FileKind = "image" | "pdf" | "other";
  const getFileKind = (src?: string): FileKind => {
    if (!src) return "other";
    const clean = src.split("?")[0].toLowerCase();
    if (clean.endsWith(".pdf")) return "pdf";
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(clean)) return "image";
    return "other";
  };

  const [filePreview, setFilePreview] = useState<{
    open: boolean;
    title?: string;
    src?: string;
    kind?: FileKind;
  }>({ open: false });

  const openPreview = (title: string, src?: string) => {
    const url = toFileURL(src);
    if (!url) return;
    setFilePreview({ open: true, title, src: url, kind: getFileKind(src) });
  };

  const downloadFile = (src?: string) => {
    const url = toFileURL(src);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = "";
    a.click();
  };
  /*****************************************************************/

  // ====== Columns ======
  const studentsColumns = [
    {
      title: "ชื่อ-นามสกุล",
      key: "name",
      render: (_: any, record: any) => (
        <span className="text-strong">{`${record.first_name} ${record.last_name}`}</span>
      ),
    },
    { title: "อายุ", dataIndex: "age", key: "age", width: 80 },
    { title: "เพศ", dataIndex: "gender", key: "gender", width: 80 },
    { title: "สาขา", dataIndex: "program_name", key: "program_name" },
    { title: "คณะ", dataIndex: "faculty_name", key: "faculty_name" },
    {
      title: "จำนวนใบสมัคร",
      dataIndex: "applications_total",
      key: "applications_total",
      width: 120,
      render: (count: number) => <Badge count={count} showZero />,
    },
    {
      title: "การดำเนินการ",
      key: "action",
      width: 140,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => viewStudentApplications(record)}
          className="btn-primary-soft"
        >
          ดูใบสมัคร
        </Button>
      ),
    },
  ];

  const applicationsColumns = [
    {
      title: "ชื่อนักศึกษา",
      dataIndex: "student_full_name",
      key: "student_full_name",
    },
    { title: "บริษัท", dataIndex: "company_name", key: "company_name" },
    { title: "ตำแหน่ง", dataIndex: "post_name", key: "post_name" },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag>,
    },
    {
      title: "วันที่สมัคร",
      dataIndex: "submit_at",
      key: "submit_at",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("th-TH") : "-",
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          colorInfo: "#1677ff",
          colorLink: "#1677ff",
          colorText: "#0B2545",
          colorBgLayout: "#f6fbff",
          borderRadiusLG: 14,
          boxShadow: "0 10px 24px rgba(22, 119, 255, 0.08)",
        },
        components: {
          Card: {
            headerBg: "transparent",
            boxShadowTertiary: "0 8px 24px rgba(0,0,0,0.05)",
          },
          Table: {
            headerBg: "#ebf4ff",
            headerColor: "#0B2545",
            borderColor: "#e6f0ff",
            rowHoverBg: "#f6fbff",
          },
          Statistic: { titleColor: "#40658A", contentFontSize: 24 },
          Badge: { colorBorderBg: "#f0f7ff" },
          Tag: { defaultBg: "#eaf3ff", defaultColor: "#0B2545" },
          Button: { controlHeight: 36 },
          Input: { activeShadow: "0 0 0 3px rgba(22, 119, 255, 0.16)" },
          Select: { activeBorderColor: "#1677ff" },
        },
      }}
    >
      <Layout>
        <AcademicStaffHeader />
        <div className="adminpage-layout">
          {contextHolder}

          <div className="page-header">
            <div>
              <Title level={2} style={{ margin: 0, color: "#0B2545" }}>
                📊 แดชบอร์ดอาจารย์
              </Title>
              <div className="page-subtitle">
                ภาพรวมการสมัครงานของนักศึกษาในที่ปรึกษา
              </div>
            </div>
            <Space>
              <Dropdown
                overlay={exportMenu}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button icon={<ExportOutlined />}>ส่งออก</Button>
              </Dropdown>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchAll}
                loading={loading}
              >
                รีเฟรช
              </Button>
            </Space>
          </div>

          <Spin spinning={loading}>
            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="card-glow">
                  <div className="stat">
                    <div className="stat-icon">
                      <UserOutlined />
                    </div>
                    <Statistic
                      title="จำนวนนักศึกษา"
                      value={overview?.students || 0}
                    />
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="card-glow">
                  <div className="stat">
                    <div className="stat-icon green">
                      <FileTextOutlined />
                    </div>
                    <Statistic
                      title={
                        <Space>
                          ใบสมัครทั้งหมด
                          {applicationsTotalAndDelta.deltaPct !== null && (
                            <Tag
                              color={
                                applicationsTotalAndDelta.deltaPct >= 0
                                  ? "green"
                                  : "red"
                              }
                            >
                              {applicationsTotalAndDelta.deltaPct >= 0
                                ? "▲"
                                : "▼"}{" "}
                              {Math.abs(
                                applicationsTotalAndDelta.deltaPct
                              ).toFixed(1)}
                              %
                            </Tag>
                          )}
                        </Space>
                      }
                      value={
                        overview?.applications_by_status?.reduce(
                          (sum: number, item: any) =>
                            sum + Number(item.count || 0),
                          0
                        ) || 0
                      }
                    />
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="card-glow">
                  <div className="stat">
                    <div className="stat-icon amber">
                      <CalendarOutlined />
                    </div>
                    <Statistic
                      title="นัดสัมภาษณ์ที่จะมาถึง"
                      value={overview?.interviews_upcoming || 0}
                    />
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="card-glow">
                  <div className="stat">
                    <div className="stat-icon red">
                      <StarOutlined />
                    </div>
                    <Statistic
                      title="รีวิวทั้งหมด"
                      value={overview?.reviews_total || 0}
                    />
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Trend Charts */}
            <Card
              title="แนวโน้มการสมัคร"
              className="section-card"
              style={{ marginBottom: 24 }}
            >
              <Tabs
                defaultActiveKey="week"
                items={[
                  {
                    key: "week",
                    label: "รายสัปดาห์",
                    children: weeklySeries.length ? (
                      <div style={{ width: "100%", height: 280 }}>
                        <ResponsiveContainer>
                          <LineChart data={weeklySeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <RTooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="value"
                              name="จำนวนใบสมัคร"
                              dot
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Empty description="ยังไม่มีข้อมูลรายสัปดาห์" />
                    ),
                  },
                  {
                    key: "month",
                    label: "รายเดือน",
                    children: monthlySeries.length ? (
                      <div style={{ width: "100%", height: 280 }}>
                        <ResponsiveContainer>
                          <LineChart data={monthlySeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <RTooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="value"
                              name="จำนวนใบสมัคร"
                              dot
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Empty description="ยังไม่มีข้อมูลรายเดือน" />
                    ),
                  },
                  {
                    key: "semester",
                    label: "รายเทอม",
                    children: semesterSeries.length ? (
                      <div style={{ width: "100%", height: 280 }}>
                        <ResponsiveContainer>
                          <LineChart data={semesterSeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <RTooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="value"
                              name="จำนวนใบสมัคร"
                              dot
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Empty description="ยังไม่มีข้อมูลรายเทอม" />
                    ),
                  },
                ]}
              />
            </Card>

            {/* Application Status Summary */}
            {overview?.applications_by_status && (
              <Card
                title="สถานะใบสมัครทั้งหมด"
                className="section-card"
                style={{ marginBottom: 24 }}
              >
                <Row gutter={[16, 16]}>
                  {overview.applications_by_status.map(
                    (item: any, idx: number) => (
                      <Col key={idx} xs={12} sm={8} lg={4}>
                        <Card size="small" className="mini-card">
                          <div className="mini-stat">
                            <div
                              className={`bullet ${getStatusColor(item.key)}`}
                            />
                            <div className="mini-title">{item.key}</div>
                          </div>
                          <div className="mini-value">
                            {Number(item.count || 0).toLocaleString()}
                          </div>
                        </Card>
                      </Col>
                    )
                  )}
                </Row>
              </Card>
            )}

            {/* Top Companies */}
            <Card
              title="บริษัทที่นักศึกษาสมัครมากที่สุด"
              className="section-card"
              style={{ marginBottom: 24 }}
            >
              {toArray(overview?.top_companies).length ? (
                <Row gutter={[16, 16]}>
                  {toArray(overview.top_companies).map((c: any, i: number) => (
                    <Col key={i} xs={24} md={12} lg={8}>
                      <Card size="small" className="mini-card">
                        <div className="company-line">
                          <div className="company-name">
                            {c.CompanyName || "ไม่ทราบชื่อบริษัท"}
                          </div>
                          <Tag color="blue">{c.Count ?? 0} ใบสมัคร</Tag>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty description="ยังไม่มีข้อมูลบริษัท" />
              )}
            </Card>

            {/* Students Table */}
            <Card
              title={<span className="card-title">รายชื่อนักศึกษา</span>}
              className="section-card"
              extra={
                <Space>
                  <Search
                    placeholder="ค้นหานักศึกษา..."
                    allowClear
                    style={{ width: 240 }}
                    onSearch={(value) => setQ(value)}
                  />
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Table
                dataSource={students}
                columns={studentsColumns}
                rowKey="id"
                className="nice-table zebra"
                locale={{
                  emptyText: <Empty description="ยังไม่มีข้อมูลนักศึกษา" />,
                }}
                pagination={{
                  current: page,
                  pageSize: pageSize,
                  total: studentsTotal,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} จาก ${total} รายการ`,
                  onChange: (newPage, newPageSize) => {
                    setPage(newPage);
                    setPageSize(newPageSize);
                  },
                }}
              />
            </Card>

            {/* Applications Table */}
            <Card
              title={<span className="card-title">ใบสมัครล่าสุด</span>}
              className="section-card"
              extra={
                <Space>
                  <Select
                    placeholder="เลือกสถานะ"
                    allowClear
                    style={{ width: 220 }}
                    value={status || undefined}
                    onChange={(v) => setStatus(v || "")}
                  >
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
              <Table
                dataSource={apps}
                columns={applicationsColumns}
                rowKey="id"
                className="nice-table zebra"
                locale={{
                  emptyText: <Empty description="ยังไม่มีข้อมูลใบสมัคร" />,
                }}
                pagination={{
                  total: appsTotal,
                  pageSize: 8,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} จาก ${total} รายการ`,
                }}
              />
            </Card>
          </Spin>
        </div>

        {/* ===== Modal: ใบสมัครของนักศึกษา ===== */}
        <Modal
          open={studentApplicationsModal}
          title={
            <span>
              ใบสมัครของ{" "}
              <b>
                {selectedStudentInfo
                  ? `${selectedStudentInfo.first_name} ${selectedStudentInfo.last_name}`
                  : "นักศึกษา"}
              </b>
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
              type="primary"
              onClick={() => {
                const exportData = (
                  Array.isArray(selectedStudentApps) ? selectedStudentApps : []
                ).map((app: any) => ({
                  บริษัท: app.company_name || app.company || "-",
                  ตำแหน่ง: app.position || app.post_name || "-",
                  สถานะ: app.status || "-",
                  วันที่สมัคร: fmtDate(app.date || app.submit_at),
                }));
                exportToCSV(
                  exportData,
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
              onClick={() => setStudentApplicationsModal(false)}
            >
              ปิด
            </Button>,
          ]}
        >
          <Spin spinning={loadingStudentApps}>
            <Table
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
                  render: (_: any, r: any) =>
                    r.company_name || r.company || "-",
                },
                {
                  title: "ตำแหน่ง",
                  key: "position",
                  render: (_: any, r: any) => r.position || r.post_name || "-",
                },
                {
                  title: "สถานะ",
                  dataIndex: "status",
                  key: "status",
                  render: (s: string) => (
                    <Tag color={getStatusColor(s)}>{s || "-"}</Tag>
                  ),
                },
                {
                  title: "วันที่สมัคร",
                  key: "date",
                  render: (_: any, r: any) => fmtDate(r.date || r.submit_at),
                },
                {
                  title: "ไฟล์แนบ",
                  key: "files",
                  render: (_: any, r: any) => (
                    <Space wrap>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => openPreview("Resume", r.resume)}
                        disabled={!r.resume}
                      >
                        Resume
                      </Button>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadFile(r.resume)}
                        disabled={!r.resume}
                      />
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => openPreview("Transcript", r.transcript)}
                        disabled={!r.transcript}
                      >
                        Transcript
                      </Button>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadFile(r.transcript)}
                        disabled={!r.transcript}
                      />
                    </Space>
                  ),
                },
              ]}
            />
          </Spin>
        </Modal>

        {/* ===== Modal: Preview ไฟล์แนบ ===== */}
        <Modal
          open={filePreview.open}
          title={filePreview.title}
          footer={null}
          width={900}
          onCancel={() => setFilePreview({ open: false })}
        >
          {filePreview.open && filePreview.src ? (
            filePreview.kind === "pdf" ? (
              // ใช้ <object> เพื่อฝัง PDF พร้อม fallback
              <object
                data={filePreview.src}
                type="application/pdf"
                width="100%"
                height="700"
                aria-label="PDF preview"
              >
                <p style={{ margin: 0 }}>
                  ไม่สามารถแสดง PDF ในหน้านี้ได้{" "}
                  <a href={filePreview.src} target="_blank" rel="noreferrer">
                    เปิดในแท็บใหม่
                  </a>{" "}
                  หรือดาวน์โหลดไฟล์เพื่อตรวจดู
                </p>
              </object>
            ) : filePreview.kind === "image" ? (
              <img
                src={filePreview.src}
                alt={filePreview.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: 700,
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            ) : (
              <p>
                ไม่รองรับไฟล์ชนิดนี้{" "}
                <a href={filePreview.src} target="_blank" rel="noreferrer">
                  เปิดไฟล์ในแท็บใหม่
                </a>
              </p>
            )
          ) : null}
        </Modal>

        {/* THEME STYLES */}
        <style jsx>{`
          :root {
            --blue-50: #f6fbff;
            --blue-100: #ebf4ff;
            --ink-900: #0b2545;
          }

          .adminpage-layout {
            display: flex;
            flex-direction: column;
            padding: 24px;
            min-height: 100vh;
            position: relative;
            background: radial-gradient(
                1200px 800px at -10% 0%,
                rgba(22, 119, 255, 0.08),
                transparent 60%
              ),
              radial-gradient(
                800px 600px at 110% -10%,
                rgba(64, 153, 255, 0.09),
                transparent 60%
              ),
              linear-gradient(180deg, #ffffff 0%, var(--blue-50) 100%);
          }

          .page-header {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(
              135deg,
              #ffffff 0%,
              var(--blue-50) 100%
            );
            border: 1px solid #eaf2ff;
            padding: 16px 20px;
            border-radius: 14px;
            box-shadow: 0 8px 28px rgba(22, 119, 255, 0.06);
          }

          .page-subtitle {
            margin-top: 4px;
            color: #5a6b85;
            font-size: 13px;
          }

          .card-glow {
            border: 1px solid #eaf2ff;
            box-shadow: 0 10px 24px rgba(22, 119, 255, 0.08);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .card-glow:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 36px rgba(22, 119, 255, 0.12);
          }

          .section-card {
            border: 1px solid #eaf2ff;
            box-shadow: 0 10px 24px rgba(22, 119, 255, 0.06);
          }

          .card-title {
            color: var(--ink-900);
            font-weight: 600;
          }

          .stat {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            background: rgba(22, 119, 255, 0.12);
            color: #1677ff;
            font-size: 18px;
          }
          .stat-icon.green {
            background: rgba(82, 196, 26, 0.12);
            color: #52c41a;
          }
          .stat-icon.amber {
            background: rgba(250, 173, 20, 0.15);
            color: #faad14;
          }
          .stat-icon.red {
            background: rgba(245, 34, 45, 0.12);
            color: #f5222d;
          }

          .mini-card {
            border: 1px solid #eaf2ff;
          }
          .mini-stat {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .mini-title {
            font-size: 12px;
            color: #445b79;
          }
          .mini-value {
            font-size: 20px;
            font-weight: 700;
            margin-top: 6px;
            color: var(--ink-900);
          }
          .bullet {
            width: 10px;
            height: 10px;
            border-radius: 999px;
            background: #1677ff;
          }
          .bullet.green {
            background: #52c41a;
          }
          .bullet.red {
            background: #f5222d;
          }
          .bullet.orange {
            background: #faad14;
          }
          .bullet.purple {
            background: #722ed1;
          }

          .company-line {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .company-name {
            font-weight: 600;
            color: var(--ink-900);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding-right: 8px;
          }

          .nice-table :global(.ant-table-thead > tr > th) {
            background: var(--blue-100) !important;
            color: var(--ink-900) !important;
            font-weight: 600;
          }
          .nice-table :global(.ant-table) {
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #eaf2ff;
          }
          .zebra :global(.ant-table-tbody > tr:nth-child(odd) > td) {
            background: #ffffff;
          }
          .zebra :global(.ant-table-tbody > tr:nth-child(even) > td) {
            background: #fdfefe;
          }
          .nice-table :global(.ant-table-tbody > tr:hover > td) {
            background: var(--blue-50) !important;
          }

          .btn-primary-soft {
            background: linear-gradient(180deg, #ffffff, #f4f9ff);
            border: 1px solid #d8e8ff;
            color: #1677ff;
          }
          .btn-primary-soft:hover {
            border-color: #1677ff;
            color: #0a5ce6;
          }

          .text-strong {
            color: var(--ink-900);
            font-weight: 600;
          }
        `}</style>
      </Layout>
    </ConfigProvider>
  );
};

export default AcademicDashboard;
