import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Modal,
  Space,
  Statistic,
  Tag,
  Progress,
  Layout,
  Segmented,
  Input,
  Select,
  Form,
  DatePicker,
  message,
  Popconfirm,
  Drawer,
  Descriptions,
  Avatar,
  Timeline,
  Badge,
  Tabs,
  Typography,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  EyeOutlined,
  DownloadOutlined,
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  CalendarOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import AdminHeader from "./../Component/AdminCoopMatchHeaderDefault";
import {
  GetAdminDashboardOverview,
  GetAdminMonthlyApplicationStats,
  GetAdminPendingPosts,
  GetAdminRecentActivities,
  GetApplicationTrendByProgram,
  GetCompanyReviewReport,
  GetCompanyReviewSummary,
  GetMatchingSuccessRate,
  GetMonthlyUsersByRole,
  GetPopularCompanies,
  GetTopJobs,
  GetUsersByRoleSeries,
} from "../../services/https";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

type ApplicationStats = {
  month: string;
  applications: number;
  interviews: number;
  approved: number;
};

type UserRole = {
  name: string;
  value: number;
  color: string;
};

type VerificationStatus = {
  status: string;
  count: number;
  color: string;
};

type ActivityLog = {
  id: number;
  user: string;
  type: "Student" | "Company" | "AcademicStaff" | "Admin";
  action: string;
  time: string;
  company?: string;
  post?: string;
  document?: string;
};

type PendingPost = {
  key: number;
  company: string;
  position: string;
  submitted: string;
  status: string;
  description?: string;
  requirements?: string;
  salary?: string;
  location?: string;
};

type UserDetail = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  joinDate: string;
  lastActive: string;
  avatar?: string;
  department?: string;
  company?: string;
};

type CompanyRatingRow = {
  company_id: number;
  company_name: string;
  avg_rating: number;
  reviews: number;
};

type ReviewDistributionBin = {
  rating: number; // 1..5
  count: number;
};

type CompanyReviewReport = {
  avg_rating: number;
  total_reviews: number;
  distribution: ReviewDistributionBin[];
  top_avg: CompanyRatingRow[]; // เรียงตามคะแนนเฉลี่ย
  top_count: CompanyRatingRow[]; // เรียงตามจำนวนรีวิว
};

