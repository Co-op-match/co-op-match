import { useEffect, useState } from "react";
import { Card, Row, Col, Table, Button, Space, Statistic, Tag, Layout, Segmented, DatePicker, message } from "antd";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Legend, Bar } from "recharts";
import { EyeOutlined, UserOutlined, TeamOutlined, BankOutlined, BookOutlined, ClockCircleOutlined, FileTextOutlined, RiseOutlined, LineChartOutlined, ThunderboltOutlined } from "@ant-design/icons";
import AdminHeader from "./../Component/AdminCoopMatchHeaderDefault";
import { GetAdminDashboardOverview, GetTrendForAdmin, GetAllLoginLogs, GetAllUser, GetTopPopular, GetUpliftPassFail } from "../../services/https";
import type { LoginLogInterface } from "../../interfaces/LoginLog";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import type { PopularCompanyInterface, PopularMajorInterface, UpliftRespInterface } from "@/interfaces/Analysis";

/* ========================= Types ========================= */
type VerifyStatusItem = { status: string; count: number };
type Overview = { applications: number; companies: number; total_users: number; students: number; pending_posts: number; verify_statuses: VerifyStatusItem[] };
type UserRole = { name: string; value: number; color: string };
type TrendPoint = { date: string; total: number; pass: number; review: number; interviewed: number; waiting_schedule: number; fail: number };
type UserLite = { ID?: number; Email?: string; Role?: { RoleName?: string }; is_active?: boolean; CreatedAt?: string };

const { RangePicker } = DatePicker;

