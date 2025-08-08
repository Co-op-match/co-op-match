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
} from "@ant-design/icons";
import AdminHeader from "./../Component/AdminCoopMatchHeaderDefault";
import {
  GetAdminDashboardOverview,
  GetAdminMonthlyApplicationStats,
  GetAdminPendingPosts,
  GetAdminRecentActivities,
} from "../../services/https";
import { useNavigate } from "react-router-dom";

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
};

const CoopDashboard = () => {
  const navigate = useNavigate();

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentDetail, setCurrentDetail] = useState(null);

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overviewRes, statsRes, activitiesRes, postsRes] =
        await Promise.all([
          GetAdminDashboardOverview(),
          GetAdminMonthlyApplicationStats(),
          GetAdminRecentActivities(),
          GetAdminPendingPosts(),
        ]);

      const overview = overviewRes.data;

      setOverviewData(overview);
      setApplicationData(statsRes.data);
      setRecentActivities(activitiesRes.data);
      setPendingPostsData(postsRes.data);

      setUserRoleData([
        { name: "นักศึกษา", value: overview.students, color: "#1890ff" },
        { name: "บริษัท", value: overview.companies, color: "#52c41a" },
        { name: "อาจารย์", value: overview.academic_staff, color: "#722ed1" },
        { name: "แอดมิน", value: overview.admins, color: "#faad14" },
      ]);

      setVerificationData([
        {
          status: "รอรับรอง",
          count: overview.pending_verifications,
          color: "#faad14",
        },
        { status: "รับรอง", count: 0, color: "#52c41a" },
        { status: "ปฏิเสธ", count: 0, color: "#ff4d4f" },
        { status: "ยังไม่ส่งคำขอ", count: 0, color: "#d9d9d9" },
      ]);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const showDetail = (type: any) => {
    setCurrentDetail(type);
    setDetailModalVisible(true);
  };

  const exportToExcel = () => {
    // Mock function สำหรับ export Excel
    console.log("Exporting to Excel...");
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
          {text}
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
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => showDetail("activities")}
                >
                  ดูทั้งหมด
                </Button>
              }
            >
              <Table
                dataSource={recentActivities}
                columns={activityColumns}
                pagination={{ pageSize: 5, showSizeChanger: true }}
                size="small"
                scroll={{ y: 280 }}
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
              <div style={{ marginBottom: 16 }}>
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
                            0
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

        {/* Detail Modal */}
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
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={[
                    {
                      name: "มกราคม",
                      students: 200,
                      companies: 45,
                      academicStaff: 20,
                      admins: 10,
                    },
                    {
                      name: "กุมภาพันธ์",
                      students: 350,
                      companies: 67,
                      academicStaff: 25,
                      admins: 15,
                    },
                    {
                      name: "มีนาคม",
                      students: 500,
                      companies: 89,
                      academicStaff: 35,
                      admins: 20,
                    },
                    {
                      name: "เมษายน",
                      students: 680,
                      companies: 145,
                      academicStaff: 55,
                      admins: 30,
                    },
                    {
                      name: "พฤษภาคม",
                      students: 756,
                      companies: 189,
                      academicStaff: 78,
                      admins: 45,
                    },
                    {
                      name: "มิถุนายน",
                      students: 856,
                      companies: 234,
                      academicStaff: 98,
                      admins: 57,
                    },
                  ]}
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
                    render: (record) =>
                      `${(
                        (record.value / overviewData.total_users || 0 ) *
                        100
                      ).toFixed(1)}%`,
                  },
                ]}
                pagination={false}
                size="small"
                style={{ marginTop: 16 }}
              />
            </div>
          )}

          {/* เพิ่ม detail modals อื่นๆ ตามต้องการ */}
          {currentDetail === "activities" && (
            <Table
              dataSource={recentActivities}
              columns={activityColumns}
              pagination={{ pageSize: 10 }}
            />
          )}
        </Modal>
      </Layout>
    </Layout>
  );
};

export default CoopDashboard;
