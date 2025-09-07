import { useEffect, useState } from "react";
import { Card, Row, Col, Table, Button, Space, Statistic, Tag, Layout, Segmented, DatePicker, message, Drawer, Descriptions, Avatar, Timeline, Badge } from "antd";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { EyeOutlined, DownloadOutlined, UserOutlined, TeamOutlined, BankOutlined, BookOutlined, ClockCircleOutlined, FileTextOutlined, PlusOutlined, MailOutlined, ReloadOutlined } from "@ant-design/icons";
import AdminHeader from "./../Component/AdminCoopMatchHeaderDefault";
import { GetAdminDashboardOverview, GetTrendForAdmin, GetAllLoginLogs, GetAllUser } from "../../services/https";
import type { LoginLogInterface } from "../../interfaces/LoginLog";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

type VerifyStatusItem = { status: string; count: number };
type Overview = { applications: number; companies: number; total_users: number; students: number; pending_posts: number; verify_statuses: VerifyStatusItem[] };
type UserRole = { name: string; value: number; color: string };
type TrendPoint = { date: string; total: number; pass: number; review: number; interviewed: number; waiting_schedule: number; fail: number };
type UserLite = { ID?: number; Email?: string; Role?: { RoleName?: string }; is_active?: boolean; CreatedAt?: string };