/* ========================= Component ========================= */
const CoopDashboard = () => {
  const navigate = useNavigate();

  /* -------- States -------- */
  const [overviewData, setOverviewData] = useState<Overview>({ applications: 0, companies: 0, total_users: 0, students: 0, pending_posts: 0, verify_statuses: [] });
  const [userRoleData, setUserRoleData] = useState<UserRole[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogInterface[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(7);
  const [trendRange, setTrendRange] = useState<[Dayjs, Dayjs] | null>(null);

  const [topMajors, setTopMajors] = useState<PopularMajorInterface[]>([]);
  const [topCompanies, setTopCompanies] = useState<PopularCompanyInterface[]>([]);
  const [uplift, setUplift] = useState<UpliftRespInterface | null>(null);

  /* -------- Effects (รวม refresh 60s ไว้ที่เดียว) -------- */
  useEffect(() => {
    const refreshAll = () => {
      fetchOverviewAndLogs();
      loadAllUsers();
      fetchTrend();
      fetchPopular();
      fetchUplift();
    };
    refreshAll(); // run now

    const timer = setInterval(refreshAll, 60_000);
    return () => clearInterval(timer);
  }, [trendDays, trendRange?.[0]?.valueOf(), trendRange?.[1]?.valueOf()]);

  /* ========================= API calls (จัดกลุ่มชิดกัน) ========================= */
  const fetchOverviewAndLogs = async () => {
    try {
      const [overviewRes, loginLogsRes] = await Promise.all([GetAdminDashboardOverview(), GetAllLoginLogs()]);
      const raw = overviewRes?.data ?? {};
      const safeOverview: Overview = {
        applications: Number(raw?.applications ?? 0),
        companies: Number(raw?.companies ?? 0),
        total_users: Number(raw?.total_users ?? 0),
        students: Number(raw?.students ?? 0),
        pending_posts: Number(raw?.pending_posts ?? 0),
        verify_statuses: Array.isArray(raw?.verify_statuses) ? raw.verify_statuses : [],
      };
      setOverviewData(safeOverview);
      setLoginLogs(Array.isArray(loginLogsRes?.data) ? loginLogsRes.data : []);
    } catch {
      message.error("ไม่สามารถโหลดภาพรวม/บันทึกการเข้าสู่ระบบได้");
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await GetAllUser();
      const u = Array.isArray(res?.data) ? (res.data as UserLite[]) : [];
      const counts = u.reduce(
        (acc, user) => {
          const role = String(user?.Role?.RoleName || "").toLowerCase();
          if (role === "student") acc.students += 1;
          else if (role === "company") acc.companies += 1;
          else if (role === "academicstaff") acc.academic_staff += 1;
          else if (role === "admin") acc.admins += 1;
          return acc;
        },
        { students: 0, companies: 0, academic_staff: 0, admins: 0 }
      );
      setUserRoleData([
        { name: "นักศึกษา", value: counts.students, color: "#1890ff" },
        { name: "บริษัท", value: counts.companies, color: "#52c41a" },
        { name: "อาจารย์", value: counts.academic_staff, color: "#722ed1" },
        { name: "แอดมิน", value: counts.admins, color: "#faad14" },
      ]);
      setOverviewData(prev => ({ ...prev, total_users: u.length }));
    } catch { /* ignore */ }
  };

  const fetchTrend = async () => {
    try {
      const params: any = trendRange && trendRange[0] && trendRange[1]
        ? { start: trendRange[0].format("YYYY-MM-DD"), end: trendRange[1].format("YYYY-MM-DD") }
        : { days: trendDays };
      const res = await GetTrendForAdmin(params);
      setTrendData(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      message.error(e?.response?.data?.error || "โหลดแนวโน้มไม่สำเร็จ");
    }
  };

  const fetchPopular = async () => {
    try {
      const res = await GetTopPopular();
      const data = res?.data || {};
      setTopMajors(Array.isArray(data?.top_majors) ? data.top_majors : []);
      setTopCompanies(Array.isArray(data?.top_companies) ? data.top_companies : []);
    } catch (e:any) {
      message.error(e?.response?.data?.error || "โหลดสาขา/บริษัทยอดนิยมไม่สำเร็จ");
    }
  };

  const fetchUplift = async () => {
    try {
      const res = await GetUpliftPassFail();
      const d = (res?.data || {}) as UpliftRespInterface;
      setUplift({
        recommended: {
          total: d?.recommended?.total ?? 0,
          pass: d?.recommended?.pass ?? 0,
          fail: d?.recommended?.fail ?? 0,
          pass_rate: d?.recommended?.pass_rate ?? null,
          fail_rate: d?.recommended?.fail_rate ?? null,
          sufficient: Boolean(d?.recommended?.sufficient),
        },
        non_recommended: {
          total: d?.non_recommended?.total ?? 0,
          pass: d?.non_recommended?.pass ?? 0,
          fail: d?.non_recommended?.fail ?? 0,
          pass_rate: d?.non_recommended?.pass_rate ?? null,
          fail_rate: d?.non_recommended?.fail_rate ?? null,
          sufficient: Boolean(d?.non_recommended?.sufficient),
        },
        uplift_pass_rate: d?.uplift_pass_rate ?? null,
        min_sample: d?.min_sample ?? 5,
        note: d?.note,
      });
    } catch (e:any) {
      message.error(e?.response?.data?.error || "โหลด Uplift ไม่สำเร็จ");
    }
  };

  /* ========================= Helpers / Columns ========================= */
  const getRoleIcon = (roleName?: string) =>
    roleName === "Student" ? <UserOutlined style={{ color: "#1890ff" }} /> :
    roleName === "Company" ? <BankOutlined style={{ color: "#52c41a" }} /> :
    roleName === "AcademicStaff" ? <BookOutlined style={{ color: "#722ed1" }} /> :
    roleName === "Admin" ? <TeamOutlined style={{ color: "#faad14" }} /> : <UserOutlined />;

  const loginColumns = [
    {
      title: "ผู้ใช้",
      key: "user",
      render: (_: any, record: LoginLogInterface) => {
        const email = record.User?.Email || "-";
        const role = record.User?.Role?.RoleName || "-";
        return (
          <Space align="start">
            {getRoleIcon(role)}
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ padding: 0, height: "auto" }}>{email}</span>
              <span style={{ color: "GrayText", marginTop: 2, fontSize: 12 }}>{role}</span>
            </div>
          </Space>
        );
      },
    },
    { title: "เข้าใช้", dataIndex: "login_at", key: "login_at", render: (t: string) => (t ? dayjs(t).format("YYYY-MM-DD HH:mm:ss") : "-") },
    { title: "ออกจากระบบ", dataIndex: "logout_at", key: "logout_at", render: (t?: string | null) => (t && String(t).trim() !== "" ? dayjs(t).format("YYYY-MM-DD HH:mm:ss") : <Tag color="green">ยังออนไลน์</Tag>) },
  ];

  const popularMajorCols = [
    { title: "อันดับ", key: "rank", render: (_:any, __:PopularMajorInterface, idx:number) => idx + 1 },
    { title: "สาขา", dataIndex: "job_type", key: "job_type" },
    { title: "จำนวนสมัคร", dataIndex: "apply_count", key: "apply_count" },
  ];

  const popularCompanyCols = [
    { title: "อันดับ", key: "rank", render: (_:any, __:PopularCompanyInterface, idx:number) => idx + 1 },
    { title: "บริษัท", dataIndex: "company_name", key: "company_name" },
    { title: "จำนวนสมัคร", dataIndex: "apply_count", key: "apply_count" },
  ];

  /* -------- Derived -------- */
  const latestLogins = [...loginLogs].sort((a, b) => dayjs(b.login_at).valueOf() - dayjs(a.login_at).valueOf());

  /* ========================= UI ========================= */
  return (
    <Layout>
      <style>{styles}</style>
      <Layout style={{ background: "transparent" }}>
        <AdminHeader />
        <Layout className="adminpage-layout" style={{ padding: 16, background: "transparent" }}>
          <div style={{ margin: 32, marginTop: 16 }}>  
            {/* Header */}
            <div className="dashboard-header">
              <div className="dashboard-title">แดชบอร์ดแอดมิน - CoopMatch</div>
              <div className="dashboard-subtitle">ภาพรวมระบบสหกิจศึกษา</div>
            </div>

            {/* Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stats-card">
                  <Statistic title="ผู้ใช้ทั้งหมด" value={overviewData.total_users || 0} prefix={<TeamOutlined style={{ color: "#3b82f6" }} />} valueStyle={{ color: "#1e3a8a", fontSize: 28, fontWeight: "bold" }} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stats-card">
                  <Statistic title="การสมัครงาน" value={overviewData.applications || 0} prefix={<FileTextOutlined style={{ color: "#3b82f6" }} />} valueStyle={{ color: "#1e3a8a", fontSize: 28, fontWeight: "bold" }} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stats-card clickable" onClick={() => navigate("/admin/verify")}>
                  <Statistic title="รอยืนยันตัวตน" value={overviewData.verify_statuses?.find((s: any) => s.status === "รอรับรอง")?.count || 0} prefix={<ClockCircleOutlined style={{ color: "#3b82f6" }} />} valueStyle={{ color: "#1e3a8a", fontSize: 28, fontWeight: "bold" }} />
                  <div className="action-card__cta" style={{ color: "#1e16b5ff" }}>
                    ดูรายละเอียด <span className="action-card__chev">›</span>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stats-card clickable" onClick={() => navigate("/admin/manage-posts")}>
                  <Statistic title="รอยืนยันโพสต์" value={overviewData.pending_posts} prefix={<ClockCircleOutlined style={{ color: "#3b82f6" }} />} valueStyle={{ color: "#1e3a8a", fontSize: 28, fontWeight: "bold" }} />
                  <div className="action-card__cta" style={{ color: "#1e16b5ff" }}>
                    ดูรายละเอียด <span className="action-card__chev">›</span>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Row 1: role distribution + latest logins */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={12}>
                <Card title="สัดส่วนผู้ใช้ตามบทบาท" className="chart-card">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={userRoleData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {userRoleData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
                    {userRoleData.map((item, index) => (
                      <Col span={12} key={index}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ width: 12, height: 12, backgroundColor: item.color, marginRight: 8, borderRadius: 2 }} />
                          <span style={{ fontSize: 12, color: "#1e3a8a", fontWeight: 500 }}>{item.name}: {item.value}</span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="ผู้ใช้งานล่าสุด" className="activity-card" extra={<Button icon={<EyeOutlined />} onClick={() => navigate("/admin/users")} className="gradient-button" size="small">ดูทั้งหมด</Button>}>
                  <Table dataSource={latestLogins} columns={loginColumns} rowKey="ID" pagination={{ pageSize: 5, showSizeChanger: true }} size="small" scroll={{ y: 280, x: true }} />
                </Card>
              </Col>
            </Row>

            {/* Row 3: Popular (Majors & Companies) */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={12}>
                <Card title="สาขายอดนิยม 5 อันดับแรก" className="chart-card">
                  <Table size="small" rowKey={(r) => r.job_type + String(r.apply_count)} columns={popularMajorCols} dataSource={topMajors} pagination={false} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="บริษัทยอดนิยม 5 อันดับแรก" className="chart-card">
                  <Table size="small" rowKey="company_id" columns={popularCompanyCols} dataSource={topCompanies} pagination={false} />
                </Card>
              </Col>
            </Row>

            {/* Row: Uplift */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={12}>
                <Card title="การเปรียบเทียบ (ผ่านการคัดเลือก)" className="chart-card">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card bordered={false} className="stats-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Statistic
                            title="ผ่านจาก การแนะนำ"
                            value={uplift?.recommended?.pass_rate != null ? `${(uplift.recommended.pass_rate * 100).toFixed(1)}%` : "-"}
                            prefix={<RiseOutlined style={{ color: "#3b82f6" }} />}
                          />
                          {!uplift?.recommended?.sufficient && <Tag color="volcano" style={{ marginLeft: 8 }}>ข้อมูลไม่เพียงพอ</Tag>}
                        </div>
                        <div style={{ color: "#1e3a8a", fontSize: 12, marginTop: 8 }}>
                          {uplift ? `${uplift.recommended.pass} / ${uplift.recommended.total} เรซูเม่` : ""}{uplift ? ` (ขั้นต่ำ ${uplift.min_sample})` : ""}
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card bordered={false} className="stats-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Statistic
                            title="ผ่านจาก ไม่ได้แนะนำ"
                            value={uplift?.non_recommended?.pass_rate != null ? `${(uplift.non_recommended.pass_rate * 100).toFixed(1)}%` : "-"}
                            prefix={<LineChartOutlined style={{ color: "#faad14" }} />}
                          />
                          {!uplift?.non_recommended?.sufficient && <Tag color="volcano" style={{ marginLeft: 8 }}>ข้อมูลไม่เพียงพอ</Tag>}
                        </div>
                        <div style={{ color: "#1e3a8a", fontSize: 12, marginTop: 8 }}>
                          {uplift ? `${uplift.non_recommended.pass} / ${uplift.non_recommended.total} เรซูเม่` : ""}{uplift ? ` (ขั้นต่ำ ${uplift.min_sample})` : ""}
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Row style={{ marginTop: 12 }}>
                    <Col span={24}>
                      <Card bordered={false} className="stats-card">
                        <Statistic
                          title="ผลต่าง (อัตราการผ่าน)"
                          value={uplift?.uplift_pass_rate != null ? `${(uplift.uplift_pass_rate * 100).toFixed(1)}%` : "–"}
                          prefix={<ThunderboltOutlined style={{ color: uplift?.uplift_pass_rate != null ? (uplift.uplift_pass_rate >= 0 ? "#52c41a" : "#ff4d4f") : "#722ed1" }} />}
                          valueStyle={{ color: uplift?.uplift_pass_rate != null ? (uplift.uplift_pass_rate >= 0 ? "#52c41a" : "#ff4d4f") : undefined }}
                        />
                        {uplift?.note && <div style={{ marginTop: 12 }}><Tag color="gold">{uplift.note}</Tag></div>}
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="เทียบสัดส่วน ผ่าน/ไม่ผ่าน ระหว่างงานที่แนะนำ" className="chart-card">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { group: "แนะนำ", Pass: uplift ? Number(uplift.recommended.pass) : 0, Fail: uplift ? Number(uplift.recommended.fail) : 0, Sufficient: uplift?.recommended?.sufficient },
                        { group: "ไม่ได้แนะนำ", Pass: uplift ? Number(uplift.non_recommended.pass) : 0, Fail: uplift ? Number(uplift.non_recommended.fail) : 0, Sufficient: uplift?.non_recommended?.sufficient },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="group" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Pass" name="ผ่าน" fill="#52c41a" />
                      <Bar dataKey="Fail" name="ไม่ผ่าน" fill="#ff4d4f" />
                    </BarChart>
                  </ResponsiveContainer>

                  {uplift && (!uplift.recommended.sufficient || !uplift.non_recommended.sufficient) && (
                    <div style={{ marginTop: 8, color: "#fa541c" }}>
                      * ข้อมูลอย่างน้อยหนึ่งฝั่งมีจำนวนต่ำกว่าเกณฑ์ขั้นต่ำ ({uplift.min_sample}) — แนะนำอย่าตีความเปรียบเทียบมากนัก
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Global trend */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card
                  title="แนวโน้มทั้งระบบ (รายวัน)"
                  className="chart-card"
                  extra={
                    <Space wrap className="segmented-gradient">
                      <Segmented value={trendDays} onChange={(v) => { setTrendDays(v as 7 | 30 | 90); setTrendRange(null); }} options={[{ label: "7 วัน", value: 7 }, { label: "30 วัน", value: 30 }, { label: "90 วัน", value: 90 }]} />
                      <RangePicker value={trendRange as any} onChange={(v) => setTrendRange(v as [Dayjs, Dayjs] | null)} allowClear />
                    </Space>
                  }
                >
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={trendData.map(d => ({ ...d, waiting: d.waiting_schedule }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="total" stroke="#1677ff" fill="#1677ff55" name="รวมสมัคร" />
                      <Area type="monotone" dataKey="review" stroke="#faad14" fill="#faad1455" name="กำลังพิจารณา" />
                      <Area type="monotone" dataKey="interviewed" stroke="#52c41a" fill="#52c41a55" name="นัดสัมภาษณ์แล้ว" />
                      <Area type="monotone" dataKey="waiting" stroke="#2f54eb" fill="#2f54eb55" name="รอการนัดสัมภาษณ์" />
                      <Area type="monotone" dataKey="pass" stroke="#722ed1" fill="#722ed155" name="ผ่าน" />
                      <Area type="monotone" dataKey="fail" stroke="#ff4d4f" fill="#ff4d4f55" name="ไม่ผ่าน/ไม่ได้รับเลือก" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </div>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default CoopDashboard;

/* ========================= Styles ========================= */
const styles = `
  @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
  @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .dashboard-header { background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%); padding: 32px; border-radius: 16px; margin-bottom: 24px; position: relative; overflow: hidden; box-shadow: 0 8px 32px rgba(30, 58, 138, 0.3); animation: fadeInDown 0.8s ease-out; }
  .dashboard-header::before { content: ''; position: absolute; inset: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="25" cy="25" r="2" fill="rgba(255,255,255,0.1)"><animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite"/></circle><circle cx="75" cy="75" r="1.5" fill="rgba(255,255,255,0.15)"><animate attributeName="opacity" values="0.15;0.4;0.15" dur="2s" repeatCount="indefinite"/></circle><circle cx="50" cy="10" r="1" fill="rgba(255,255,255,0.2)"><animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite"/></circle></svg>') repeat; }
  .dashboard-title { color: white; font-size: 36px; font-weight: 700; margin-bottom: 12px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); position: relative; z-index: 1; }
  .dashboard-subtitle { color: rgba(255, 255, 255, 0.9); font-size: 18px; position: relative; z-index: 1; }
  .header-buttons { position: relative; z-index: 1; }

  .stats-card { border-radius: 16px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background: white; overflow: hidden; position: relative; height: 100%; }
  .stats-card.clickable:hover { cursor: pointer; animation: pulse 0.6s ease-in-out; box-shadow: 0 12px 40px rgba(0,0,0,0.15); }
  .stats-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%); }

  .chart-card { border-radius: 16px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background: white; overflow: hidden; animation: slideInUp 0.8s ease-out; height: 100%; }
  .chart-card .ant-card-head { background: linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%); border-bottom: 1px solid rgba(30, 58, 138, 0.1); }
  .chart-card .ant-card-head-title { color: rgb(30, 58, 138); font-weight: 600; font-size: 18px; }

  .activity-card { border-radius: 16px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background: white; overflow: hidden; animation: slideInUp 1s ease-out; height: 100% }

  .gradient-button { background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%); border: none; border-radius: 8px; color: white; font-weight: 500; transition: all 0.3s ease; }
  .gradient-button:hover { background: linear-gradient(135deg, rgb(29, 78, 216) 0%, rgb(37, 99, 235) 100%); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(30, 58, 138, 0.4); }

  .segmented-gradient .ant-segmented { background: linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border-radius: 8px; padding: 4px; }

  .trend-table { border-radius: 12px; overflow: hidden; }
  .trend-table .ant-table-thead > tr > th { background: linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%); color: rgb(30, 58, 138); font-weight: 600; }

  .action-card__cta { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 13px; font-weight: 600; opacity: .9; transition: opacity .15s ease; }
  .action-card__chev { display: inline-block; transition: transform .15s ease; }
  .stats-card.clickable:hover .action-card__chev { transform: translateX(4px); }
  .stats-card.clickable:hover .action-card__cta { opacity: 1; }
`;