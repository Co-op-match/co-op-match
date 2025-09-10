import {
  Card,
  Descriptions,
  Table,
  Tag,
  Avatar,
  Badge,
  Row,
  Col,
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
  Empty,
  theme,
  Upload,
  message,
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
  PlusOutlined,
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
import React, { useCallback, useEffect, useMemo, useState, type Key } from "react";
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
import type { ColumnFilterItem } from "antd/es/table/interface";
dayjs.locale("th");

const { Title, Text } = Typography;

/* ----------------------- Types ----------------------- */
type Accent = "blue" | "green" | "magenta" | "orange";

interface StatCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  prefix?: React.ReactNode;
  accent?: Accent;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, prefix, accent = "blue", delay = 0 }) => {
  const colors = {
    blue: { 
      bg: "linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)", 
      border: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)", 
      icon: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)" 
    },
    green: { 
      bg: "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(74, 222, 128, 0.05) 100%)", 
      border: "linear-gradient(135deg, #22c55e 0%, #4ade80 100%)", 
      icon: "#22c55e" 
    },
    magenta: { 
      bg: "linear-gradient(135deg, rgba(219, 39, 119, 0.05) 0%, rgba(244, 114, 182, 0.05) 100%)", 
      border: "linear-gradient(135deg, #db2777 0%, #f472b6 100%)", 
      icon: "#db2777" 
    },
    orange: { 
      bg: "linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(251, 146, 60, 0.05) 100%)", 
      border: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", 
      icon: "#f97316" 
    },
  } as const;

  const color = colors[accent] || colors.blue;

  return (
    <div 
      className="animate-fadeInUp animate-pulse"
      style={{ 
        animationDelay: `${delay}ms`,
        height: "100%"
      }}
    >
      <Card
        style={{
          background: color.bg,
          border: "none",
          borderRadius: 20,
          height: "100%",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        bodyStyle={{ 
          padding: 24,
          position: "relative",
          zIndex: 2
        }}
        className="gradient-border"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Text style={{ color: "#64748b", fontSize: 14, display: "block", marginBottom: 12, fontWeight: 500 }}>
              {title}
            </Text>
            <Title level={2} style={{ 
              margin: 0, 
              background: accent === "blue" ? "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)" : color.icon,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 800,
              fontSize: 32
            }}>
              {value}
            </Title>
          </div>
          <div
            style={{
              background: accent === "blue" 
                ? "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)"
                : `linear-gradient(135deg, ${color.icon} 0%, ${color.icon}99 100%)`,
              borderRadius: 16,
              padding: 16,
              color: "white",
              fontSize: 28,
              boxShadow: `0 8px 32px ${accent === "blue" ? "rgba(30, 58, 138, 0.3)" : `${color.icon}33`}`,
            }}
          >
            {prefix}
          </div>
        </div>
        <div 
          className="animate-shimmer"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: accent === "blue" 
              ? "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)"
              : color.icon,
          }}
        />
      </Card>
    </div>
  );
};

interface SectionCardProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  delay?: number;
}

const SectionCard: React.FC<SectionCardProps> = ({ icon, title, children, delay = 0 }) => (
  <div 
    className="animate-fadeInUp"
    style={{ 
      animationDelay: `${delay}ms`,
      height: "100%"
    }}
  >
    <Card
      style={{
        borderRadius: 20,
        background: "linear-gradient(135deg, #ffffff 0%, rgba(248, 250, 252, 0.8) 100%)",
        border: "none",
        height: 380,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(30, 58, 138, 0.1)",
      }}
      bodyStyle={{
        padding: 24,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 2,
      }}
      className="gradient-border"
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <div
          style={{
            background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
            borderRadius: 12,
            padding: 12,
            marginRight: 16,
            color: "white",
            boxShadow: "0 8px 32px rgba(30, 58, 138, 0.3)",
          }}
        >
          {icon}
        </div>
        <Title level={4} style={{ 
          margin: 0, 
          background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontWeight: 700,
          fontSize: 18
        }}>
          {title}
        </Title>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </Card>
  </div>
);

