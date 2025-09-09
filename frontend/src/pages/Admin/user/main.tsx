import {
  Card,
  Descriptions,
  Table,
  Tag,
  Avatar,
  Badge,
  Row,
  Col,
  Statistic,
  Button,
  Modal,
  Input,
  Select,
  Switch,
  Space,
  Divider,
  Layout,
  Typography,
  Form,
  DatePicker,
  Upload,
  Skeleton,
  Empty,
  theme,
} from "antd";
import {
  UserOutlined,
  LoginOutlined,
  EditOutlined,
  EyeOutlined,
  SafetyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState, type Key } from "react";
import type { UserInterface } from "../../../interfaces/User";
import type { CompanyInterface } from "../../../interfaces/Company";
import type { StudentInterface } from "../../../interfaces/Student";
import type { AcademicStaffInterface } from "../../../interfaces/AcademicStaff";
import {
  CreateAdmin,
  GetAllAcademicStaff,
  GetAllCompany,
  GetAllLoginLogs,
  GetAllStudent,
  GetAllUser,
  GetMonthlyUsersByRole,
  GetRole,
  UpdateUser,
  UploadImageByAdmin,
} from "../../../services/https";
import type { RoleInterface } from "../../../interfaces/Role";
import type { LoginLogInterface } from "../../../interfaces/LoginLog";
import type { ColumnsType, TableProps } from "antd/es/table";
import AdminHeader from "../../Component/AdminCoopMatchHeaderDefault";
import ExportExcelButton from "./ExportExcelButton";
import { fileURL } from "@/config/env";
import type { MonthlyUserByRoleInterface } from "@/interfaces/Analysis";
import "dayjs/locale/th";
dayjs.locale("th");

const { Title, Text } = Typography;
const { Option } = Select;

// ===== replace your StatCard with this version =====
type Accent = "blue" | "green" | "magenta" | "orange";
type Palette = { bg: string; border: string; color: string };

function StatCard({
  title,
  value,
  prefix,
  accent,
}: {
  title: string;
  value: number;
  prefix?: React.ReactNode;
  accent: Accent;
}) {
  const { token } = theme.useToken();

  const PALETTES = {
    blue: {
      bg: "linear-gradient(135deg,#fff 0%,#f8fbff 100%)",
      border: "rgba(24,144,255,.15)",
      color: token.colorPrimary,
    },
    green: {
      bg: "linear-gradient(135deg,#fff 0%,#f1f8e9 100%)",
      border: "rgba(82,196,26,.15)",
      color: "#4caf50",
    },
    magenta: {
      bg: "linear-gradient(135deg,#fff 0%,#fce4ec 100%)",
      border: "rgba(233,30,99,.15)",
      color: "#e91e63",
    },
    orange: {
      bg: "linear-gradient(135deg,#fff 0%,#fff3e0 100%)",
      border: "rgba(250,140,22,.15)",
      color: "#ff9800",
    },
  } as const satisfies Record<Accent, Palette>;

  const palette: Palette = PALETTES[accent];

  return (
    <Card
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 16,
      }}
      bodyStyle={{ padding: 16 }}
    >
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        valueStyle={{ color: palette.color, fontSize: 28, fontWeight: 700 }}
        style={{ textAlign: "center" }}
      />
    </Card>
  );
}

