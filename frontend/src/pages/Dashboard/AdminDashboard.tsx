import React, { useState, useEffect } from "react";
import {
  Layout,
  Row,
  Col,
  Typography,
  Input,
  Button,
  Card,
  Statistic,
  Table,
  Tag,
  Space,
  Avatar,
  Progress,
  Divider,
  Alert,
  notification,
  Dropdown,
  Menu,
  Badge,
} from "antd";
import {
  UserOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  MoreOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../Component/AdminCoopMatchHeaderDefault";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  pendingVerifications: number;
  approvedVerifications: number;
  rejectedVerifications: number;
}

interface RecentActivity {
  id: string;
  type: "verification" | "registration" | "update";
  user: string;
  action: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Mock data - ในการใช้งานจริงจะดึงจาก API
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 1247,
    totalCompanies: 156,
    pendingVerifications: 23,
    approvedVerifications: 189,
    rejectedVerifications: 12,
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "verification",
      user: "บริษัท ABC จำกัด",
      action: "ส่งคำขอรับรอง",
      timestamp: "2 นาทีที่แล้ว",
      status: "pending",
    },
    {
      id: "2",
      type: "registration",
      user: "สมชาย ใจดี",
      action: "สมัครสมาชิกใหม่",
      timestamp: "15 นาทีที่แล้ว",
      status: "approved",
    },
    {
      id: "3",
      type: "verification",
      user: "บริษัท XYZ จำกัด",
      action: "ได้รับการรับรอง",
      timestamp: "1 ชั่วโมงที่แล้ว",
      status: "approved",
    },
  ]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("id");
    localStorage.removeItem("isLogin");
    localStorage.removeItem("role");
    localStorage.removeItem("roleId");

    notification.success({
      message: "ออกจากระบบสำเร็จ",
      description: "คุณได้ออกจากระบบเรียบร้อยแล้ว",
    });

    navigate("/sign-in");
  };

  const handleSearch = (value: string) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (value) {
        notification.info({
          message: "ผลการค้นหา",
          description: `ค้นหา "${value}" เสร็จสิ้น`,
        });
      }
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "orange";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "รอดำเนินการ";
      case "approved":
        return "อนุมัติ";
      case "rejected":
        return "ปฏิเสธ";
      default:
        return status;
    }
  };

  const activityColumns = [
    {
      title: "ผู้ใช้",
      dataIndex: "user",
      key: "user",
      render: (text: string) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "กิจกรรม",
      dataIndex: "action",
      key: "action",
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "เวลา",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: "การดำเนินการ",
      key: "action",
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}>
            ดูรายละเอียด
          </Button>
        </Space>
      ),
    },
  ];

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "โปรไฟล์",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "ตั้งค่า",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "ออกจากระบบ",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminHeader />
      <Layout>
        <Content style={{ margin: "24px", background: "#f5f5f5" }}>
          {/* Alert สำหรับการแจ้งเตือน */}
          {stats.pendingVerifications > 0 && (
            <Alert
              message={`มีคำขอรับรองที่รอดำเนินการ ${stats.pendingVerifications} รายการ`}
              type="warning"
              showIcon
              closable
              style={{ marginBottom: 24 }}
              action={
                <Button size="small" type="primary">
                  ดูรายการ
                </Button>
              }
            />
          )}

          {/* Statistics Cards */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="ผู้ใช้ทั้งหมด"
                  value={stats.totalUsers}
                  prefix={<UserOutlined style={{ color: "#1677ff" }} />}
                  valueStyle={{ color: "#1677ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="บริษัททั้งหมด"
                  value={stats.totalCompanies}
                  prefix={<BankOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="รอดำเนินการ"
                  value={stats.pendingVerifications}
                  prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="ได้รับการรับรอง"
                  value={stats.approvedVerifications}
                  prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Search and Filters */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={12}>
                <Input.Search
                  placeholder="ค้นหาผู้ใช้, บริษัท, หรือกิจกรรม..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  loading={loading}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onSearch={handleSearch}
                />
              </Col>
              <Col xs={24} md={12}>
                <Space wrap>
                  <Button icon={<FilterOutlined />}>ตัวกรอง</Button>
                  <Button icon={<ExportOutlined />}>ส่งออกข้อมูล</Button>
                  <Button
                    type="primary"
                    onClick={() => navigate("/admin/verify")}
                  >
                    จัดการการรับรอง
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Main Content */}
          <Row gutter={[24, 24]}>
            {/* Recent Activities */}
            <Col xs={24} xl={16}>
              <Card
                title="กิจกรรมล่าสุด"
                extra={
                  <Button type="link" size="small">
                    ดูทั้งหมด
                  </Button>
                }
              >
                <Table
                  columns={activityColumns}
                  dataSource={recentActivities}
                  pagination={false}
                  size="small"
                  rowKey="id"
                />
              </Card>
            </Col>

            {/* Quick Actions & Progress */}
            <Col xs={24} xl={8}>
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                {/* Quick Actions */}
                <Card title="การดำเนินการด่วน">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Button
                      type="primary"
                      block
                      size="large"
                      onClick={() => navigate("/admin/verify")}
                    >
                      ตรวจสอบการรับรอง
                    </Button>
                    <Button
                      block
                      size="large"
                      onClick={() => navigate("/admin/users")}
                    >
                      จัดการผู้ใช้
                    </Button>
                    <Button
                      block
                      size="large"
                      onClick={() => navigate("/admin/companies")}
                    >
                      จัดการบริษัท
                    </Button>
                  </Space>
                </Card>

                {/* System Status */}
                <Card title="สถานะระบบ">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <Text>ประสิทธิภาพระบบ</Text>
                      <Progress percent={92} status="active" />
                    </div>
                    <div>
                      <Text>การใช้งานเซิร์ฟเวอร์</Text>
                      <Progress percent={68} />
                    </div>
                    <div>
                      <Text>พื้นที่จัดเก็บข้อมูล</Text>
                      <Progress percent={45} />
                    </div>
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;