/* ----------------------- Utils ----------------------- */
const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}ชั่วโมง ${minutes}นาที`;
};

/* ----------------------- Main ----------------------- */
const AdminUserDetailsPage: React.FC = () => {
  const { token } = theme.useToken();

  const [users, setUsers] = useState<UserInterface[]>([]);
  const [students, setStudents] = useState<StudentInterface[]>([]);
  const [companies, setCompanies] = useState<CompanyInterface[]>([]);
  const [academicStaffs, setAcademicStaffs] = useState<AcademicStaffInterface[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogInterface[]>([]);
  const [filteredLoginLogs, setFilteredLoginLogs] = useState<LoginLogInterface[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInterface | null>(null);
  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const [monthlyUserData, setMonthlyUserData] = useState<MonthlyUserByRoleInterface[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loginSearchText, setLoginSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [isAddFormValid, setIsAddFormValid] = useState(false);
  const [addForm] = Form.useForm();
  const addFormValues = Form.useWatch([], addForm);
  const [fileList, setFileList] = useState<any[]>([]);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

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
      setAcademicStaffs(Array.isArray(academicRes.data) ? academicRes.data : []);
      setLoginLogs(logsRes?.data ?? []);
      setFilteredLoginLogs(logsRes?.data ?? []);
      setRoles(roleRes?.data ?? []);
      const rows = Array.isArray(monthUserRes?.data) ? monthUserRes.data : [];
      setMonthlyUserData(rows);
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
      loginLogs.filter((log) => (log.User?.Email || "").toLowerCase().includes(q))
    );
  }, [loginLogs, loginSearchText]);

  // ทุกครั้งที่ค่าในฟอร์มเปลี่ยน ให้ประเมินความถูกต้อง
  useEffect(() => {
    (async () => {
      try {
        await addForm.validateFields({ validateOnly: true });
        setIsAddFormValid(true);
      } catch {
        setIsAddFormValid(false);
      }
    })();
  }, [addForm, addFormValues]);

  // Pie data
  const roleStats = useMemo(
    () =>
      roles.map((Role, index) => ({
        name: Role.RoleNameTH,
        value: users.filter((user) => user.Role?.RoleName === Role.RoleName).length,
        color: [
          "rgb(30, 58, 138)",
          "#22c55e",
          "#f97316", 
          "#a855f7"
        ][index % 4],
      })),
    [roles, users]
  );

  const roleFilters: ColumnFilterItem[] = useMemo(() => {
    return roles
      .map((r) => r.RoleNameTH)
      .filter((name): name is string => !!name && name.trim() !== "")
      .map((name) => ({ text: name, value: name as Key }));
  }, [roles]);

  const [roleFilterKeys, setRoleFilterKeys] = useState<Key[] | null>(null);

  const displayedUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchText ||
        user.Email?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.Role?.RoleNameTH?.includes(searchText);
      const matchesRole = !roleFilterKeys || roleFilterKeys.includes(user.Role?.RoleNameTH as Key);
      return matchesSearch && matchesRole;
    });
  }, [users, searchText, roleFilterKeys]);

  // Latest log per user (ถ้าอยากใช้ในอนาคต)
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

  const validateEmailUnique = useCallback(async (_: any, value: string) => {
    if (!value) return Promise.resolve();
    const exists = users.some(
      (u) => (u.Email ?? "").toLowerCase() === value.toLowerCase()
    );
    if (exists) {
      return Promise.reject(new Error("อีเมลนี้ถูกใช้แล้ว"));
    }
    return Promise.resolve();
  }, [users]);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedUser) return;
    try {
      setSubmittingEdit(true);
      const payload = {
        Email: selectedUser.Email,
        RoleID: selectedUser.RoleID,
        is_active: selectedUser.is_active,
      };
      await UpdateUser(selectedUser.ID!, payload);
      messageApi.success('อัปเดตผู้ใช้สำเร็จ');
      await refreshData();
      setEditModalVisible(false);
    } catch (err) {
      console.error(err);
      messageApi.error('อัปเดตผู้ใช้ไม่สำเร็จ');
    } finally {
      setSubmittingEdit(false);
    }
  }, [selectedUser, refreshData, messageApi]);

  const handleCancleCreateAdmin = () => {
    setAddAdminOpen(false);
    setFileList([]);
    addForm.resetFields();
  }

  const handleCreateAdmin = useCallback(async () => {
    try {
      const values = await addForm.validateFields();
      setSubmittingAdd(true);

      const adminRole = roles.find(r => r.RoleName === 'Admin' || r.RoleNameTH === 'แอดมิน');
      const adminRoleId = adminRole?.ID;

      // อัปโหลดรูป (service รับ File อย่างเดียว)
      const files = (addForm.getFieldValue("image") ?? []) as any[];
      const rawFile = files?.[0]?.originFileObj as File | undefined;
      
      if (rawFile) {
        const res_image = await UploadImageByAdmin(rawFile);

        if (res_image?.status === 201 || res_image?.status === 200) {
          const payload = {
            email: values.email,
            password: values.password,
            is_active: values.is_active ?? true,
            role: localStorage.getItem("role") || "Admin", // แนะนำให้ fix เป็น "Admin"
            role_id: adminRoleId,
            first_name: values.first_name,
            last_name: values.last_name,
            image_url: res_image.data.image_url,
            birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
          };

          const res_admin = await CreateAdmin(payload);
          if (res_admin?.status === 201 || res_admin?.status === 200) {
            messageApi.success('สร้างแอดมินสำเร็จ');
          } else {
            messageApi.error('สร้างแอดมินไม่สำเร็จ');
          }
          
        }
      }
      
      await refreshData();
      setAddAdminOpen(false);
      setFileList([]);
      addForm.resetFields();
    } catch (err) {
      console.error(err);
      messageApi.error('สร้างแอดมินไม่สำเร็จ');
    } finally {
      setSubmittingAdd(false);
    }
  }, [addForm, roles, fileList, refreshData, messageApi]);

  /* ----------------------- Columns ----------------------- */
  const userColumns: ColumnsType<UserInterface> = [
    {
      title: "อีเมล",
      dataIndex: "Email",
      key: "Email",
      ellipsis: true,
      render: (Email: string, record: UserInterface) => {
        const isCompany = record.Role?.RoleName === "Company";
        const raw = isCompany ? record.Company?.[0]?.logo : record.ProfileImage?.[0]?.image_url;
        const imgSrc = raw ? fileURL(raw) : undefined;
        return (
          <Space>
            <Avatar 
              src={imgSrc} 
              icon={!imgSrc ? <UserOutlined /> : undefined}
            />
            <Text style={{ 
              background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 600 
            }}>
              {Email}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "บทบาท",
      dataIndex: ["Role", "RoleNameTH"],
      key: "Role",
      filters: roleFilters,
      filteredValue: roleFilterKeys ?? undefined,
      onFilter: (value, record) => String(record.Role?.RoleNameTH) === String(value),
      render: (RoleNameTH: string, record) => {
        const gradient =
          record.Role?.RoleNameTH === "แอดมิน"
            ? "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)"
            : record.Role?.RoleNameTH === "นักเรียน"
            ? "linear-gradient(135deg, #22c55e 0%, #4ade80 100%)"
            : record.Role?.RoleNameTH === "บริษัท"
            ? "linear-gradient(135deg, #f97316 0%, #fb923c 100%)"
            : "linear-gradient(135deg, #a855f7 0%, #c084fc 100%)";
        
        return (
          <Tag 
            style={{ 
              background: gradient,
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              padding: "4px 12px"
            }}
          >
            {RoleNameTH}
          </Tag>
        );
      },
    },
    {
      title: "สถานะ",
      key: "status",
      width: 160,
      render: (_, record) => (
        <Badge 
          status={record.is_active ? "success" : "error"} 
          text={
            <span style={{ 
              fontWeight: 500,
              color: record.is_active ? "#22c55e" : "#ef4444"
            }}>
              {record.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </span>
          } 
        />
      ),
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "CreatedAt",
      key: "CreatedAt",
      width: 180,
      render: (date: string | Date) => (
        <Text style={{ fontWeight: 500, color: "#64748b" }}>
          {new Date(date).toLocaleDateString("th-TH")}
        </Text>
      ),
    },
    {
      title: "การจัดการ",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            style={{
              background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
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
            style={{ 
              background: "linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
              borderColor: "rgb(30, 58, 138)", 
              color: "rgb(30, 58, 138)",
              borderRadius: 8,
              fontWeight: 600,
            }}
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

  const handleUserTableChange: TableProps<UserInterface>["onChange"] = (_pagination, filters) => {
    const val = filters?.Role as Key[] | null | undefined;
    setRoleFilterKeys(val ?? null);
  };

  /* ----------------------- Per-user logs in modal ----------------------- */
  const selectedUserLogs = useMemo(() => {
    if (!selectedUser) return [];
    const uid = selectedUser.ID;
    return loginLogs
      .filter((l) => (l as any).UserID === uid || l.User?.ID === uid)
      .sort((a, b) => dayjs(b.login_at).valueOf() - dayjs(a.login_at).valueOf());
  }, [loginLogs, selectedUser]);

  const perUserLogColumns: ColumnsType<LoginLogInterface> = [
    {
      title: "เข้า",
      dataIndex: "login_at",
      key: "login_at",
      width: 190,
      render: (date: string) => (
        <Text style={{ fontWeight: 500, color: "#64748b" }}>
          {dayjs(date).format("DD/MM/YYYY HH:mm:ss")}
        </Text>
      ),
    },
    {
      title: "ออก",
      dataIndex: "logout_at",
      key: "logout_at",
      width: 190,
      render: (date?: string | null) =>
        date && String(date).trim() !== "" ? (
          <Text style={{ fontWeight: 500, color: "#64748b" }}>
            {dayjs(date).format("DD/MM/YYYY HH:mm:ss")}
          </Text>
        ) : (
          <Tag 
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #4ade80 100%)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 600
            }}
          >
            ยังคงออนไลน์
          </Tag>
        ),
    },
    {
      title: "ระยะเวลา",
      key: "duration",
      width: 120,
      render: (_: any, rec: LoginLogInterface) => {
        const start = dayjs(rec.login_at);
        const end = rec.logout_at ? dayjs(rec.logout_at) : dayjs();
        return (
          <Text style={{ fontWeight: 500, color: "#64748b" }}>
            {formatDuration(end.diff(start))}
          </Text>
        );
      },
    },
  ];

  /* ----------------------- Render ----------------------- */
  return (
    <>
      <style>{styles}</style>
      <Layout>
        <AdminHeader />
        <Layout className="adminpage-layout" style={{ 
          padding: 16,
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          minHeight: "100vh"
        }}>
          {contextHolder}
          <div style={{ margin: 32, marginTop: 16 }}>
            {/* Header */}
            <div className="animate-fadeInUp" style={{ marginBottom: 32 }}>
              <Card
                style={{
                  background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                  border: "none",
                  borderRadius: 24,
                  overflow: "hidden",
                  position: "relative",
                }}
                bodyStyle={{ padding: 32 }}
              >
                <div 
                  className="animate-shimmer"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                    backgroundSize: "200% 100%",
                  }}
                />
                <Row justify="space-between" align="middle" style={{ position: "relative", zIndex: 2 }}>
                  <Col>
                    <Space size={20} align="center">
                      <div
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          borderRadius: 20,
                          padding: 20,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <SafetyOutlined style={{ fontSize: 40, color: "white" }} />
                      </div>
                      <div>
                        <Title level={1} style={{ 
                          margin: 0, 
                          color: "white", 
                          fontWeight: 800,
                          fontSize: 36,
                          textShadow: "0 4px 8px rgba(0,0,0,0.3)"
                        }}>
                          จัดการข้อมูลผู้ใช้ระบบ
                        </Title>
                        <Text style={{ 
                          color: "rgba(255, 255, 255, 0.9)", 
                          fontSize: 18,
                          fontWeight: 500
                        }}>
                          ระบบการจัดการผู้ใช้งานแบบครบถ้วน พร้อมการวิเคราะห์และรายงาน
                        </Text>
                      </div>
                    </Space>
                  </Col>
                  <Col>
                    <div className="animate-slideInRight">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setAddAdminOpen(true)}
                        size="large"
                        style={{
                          background: "rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(10px)",
                          border: "2px solid rgba(255, 255, 255, 0.3)",
                          borderRadius: 16,
                          height: 56,
                          fontSize: 16,
                          fontWeight: 700,
                          color: "white",
                          padding: "0 32px",
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                        className="animate-pulse"
                      >
                        เพิ่มแอดมิน
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>

            {/* KPI Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              <Col xs={24} sm={12} md={6}>
                <StatCard 
                  title="ผู้ใช้ทั้งหมด" 
                  value={users.length} 
                  prefix={<TeamOutlined />} 
                  accent="blue"
                  delay={0}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <StatCard
                  title="ออนไลน์"
                  value={users.filter((u) => u.is_logged_in).length}
                  prefix={<CheckCircleOutlined />}
                  accent="green"
                  delay={100}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <StatCard
                  title="ออฟไลน์"
                  value={users.filter((u) => !u.is_logged_in).length}
                  prefix={<CloseCircleOutlined />}
                  accent="magenta"
                  delay={200}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <StatCard 
                  title="เข้าสู่ระบบวันนี้" 
                  value={2} 
                  prefix={<LoginOutlined />} 
                  accent="orange"
                  delay={300}
                />
              </Col>
            </Row>

            {/* Charts */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              <Col xs={24} lg={12}>
                <SectionCard icon={<GlobalOutlined />} title="สัดส่วนผู้ใช้" delay={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        nameKey="name"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent! * 100).toFixed(0)}%`}
                      >
                        {roleStats.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          background: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: 12,
                          fontSize: 14,
                          fontWeight: 600,
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                          backdropFilter: "blur(10px)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </SectionCard>
              </Col>
              <Col xs={24} lg={12}>
                <SectionCard icon={<BarChartOutlined />} title="ผู้ใช้รายเดือน" delay={500}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyUserData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 58, 138, 0.1)" />
                      <XAxis 
                        dataKey="month" 
                        stroke="rgb(30, 58, 138)" 
                        fontSize={12}
                        fontWeight={600}
                      />
                      <YAxis 
                        stroke="rgb(30, 58, 138)" 
                        fontSize={12}
                        fontWeight={600}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          background: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: 12,
                          fontSize: 14,
                          fontWeight: 600,
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                          backdropFilter: "blur(10px)",
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="students" 
                        stroke="rgb(30, 58, 138)" 
                        strokeWidth={3} 
                        dot={{ fill: "rgb(30, 58, 138)", strokeWidth: 2, r: 4 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="companies" 
                        stroke="#f97316" 
                        strokeWidth={3} 
                        dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="academic_staff" 
                        stroke="#a855f7" 
                        strokeWidth={3} 
                        dot={{ fill: "#a855f7", strokeWidth: 2, r: 4 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="admins" 
                        stroke="#22c55e" 
                        strokeWidth={3} 
                        dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </SectionCard>
              </Col>
            </Row>

            {/* Users Table */}
            <div className="animate-fadeInUp" style={{ animationDelay: "600ms" }}>
              <Card
                style={{
                  borderRadius: 24,
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "none",
                  boxShadow: "0 20px 60px rgba(30, 58, 138, 0.15)",
                  backdropFilter: "blur(10px)",
                  overflow: "hidden",
                  position: "relative",
                }}
                bodyStyle={{ padding: 32 }}
              >
                <div 
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                  }}
                />
                
                <div style={{ marginBottom: 24 }}>
                  <Title level={3} style={{ 
                    margin: 0, 
                    marginBottom: 20,
                    background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontWeight: 800,
                    fontSize: 24
                  }}>
                    รายการผู้ใช้งาน
                  </Title>
                  <Input.Search
                    placeholder="ค้นหาด้วยอีเมลหรือบทบาท..."
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ 
                      width: 400, 
                      borderRadius: 12,
                    }}
                    size="large"
                    enterButton={
                      <Button
                        size="large"
                        style={{
                          background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                          border: "none",
                          borderRadius: "0 12px 12px 0",
                          fontWeight: 600,
                        }}
                      >
                        ค้นหา
                      </Button>
                    }
                  />
                </div>
                
                <Table<UserInterface>
                  columns={userColumns}
                  dataSource={displayedUsers}
                  rowKey="ID"
                  onChange={handleUserTableChange}
                  sticky
                  scroll={{ x: 980 }}
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => (
                      <span style={{ fontWeight: 600, color: "#64748b" }}>
                        {range[0]}-{range[1]} จาก {total} รายการ
                      </span>
                    ),
                  }}
                  style={{ 
                    backgroundColor: "transparent",
                    borderRadius: 16,
                  }}
                  rowClassName={() => "animate-fadeInUp"}
                />
              </Card>
            </div>

            {/* View Modal */}
            <Modal
              title={
                <div style={{ 
                  background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: 24, 
                  fontWeight: 800, 
                  textAlign: "center",
                  padding: "16px 0"
                }}>
                  รายละเอียดผู้ใช้: {selectedUser?.Email}
                </div>
              }
              open={isModalVisible}
              onCancel={() => setIsModalVisible(false)}
              footer={[
                <Button 
                  key="close" 
                  onClick={() => setIsModalVisible(false)} 
                  size="large"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                    borderColor: "rgb(30, 58, 138)", 
                    color: "rgb(30, 58, 138)",
                    borderRadius: 12,
                    fontWeight: 600,
                    height: 44,
                    padding: "0 24px"
                  }}
                >
                  ปิด
                </Button>,
              ]}
              width={1000}
              style={{ top: 20 }}
            >
              {selectedUser && (
                <div style={{ padding: "16px 0" }}>
                  <Descriptions 
                    bordered 
                    column={2} 
                    size="middle"
                    style={{
                      background: "rgba(248, 250, 252, 0.8)",
                      borderRadius: 16,
                    }}
                    labelStyle={{
                      background: "linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)",
                      fontWeight: 600,
                      color: "rgb(30, 58, 138)"
                    }}
                    contentStyle={{
                      background: "white",
                      fontWeight: 500
                    }}
                  >
                    <Descriptions.Item label="อีเมล">{selectedUser.Email}</Descriptions.Item>
                    <Descriptions.Item label="บทบาท">
                      <Tag style={{
                        background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 600,
                        padding: "4px 12px"
                      }}>
                        {selectedUser.Role?.RoleNameTH}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="สถานะการใช้งาน">
                      <Badge
                        status={selectedUser.is_active ? "success" : "error"}
                        text={
                          <span style={{ 
                            fontWeight: 600,
                            color: selectedUser.is_active ? "#22c55e" : "#ef4444"
                          }}>
                            {selectedUser.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                          </span>
                        }
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="สถานะออนไลน์">
                      <Badge
                        status={selectedUser.is_logged_in ? "processing" : "default"}
                        text={
                          <span style={{ 
                            fontWeight: 600,
                            color: selectedUser.is_logged_in ? "#3b82f6" : "#64748b"
                          }}>
                            {selectedUser.is_logged_in ? "ออนไลน์" : "ออฟไลน์"}
                          </span>
                        }
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="วันที่สร้าง">
                      <Text style={{ fontWeight: 600, color: "#64748b" }}>
                        {new Date(selectedUser.CreatedAt || "").toLocaleDateString("th-TH")}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="อัปเดตล่าสุด">
                      <Text style={{ fontWeight: 600, color: "#64748b" }}>
                        {new Date(selectedUser.UpdatedAt || "").toLocaleDateString("th-TH")}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>

                  <Divider 
                    orientation="center" 
                    style={{ 
                      margin: "32px 0 24px",
                      borderColor: "rgba(30, 58, 138, 0.2)"
                    }}
                  >
                    <Text style={{ 
                      background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontWeight: 700,
                      fontSize: 18
                    }}>
                      บันทึกการเข้าสู่ระบบ
                    </Text>
                  </Divider>

                  {selectedUserLogs.length === 0 ? (
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                      description={
                        <Text style={{ color: "#64748b", fontWeight: 500 }}>
                          ไม่มีข้อมูลบันทึกการเข้าสู่ระบบ
                        </Text>
                      }
                    />
                  ) : (
                    <Table<LoginLogInterface>
                      rowKey={(r) => `${r.ID}-${r.login_at}`}
                      dataSource={selectedUserLogs}
                      columns={perUserLogColumns}
                      pagination={{ pageSize: 5 }}
                      style={{
                        borderRadius: 12,
                        overflow: "hidden"
                      }}
                    />
                  )}
                </div>
              )}
            </Modal>

            {/* Edit Modal */}
            <Modal
              title={
                <div style={{ 
                  background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: 24, 
                  fontWeight: 800, 
                  textAlign: "center",
                  padding: "16px 0"
                }}>
                  แก้ไขข้อมูลผู้ใช้
                </div>
              }
              open={editModalVisible}
              onCancel={() => setEditModalVisible(false)}
              onOk={handleSaveEdit}
              okText="บันทึก"
              cancelText="ยกเลิก"
              confirmLoading={submittingEdit}
              okButtonProps={{
                size: "large",
                style: {
                  background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: 600,
                  height: 44,
                  padding: "0 24px"
                },
              }}
              cancelButtonProps={{
                size: "large",
                style: {
                  background: "linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                  borderColor: "rgb(30, 58, 138)",
                  color: "rgb(30, 58, 138)",
                  borderRadius: 12,
                  fontWeight: 600,
                  height: 44,
                  padding: "0 24px"
                }
              }}
            >
              <div style={{ padding: "16px 0" }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    fontWeight: 700, 
                    background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontSize: 16,
                    display: "block",
                    marginBottom: 8
                  }}>
                    อีเมล:
                  </label>
                  <Input
                    value={selectedUser?.Email || ""}
                    onChange={(e) =>
                      selectedUser && setSelectedUser({ ...selectedUser, Email: e.target.value })
                    }
                    style={{ 
                      borderRadius: 12,
                      height: 44,
                      fontSize: 16
                    }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    fontWeight: 700, 
                    background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontSize: 16,
                    display: "block",
                    marginBottom: 8
                  }}>
                    บทบาท:
                  </label>
                  <Select
                    value={selectedUser?.RoleID}
                    style={{ width: "100%" }}
                    size="large"
                    onChange={(roleId) => {
                      if (!selectedUser) return;
                      const Role = roles.find((r) => r.ID === roleId);
                      setSelectedUser({ ...selectedUser, RoleID: roleId, Role: Role || selectedUser.Role });
                    }}
                    options={roles.map((r) => ({ label: r.RoleNameTH, value: r.ID }))}
                  />
                </div>
                <div>
                  <label style={{ 
                    fontWeight: 700, 
                    background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontSize: 16,
                    display: "block",
                    marginBottom: 12
                  }}>
                    สถานะการใช้งาน:
                  </label>
                  <Switch
                    checked={!!selectedUser?.is_active}
                    checkedChildren="เปิดใช้งาน"
                    unCheckedChildren="ปิดใช้งาน"
                    size="default"
                    onChange={(checked) => selectedUser && setSelectedUser({ ...selectedUser, is_active: checked })}
                    style={{
                      background: selectedUser?.is_active 
                        ? "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)" 
                        : undefined
                    }}
                  />
                </div>
              </div>
            </Modal>

            {/* Add Admin Modal */}
            <Modal
              title={
                <div style={{ 
                  background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: 24, 
                  fontWeight: 800, 
                  textAlign: "center",
                  padding: "16px 0"
                }}>
                  เพิ่มแอดมิน
                </div>
              }
              open={addAdminOpen}
              onCancel={handleCancleCreateAdmin}
              onOk={handleCreateAdmin}
              okText="บันทึก"
              cancelText="ยกเลิก"
              confirmLoading={submittingAdd}
              okButtonProps={{
                disabled: !isAddFormValid || submittingAdd,
                size: "large",
                style: {
                  background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: 600,
                  height: 44,
                  padding: "0 24px"
                },
              }}
              cancelButtonProps={{
                size: "large",
                style: {
                  background: "linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                  borderColor: "rgb(30, 58, 138)",
                  color: "rgb(30, 58, 138)",
                  borderRadius: 12,
                  fontWeight: 600,
                  height: 44,
                  padding: "0 24px"
                }
              }}
              width={600}
            >
              <Form form={addForm} layout="vertical" style={{ padding: "16px 0" }}>
                <Form.Item
                  label={
                    <span style={{ 
                      fontWeight: 700, 
                      background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontSize: 16
                    }}>
                      รูปโปรไฟล์
                    </span>
                  }
                  name="image"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                  rules={[{ required: true, message: "กรุณาอัปโหลดรูปโปรไฟล์" }]}
                >
                  <Upload
                    listType="picture-circle"
                    beforeUpload={() => false}
                    maxCount={1}
                    accept="image/*"
                    style={{
                      background: "linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)",
                      borderRadius: 12
                    }}
                  >
                    <div style={{ 
                      background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontWeight: 600
                    }}>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ 
                      fontWeight: 700, 
                      background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontSize: 16
                    }}>
                      อีเมล
                    </span>
                  }
                  name="email"
                  validateFirst
                  validateTrigger={["onBlur", "onSubmit"]}
                  rules={[
                    { required: true, message: "กรุณากรอกอีเมล" },
                    { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                    { validator: validateEmailUnique },
                  ]}
                >
                  <Input 
                    placeholder="admin@gmail.com" 
                    size="large"
                    style={{ 
                      borderRadius: 12,
                      fontSize: 16
                    }} 
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ 
                      fontWeight: 700, 
                      background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontSize: 16
                    }}>
                      รหัสผ่าน
                    </span>
                  }
                  name="password"
                  rules={[
                    { required: true, message: "กรุณากรอกรหัสผ่าน" },
                    { min: 6, message: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" },
                  ]}
                >
                  <Input.Password 
                    size="large"
                    style={{ 
                      borderRadius: 12,
                      fontSize: 16
                    }} 
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <span style={{ 
                          fontWeight: 700, 
                          background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          fontSize: 16
                        }}>
                          ชื่อ
                        </span>
                      }
                      name="first_name"
                      rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
                    >
                      <Input 
                        size="large"
                        style={{ 
                          borderRadius: 12,
                          fontSize: 16
                        }} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <span style={{ 
                          fontWeight: 700, 
                          background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          fontSize: 16
                        }}>
                          นามสกุล
                        </span>
                      }
                      name="last_name"
                      rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}
                    >
                      <Input 
                        size="large"
                        style={{ 
                          borderRadius: 12,
                          fontSize: 16
                        }} 
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label={
                    <span style={{ 
                      fontWeight: 700, 
                      background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontSize: 16
                    }}>
                      วันเกิด
                    </span>
                  }
                  name="birthday"
                  rules={[
                    { required: true, message: "กรุณาเลือกวันเกิด" },
                    {
                      validator: (_: any, value) =>
                        value && value.isAfter(dayjs(), "day")
                          ? Promise.reject(new Error("วันเกิดต้องไม่เป็นอนาคต"))
                          : Promise.resolve(),
                    },
                  ]}
                >
                  <DatePicker
                    style={{ 
                      width: "100%", 
                      borderRadius: 12,
                      fontSize: 16
                    }}
                    size="large"
                    disabledDate={(current) => current && current > dayjs().endOf("day")}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ 
                      fontWeight: 700, 
                      background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontSize: 16
                    }}>
                      สถานะการใช้งาน
                    </span>
                  }
                  name="is_active"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch 
                    checkedChildren="เปิดใช้งาน" 
                    unCheckedChildren="ปิดใช้งาน" 
                    size="default"
                    style={{
                      background: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)"
                    }}
                  />
                </Form.Item>
              </Form>
            </Modal>
          </div>
        </Layout>
      </Layout>
    </>
  );
};

export default AdminUserDetailsPage;

const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite linear;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    background-size: 200% 100%;
  }
  
  .animate-slideInRight {
    animation: slideInRight 0.5s ease-out forwards;
  }
  
  .gradient-border {
    position: relative;
    background: white;
    border-radius: 16px;
    overflow: hidden;
  }
  
  .glassmorphism {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
`;