const CoopDashboard = () => {
  const navigate = useNavigate();

  // ===== States
  const [overviewData, setOverviewData] = useState<Overview>({ applications: 0, companies: 0, total_users: 0, students: 0, pending_posts: 0, verify_statuses: [] });
  const [userRoleData, setUserRoleData] = useState<UserRole[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogInterface[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);
  const [trendRange, setTrendRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [userDetailDrawer, setUserDetailDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id?: number; name?: string; email?: string; phone?: string; role?: string; status?: string; joinDate?: string; lastActive?: string; department?: string; company?: string;
  } | null>(null);

  // ===== Effects
  useEffect(() => { fetchOverviewAndLogs(); loadAllUsers(); }, []);
  useEffect(() => { fetchTrend(); /* auto refresh on control change */ }, [trendDays, trendRange?.[0]?.valueOf(), trendRange?.[1]?.valueOf()]);

  // ===== API calls
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
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrend = async () => {
    try {
      setTrendLoading(true);
      const params: any = trendRange && trendRange[0] && trendRange[1]
        ? { start: trendRange[0].format("YYYY-MM-DD"), end: trendRange[1].format("YYYY-MM-DD") }
        : { days: trendDays };
      const res = await GetTrendForAdmin(params);
      setTrendData(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      message.error(e?.response?.data?.error || "โหลดแนวโน้มไม่สำเร็จ");
    } finally { setTrendLoading(false); }
  };

  // ===== Helpers / renderers
  const getRoleIcon = (roleName?: string) =>
    roleName === "Student" ? <UserOutlined style={{ color: "#1890ff" }} /> :
    roleName === "Company" ? <BankOutlined style={{ color: "#52c41a" }} /> :
    roleName === "AcademicStaff" ? <BookOutlined style={{ color: "#722ed1" }} /> :
    roleName === "Admin" ? <TeamOutlined style={{ color: "#faad14" }} /> : <UserOutlined />;

  const showUserDetail = (log: LoginLogInterface | any) => {
    const u = (log?.User as any) || {};
    setSelectedUser({
      id: u.ID || log.id || 0,
      name: u.Email || log.user || "ไม่ทราบ",
      email: u.Email || `${log?.user || "unknown"}@example.com`,
      phone: "ไม่ระบุ",
      role: u.Role?.RoleName || log?.type || "-",
      status: u.is_active ? "Active" : "Inactive",
      joinDate: u.CreatedAt ? dayjs(u.CreatedAt).format("YYYY-MM-DD") : "ไม่ทราบ",
      lastActive: log?.login_at ? dayjs(log.login_at).format("YYYY-MM-DD HH:mm:ss") : "ไม่ทราบ",
      company: u?.Company?.[0]?.company_name,
    });
    setUserDetailDrawer(true);
  };

  // ===== Columns
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
              <Button type="link" style={{ padding: 0, height: "auto" }} onClick={() => showUserDetail(record)}>{email}</Button>
              <span style={{ color: "GrayText", marginTop: 2, fontSize: 12 }}>{role}</span>
            </div>
          </Space>
        );
      },
    },
    { title: "IP", dataIndex: "ip", key: "ip", render: (ip: string) => ip || "-" },
    { title: "เข้าใช้", dataIndex: "login_at", key: "login_at", render: (t: string) => (t ? dayjs(t).format("YYYY-MM-DD HH:mm:ss") : "-") },
    {
      title: "ออกจากระบบ",
      dataIndex: "logout_at",
      key: "logout_at",
      render: (t?: string | null) => (t && String(t).trim() !== "" ? dayjs(t).format("YYYY-MM-DD HH:mm:ss") : <Tag color="green">ยังออนไลน์</Tag>),
    },
  ];

  // ===== Derived data
  const latestLogins = [...loginLogs].sort((a, b) => dayjs(b.login_at).valueOf() - dayjs(a.login_at).valueOf());

  // ===== UI
  return (
    <Layout>
      <AdminHeader />
      <Layout className="adminpage-layout">
        {/* Header */}
        <div className="adminpage-dashboard-header">
          <div className="adminpage-dashboard-title">แดชบอร์ดแอดมิน - CoopMatch</div>
          <div className="adminpage-dashboard-subtitle">ภาพรวมระบบสหกิจศึกษา</div>
          <Space style={{ marginTop: 16 }}>
            <Button icon={<PlusOutlined />} type="primary">เพิ่มข้อมูล</Button>
            <Button icon={<DownloadOutlined />} onClick={() => message.success("กำลังเตรียมรายงาน...")}>รายงาน</Button>
          </Space>
        </div>

        {/* Overview Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="adminpage-dashboard-stats-card">
              <Statistic title="ผู้ใช้ทั้งหมด" value={overviewData.total_users || 0} prefix={<TeamOutlined style={{ color: "#1890ff" }} />} valueStyle={{ color: "#1890ff", fontSize: "24px" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="adminpage-dashboard-stats-card">
              <Statistic title="การสมัครงาน" value={overviewData.applications || 0} prefix={<FileTextOutlined style={{ color: "#52c41a" }} />} valueStyle={{ color: "#52c41a", fontSize: "24px" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="adminpage-dashboard-stats-card click" onClick={() => navigate("/admin/verify")}>
              <Statistic
                title="รอยืนยันตัวตน"
                value={overviewData.verify_statuses?.find((s: any) => s.status === "รอรับรอง")?.count || 0}
                prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                valueStyle={{ color: "#faad14", fontSize: "24px" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="adminpage-dashboard-stats-card click" onClick={() => navigate("/admin/manage-posts")}>
              <Statistic title="รอยืนยันโพสต์" value={overviewData.pending_posts} prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />} valueStyle={{ color: "#faad14", fontSize: "24px" }} />
            </Card>
          </Col>
        </Row>

        {/* Charts Row 1 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="สัดส่วนผู้ใช้ตามบทบาท" className="adminpage-dashboard-chart-card">
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
                      <span style={{ fontSize: 12 }}>{item.name}: {item.value}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="ผู้ใช้งานล่าสุด"
              className="adminpage-dashboard-activity-card"
              extra={<Space><Button icon={<EyeOutlined />} onClick={() => message.info("แสดงรายการทั้งหมดบนตารางด้านล่างแล้ว")}>ดูทั้งหมด</Button></Space>}
            >
              <Table
                dataSource={latestLogins}
                columns={loginColumns}
                rowKey="ID"
                pagination={{ pageSize: 5, showSizeChanger: true }}
                size="small"
                scroll={{ y: 280, x: true }}
              />
            </Card>
          </Col>
        </Row>

        {/* แนวโน้มทั้งระบบ (รายวัน) */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card
              title="แนวโน้มทั้งระบบ (รายวัน)"
              className="adminpage-dashboard-chart-card"
              extra={
                <Space wrap>
                  <Segmented value={trendDays} onChange={(v) => { setTrendDays(v as 7 | 30 | 90); setTrendRange(null); }} options={[{ label: "7 วัน", value: 7 }, { label: "30 วัน", value: 30 }, { label: "90 วัน", value: 90 }]} />
                  <RangePicker value={trendRange as any} onChange={(v) => setTrendRange(v as [Dayjs, Dayjs] | null)} allowClear />
                  <Button icon={<ReloadOutlined />} loading={trendLoading} onClick={fetchTrend}>รีเฟรช</Button>
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

              <Table
                size="small"
                style={{ marginTop: 16 }}
                rowKey={(r) => r.date}
                dataSource={trendData}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                columns={[
                  { title: "วันที่", dataIndex: "date" },
                  { title: "รวมสมัคร", dataIndex: "total" },
                  { title: "กำลังพิจารณา", dataIndex: "review" },
                  { title: "นัดสัมภาษณ์แล้ว", dataIndex: "interviewed" },
                  { title: "รอการนัดสัมภาษณ์", dataIndex: "waiting_schedule" },
                  { title: "ผ่าน", dataIndex: "pass" },
                  { title: "ไม่ผ่าน/ไม่ได้รับเลือก", dataIndex: "fail" },
                ]}
              />
            </Card>
          </Col>
        </Row>

        {/* User Detail Drawer */}
        <Drawer title="รายละเอียดผู้ใช้" width={600} open={userDetailDrawer} onClose={() => setUserDetailDrawer(false)} extra={<Space><Button icon={<PlusOutlined />}>แก้ไข</Button><Button icon={<MailOutlined />}>ส่งอีเมล</Button></Space>}>
          {selectedUser && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Avatar size={80} icon={<UserOutlined />} />
                <h3 style={{ margin: "8px 0" }}>{selectedUser.name}</h3>
                <Tag color="blue">{selectedUser.role}</Tag>
              </div>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="อีเมล">{selectedUser.email}</Descriptions.Item>
                <Descriptions.Item label="โทรศัพท์">{selectedUser.phone}</Descriptions.Item>
                <Descriptions.Item label="สถานะ"><Badge status={selectedUser.status === "Active" ? "success" : "default"} text={selectedUser.status} /></Descriptions.Item>
                <Descriptions.Item label="วันที่เข้าร่วม">{selectedUser.joinDate}</Descriptions.Item>
                <Descriptions.Item label="เข้าใช้ล่าสุด">{selectedUser.lastActive}</Descriptions.Item>
                {selectedUser.department && <Descriptions.Item label="แผนก">{selectedUser.department}</Descriptions.Item>}
                {selectedUser.company && <Descriptions.Item label="บริษัท">{selectedUser.company}</Descriptions.Item>}
              </Descriptions>
              <div style={{ marginTop: 24 }}>
                <h4>กิจกรรมล่าสุด</h4>
                <Timeline>
                  <Timeline.Item color="green">เข้าสู่ระบบ - 2 ชั่วโมงที่แล้ว</Timeline.Item>
                  <Timeline.Item color="blue">อัปเดตโปรไฟล์ - 1 วันที่แล้ว</Timeline.Item>
                  <Timeline.Item>สมัครงาน - 3 วันที่แล้ว</Timeline.Item>
                </Timeline>
              </div>
            </div>
          )}
        </Drawer>
      </Layout>
    </Layout>
  );
};

export default CoopDashboard;