const CoopDashboard = () => {
  const navigate = useNavigate();

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [userDetailDrawer, setUserDetailDrawer] = useState(false);
  const [postApprovalModal, setPostApprovalModal] = useState(false);
  const [verificationModal, setVerificationModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [systemSettingsModal, setSystemSettingsModal] = useState(false);
  const [bulkActionModal, setBulkActionModal] = useState(false);

  // Data states
  const [currentDetail, setCurrentDetail] = useState(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [applicationData, setApplicationData] = useState<ApplicationStats[]>(
    []
  );
  const [userRoleData, setUserRoleData] = useState<UserRole[]>([]);
  const [verificationData, setVerificationData] = useState<
    VerificationStatus[]
  >([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [pendingPostsData, setPendingPostsData] = useState<PendingPost[]>([]);
  const [monthlyUserData, setMonthlyUserData] = useState<any[]>([]);
  const [userRoleSeries, setUserRoleSeries] = useState<any[]>([]);
  const [userRoleTotal, setUserRoleTotal] = useState(0);

  const [topJobs, setTopJobs] = useState<any[]>([]);
  const [popularCompanies, setPopularCompanies] = useState<any[]>([]);

  const [mode, setMode] = useState<"month" | "quarter" | "year">("month");
  const [yearBE, setYearBE] = useState<number>(dayjs().year() + 543); // พ.ศ.
  const yearsBE = Array.from({ length: 6 }).map(
    (_, i) => dayjs().year() + 543 - i
  ); // ปีนี้ย้อนหลัง 5 ปี

  const [matchingSeries, setMatchingSeries] = useState<any[]>([]);
  const [matchingOverall, setMatchingOverall] = useState<number>(0);
  const [programSeries, setProgramSeries] = useState<any[]>([]);
  const [programOthers, setProgramOthers] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any>(null);

  const [reviewReport, setReviewReport] = useState<CompanyReviewReport | null>(
    null
  );

  // Form instances
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  // Helper แปลง พ.ศ. -> ค.ศ.
  const toAD = (be: number) => be - 543;

  useEffect(() => {
    loadUsersByRoleSeries(mode, toAD(yearBE));
  }, [mode, yearBE]);

  const loadUsersByRoleSeries = async (m: typeof mode, yearAD: number) => {
    const res = await GetUsersByRoleSeries({ mode: m, year: yearAD });
    const series = Array.isArray(res?.data) ? res.data : [];
    setUserRoleSeries(series);

    // ---- สรุปยอดตามบทบาทจาก series ----
    const sums = series.reduce(
      (acc: any, p: any) => {
        acc.students += p?.students ?? 0;
        acc.companies += p?.companies ?? 0;
        acc.academic_staff += p?.academic_staff ?? 0;
        acc.admins += p?.admins ?? 0;
        return acc;
      },
      { students: 0, companies: 0, academic_staff: 0, admins: 0 }
    );

    const rows = [
      { name: "นักศึกษา", value: sums.students, color: "#1890ff" },
      { name: "บริษัท", value: sums.companies, color: "#52c41a" },
      { name: "อาจารย์", value: sums.academic_staff, color: "#722ed1" },
      { name: "แอดมิน", value: sums.admins, color: "#faad14" },
    ];
    setUserRoleData(rows);
    setUserRoleTotal(
      sums.students + sums.companies + sums.academic_staff + sums.admins
    );
  };

  const fetchData = async () => {
    try {
      const [
        overviewRes,
        statsRes,
        postsRes,
        monthlyUsersRes,
        topJobsRes,
        popularCompaniesRes,
        matchRes,
        majorRes,
        reviewRes,
      ] = await Promise.all([
        GetAdminDashboardOverview(),
        GetAdminMonthlyApplicationStats(),
        GetAdminPendingPosts(),
        GetMonthlyUsersByRole(),
        GetTopJobs(),
        GetPopularCompanies(),
        GetMatchingSuccessRate({ days: 90 }),
        GetApplicationTrendByProgram({ days: 90, top: 5 }),
        GetCompanyReviewSummary({ days: 30 }),
        GetCompanyReviewReport({ days: 30 }),
      ]);
      const overview = overviewRes.data;

      setOverviewData(overview);
      setApplicationData(statsRes.data);
      setPendingPostsData(postsRes.data);
      setMonthlyUserData(monthlyUsersRes.data || []);
      setTopJobs(topJobsRes.data || []);
      setPopularCompanies(popularCompaniesRes.data || []);

      setMatchingSeries(matchRes.data.series || []);
      setMatchingOverall(matchRes.data.successRate || 0);
      setProgramSeries(majorRes.data.series || []);
      setProgramOthers(majorRes.data.others || []);
      setReviewSummary(reviewRes.data || null);
      setReviewReport(reviewRes.data || null);

      setUserRoleData([
        { name: "นักศึกษา", value: overview.students, color: "#1890ff" },
        { name: "บริษัท", value: overview.companies, color: "#52c41a" },
        { name: "อาจารย์", value: overview.academic_staff, color: "#722ed1" },
        { name: "แอดมิน", value: overview.admins, color: "#faad14" },
      ]);

      // Template ของทุกสถานะ + สี
      const statusTemplate = [
        { status: "ยังไม่ได้ส่งคำขอ", color: "#d9d9d9" },
        { status: "รอรับรอง", color: "#faad14" },
        { status: "รับรอง", color: "#52c41a" },
        { status: "ปฏิเสธ", color: "#ff4d4f" },
      ];
      const verificationData = statusTemplate.map((tpl) => {
        const found = overview.verify_statuses.find(
          (v: any) => v.status === tpl.status
        );
        return {
          status: tpl.status,
          count: found ? found.count : 0,
          color: tpl.color,
        };
      });
      setVerificationData(verificationData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      message.error("ไม่สามารถโหลดข้อมูลได้");
    }
  };

  // Modal handlers
  const showDetail = (type: any) => {
    setCurrentDetail(type);
    setDetailModalVisible(true);
  };

  const showUserDetail = (user: any) => {
    setSelectedUser({
      id: user.id,
      name: user.user || user.name,
      email: user.email || `${user.user}@example.com`,
      phone: user.phone || "ไม่ระบุ",
      role: user.type || user.role,
      status: "Active",
      joinDate: "2024-01-01",
      lastActive: user.time || "ไม่ทราบ",
      department: user.department,
      company: user.company,
    });
    setUserDetailDrawer(true);
  };

  const showPostApproval = (post: any) => {
    setSelectedPost(post);
    setPostApprovalModal(true);
  };

  const handleApprovePost = async (postId: number) => {
    try {
      // API call to approve post
      message.success("อนุมัติโพสต์เรียบร้อย");
      setPostApprovalModal(false);
      fetchData();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  const handleRejectPost = async (postId: number, reason: string) => {
    try {
      // API call to reject post
      message.success("ปฏิเสธโพสต์เรียบร้อย");
      setPostApprovalModal(false);
      fetchData();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการปฏิเสธ");
    }
  };

  const handleBulkAction = async (action: string, selectedItems: any[]) => {
    try {
      // API call for bulk action
      message.success(`ดำเนินการ ${action} เรียบร้อย`);
      setBulkActionModal(false);
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      message.error("เกิดข้อผิดพลาด");
    }
  };

  const exportToExcel = () => {
    console.log("Exporting to Excel...");
    message.success("กำลังส่งออกข้อมูล...");
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case "รอรับรอง":
        return "orange";
      case "รับรอง":
        return "green";
      case "ปฏิเสธ":
        return "red";
      default:
        return "default";
    }
  };

  const getRoleIcon = (type: any) => {
    switch (type) {
      case "Student":
        return <UserOutlined style={{ color: "#1890ff" }} />;
      case "Company":
        return <BankOutlined style={{ color: "#52c41a" }} />;
      case "AcademicStaff":
        return <BookOutlined style={{ color: "#722ed1" }} />;
      case "Admin":
        return <TeamOutlined style={{ color: "#faad14" }} />;
      default:
        return <UserOutlined />;
    }
  };

  const activityColumns = [
    {
      title: "ผู้ใช้",
      dataIndex: "user",
      key: "user",
      render: (text: any, record: any) => (
        <Space>
          {getRoleIcon(record.type)}
          <Button type="link" onClick={() => showUserDetail(record)}>
            {text}
          </Button>
        </Space>
      ),
    },
    {
      title: "กิจกรรม",
      dataIndex: "action",
      key: "action",
    },
    {
      title: "รายละเอียด",
      key: "details",
      render: (record: any) =>
        record.company || record.post || record.document || "-",
    },
    {
      title: "เวลา",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "การกระทำ",
      key: "actions",
      render: (record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showUserDetail(record)}
          >
            ดู
          </Button>
        </Space>
      ),
    },
  ];

  const postColumns = [
    {
      title: "บริษัท",
      dataIndex: "company",
      key: "company",
    },
    {
      title: "ตำแหน่ง",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "วันที่ส่ง",
      dataIndex: "submitted",
      key: "submitted",
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status: any) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "การกระทำ",
      key: "actions",
      render: (record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showPostApproval(record)}
          >
            ดู
          </Button>
          <Popconfirm
            title="คุณแน่ใจหรือไม่?"
            onConfirm={() => handleApprovePost(record.key)}
          >
            <Button size="small" type="primary" icon={<CheckOutlined />}>
              อนุมัติ
            </Button>
          </Popconfirm>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => showPostApproval(record)}
          >
            ปฏิเสธ
          </Button>
        </Space>
      ),
    },
  ];

  // ---- Company Review UI helpers ----
  const reviewColumns = [
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
          {v?.toFixed(2)}
        </Text>
      ),
    },
  ];

  const pieColors = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];
  const reviewDistributionData = (reviewReport?.distribution || []).map(
    (d) => ({
      name: `${d.rating} ดาว`,
      value: d.count,
    })
  );

  if (!overviewData) {
    return (
      <Layout>
        <AdminHeader />
        <div style={{ padding: "2rem", textAlign: "center" }}>กำลังโหลด...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AdminHeader />
      <Layout className="adminpage-layout">
        {/* Header */}
        <div className="adminpage-dashboard-header">
          <div className="adminpage-dashboard-title">
            แดชบอร์ดแอดมิน - CoopMatch
          </div>
          <div className="adminpage-dashboard-subtitle">
            ภาพรวมระบบสหกิจศึกษา
          </div>
          <Space style={{ marginTop: 16 }}>
            <Button icon={<PlusOutlined />} type="primary">
              เพิ่มข้อมูล
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => setReportModal(true)}
            >
              รายงาน
            </Button>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setBulkActionModal(true)}
            >
              การกระทำแบบกลุ่ม
            </Button>
          </Space>
        </div>

        {/* Overview Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="adminpage-dashboard-stats-card">
              <Statistic
                title="ผู้ใช้ทั้งหมด"
                value={overviewData.total_users || 0}
                prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1890ff", fontSize: "24px" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="adminpage-dashboard-stats-card">
              <Statistic
                title="การสมัครงาน"
                value={overviewData.applications || 0}
                prefix={<FileTextOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a", fontSize: "24px" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="adminpage-dashboard-stats-card">
              <Statistic
                title="การสัมภาษณ์"
                value={overviewData.interviews || 0}
                prefix={<CheckCircleOutlined style={{ color: "#722ed1" }} />}
                valueStyle={{ color: "#722ed1", fontSize: "24px" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="adminpage-dashboard-stats-card">
              <Statistic
                title="รอยืนยัน"
                value={
                  overviewData.pending_posts +
                    overviewData.pending_verifications || 0
                }
                prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                valueStyle={{ color: "#faad14", fontSize: "24px" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Row 1 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title="สถิติการสมัครงานรายเดือน"
              className="adminpage-dashboard-chart-card"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={applicationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#1890ff" name="การสมัคร" />
                  <Bar dataKey="interviews" fill="#52c41a" name="การสัมภาษณ์" />
                  <Bar
                    dataKey="approved"
                    fill="#722ed1"
                    name="ผ่านการคัดเลือก"
                  />
                </BarChart>
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
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="สัดส่วนผู้ใช้ตามบทบาท"
              className="adminpage-dashboard-chart-card"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
                {userRoleData.map((item, index) => (
                  <Col span={12} key={index}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: item.color,
                          marginRight: 8,
                          borderRadius: 2,
                        }}
                      ></div>
                      <span style={{ fontSize: 12 }}>
                        {item.name}: {item.value}
                      </span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Charts Row 2 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={10}>
            <Card
              title="สถานะการยืนยันตัวตน"
              className="adminpage-dashboard-chart-card"
              extra={
                <Button type="link" onClick={() => navigate("/admin/verify")}>
                  ดูรายการทั้งหมด
                </Button>
              }
            >
              <div style={{ marginTop: 30, marginBottom: 60 }}>
                {verificationData.map((item, index) => (
                  <div key={index} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span>{item.status}</span>
                      <span style={{ fontWeight: "bold" }}>{item.count}</span>
                    </div>
                    <Progress
                      percent={
                        (item.count /
                          verificationData.reduce(
                            (sum, v) => sum + v.count,
                            1
                          )) *
                        100
                      }
                      strokeColor={item.color}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                ))}
              </div>
              <Button
                type="primary"
                block
                onClick={() => navigate("/admin/verify")}
              >
                จัดการการยืนยัน
              </Button>
            </Card>
          </Col>
          <Col span={14}>
            <Card
              title="โพสต์งานที่รอการอนุมัติ"
              className="adminpage-dashboard-chart-card"
              extra={
                <Space>
                  <Button
                    type="link"
                    onClick={() => navigate("/admin/manage-posts")}
                  >
                    ดูรายการทั้งหมด
                  </Button>
                </Space>
              }
            >
              <Table
                dataSource={pendingPostsData}
                columns={postColumns}
                pagination={{ pageSize: 3, showSizeChanger: true }}
                scroll={{ x: 800 }}
                rowSelection={{
                  selectedRowKeys: selectedRows,
                  onChange: setSelectedRows,
                }}
              />
            </Card>
          </Col>
        </Row>
        <Card
          title="อัตราการจับคู่สำเร็จ (รายวัน)"
          className="adminpage-dashboard-chart-card"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={matchingSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar
                yAxisId="left"
                dataKey="total"
                name="จำนวนสมัคร"
                fill="#1890ff"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="success_rate"
                name="อัตราสำเร็จ"
                dot={false}
                stroke="#52c41a"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8 }}>
            อัตราสำเร็จรวมช่วงเวลา: <b>{(matchingOverall * 100).toFixed(1)}%</b>
            <Button
              style={{ float: "right" }}
              icon={<DownloadOutlined />}
              onClick={() =>
                window.open(
                  `${
                    import.meta.env.VITE_API_BASE_URL
                  }/analysis/matching/export.csv?days=90`,
                  "_blank"
                )
              }
            >
              Export CSV
            </Button>
          </div>
        </Card>
        <Card
          title="แนวโน้มการสมัครตามหลักสูตร (Top 5)"
          className="adminpage-dashboard-chart-card"
        >
          <ResponsiveContainer width="100%" height={320}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              {programSeries.map((s, idx) => (
                <Line
                  key={s.program}
                  data={s.data}
                  dataKey="value"
                  name={s.program}
                  type="monotone"
                  dot={false}
                />
              ))}
              {/* others (option) */}
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card
          title="รายงานผลการประเมินจากบริษัท (30 วัน)"
          className="adminpage-dashboard-chart-card"
        >
          {reviewSummary && (
            <>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="คะแนนเฉลี่ย"
                    value={reviewSummary.avg_rating?.toFixed(2)}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="จำนวนรีวิว"
                    value={reviewSummary.total_reviews}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <b>Distribution</b>
                {reviewSummary.distribution?.map((d: any) => (
                  <div
                    key={d.rating}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <span>{d.rating}★</span>
                    <Progress
                      percent={
                        reviewSummary.total_reviews
                          ? (d.count / reviewSummary.total_reviews) * 100
                          : 0
                      }
                      showInfo={false}
                    />
                    <span>{d.count}</span>
                  </div>
                ))}
              </div>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <b>Top by Average</b>
                  <Table
                    size="small"
                    dataSource={reviewSummary.top_avg}
                    pagination={false}
                    columns={[
                      { title: "บริษัท", dataIndex: "company_name" },
                      { title: "รีวิว", dataIndex: "reviews", width: 90 },
                      {
                        title: "เฉลี่ย",
                        dataIndex: "avg_rating",
                        width: 90,
                        render: (v: number) => v?.toFixed(2),
                      },
                    ]}
                    rowKey="company_id"
                  />
                </Col>
                <Col span={12}>
                  <b>Top by Count</b>
                  <Table
                    size="small"
                    dataSource={reviewSummary.top_count}
                    pagination={false}
                    columns={[
                      { title: "บริษัท", dataIndex: "company_name" },
                      { title: "รีวิว", dataIndex: "reviews", width: 90 },
                      {
                        title: "เฉลี่ย",
                        dataIndex: "avg_rating",
                        width: 90,
                        render: (v: number) => v?.toFixed(2),
                      },
                    ]}
                    rowKey="company_id"
                  />
                </Col>
              </Row>
            </>
          )}
        </Card><Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
  <Col xs={24} md={10}>
    <Card
      title="📊 สรุปผลการประเมินจากบริษัท (30 วัน)"
      className="adminpage-dashboard-chart-card"
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: 16,
          padding: "12px",
          background:
            "linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(82, 196, 26, 0.1) 100%)",
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 16 }}>
          คะแนนเฉลี่ยรวม:{" "}
          <Text strong style={{ fontSize: 20, color: "#1890ff" }}>
            {reviewReport?.avg_rating != null
              ? reviewReport.avg_rating.toFixed(2)
              : "-"}
          </Text>{" "}
          | รีวิวทั้งหมด:{" "}
          <Text strong style={{ fontSize: 20, color: "#722ed1" }}>
            {reviewReport?.total_reviews ?? 0}
          </Text>
        </Text>
      </div>

      <div
        style={{
          width: "100%",
          height: 260,
          background: "rgba(255, 255, 255, 0.5)",
          borderRadius: 8,
          padding: 8,
        }}
      >
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={reviewDistributionData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                const RAD = Math.PI / 180;
                const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + r * Math.cos(-midAngle! * RAD);
                const y = cy + r * Math.sin(-midAngle! * RAD);
                const value = reviewDistributionData[index!]?.value ?? 0;
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12}
                    fill="#fff"
                  >
                    {value}
                  </text>
                );
              }}
            >
              {reviewDistributionData.map((_, idx) => (
                <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  </Col>

  <Col xs={24} md={14}>
    <Card
      title="🏆 บริษัทคะแนนสูงสุด (เรียงตามคะแนนเฉลี่ย)"
      className="adminpage-dashboard-chart-card"
      extra={
        <Space>
          {/* เผื่ออนาคตปุ่ม filter company_id หรือ export */}
        </Space>
      }
    >
      <Table
        size="small"
        rowKey="company_id"
        columns={reviewColumns}
        dataSource={reviewReport?.top_avg || []}
        pagination={{ pageSize: 5, showSizeChanger: false }}
        style={{
          background: "rgba(255, 255, 255, 0.5)",
          borderRadius: 8,
        }}
      />
    </Card>
  </Col>
</Row>
      </Layout>
    </Layout>
  );
};

export default CoopDashboard;
