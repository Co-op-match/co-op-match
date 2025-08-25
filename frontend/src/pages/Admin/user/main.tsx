import {
  Card,
  Descriptions,
  Table,
  Tag,
  Tabs,
  Avatar,
  Badge,
  Row,
  Col,
  Statistic,
  Timeline,
  Empty,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Space,
  Tooltip,
  Divider,
  Layout,
  Typography,
} from "antd";
import {
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  EditOutlined,
  EyeOutlined,
  SafetyOutlined,
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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
import type { StudentInterestInterface } from "../../../interfaces/StudentInterest";
import type { CompanyInterface } from "../../../interfaces/Company";
import type { StudentInterface } from "../../../interfaces/Student";
import type { AcademicStaffInterface } from "../../../interfaces/AcademicStaff";
import {
  GetAllAcademicStaff,
  GetAllCompany,
  GetAllLoginLogs,
  GetAllStudent,
  GetAllUser,
  GetRole,
  UpdateUser,
} from "../../../services/https";
import type { RoleInterface } from "../../../interfaces/Role";
import type { LoginLogInterface } from "../../../interfaces/LoginLog";
import type { ColumnsType, TableProps } from "antd/es/table";
import { width } from "@fortawesome/free-solid-svg-icons/fa0";
import AdminHeader from "../../Component/AdminCoopMatchHeaderDefault";
import ExportPostsButton from "../../../components/adminpage/post/Post_ExportButton";
import ExportExcelButton from "./ExportExcelButton";

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text } = Typography;

