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
  notification,
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

const CoopDashboard = () => {
  const navigate = useNavigate();

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [userDetailDrawer, setUserDetailDrawer] = useState(false);
  const [postApprovalModal, setPostApprovalModal] = useState(false);
  const [userManagementModal, setUserManagementModal] = useState(false);
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

  // Filter states
  const [userGrain, setUserGrain] = useState<"month" | "quarter" | "year">(
    "month"
  );
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [mode, setMode] = useState<"month" | "quarter" | "year">("month");
  const [yearBE, setYearBE] = useState<number>(dayjs().year() + 543); // พ.ศ.
  const yearsBE = Array.from({ length: 6 }).map(
    (_, i) => dayjs().year() + 543 - i
  ); // ปีนี้ย้อนหลัง 5 ปี

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
        activitiesRes,
        postsRes,
        monthlyUsersRes,
        topJobsRes,
        popularCompaniesRes,
      ] = await Promise.all([
        GetAdminDashboardOverview(),
        GetAdminMonthlyApplicationStats(),
        GetAdminRecentActivities(),
        GetAdminPendingPosts(),
        GetMonthlyUsersByRole(),
        GetTopJobs(),
        GetPopularCompanies(),
      ]);

      const overview = overviewRes.data;

      setOverviewData(overview);
      setApplicationData(statsRes.data);
      setRecentActivities(activitiesRes.data);
      setPendingPostsData(postsRes.data);
      setMonthlyUserData(monthlyUsersRes.data || []);
      setTopJobs(topJobsRes.data || []);
      setPopularCompanies(popularCompaniesRes.data || []);

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
              extra={
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => showDetail("applications")}
                >
                  ดูรายละเอียด
                </Button>
              }
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
              extra={
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => showDetail("users")}
                >
                  ดูรายละเอียด
                </Button>
              }
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
          <Col xs={24} lg={14}>
            <Card
              title="กิจกรรมล่าสุด"
              className="adminpage-dashboard-activity-card"
              extra={
                <Space>
                  <Search
                    placeholder="ค้นหากิจกรรม"
                    style={{ width: 200 }}
                    onSearch={setSearchText}
                  />
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => showDetail("activities")}
                  >
                    ดูทั้งหมด
                  </Button>
                </Space>
              }
            >
              <Table
                dataSource={recentActivities}
                columns={activityColumns}
                pagination={{ pageSize: 5, showSizeChanger: true }}
                size="small"
                scroll={{ y: 280 }}
                rowSelection={{
                  selectedRowKeys: selectedRows,
                  onChange: setSelectedRows,
                }}
              />
            </Card>
          </Col>

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
        </Row>

        {/* Pending Posts Table */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
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
                pagination={{ pageSize: 5, showSizeChanger: true }}
                scroll={{ x: 800 }}
                rowSelection={{
                  selectedRowKeys: selectedRows,
                  onChange: setSelectedRows,
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* User Detail Drawer */}
        <Drawer
          title="รายละเอียดผู้ใช้"
          width={600}
          open={userDetailDrawer}
          onClose={() => setUserDetailDrawer(false)}
          extra={
            <Space>
              <Button icon={<EditOutlined />}>แก้ไข</Button>
              <Button icon={<MailOutlined />}>ส่งอีเมล</Button>
            </Space>
          }
        >
          {selectedUser && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Avatar size={80} icon={<UserOutlined />} />
                <h3 style={{ margin: "8px 0" }}>{selectedUser.name}</h3>
                <Tag color="blue">{selectedUser.role}</Tag>
              </div>

              <Descriptions column={1} bordered>
                <Descriptions.Item label="อีเมล">
                  {selectedUser.email}
                </Descriptions.Item>
                <Descriptions.Item label="โทรศัพท์">
                  {selectedUser.phone}
                </Descriptions.Item>
                <Descriptions.Item label="สถานะ">
                  <Badge status="success" text={selectedUser.status} />
                </Descriptions.Item>
                <Descriptions.Item label="วันที่เข้าร่วม">
                  {selectedUser.joinDate}
                </Descriptions.Item>
                <Descriptions.Item label="เข้าใช้ล่าสุด">
                  {selectedUser.lastActive}
                </Descriptions.Item>
                {selectedUser.department && (
                  <Descriptions.Item label="แผนก">
                    {selectedUser.department}
                  </Descriptions.Item>
                )}
                {selectedUser.company && (
                  <Descriptions.Item label="บริษัท">
                    {selectedUser.company}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <div style={{ marginTop: 24 }}>
                <h4>กิจกรรมล่าสุด</h4>
                <Timeline>
                  <Timeline.Item color="green">
                    เข้าสู่ระบบ - 2 ชั่วโมงที่แล้ว
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    อัปเดตโปรไฟล์ - 1 วันที่แล้ว
                  </Timeline.Item>
                  <Timeline.Item>สมัครงาน - 3 วันที่แล้ว</Timeline.Item>
                </Timeline>
              </div>
            </div>
          )}
        </Drawer>

        {/* Post Approval Modal */}
        <Modal
          title="อนุมัติโพสต์งาน"
          open={postApprovalModal}
          onCancel={() => setPostApprovalModal(false)}
          width={800}
          footer={[
            <Button
              key="reject"
              danger
              onClick={() => handleRejectPost(selectedPost?.key!, "")}
            >
              ปฏิเสธ
            </Button>,
            <Button
              key="approve"
              type="primary"
              onClick={() => handleApprovePost(selectedPost?.key!)}
            >
              อนุมัติ
            </Button>,
          ]}
        >
          {selectedPost && (
            <Descriptions column={2} bordered>
              <Descriptions.Item label="บริษัท" span={2}>
                {selectedPost.company}
              </Descriptions.Item>
              <Descriptions.Item label="ตำแหน่ง">
                {selectedPost.position}
              </Descriptions.Item>
              <Descriptions.Item label="วันที่ส่ง">
                {selectedPost.submitted}
              </Descriptions.Item>
              <Descriptions.Item label="สถานะ">
                <Tag color={getStatusColor(selectedPost.status)}>
                  {selectedPost.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="เงินเดือน">
                {selectedPost.salary || "ไม่ระบุ"}
              </Descriptions.Item>
              <Descriptions.Item label="สถานที่" span={2}>
                {selectedPost.location || "ไม่ระบุ"}
              </Descriptions.Item>
              <Descriptions.Item label="รายละเอียดงาน" span={2}>
                {selectedPost.description || "ไม่มีรายละเอียด"}
              </Descriptions.Item>
              <Descriptions.Item label="คุณสมบัติที่ต้องการ" span={2}>
                {selectedPost.requirements || "ไม่ระบุ"}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* User Management Modal */}
        <Modal
          title="จัดการผู้ใช้"
          open={userManagementModal}
          onCancel={() => setUserManagementModal(false)}
          width={1000}
          footer={[
            <Button key="close" onClick={() => setUserManagementModal(false)}>
              ปิด
            </Button>,
          ]}
        >
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Search placeholder="ค้นหาผู้ใช้" onSearch={setSearchText} />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="เลือกบทบาท"
                  style={{ width: "100%" }}
                  allowClear
                >
                  <Option value="Student">นักศึกษา</Option>
                  <Option value="Company">บริษัท</Option>
                  <Option value="AcademicStaff">อาจารย์</Option>
                  <Option value="Admin">แอดมิน</Option>
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="สถานะ"
                  style={{ width: "100%" }}
                  allowClear
                >
                  <Option value="Active">ใช้งาน</Option>
                  <Option value="Inactive">ไม่ใช้งาน</Option>
                  <Option value="Pending">รอยืนยัน</Option>
                  <Option value="Suspended">ระงับการใช้งาน</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Button type="primary" icon={<PlusOutlined />}>
                  เพิ่มผู้ใช้
                </Button>
              </Col>
            </Row>
          </div>

          <Table
            dataSource={recentActivities.map((activity, index) => ({
              key: index,
              name: activity.user,
              role: activity.type,
              email: `${activity.user.toLowerCase()}@example.com`,
              status: "Active",
              lastActive: activity.time,
            }))}
            columns={[
              {
                title: "ชื่อ",
                dataIndex: "name",
                key: "name",
                render: (text, record) => (
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {text}
                  </Space>
                ),
              },
              {
                title: "บทบาท",
                dataIndex: "role",
                key: "role",
                render: (role) => <Tag>{role}</Tag>,
              },
              {
                title: "อีเมล",
                dataIndex: "email",
                key: "email",
              },
              {
                title: "สถานะ",
                dataIndex: "status",
                key: "status",
                render: (status) => (
                  <Badge
                    status={status === "Active" ? "success" : "default"}
                    text={status}
                  />
                ),
              },
              {
                title: "เข้าใช้ล่าสุด",
                dataIndex: "lastActive",
                key: "lastActive",
              },
              {
                title: "การกระทำ",
                key: "actions",
                render: (record) => (
                  <Space>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setUserManagementModal(false);
                        showUserDetail(record);
                      }}
                    >
                      ดู
                    </Button>
                    <Button size="small" icon={<EditOutlined />}>
                      แก้ไข
                    </Button>
                    <Popconfirm
                      title="คุณแน่ใจหรือไม่?"
                      onConfirm={() => message.success("ลบผู้ใช้เรียบร้อย")}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        ลบ
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            pagination={{ pageSize: 10 }}
          />
        </Modal>

        {/* Verification Modal */}
        <Modal
          title="จัดการการยืนยันตัวตน"
          open={verificationModal}
          onCancel={() => setVerificationModal(false)}
          width={1000}
          footer={[
            <Button key="close" onClick={() => setVerificationModal(false)}>
              ปิด
            </Button>,
          ]}
        >
          <Tabs defaultActiveKey="pending">
            <TabPane
              tab={`รอดำเนินการ (${verificationData[0]?.count || 0})`}
              key="pending"
            >
              <Table
                dataSource={Array.from({ length: 5 }, (_, index) => ({
                  key: index,
                  name: `ผู้ใช้ ${index + 1}`,
                  type: ["Student", "Company"][index % 2],
                  document: "บัตรประชาชน",
                  submitted: "2024-01-15",
                  status: "รอดำเนินการ",
                }))}
                columns={[
                  {
                    title: "ชื่อผู้ใช้",
                    dataIndex: "name",
                    key: "name",
                    render: (text, record) => (
                      <Space>
                        {getRoleIcon(record.type)}
                        {text}
                      </Space>
                    ),
                  },
                  {
                    title: "ประเภท",
                    dataIndex: "type",
                    key: "type",
                    render: (type) => <Tag>{type}</Tag>,
                  },
                  {
                    title: "เอกสาร",
                    dataIndex: "document",
                    key: "document",
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
                    render: (status) => <Tag color="orange">{status}</Tag>,
                  },
                  {
                    title: "การกระทำ",
                    key: "actions",
                    render: (record) => (
                      <Space>
                        <Button size="small" icon={<EyeOutlined />}>
                          ดูเอกสาร
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={() => {
                            message.success("อนุมัติการยืนยันเรียบร้อย");
                            fetchData();
                          }}
                        >
                          อนุมัติ
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<CloseOutlined />}
                          onClick={() => {
                            message.error("ปฏิเสธการยืนยัน");
                            fetchData();
                          }}
                        >
                          ปฏิเสธ
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                pagination={{ pageSize: 5 }}
              />
            </TabPane>
            <TabPane tab="อนุมัติแล้ว" key="approved">
              <Table
                dataSource={[]}
                columns={[
                  { title: "ชื่อผู้ใช้", dataIndex: "name", key: "name" },
                  { title: "ประเภท", dataIndex: "type", key: "type" },
                  {
                    title: "วันที่อนุมัติ",
                    dataIndex: "approved",
                    key: "approved",
                  },
                ]}
                locale={{ emptyText: "ไม่มีข้อมูล" }}
              />
            </TabPane>
            <TabPane tab="ปฏิเสธแล้ว" key="rejected">
              <Table
                dataSource={[]}
                columns={[
                  { title: "ชื่อผู้ใช้", dataIndex: "name", key: "name" },
                  { title: "ประเภท", dataIndex: "type", key: "type" },
                  { title: "เหตุผล", dataIndex: "reason", key: "reason" },
                  {
                    title: "วันที่ปฏิเสธ",
                    dataIndex: "rejected",
                    key: "rejected",
                  },
                ]}
                locale={{ emptyText: "ไม่มีข้อมูล" }}
              />
            </TabPane>
          </Tabs>
        </Modal>

        {/* Report Modal */}
        <Modal
          title="สร้างรายงาน"
          open={reportModal}
          onCancel={() => setReportModal(false)}
          onOk={() => {
            message.success("กำลังสร้างรายงาน...");
            setReportModal(false);
          }}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="reportType"
              label="ประเภทรายงาน"
              rules={[{ required: true, message: "กรุณาเลือกประเภทรายงาน" }]}
            >
              <Select placeholder="เลือกประเภทรายงาน">
                <Option value="user_statistics">สstatติผู้ใช้</Option>
                <Option value="application_report">รายงานการสมัครงาน</Option>
                <Option value="company_report">รายงานบริษัท</Option>
                <Option value="activity_log">บันทึกกิจกรรม</Option>
                <Option value="verification_report">รายงานการยืนยัน</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="dateRange"
              label="ช่วงเวลา"
              rules={[{ required: true, message: "กรุณาเลือกช่วงเวลา" }]}
            >
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="format" label="รูปแบบไฟล์" initialValue="excel">
              <Select>
                <Option value="excel">Excel (.xlsx)</Option>
                <Option value="pdf">PDF (.pdf)</Option>
                <Option value="csv">CSV (.csv)</Option>
              </Select>
            </Form.Item>

            <Form.Item name="includeCharts" valuePropName="checked">
              <Space>
                <input type="checkbox" />
                รวมกราฟและแผนภูมิ
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Bulk Action Modal */}
        <Modal
          title="การกระทำแบบกลุ่ม"
          open={bulkActionModal}
          onCancel={() => setBulkActionModal(false)}
          onOk={() => {
            handleBulkAction("bulk_action", selectedRows);
          }}
          width={500}
        >
          <div style={{ marginBottom: 16 }}>
            <p>เลือกรายการที่ต้องการดำเนินการ: {selectedRows.length} รายการ</p>
          </div>

          <Form layout="vertical">
            <Form.Item label="เลือกการกระทำ" required>
              <Select placeholder="เลือกการกระทำ">
                <Option value="approve_all">อนุมัติทั้งหมด</Option>
                <Option value="reject_all">ปฏิเสธทั้งหมด</Option>
                <Option value="delete_all">ลบทั้งหมด</Option>
                <Option value="export_selected">ส่งออกที่เลือก</Option>
                <Option value="send_notification">ส่งการแจ้งเตือน</Option>
              </Select>
            </Form.Item>

            <Form.Item label="หมายเหตุ (ไม่บังคับ)">
              <Input.TextArea
                rows={3}
                placeholder="เพิ่มหมายเหตุสำหรับการกระทำนี้..."
              />
            </Form.Item>
          </Form>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: "#fff2e8",
              borderRadius: 6,
            }}
          >
            <Space>
              <WarningOutlined style={{ color: "#fa8c16" }} />
              <span style={{ color: "#fa8c16" }}>
                การกระทำนี้ไม่สามารถยกเลิกได้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
              </span>
            </Space>
          </div>
        </Modal>

        {/* System Settings Modal */}
        <Modal
          title="การตั้งค่าระบบ"
          open={systemSettingsModal}
          onCancel={() => setSystemSettingsModal(false)}
          onOk={() => {
            message.success("บันทึกการตั้งค่าเรียบร้อย");
            setSystemSettingsModal(false);
          }}
          width={700}
        >
          <Tabs defaultActiveKey="general">
            <TabPane tab="ทั่วไป" key="general">
              <Form layout="vertical">
                <Form.Item label="ชื่อระบบ" initialValue="CoopMatch">
                  <Input />
                </Form.Item>
                <Form.Item
                  label="อีเมลผู้ดูแลระบบ"
                  initialValue="admin@coopmatch.com"
                >
                  <Input />
                </Form.Item>
                <Form.Item label="จำนวนรายการต่อหน้า" initialValue={10}>
                  <Select>
                    <Option value={5}>5</Option>
                    <Option value={10}>10</Option>
                    <Option value={20}>20</Option>
                    <Option value={50}>50</Option>
                  </Select>
                </Form.Item>
              </Form>
            </TabPane>
            <TabPane tab="การแจ้งเตือน" key="notifications">
              <Form layout="vertical">
                <Form.Item label="การแจ้งเตือนทางอีเมล">
                  <Space direction="vertical">
                    <label>
                      <input type="checkbox" defaultChecked /> การสมัครงานใหม่
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked /> การอนุมัติโพสต์
                    </label>
                    <label>
                      <input type="checkbox" /> การยืนยันตัวตน
                    </label>
                    <label>
                      <input type="checkbox" /> รายงานรายสัปดาห์
                    </label>
                  </Space>
                </Form.Item>
              </Form>
            </TabPane>
            <TabPane tab="ความปลอดภัย" key="security">
              <Form layout="vertical">
                <Form.Item label="ระยะเวลาการล็อกอิน (นาที)" initialValue={60}>
                  <Input type="number" />
                </Form.Item>
                <Form.Item
                  label="จำนวนครั้งการล็อกอินที่ผิดพลาด"
                  initialValue={5}
                >
                  <Input type="number" />
                </Form.Item>
                <Form.Item label="การล็อกกิจกรรม">
                  <Space direction="vertical">
                    <label>
                      <input type="checkbox" defaultChecked />{" "}
                      บันทึกการเข้าสู่ระบบ
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked />{" "}
                      บันทึกการแก้ไขข้อมูล
                    </label>
                    <label>
                      <input type="checkbox" /> บันทึกการลบข้อมูล
                    </label>
                  </Space>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Modal>

        {/* Detail Modal (Original) */}
        <Modal
          title={`รายละเอียด${
            currentDetail === "applications"
              ? "การสมัครงาน"
              : currentDetail === "users"
              ? "ผู้ใช้"
              : currentDetail === "activities"
              ? "กิจกรรม"
              : currentDetail === "verifications"
              ? "การยืนยันตัวตน"
              : currentDetail === "posts"
              ? "โพสต์งาน"
              : ""
          }`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={800}
          footer={[
            <Button
              key="export"
              icon={<DownloadOutlined />}
              onClick={exportToExcel}
            >
              Export Excel
            </Button>,
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              ปิด
            </Button>,
          ]}
        >
          {currentDetail === "applications" && (
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={applicationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#1890ff"
                    name="การสมัคร"
                  />
                  <Line
                    type="monotone"
                    dataKey="interviews"
                    stroke="#52c41a"
                    name="การสัมภาษณ์"
                  />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="#722ed1"
                    name="ผ่านการคัดเลือก"
                  />
                </LineChart>
              </ResponsiveContainer>
              <Table
                dataSource={applicationData.map((item, index) => ({
                  key: index,
                  ...item,
                }))}
                columns={[
                  { title: "เดือน", dataIndex: "month", key: "month" },
                  {
                    title: "การสมัคร",
                    dataIndex: "applications",
                    key: "applications",
                  },
                  {
                    title: "การสัมภาษณ์",
                    dataIndex: "interviews",
                    key: "interviews",
                  },
                  {
                    title: "ผ่านการคัดเลือก",
                    dataIndex: "approved",
                    key: "approved",
                  },
                ]}
                pagination={false}
                size="small"
                style={{ marginTop: 16 }}
              />
            </div>
          )}

          {currentDetail === "users" && (
            <div>
              <div
                style={{
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Space
                  wrap
                  style={{
                    justifyContent: "flex-end",
                    width: "100%",
                    marginBottom: 12,
                  }}
                >
                  <Select
                    value={yearBE}
                    onChange={setYearBE}
                    options={yearsBE.map((y) => ({ label: y, value: y }))}
                    style={{ width: 120 }}
                  />
                  <Segmented
                    value={mode}
                    onChange={(v) => setMode(v as any)}
                    options={[
                      { label: "เดือน", value: "month" },
                      { label: "ไตรมาส", value: "quarter" },
                      { label: "ปี", value: "year" },
                    ]}
                  />
                </Space>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={(Array.isArray(userRoleSeries)
                    ? userRoleSeries
                    : []
                  ).map((p: any) => ({
                    name: p.label,
                    students: p.students,
                    companies: p.companies,
                    academicStaff: p.academic_staff,
                    admins: p.admins,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stackId="1"
                    stroke="#1890ff"
                    fill="#1890ff"
                    name="นักศึกษา"
                  />
                  <Area
                    type="monotone"
                    dataKey="companies"
                    stackId="1"
                    stroke="#52c41a"
                    fill="#52c41a"
                    name="บริษัท"
                  />
                  <Area
                    type="monotone"
                    dataKey="academicStaff"
                    stackId="1"
                    stroke="#722ed1"
                    fill="#722ed1"
                    name="อาจารย์"
                  />
                  <Area
                    type="monotone"
                    dataKey="admins"
                    stackId="1"
                    stroke="#faad14"
                    fill="#faad14"
                    name="แอดมิน"
                  />
                </AreaChart>
              </ResponsiveContainer>

              <Table
                dataSource={userRoleData.map((item, index) => ({
                  key: index,
                  ...item,
                }))}
                columns={[
                  { title: "บทบาท", dataIndex: "name", key: "name" },
                  { title: "จำนวน", dataIndex: "value", key: "value" },
                  {
                    title: "เปอร์เซ็นต์",
                    key: "percent",
                    render: (record: any) =>
                      `${((record.value / (userRoleTotal || 1)) * 100).toFixed(
                        1
                      )}%`,
                  },
                ]}
                pagination={false}
                size="small"
                style={{ marginTop: 16 }}
              />
            </div>
          )}

          {currentDetail === "activities" && (
            <Table
              dataSource={recentActivities}
              columns={activityColumns}
              pagination={{ pageSize: 10 }}
            />
          )}
        </Modal>

        {/* Quick Actions Floating Button */}
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <Space direction="vertical">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setUserManagementModal(true)}
              title="จัดการผู้ใช้"
            />
            <Button
              type="default"
              shape="circle"
              size="large"
              icon={<WarningOutlined />}
              onClick={() => setVerificationModal(true)}
              title="การยืนยันที่รอดำเนินการ"
              style={{
                backgroundColor: "#faad14",
                borderColor: "#faad14",
                color: "white",
              }}
            />
          </Space>
        </div>
      </Layout>
    </Layout>
  );
};

export default CoopDashboard;
