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
  GetAdminApplicationStats,
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
import HeaderStats from "../../components/adminpage/dashboard/HeaderStats";
import ApplicationsCard from "../../components/adminpage/dashboard/ApplicationsCard";
import UserRoleCard from "../../components/adminpage/dashboard/UserRoleCard";
import RecentActivitiesCard from "../../components/adminpage/dashboard/RecentActivitiesCard";

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

  // Helper แปลง พ.ศ. -> ค.ศ.
  const toAD = (be: number) => be - 543;

  /**************************************** ดึงข้อมูลทั้งหมด ****************************************/
  useEffect(() => {
    fetchData();
  }, []);

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

  /**************************************** ดึงข้อมูล modal จำนวน ผู้ใช้ในแต่ละปี ****************************************/
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

  /**************************************** ดึงข้อมูล modal จำนวน ผู้สมัครในแต่ละปี ****************************************/
  /*   const [appGrain, setAppGrain] = useState<
    "day" | "week" | "month" | "quarter" | "year"
  >("month");
  const [appYearBE, setAppYearBE] = useState<number>(dayjs().year() + 543);
  const [appRange, setAppRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  useEffect(() => {
    loadApplicationStats();
  }, [appGrain, appYearBE, appRange]);

  // ดึงสถิติใหม่ โดยส่งพารามิเตอร์
  const loadApplicationStats = async () => {
    const params: any = { grain: appGrain };
    if (appGrain === "year" || appGrain === "quarter" || appGrain === "month") {
      params.year = String(toAD(appYearBE));
    }
    if (appRange) {
      params.start = appRange[0].format("YYYY-MM-DD");
      params.end = appRange[1].format("YYYY-MM-DD");
    }
    const res = await GetAdminApplicationStats(params); // เขียน service ให้รองรับ params
    setApplicationData(res.data || []);
  }; */

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
          </Space>
        </div>

        {/* Overview Statistics */}
        <HeaderStats overviewData={overviewData} />

        {/* Charts Row 1 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <ApplicationsCard
              applicationData={applicationData}
              onViewDetail={() =>
                navigate("/admin/analytics/applications", {
                  state: { applicationData },
                })
              }
            />
          </Col>

          <Col xs={24} lg={12}>
            <UserRoleCard
              userRoleData={userRoleData}
              onViewDetail={() =>
                navigate("/admin/analytics/users", {
                  state: {
                    userRoleData,
                    userRoleSeries,
                    defaultYearBE: yearBE,
                    yearsBE,
                    defaultMode: mode,
                  },
                })
              }
            />
          </Col>
        </Row>

        {/* Charts Row 2 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={14}>
            <RecentActivitiesCard
              activities={recentActivities}
              onViewAll={() =>
                navigate("/admin/analytics/activities", {
                  state: { recentActivities },
                })
              }
            />
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
      </Layout>
    </Layout>
  );
};

export default CoopDashboard;