const AdminUserDetailsPage: React.FC = () => {
  const [users, setUsers] = useState<UserInterface[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserInterface[]>([]);
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

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loginSearchText, setLoginSearchText] = useState("");

  const [form] = Form.useForm();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalMs, setIntervalMs] = useState(600000); // 10,000 : 10s

  const refreshData = useCallback(async () => {
    try {
      const [
        usersRes,
        studentsRes,
        companiesRes,
        academicRes,
        logsRes,
        roleRes,
      ] = await Promise.all([
        GetAllUser(),
        GetAllStudent(),
        GetAllCompany(),
        GetAllAcademicStaff(),
        GetAllLoginLogs(),
        GetRole(),
      ]);

      const usersData = usersRes.data ?? [];
      setUsers(usersData);
      setFilteredUsers(usersData);

      setStudents(studentsRes.data ?? []);
      setCompanies(companiesRes.data ?? []);
      setAcademicStaffs(academicRes.data ?? []);
      setLoginLogs(logsRes.data ?? []);
      setFilteredLoginLogs(logsRes.data ?? []);
      setRoles(roleRes.data ?? []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // โหลดครั้งแรก
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      refreshData();
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoRefresh, intervalMs, refreshData]);

  // Filter users based on search text
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.Email?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.Role?.RoleNameTH?.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchText]);

  // Filter login logs based on search text
  useEffect(() => {
    const filtered = loginLogs.filter(
      (log) =>
        log.User?.Email?.toLowerCase().includes(
          loginSearchText.toLowerCase()
        ) ||
        log.ip?.toLowerCase().includes(loginSearchText.toLowerCase()) ||
        log.device?.toLowerCase().includes(loginSearchText.toLowerCase())
    );
    setFilteredLoginLogs(filtered);
    console.log("filtered: ",filtered);
  }, [loginLogs, loginSearchText]);

  // Statistics data for charts - separated by Role
  const adminStats = users.filter((u) => u.Role?.RoleName === "Admin");
  const studentStats = users.filter((u) => u.Role?.RoleName === "Student");
  const companyStats = users.filter((u) => u.Role?.RoleName === "Company");
  const academicStats = users.filter(
    (u) => u.Role?.RoleName === "AcademicStaff"
  );

  const roleChartData = [
    {
      name: "แอดมิน",
      total: adminStats.length,
      online: adminStats.filter((u) => u.is_logged_in).length,
      offline: adminStats.filter((u) => !u.is_logged_in).length,
    },
    {
      name: "นักเรียน",
      total: studentStats.length,
      online: studentStats.filter((u) => u.is_logged_in).length,
      offline: studentStats.filter((u) => !u.is_logged_in).length,
    },
    {
      name: "บริษัท",
      total: companyStats.length,
      online: companyStats.filter((u) => u.is_logged_in).length,
      offline: companyStats.filter((u) => !u.is_logged_in).length,
    },
    {
      name: "อาจารย์",
      total: academicStats.length,
      online: academicStats.filter((u) => u.is_logged_in).length,
      offline: academicStats.filter((u) => !u.is_logged_in).length,
    },
  ];

  const roleStats = roles.map((Role) => ({
    name: Role.RoleNameTH,
    value: users.filter((user) => user.Role?.RoleName === Role.RoleName).length,
    color:
      Role.RoleName === "Admin"
        ? "#1890ff"
        : Role.RoleName === "Student"
        ? "#52c41a"
        : Role.RoleName === "Company"
        ? "#fa8c16"
        : "#722ed1",
  }));

  const activeStats = [
    {
      name: "ออนไลน์",
      value: users.filter((u) => u.is_logged_in).length,
      color: "#52c41a",
    },
    {
      name: "ออฟไลน์",
      value: users.filter((u) => !u.is_logged_in).length,
      color: "#f5222d",
    },
  ];

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

  const monthlyUserData = [
    { month: "ม.ค.", users: 45 },
    { month: "ก.พ.", users: 52 },
    { month: "มี.ค.", users: 48 },
    { month: "เม.ย.", users: 61 },
    { month: "พ.ค.", users: 55 },
    { month: "มิ.ย.", users: 67 },
    { month: "ก.ค.", users: 73 },
    { month: "ส.ค.", users: 78 },
  ];

  // 1) ฟิลเตอร์บทบาทที่เลือก (controlled)
  const [roleFilterKeys, setRoleFilterKeys] = useState<Key[] | null>(null);

  // 2) รวมการค้นหา + ฟิลเตอร์บทบาท -> รายการที่แสดงจริง
  const displayedUsers = useMemo(() => {
    let data = [...users];

    // ค้นหา
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      data = data.filter(
        (u) =>
          u.Email?.toLowerCase().includes(q) ||
          u.Role?.RoleNameTH?.toLowerCase().includes(q)
      );
    }

    // ฟิลเตอร์บทบาท (จากตัวกรองคอลัมน์)
    if (roleFilterKeys?.length) {
      const allow = new Set(roleFilterKeys.map(String));
      data = data.filter((u) => allow.has(String(u.Role?.RoleNameTH ?? "")));
    }

    return data;
  }, [users, searchText, roleFilterKeys]);

  // วางไว้บนสุดของไฟล์ (นอก component) หรือย้ายไป utils ก็ได้
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  /** ถ้าเป็นลิงก์เต็ม -> ใช้เลย, ถ้าเป็นพาธ -> เติม BASE_URL ให้ถูกต้อง */
  const resolveUrl = (p?: string) => {
    if (!p) return undefined;
    if (/^https?:\/\//i.test(p)) return p; // ลิงก์เต็ม
    const base = BASE_URL.replace(/\/+$/, ""); // ตัด / ท้าย
    const path = p.startsWith("/") ? p : `/${p}`; // เติม / หน้า
    return `${base}${path}`;
  };

  const userColumns: ColumnsType<UserInterface> = [
    {
      title: "อีเมล",
      dataIndex: "Email",
      key: "Email",
      render: (Email: string, record: UserInterface) => {
        const isCompany = record.Role?.RoleName === "Company";
        const raw = isCompany
          ? record.Company?.[0]?.logo
          : record.ProfileImage?.[0]?.image_url;

        const imgSrc = resolveUrl(raw);

        return (
          <Space>
            <Avatar
              src={imgSrc}
              icon={!imgSrc ? <UserOutlined /> : undefined}
            />
            <span>{Email}</span>
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
      render: (record: UserInterface) => (
        <Space>
          <Badge
            status={record.is_active ? "success" : "error"}
            text={record.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
          />
          <Badge
            status={record.is_logged_in ? "processing" : "default"}
            text={record.is_logged_in ? "ออนไลน์" : "ออฟไลน์"}
          />
        </Space>
      ),
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "CreatedAt",
      key: "CreatedAt",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "การจัดการ",
      key: "actions",
      render: (record: UserInterface) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewUser(record)}
            style={{
              background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
            }}
          >
            ดู
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditUser(record)}
            style={{
              borderColor: "#1976d2",
              color: "#1976d2",
              borderRadius: "8px",
              background: "rgba(25, 118, 210, 0.02)",
            }}
          >
            แก้ไข
          </Button>
        </Space>
      ),
    },
  ];

const loginLogColumns: ColumnsType<LoginLogInterface> = [
    {
      title: "อีเมล",
      dataIndex: ["User", "Email"],
      key: "Email",
      render: (Email: string, record: UserInterface) => {
        const isCompany = record.Role?.RoleName === "Company";
        const raw = isCompany
          ? record.Company?.[0]?.logo
          : record.ProfileImage?.[0]?.image_url;

        const imgSrc = resolveUrl(raw);

        return (
          <Space>
            <Avatar
              src={imgSrc}
              icon={!imgSrc ? <UserOutlined /> : undefined}
            />
            <span>{Email}</span>
          </Space>
        );
      },
    },
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
      render: (ip: string) => <Tag icon={<GlobalOutlined />}>{ip}</Tag>,
    },
    {
      title: "อุปกรณ์",
      dataIndex: "device",
      key: "device",
      width: 500,
    },
    {
      title: "เวลาเข้าสู่ระบบ",
      dataIndex: "login_at",
      key: "login_at",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "เวลาออกจากระบบ",
      dataIndex: "logout_at",
      key: "logout_at",
    render: (date?: string | null) =>
      date && String(date).trim() !== ""
        ? dayjs(date).format("DD/MM/YYYY HH:mm:ss")
        : <Tag color="green">ยังคงออนไลน์</Tag>,
    },
  ];

  const handleViewUser = (user: UserInterface) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const handleEditUser = (user: UserInterface) => {
    setSelectedUser(user);
    form.setFieldsValue({
      Email: user.Email,
      is_active: user.is_active,
      RoleID: user.RoleID,
    });
    setEditModalVisible(true);
  };

  const handleUserTableChange: TableProps<UserInterface>["onChange"] = (
    _pagination,
    filters,
    _sorter
  ) => {
    // ชื่อ key ต้องตรงกับ key ของคอลัมน์ ("Role")
    const val = filters?.Role as Key[] | null | undefined;
    setRoleFilterKeys(val ?? null);
  };

  const handleEditSubmit = (values: any) => {
    console.log("Updated user:", values);
    setEditModalVisible(false);
    form.resetFields();
  };

  const renderUserDetail = () => {
    if (!selectedUser) return null;

    let profileData = null;
    if (selectedUser.Role?.RoleName === "Student") {
      profileData = students.find((s) => s.UserID === selectedUser.ID);
    } else if (selectedUser.Role?.RoleName === "Company") {
      profileData = companies.find((c) => c.UserID === selectedUser.ID);
    } else if (selectedUser.Role?.RoleName === "AcademicStaff") {
      profileData = academicStaffs.find((a) => a.UserID === selectedUser.ID);
    }

    return (
      <div>
        <Descriptions bordered column={2}>
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
              status={selectedUser.is_logged_in ? "processing" : "default"}
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

        {profileData && (
          <>
            <Divider>ข้อมูลโปรไฟล์</Divider>
            <Descriptions bordered column={2}>
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
                    {(profileData as AcademicStaffInterface).academic_position}
                  </Descriptions.Item>
                  <Descriptions.Item label="อายุ">
                    {(profileData as AcademicStaffInterface).age} ปี
                  </Descriptions.Item>
                  <Descriptions.Item label="คณะ">
                    {(profileData as AcademicStaffInterface).faculty}
                  </Descriptions.Item>
                  <Descriptions.Item label="ภาควิชา">
                    {(profileData as AcademicStaffInterface).department}
                  </Descriptions.Item>
                  <Descriptions.Item label="มหาวิทยาลัย" span={2}>
                    {(profileData as AcademicStaffInterface).university}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <AdminHeader />
      <Layout className="adminpage-layout">
        <div className="adminpost-header-box">
          <Row justify="space-between" align="middle">
            <Col>
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    backgroundColor: "#e6f4ff",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                >
                  <SafetyOutlined
                    style={{ fontSize: "32px", color: "#1677ff" }}
                  />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, color: "#1677ff" }}>
                    จัดการข้อมูลผู้ใช้ระบบ
                  </Title>
                  <Text style={{ color: "#555", fontSize: "16px" }}>
                    ระบบการจัดการผู้ใช้งานแบบครบถ้วน
                  </Text>
                </div>
              </div>
            </Col>
            {/* <Col>
              <Space>
                <ExportExcelButton
                  usersAll={users}
                  usersFiltered={filteredUsers}
                  logsAll={loginLogs}
                  logsFiltered={filteredLoginLogs}
                />
              </Space>
            </Col> */}
          </Row>
        </div>
        {/*         <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 8px 32px rgba(33, 150, 243, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h1
            style={{
              marginBottom: "8px",
              fontSize: "32px",
              fontWeight: "700",
              background: "linear-gradient(45deg, #1976d2, #42a5f5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textAlign: "center",
            }}
          >
            <SafetyOutlined style={{ marginRight: "12px", color: "#1976d2" }} />
            จัดการข้อมูลผู้ใช้ระบบ
          </h1>
          <div
            style={{
              textAlign: "center",
              color: "#546e7a",
              fontSize: "16px",
              fontWeight: "400",
            }}
          >
            ระบบการจัดการผู้ใช้งานแบบครบถ้วน
          </div>
        </div> */}

        <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                border: "1px solid rgba(25, 118, 210, 0.1)",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(33, 150, 243, 0.08)",
                transition: "all 0.3s ease",
                /*  "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(33, 150, 243, 0.15)",
              }, */
              }}
            >
              <Statistic
                title="ผู้ใช้ทั้งหมด"
                value={users.length}
                prefix={<TeamOutlined style={{ color: "#1976d2" }} />}
                valueStyle={{
                  color: "#1976d2",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
                style={{ textAlign: "center" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)",
                border: "1px solid rgba(76, 175, 80, 0.1)",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(76, 175, 80, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <Statistic
                title="ออนไลน์"
                value={users.filter((u) => u.is_logged_in).length}
                prefix={<CheckCircleOutlined style={{ color: "#4caf50" }} />}
                valueStyle={{
                  color: "#4caf50",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
                style={{ textAlign: "center" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fce4ec 100%)",
                border: "1px solid rgba(233, 30, 99, 0.1)",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(233, 30, 99, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <Statistic
                title="ออฟไลน์"
                value={users.filter((u) => !u.is_logged_in).length}
                prefix={<CloseCircleOutlined style={{ color: "#e91e63" }} />}
                valueStyle={{
                  color: "#e91e63",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
                style={{ textAlign: "center" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fff3e0 100%)",
                border: "1px solid rgba(255, 152, 0, 0.1)",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(255, 152, 0, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <Statistic
                title="เข้าสู่ระบบวันนี้"
                value={
                  loginLogs.filter((log) =>
                    dayjs(log.login_at).isSame(dayjs(), "day")
                  ).length
                }
                prefix={<LoginOutlined style={{ color: "#ff9800" }} />}
                valueStyle={{
                  color: "#ff9800",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
                style={{ textAlign: "center" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Row - Updated with Role-specific data */}
        <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div
                  style={{
                    color: "#1976d2",
                    fontSize: "18px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <TeamOutlined />
                  ผู้ใช้ตามบทบาทและสถานะ
                </div>
              }
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                border: "1px solid rgba(25, 118, 210, 0.1)",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(33, 150, 243, 0.08)",
              }}
              headStyle={{
                background:
                  "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)",
                borderBottom: "1px solid rgba(25, 118, 210, 0.1)",
                borderRadius: "16px 16px 0 0",
              }}
            >
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={roleChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(25, 118, 210, 0.1)"
                  />
                  <XAxis dataKey="name" stroke="#1976d2" fontSize={12} />
                  <YAxis stroke="#1976d2" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid rgba(25, 118, 210, 0.2)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="online"
                    stackId="a"
                    fill="#4caf50"
                    name="ออนไลน์"
                  />
                  <Bar
                    dataKey="offline"
                    stackId="a"
                    fill="#f44336"
                    name="ออฟไลน์"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Row gutter={[16, 16]} style={{ height: "100%" }}>
              <Col xs={24}>
                <Card
                  title={
                    <div
                      style={{
                        color: "#1976d2",
                        fontSize: "16px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <GlobalOutlined />
                      สัดส่วนผู้ใช้
                    </div>
                  }
                  style={{
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                    border: "1px solid rgba(25, 118, 210, 0.1)",
                    borderRadius: "16px",
                    boxShadow: "0 4px 20px rgba(33, 150, 243, 0.08)",
                    height: "180px",
                  }}
                  headStyle={{
                    background:
                      "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)",
                    borderBottom: "1px solid rgba(25, 118, 210, 0.1)",
                    borderRadius: "16px 16px 0 0",
                  }}
                  bodyStyle={{ height: "120px", padding: "8px" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={45}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${(percent! * 100).toFixed(0)}%`
                        }
                      >
                        {roleStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          background: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid rgba(25, 118, 210, 0.2)",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24}>
                <Card
                  title={
                    <div
                      style={{
                        color: "#1976d2",
                        fontSize: "16px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <BarChart />
                      ผู้ใช้รายเดือน
                    </div>
                  }
                  style={{
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                    border: "1px solid rgba(25, 118, 210, 0.1)",
                    borderRadius: "16px",
                    boxShadow: "0 4px 20px rgba(33, 150, 243, 0.08)",
                    height: "180px",
                  }}
                  headStyle={{
                    background:
                      "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)",
                    borderBottom: "1px solid rgba(25, 118, 210, 0.1)",
                    borderRadius: "16px 16px 0 0",
                  }}
                  bodyStyle={{ height: "120px", padding: "8px" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyUserData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(25, 118, 210, 0.1)"
                      />
                      <XAxis dataKey="month" stroke="#1976d2" fontSize={10} />
                      <YAxis stroke="#1976d2" fontSize={10} />
                      <RechartsTooltip
                        contentStyle={{
                          background: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid rgba(25, 118, 210, 0.2)",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#1976d2"
                        strokeWidth={2}
                        dot={{ fill: "#1976d2", strokeWidth: 1, r: 3 }}
                        activeDot={{ r: 4, stroke: "#1976d2", strokeWidth: 1 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Card
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
            border: "1px solid rgba(25, 118, 210, 0.1)",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(33, 150, 243, 0.08)",
          }}
        >
          <Tabs
            defaultActiveKey="users"
            /* style={{
            ".ant-tabs-tab": {
              fontSize: "16px",
              fontWeight: "500",
            },
          }} */
          >
            <TabPane
              tab={
                <span
                  style={{
                    color: "#1976d2",
                    fontSize: "16px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <TeamOutlined />
                  รายชื่อผู้ใช้
                </span>
              }
              key="users"
            >
              <div style={{ marginBottom: "16px" }}>
                <Input.Search
                  placeholder="ค้นหาด้วยอีเมลหรือบทบาท..."
                  allowClear
                  size="large"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    maxWidth: 400,
                    borderRadius: "8px",
                  }}
                  enterButton={
                    <Button
                      type="primary"
                      style={{
                        background:
                          "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                        border: "none",
                        borderRadius: "0 8px 8px 0",
                      }}
                    >
                      ค้นหา
                    </Button>
                  }
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
                /* style={{
                ".ant-table-thead > tr > th": {
                  background:
                    "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)",
                  color: "#1976d2",
                  fontWeight: "600",
                  borderBottom: "2px solid rgba(25, 118, 210, 0.1)",
                },
              }} */
                onChange={handleUserTableChange}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} จาก ${total} รายการ`,
                }}
              />
            </TabPane>
            <TabPane
              tab={
                <span
                  style={{
                    color: "#1976d2",
                    fontSize: "16px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <LoginOutlined />
                  บันทึกการเข้าสู่ระบบ
                </span>
              }
              key="loginLogs"
            >
              <div style={{ marginBottom: "16px" }}>
                <Input.Search
                  placeholder="ค้นหาด้วยอีเมล, IP หรืออุปกรณ์..."
                  allowClear
                  size="large"
                  value={loginSearchText}
                  onChange={(e) => setLoginSearchText(e.target.value)}
                  style={{
                    maxWidth: 400,
                    borderRadius: "8px",
                  }}
                  enterButton={
                    <Button
                      type="primary"
                      style={{
                        background:
                          "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                        border: "none",
                        borderRadius: "0 8px 8px 0",
                      }}
                    >
                      ค้นหา
                    </Button>
                  }
                />
                <ExportExcelButton
                  variant="logs"
                  logsAll={loginLogs}
                  logsFiltered={filteredLoginLogs}
                />
              </div>
              <Table
                columns={loginLogColumns}
                dataSource={filteredLoginLogs}
                rowKey="ID"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} จาก ${total} รายการ`,
                }}
              />
            </TabPane>
          </Tabs>
        </Card>

        <Modal
          title={
            <div
              style={{
                color: "#1976d2",
                fontSize: "20px",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              รายละเอียดผู้ใช้: {selectedUser?.Email}
            </div>
          }
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[
            <Button
              key="close"
              onClick={() => setIsModalVisible(false)}
              style={{
                borderColor: "#1976d2",
                color: "#1976d2",
                borderRadius: "8px",
                background: "rgba(25, 118, 210, 0.02)",
              }}
            >
              ปิด
            </Button>,
          ]}
          width={900}
          /*  style={{
          ".ant-modal-content": {
            borderRadius: "16px",
            overflow: "hidden",
          },
        }}
        bodyStyle={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
          padding: "24px",
        }} */
        >
          {renderUserDetail()}
        </Modal>

        <Modal
          title={
            <div
              style={{
                color: "#1976d2",
                fontSize: "20px",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              แก้ไขข้อมูลผู้ใช้
            </div>
          }
          visible={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={async () => {
            if (!selectedUser) return;
            const payload = {
              Email: selectedUser.Email,
              RoleID: selectedUser.RoleID,
              is_active: selectedUser.is_active,
            };
            try {
              const res = await UpdateUser(Number(selectedUser.ID), payload);
              // sync กลับเข้าตาราง
              setUsers((prev) =>
                prev.map((u) => (u.ID === selectedUser.ID ? res.data : u))
              );
              setEditModalVisible(false);
            } catch (e) {
              console.error(e);
            }
          }}
          okText={<span style={{ fontWeight: "600" }}>บันทึก</span>}
          cancelText="ยกเลิก"
          okButtonProps={{
            style: {
              background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
            },
          }}
          cancelButtonProps={{
            style: {
              borderColor: "#1976d2",
              color: "#1976d2",
              borderRadius: "8px",
              background: "rgba(25, 118, 210, 0.02)",
            },
          }}
          bodyStyle={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
            padding: "24px",
          }}
        >
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label>อีเมล:</label>
              <Input
                value={selectedUser?.Email || ""}
                style={{ marginTop: "4px" }}
                onChange={(e) => {
                  if (selectedUser) {
                    setSelectedUser({ ...selectedUser, Email: e.target.value });
                  }
                }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label>บทบาท:</label>
              <Select
                value={selectedUser?.RoleID}
                style={{ width: "100%", marginTop: "4px" }}
                onChange={(value) => {
                  if (selectedUser) {
                    const Role = roles[value - 1];
                    setSelectedUser({
                      ...selectedUser,
                      RoleID: value,
                      Role: {
                        ID: value,
                        RoleName: Role.RoleName,
                        RoleNameTH: Role.RoleNameTH,
                      },
                    });
                  }
                }}
              >
                {roles.map((Role, index) => (
                  <Option key={index + 1} value={index + 1}>
                    {Role.RoleNameTH}
                  </Option>
                ))}
              </Select>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label>สถานะการใช้งาน:</label>
              <div style={{ marginTop: "4px" }}>
                <Switch
                  checked={selectedUser?.is_active}
                  checkedChildren="เปิดใช้งาน"
                  unCheckedChildren="ปิดใช้งาน"
                  onChange={(checked) => {
                    if (selectedUser) {
                      setSelectedUser({ ...selectedUser, is_active: checked });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default AdminUserDetailsPage;