function SectionCard({
  icon,
  title,
  children,
  height = 220,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  height?: number;
}) {
  const { token } = theme.useToken();
  return (
    <Card
      title={
        <span
          style={{
            color: token.colorPrimary,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {icon}
          {title}
        </span>
      }
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorPrimaryBorder}`,
        background: "linear-gradient(135deg,#fff 0%,#f8fbff 100%)",
        height,
      }}
      headStyle={{
        background:
          "linear-gradient(135deg,rgba(25,118,210,.05) 0%, rgba(33,150,243,.02) 100%)",
        borderBottom: `1px solid ${token.colorPrimaryBorder}`,
        borderRadius: "16px 16px 0 0",
      }}
      bodyStyle={{ height: height - 60, padding: 8 }}
    >
      {children}
    </Card>
  );
}

/* ----------------------- Utils ----------------------- */
function formatDuration(ms: number) {
  if (ms <= 0 || !Number.isFinite(ms)) return "-";
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* ----------------------- Main ----------------------- */
const AdminUserDetailsPage: React.FC = () => {
  const { token } = theme.useToken();

  const [users, setUsers] = useState<UserInterface[]>([]);
  const [students, setStudents] = useState<StudentInterface[]>([]);
  const [companies, setCompanies] = useState<CompanyInterface[]>([]);
  const [academicStaffs, setAcademicStaffs] = useState<
    AcademicStaffInterface[]
  >([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogInterface[]>([]);
  const [filteredLoginLogs, setFilteredLoginLogs] = useState<
    LoginLogInterface[]
  >([]);
  const [selectedUser, setSelectedUser] = useState<UserInterface | null>(null);
  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const [monthlyUserData, SetMonthlyUserData] = useState<
    MonthlyUserByRoleInterface[]
  >([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loginSearchText, setLoginSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  // auto refresh
  const autoRefresh = true;
  const intervalMs = 600_000; // 10 นาที

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        usersRes,
        studentsRes,
        companiesRes,
        academicRes,
        logsRes,
        roleRes,
        monthUserRes,
      ] = await Promise.all([
        GetAllUser(),
        GetAllStudent(),
        GetAllCompany(),
        GetAllAcademicStaff(),
        GetAllLoginLogs(),
        GetRole(),
        GetMonthlyUsersByRole(),
      ]);
      const usersData = usersRes?.data ?? [];
      setUsers(usersData);
      setStudents(studentsRes?.data ?? []);
      setCompanies(companiesRes?.data ?? []);
      setAcademicStaffs(
        Array.isArray(academicRes.data) ? academicRes.data : []
      );
      setLoginLogs(logsRes?.data ?? []);
      setFilteredLoginLogs(logsRes?.data ?? []);
      setRoles(roleRes?.data ?? []);
      const rows = Array.isArray(monthUserRes?.data) ? monthUserRes.data : [];
      SetMonthlyUserData(rows);
      setLoading(!loading);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      refreshData();
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoRefresh, intervalMs, refreshData]);

  // Filter login logs based on search text
  useEffect(() => {
    const q = loginSearchText.toLowerCase().trim();
    setFilteredLoginLogs(
      loginLogs.filter((log) =>
        (log.User?.Email || "").toLowerCase().includes(q)
      )
    );
  }, [loginLogs, loginSearchText]);

  // Pie data
  const roleStats = roles.map((Role) => ({
    name: Role.RoleNameTH,
    value: users.filter((user) => user.Role?.RoleName === Role.RoleName).length,
    color:
      Role.RoleName === "Admin"
        ? token.colorPrimary
        : Role.RoleName === "Student"
        ? "#52c41a"
        : Role.RoleName === "Company"
        ? "#fa8c16"
        : "#722ed1",
  }));

  const roleFilters = useMemo(
    () =>
      Array.from(
        new Set(
          users
            .map((u) => u.Role?.RoleNameTH)
            .filter((v): v is string => Boolean(v))
        )
      ).map((name) => ({ text: name, value: name })),
    [users]
  );

  const [roleFilterKeys, setRoleFilterKeys] = useState<Key[] | null>(null);

  const displayedUsers = useMemo(() => {
    let data = [...users];
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      data = data.filter(
        (u) =>
          (u.Email || "").toLowerCase().includes(q) ||
          (u.Role?.RoleNameTH || "").toLowerCase().includes(q)
      );
    }
    if (roleFilterKeys?.length) {
      const allow = new Set(roleFilterKeys.map(String));
      data = data.filter((u) => allow.has(String(u.Role?.RoleNameTH ?? "")));
    }
    return data;
  }, [users, searchText, roleFilterKeys]);

  // Latest log per user (for columns)
  const latestLogByUser = useMemo(() => {
    const map = new Map<number, LoginLogInterface>();
    for (const log of loginLogs) {
      const uid = (log as any).UserID ?? (log.User?.ID as number | undefined);
      if (!uid) continue;
      const prev = map.get(uid);
      const curLogin = dayjs(log.login_at);
      if (!prev || curLogin.isAfter(dayjs(prev.login_at))) {
        map.set(uid, log);
      }
    }
    return map;
  }, [loginLogs]);

  /* ----------------------- Columns ----------------------- */
  const userColumns: ColumnsType<UserInterface> = [
    {
      title: "อีเมล",
      dataIndex: "Email",
      key: "Email",
      ellipsis: true,
      render: (Email: string, record: UserInterface) => {
        const isCompany = record.Role?.RoleName === "Company";
        const raw = isCompany
          ? record.Company?.[0]?.logo
          : record.ProfileImage?.[0]?.image_url;
        const imgSrc = raw ? fileURL(raw) : undefined;
        return (
          <Space>
            <Avatar
              src={imgSrc}
              icon={!imgSrc ? <UserOutlined /> : undefined}
            />
            <span style={{ maxWidth: 260, display: "inline-block" }}>
              {Email}
            </span>
          </Space>
        );
      },
    },
    {
      title: "บทบาท",
      dataIndex: ["Role", "RoleNameTH"],
      key: "Role",
      filters: roleFilters,
      filteredValue: roleFilterKeys ?? null,
      onFilter: (value, record) =>
        String(record.Role?.RoleNameTH) === String(value),
      render: (RoleNameTH: string, record: UserInterface) => {
        const color =
          record.Role?.RoleNameTH === "แอดมิน"
            ? "blue"
            : record.Role?.RoleNameTH === "นักเรียน"
            ? "green"
            : record.Role?.RoleNameTH === "บริษัท"
            ? "orange"
            : "purple";
        return <Tag color={color}>{RoleNameTH}</Tag>;
      },
    },
    {
      title: "สถานะ",
      key: "status",
      width: 160,
      render: (_: any, record: UserInterface) => (
        <Badge
          status={record.is_active ? "success" : "error"}
          text={record.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
        />
      ),
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "CreatedAt",
      key: "CreatedAt",
      width: 180,
      sorter: (a, b) =>
        dayjs(a.CreatedAt).valueOf() - dayjs(b.CreatedAt).valueOf(),
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "เข้า (ล่าสุด)",
      key: "last_login_at",
      width: 190,
      sorter: (a, b) => {
        const la = latestLogByUser.get(a.ID!)?.login_at;
        const lb = latestLogByUser.get(b.ID!)?.login_at;
        const va = la ? dayjs(la).valueOf() : 0;
        const vb = lb ? dayjs(lb).valueOf() : 0;
        return va - vb;
      },
      render: (_: any, record: UserInterface) => {
        const log = latestLogByUser.get(record.ID!);
        return log ? (
          dayjs(log.login_at).format("DD/MM/YYYY HH:mm:ss")
        ) : (
          <span>-</span>
        );
      },
    },
    {
      title: "ออก (ล่าสุด)",
      key: "last_logout_at",
      width: 190,
      sorter: (a, b) => {
        const la = latestLogByUser.get(a.ID!)?.logout_at;
        const lb = latestLogByUser.get(b.ID!)?.logout_at;
        const va = la ? dayjs(la).valueOf() : -1;
        const vb = lb ? dayjs(lb).valueOf() : -1;
        return va - vb;
      },
      render: (_: any, record: UserInterface) => {
        const log = latestLogByUser.get(record.ID!);
        const out = log?.logout_at as any;
        if (!log) return <div>-</div>;
        return out && String(out).trim() !== "" ? (
          dayjs(out).format("DD/MM/YYYY HH:mm:ss")
        ) : (
          <Tag color="green">ยังคงออนไลน์</Tag>
        );
      },
    },
    {
      title: "การจัดการ",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_: any, record: UserInterface) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setIsModalVisible(true);
            }}
          >
            ดู
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setEditModalVisible(true);
            }}
          >
            แก้ไข
          </Button>
        </Space>
      ),
    },
  ];

  const handleUserTableChange: TableProps<UserInterface>["onChange"] = (
    _pagination,
    filters
  ) => {
    const val = filters?.Role as Key[] | null | undefined;
    setRoleFilterKeys(val ?? null);
  };

  /* ----------------------- Per-user logs in modal ----------------------- */
  const selectedUserLogs = useMemo(() => {
    if (!selectedUser) return [];
    const uid = selectedUser.ID;
    return loginLogs
      .filter((l) => (l as any).UserID === uid || l.User?.ID === uid)
      .sort(
        (a, b) => dayjs(b.login_at).valueOf() - dayjs(a.login_at).valueOf()
      );
  }, [loginLogs, selectedUser]);

  const perUserLogColumns: ColumnsType<LoginLogInterface> = [
    {
      title: "เข้า",
      dataIndex: "login_at",
      key: "login_at",
      width: 190,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "ออก",
      dataIndex: "logout_at",
      key: "logout_at",
      width: 190,
      render: (date?: string | null) =>
        date && String(date).trim() !== "" ? (
          dayjs(date).format("DD/MM/YYYY HH:mm:ss")
        ) : (
          <Tag color="green">ยังคงออนไลน์</Tag>
        ),
    },
    {
      title: "ระยะเวลา",
      key: "duration",
      width: 120,
      render: (_: any, rec: LoginLogInterface) => {
        const start = dayjs(rec.login_at);
        const end = rec.logout_at ? dayjs(rec.logout_at) : dayjs();
        return formatDuration(end.diff(start));
      },
    },
    {
      title: "สถานะ",
      key: "status",
      width: 120,
      render: (_: any, rec: LoginLogInterface) =>
        rec.logout_at ? (
          <Badge status="default" text="ออฟไลน์" />
        ) : (
          <Badge status="processing" text="ออนไลน์" />
        ),
    },
  ];

  /* ----------------------- Render ----------------------- */
  return (
    <Layout>
      <AdminHeader />
      <Layout className="adminpage-layout" style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size={16} align="center">
                <div
                  style={{
                    backgroundColor: token.colorPrimaryBg,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <SafetyOutlined
                    style={{ fontSize: 28, color: token.colorPrimary }}
                  />
                </div>
                <div>
                  <Title
                    level={3}
                    style={{ margin: 0, color: token.colorPrimary }}
                  >
                    จัดการข้อมูลผู้ใช้ระบบ
                  </Title>
                  <Text type="secondary">ระบบการจัดการผู้ใช้งานแบบครบถ้วน</Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Button type="primary" onClick={() => setAddAdminOpen(true)}>
                + เพิ่มแอดมิน
              </Button>
            </Col>
          </Row>
        </div>

        {/* KPI */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="ผู้ใช้ทั้งหมด"
              value={users.length}
              prefix={<TeamOutlined />}
              accent="blue"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="ออนไลน์"
              value={users.filter((u) => u.is_logged_in).length}
              prefix={<CheckCircleOutlined />}
              accent="green"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="ออฟไลน์"
              value={users.filter((u) => !u.is_logged_in).length}
              prefix={<CloseCircleOutlined />}
              accent="magenta"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="เข้าสู่ระบบวันนี้"
              value={
                loginLogs.filter((log) =>
                  dayjs(log.login_at).isSame(dayjs(), "day")
                ).length
              }
              prefix={<LoginOutlined />}
              accent="orange"
            />
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <SectionCard icon={<GlobalOutlined />} title="สัดส่วนผู้ใช้">
              {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : roleStats.every((r) => r.value === 0) ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="ยังไม่มีข้อมูลผู้ใช้"
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ percent }) => `${(percent! * 100).toFixed(0)}%`}
                    >
                      {roleStats.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: "#fff",
                        border: `1px solid ${token.colorPrimaryBorder}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </Col>
          <Col xs={24} lg={12}>
            <SectionCard icon={<BarChartOutlined />} title="ผู้ใช้รายเดือน">
              {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : !monthlyUserData?.length ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="ยังไม่มีข้อมูลรายเดือน"
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyUserData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(25,118,210,0.1)"
                    />
                    <XAxis
                      dataKey="month"
                      stroke={token.colorPrimary}
                      fontSize={10}
                      tickFormatter={(m: string) =>
                        dayjs(m, "YYYY-MM").format("MMM")
                      }
                    />
                    <YAxis stroke={token.colorPrimary} fontSize={10} />
                    <RechartsTooltip
                      contentStyle={{
                        background: "#fff",
                        border: `1px solid ${token.colorPrimaryBorder}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="students"
                      stroke="#1890ff"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="companies"
                      stroke="#fa8c16"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="academic_staff"
                      stroke="#722ed1"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="admins"
                      stroke="#52c41a"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </Col>
        </Row>

        {/* Users Table */}
        <Card style={{ borderRadius: 16 }}>
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Input.Search
              placeholder="ค้นหาด้วยอีเมลหรือบทบาท..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 360 }}
              enterButton="ค้นหา"
            />
            <ExportExcelButton
              variant="users"
              usersAll={users}
              usersFiltered={displayedUsers}
            />
          </div>
          <Table
            columns={userColumns}
            dataSource={displayedUsers}
            rowKey="ID"
            loading={loading}
            onChange={handleUserTableChange}
            sticky
            scroll={{ x: 980 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} จาก ${total} รายการ`,
            }}
          />
        </Card>

        {/* View Modal (รายละเอียด + บันทึกการเข้าสู่ระบบของคนนี้) */}
        <Modal
          title={
            <div
              style={{
                color: token.colorPrimary,
                fontSize: 18,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              รายละเอียดผู้ใช้: {selectedUser?.Email}
            </div>
          }
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsModalVisible(false)}>
              ปิด
            </Button>,
          ]}
          width={1000}
        >
          {selectedUser && (
            <div>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="อีเมล">
                  {selectedUser.Email}
                </Descriptions.Item>
                <Descriptions.Item label="บทบาท">
                  <Tag color="blue">{selectedUser.Role?.RoleNameTH}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="สถานะการใช้งาน">
                  <Badge
                    status={selectedUser.is_active ? "success" : "error"}
                    text={selectedUser.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="สถานะออนไลน์">
                  <Badge
                    status={
                      selectedUser.is_logged_in ? "processing" : "default"
                    }
                    text={selectedUser.is_logged_in ? "ออนไลน์" : "ออฟไลน์"}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="วันที่สร้าง">
                  {dayjs(selectedUser.CreatedAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="อัปเดตล่าสุด">
                  {dayjs(selectedUser.UpdatedAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              </Descriptions>

              {/* โปรไฟล์ตามบทบาท */}
              {(() => {
                let profileData:
                  | StudentInterface
                  | CompanyInterface
                  | AcademicStaffInterface
                  | undefined;
                if (selectedUser.Role?.RoleName === "Student")
                  profileData = students.find(
                    (s) => s.UserID === selectedUser!.ID
                  );
                else if (selectedUser.Role?.RoleName === "Company")
                  profileData = companies.find(
                    (c) => c.UserID === selectedUser!.ID
                  );
                else if (selectedUser.Role?.RoleName === "AcademicStaff")
                  profileData = academicStaffs.find(
                    (a) => a.UserID === selectedUser!.ID
                  );

                return profileData ? (
                  <>
                    <Divider orientation="center">ข้อมูลโปรไฟล์</Divider>
                    <Descriptions bordered column={2} size="middle">
                      {selectedUser.Role?.RoleName === "Student" && (
                        <>
                          <Descriptions.Item label="ชื่อ">
                            {(profileData as StudentInterface).first_name}
                          </Descriptions.Item>
                          <Descriptions.Item label="นามสกุล">
                            {(profileData as StudentInterface).last_name}
                          </Descriptions.Item>
                          <Descriptions.Item label="อายุ">
                            {(profileData as StudentInterface).age} ปี
                          </Descriptions.Item>
                          <Descriptions.Item label="สัญชาติ">
                            {(profileData as StudentInterface).nationality}
                          </Descriptions.Item>
                          <Descriptions.Item label="ศาสนา">
                            {(profileData as StudentInterface).religion}
                          </Descriptions.Item>
                          <Descriptions.Item label="เบอร์โทร">
                            {(profileData as StudentInterface).phone_number}
                          </Descriptions.Item>
                        </>
                      )}
                      {selectedUser.Role?.RoleName === "Company" && (
                        <>
                          <Descriptions.Item label="ชื่อบริษัท">
                            {(profileData as CompanyInterface).company_name}
                          </Descriptions.Item>
                          <Descriptions.Item label="โลโก้">
                            <Avatar
                              src={(profileData as CompanyInterface).logo}
                              size={64}
                            />
                          </Descriptions.Item>
                        </>
                      )}
                      {selectedUser.Role?.RoleName === "AcademicStaff" && (
                        <>
                          <Descriptions.Item label="ชื่อ">
                            {(profileData as AcademicStaffInterface).first_name}
                          </Descriptions.Item>
                          <Descriptions.Item label="นามสกุล">
                            {(profileData as AcademicStaffInterface).last_name}
                          </Descriptions.Item>
                          <Descriptions.Item label="ตำแหน่งทางวิชาการ">
                            {
                              (profileData as AcademicStaffInterface)
                                .academic_position
                            }
                          </Descriptions.Item>
                          <Descriptions.Item label="อายุ">
                            {(profileData as AcademicStaffInterface).age} ปี
                          </Descriptions.Item>
                        </>
                      )}
                    </Descriptions>
                  </>
                ) : null;
              })()}

              {/* -------- บันทึกการเข้าสู่ระบบของผู้ใช้นี้ (เพิ่มด้านล่าง) -------- */}
              <Divider orientation="center" style={{ marginTop: 20 }}>
                บันทึกการเข้าสู่ระบบของผู้ใช้นี้
              </Divider>
              {selectedUserLogs.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="ยังไม่มีประวัติการเข้าสู่ระบบ"
                />
              ) : (
                <Table
                  size="small"
                  columns={perUserLogColumns}
                  dataSource={selectedUserLogs}
                  rowKey="ID"
                  pagination={{ pageSize: 5, showSizeChanger: false }}
                  sticky
                  scroll={{ x: 900 }}
                />
              )}
            </div>
          )}
        </Modal>

        {/* Edit Modal */}
        <Modal
          title={
            <div
              style={{
                color: token.colorPrimary,
                fontSize: 18,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              แก้ไขข้อมูลผู้ใช้
            </div>
          }
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={async () => {
            if (!selectedUser) return;
            try {
              const payload = {
                Email: selectedUser.Email,
                RoleID: selectedUser.RoleID,
                is_active: selectedUser.is_active,
              };
              const res = await UpdateUser(Number(selectedUser.ID), payload);
              setUsers((prev) =>
                prev.map((u) => (u.ID === selectedUser.ID ? res.data : u))
              );
              setEditModalVisible(false);
            } catch (e) {
              console.error(e);
            }
          }}
          okText="บันทึก"
          cancelText="ยกเลิก"
        >
          <div>
            <div style={{ marginBottom: 12 }}>
              <label>อีเมล:</label>
              <Input
                value={selectedUser?.Email || ""}
                onChange={(e) =>
                  selectedUser &&
                  setSelectedUser({ ...selectedUser, Email: e.target.value })
                }
                style={{ marginTop: 4 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>บทบาท:</label>
              <Select
                value={selectedUser?.RoleID}
                style={{ width: "100%", marginTop: 4 }}
                onChange={(roleId) => {
                  if (!selectedUser) return;
                  const Role = roles.find((r) => r.ID === roleId);
                  setSelectedUser({
                    ...selectedUser,
                    RoleID: roleId,
                    Role: Role
                      ? {
                          ID: Role.ID,
                          RoleName: Role.RoleName,
                          RoleNameTH: Role.RoleNameTH,
                        }
                      : selectedUser.Role,
                  });
                }}
              >
                {roles.map((Role) => (
                  <Option key={Role.ID} value={Role.ID}>
                    {Role.RoleNameTH}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <label>สถานะการใช้งาน:</label>
              <div style={{ marginTop: 4 }}>
                <Switch
                  checked={!!selectedUser?.is_active}
                  checkedChildren="เปิดใช้งาน"
                  unCheckedChildren="ปิดใช้งาน"
                  onChange={(checked) =>
                    selectedUser &&
                    setSelectedUser({ ...selectedUser, is_active: checked })
                  }
                />
              </div>
            </div>
          </div>
        </Modal>

        {/* Add Admin Modal */}
        <Modal
          title={
            <div
              style={{
                color: token.colorPrimary,
                fontSize: 18,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              เพิ่มแอดมิน
            </div>
          }
          open={addAdminOpen}
          onCancel={() => setAddAdminOpen(false)}
          okText="บันทึก"
          cancelText="ยกเลิก"
          onOk={async () => {
            try {
              const v = await addForm.validateFields();

              let imageUrl = "";
              const fileObj = fileList?.[0]?.originFileObj as File | undefined;
              if (fileObj) {
                const up = await UploadImageByAdmin(fileObj);
                imageUrl = up?.data?.image_url || "";
              }

              const payload = {
                email: v.email.trim().toLowerCase(),
                password: v.password,
                first_name: v.first_name,
                last_name: v.last_name,
                birthday: dayjs(v.birthday).format("YYYY-MM-DD"),
                is_active: v.is_active ?? true,
                image_url: imageUrl,
                role: localStorage.getItem("role") || "",
              };

              await CreateAdmin(payload);
              await refreshData();
              setAddAdminOpen(false);
              setFileList([]);
              addForm.resetFields();
            } catch (err) {
              console.error(err);
            }
          }}
        >
          <Form form={addForm} layout="vertical">
            <Form.Item
              label="รูปโปรไฟล์"
              name="image"
              rules={[{ required: true, message: "กรุณาอัปโหลดรูป" }]}
            >
              <Upload
                listType="picture-card"
                beforeUpload={() => false}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                maxCount={1}
                accept="image/*"
              >
                {fileList.length === 0 && "+ Upload"}
              </Upload>
            </Form.Item>

            <Form.Item
              label="อีเมล"
              name="email"
              rules={[
                { required: true, message: "กรุณากรอกอีเมล" },
                { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
              ]}
            >
              <Input placeholder="admin@example.com" />
            </Form.Item>

            <Form.Item
              label="รหัสผ่าน"
              name="password"
              rules={[
                { required: true, message: "กรุณากรอกรหัสผ่าน" },
                { min: 6, message: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="ชื่อ"
              name="first_name"
              rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="นามสกุล"
              name="last_name"
              rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="วันเกิด"
              name="birthday"
              rules={[{ required: true, message: "กรุณาเลือกวันเกิด" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="สถานะการใช้งาน"
              name="is_active"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch
                checkedChildren="เปิดใช้งาน"
                unCheckedChildren="ปิดใช้งาน"
              />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default AdminUserDetailsPage;
