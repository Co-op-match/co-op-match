import { Card, Descriptions, Table, Tag, Tabs, Avatar, Badge, Row, Col, Statistic, Button, Modal, Input, Select, Switch, Space, Divider, Layout, Typography } from "antd";
import { UserOutlined, LoginOutlined, EditOutlined, EyeOutlined, SafetyOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined, GlobalOutlined, BarChartOutlined } from "@ant-design/icons";
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState, type Key } from "react";
import type { UserInterface } from "../../../interfaces/User";
import type { CompanyInterface } from "../../../interfaces/Company";
import type { StudentInterface } from "../../../interfaces/Student";
import type { AcademicStaffInterface } from "../../../interfaces/AcademicStaff";
import { GetAllAcademicStaff, GetAllCompany, GetAllLoginLogs, GetAllStudent, GetAllUser, GetMonthlyUsersByRole, GetRole, UpdateUser } from "../../../services/https";
import type { RoleInterface } from "../../../interfaces/Role";
import type { LoginLogInterface } from "../../../interfaces/LoginLog";
import type { ColumnsType, TableProps } from "antd/es/table";
import AdminHeader from "../../Component/AdminCoopMatchHeaderDefault";
import ExportExcelButton from "./ExportExcelButton";
import { fileURL } from "@/config/env";
import type { MonthlyUserByRoleInterface } from "@/interfaces/Analysis";

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text } = Typography;

const AdminUserDetailsPage: React.FC = () => {
  const [users, setUsers] = useState<UserInterface[]>([]);
  const [students, setStudents] = useState<StudentInterface[]>([]);
  const [companies, setCompanies] = useState<CompanyInterface[]>([]);
  const [academicStaffs, setAcademicStaffs] = useState<AcademicStaffInterface[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogInterface[]>([]);
  const [filteredLoginLogs, setFilteredLoginLogs] = useState<LoginLogInterface[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInterface | null>(null);
  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const [monthlyUserData, SetMonthlyUserData] = useState<MonthlyUserByRoleInterface[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loginSearchText, setLoginSearchText] = useState("");

  // ค่าคงที่สำหรับ auto refresh
  const autoRefresh = true;
  const intervalMs = 600_000; // 10 นาที

  const refreshData = useCallback(async () => {
    try {
      const [usersRes, studentsRes, companiesRes, academicRes, logsRes, roleRes, monthUserRes] = await Promise.all([
        GetAllUser(),
        GetAllStudent(),
        GetAllCompany(),
        GetAllAcademicStaff(),
        GetAllLoginLogs(),
        GetRole(),
        GetMonthlyUsersByRole(),
      ]);
      const usersData = usersRes.data ?? [];
      setUsers(usersData);
      setStudents(studentsRes.data ?? []);
      setCompanies(companiesRes.data ?? []);
      setAcademicStaffs(academicRes.data ?? []);
      setLoginLogs(logsRes.data ?? []);
      setFilteredLoginLogs(logsRes.data ?? []);
      setRoles(roleRes.data ?? []);
      const rows = Array.isArray(monthUserRes?.data) ? monthUserRes.data : [];
      SetMonthlyUserData(rows);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { refreshData(); }, intervalMs);
    return () => clearInterval(id);
  }, [autoRefresh, intervalMs, refreshData]);

  // Filter login logs based on search text
  useEffect(() => {
    const q = loginSearchText.toLowerCase();
    setFilteredLoginLogs(
      loginLogs.filter(
        (log) =>
          log.User?.Email?.toLowerCase().includes(q) ||
          log.ip?.toLowerCase().includes(q) ||
          log.device?.toLowerCase().includes(q)
      )
    );
  }, [loginLogs, loginSearchText]);

  // สร้างสัดส่วนผู้ใช้ตามบทบาท (ใช้ใน Pie)
  const roleStats = roles.map((Role) => ({
    name: Role.RoleNameTH,
    value: users.filter((user) => user.Role?.RoleName === Role.RoleName).length,
    color:
      Role.RoleName === "Admin" ? "#1890ff" :
      Role.RoleName === "Student" ? "#52c41a" :
      Role.RoleName === "Company" ? "#fa8c16" : "#722ed1",
  }));

  const roleFilters = useMemo(
    () =>
      Array.from(new Set(users.map((u) => u.Role?.RoleNameTH).filter((v): v is string => Boolean(v)))).map((name) => ({
        text: name, value: name,
      })),
    [users]
  );

  // ฟิลเตอร์บทบาทที่เลือก (controlled)
  const [roleFilterKeys, setRoleFilterKeys] = useState<Key[] | null>(null);

  const chartData = useMemo(() => {
  return (monthlyUserData ?? []).map(d => ({
    month: d.month,
    students: d.students,
    companies: d.companies,
    academic_staff: d.academic_staff,
    admins: d.admins,
    total: (d.students || 0) + (d.companies || 0) + (d.academic_staff || 0) + (d.admins || 0),
  }));
}, [monthlyUserData]);


  // รวมการค้นหา + ฟิลเตอร์บทบาท -> รายการที่แสดงจริง
  const displayedUsers = useMemo(() => {
    let data = [...users];
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      data = data.filter((u) => u.Email?.toLowerCase().includes(q) || u.Role?.RoleNameTH?.toLowerCase().includes(q));
    }
    if (roleFilterKeys?.length) {
      const allow = new Set(roleFilterKeys.map(String));
      data = data.filter((u) => allow.has(String(u.Role?.RoleNameTH ?? "")));
    }
    return data;
  }, [users, searchText, roleFilterKeys]);

  const userColumns: ColumnsType<UserInterface> = [
    {
      title: "อีเมล",
      dataIndex: "Email",
      key: "Email",
      render: (Email: string, record: UserInterface) => {
        const isCompany = record.Role?.RoleName === "Company";
        const raw = isCompany ? record.Company?.[0]?.logo : record.ProfileImage?.[0]?.image_url;
        const imgSrc = fileURL(raw);
        return (
          <Space>
            <Avatar src={imgSrc} icon={!imgSrc ? <UserOutlined /> : undefined} />
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
      onFilter: (value, record) => String(record.Role?.RoleNameTH) === String(value),
      render: (RoleNameTH: string, record: UserInterface) => {
        const color =
          record.Role?.RoleNameTH === "แอดมิน" ? "blue" :
          record.Role?.RoleNameTH === "นักเรียน" ? "green" :
          record.Role?.RoleNameTH === "บริษัท" ? "orange" : "purple";
        return <Tag color={color}>{RoleNameTH}</Tag>;
      },
    },
    {
      title: "สถานะ",
      key: "status",
      render: (_: any, record: UserInterface) => (
        <Space>
          <Badge status={record.is_active ? "success" : "error"} text={record.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"} />
          <Badge status={record.is_logged_in ? "processing" : "default"} text={record.is_logged_in ? "ออนไลน์" : "ออฟไลน์"} />
        </Space>
      ),
    },
    { title: "วันที่สร้าง", dataIndex: "CreatedAt", key: "CreatedAt", render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm") },
    {
      title: "การจัดการ",
      key: "actions",
      render: (_: any, record: UserInterface) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => { setSelectedUser(record); setIsModalVisible(true); }}
            style={{ background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)", border: "none", borderRadius: 8, boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)" }}
          >
            ดู
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => { setSelectedUser(record); setEditModalVisible(true); }}
            style={{ borderColor: "#1976d2", color: "#1976d2", borderRadius: 8, background: "rgba(25, 118, 210, 0.02)" }}
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
      render: (Email: string, record: LoginLogInterface) => {
        const isCompany = record.User?.Role?.RoleName === "Company";
        const raw = isCompany ? record.User?.Company?.[0]?.logo : record.User?.ProfileImage?.[0]?.image_url;
        const imgSrc = fileURL(raw);
        return (
          <Space>
            <Avatar src={imgSrc} icon={!imgSrc ? <UserOutlined /> : undefined} />
            <span>{Email}</span>
          </Space>
        );
      },
    },
    { title: "IP Address", dataIndex: "ip", key: "ip", render: (ip: string) => <Tag icon={<GlobalOutlined />}>{ip}</Tag> },
    { title: "เวลาเข้าสู่ระบบ", dataIndex: "login_at", key: "login_at", render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss") },
    {
      title: "เวลาออกจากระบบ",
      dataIndex: "logout_at",
      key: "logout_at",
      render: (date?: string | null) => (date && String(date).trim() !== "" ? dayjs(date).format("DD/MM/YYYY HH:mm:ss") : <Tag color="green">ยังคงออนไลน์</Tag>),
    },
  ];

  const handleUserTableChange: TableProps<UserInterface>["onChange"] = (_pagination, filters) => {
    const val = filters?.Role as Key[] | null | undefined; setRoleFilterKeys(val ?? null);
  };

  return (
    <Layout>
      <AdminHeader />
      <Layout className="adminpage-layout">
        <div className="adminpost-header-box">
          <Row justify="space-between" align="middle">
            <Col>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ backgroundColor: "#e6f4ff", borderRadius: 12, padding: 12 }}>
                  <SafetyOutlined style={{ fontSize: 32, color: "#1677ff" }} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, color: "#1677ff" }}>จัดการข้อมูลผู้ใช้ระบบ</Title>
                  <Text style={{ color: "#555", fontSize: 16 }}>ระบบการจัดการผู้ใช้งานแบบครบถ้วน</Text>
                </div>
              </div>
            </Col>
            {/* <Col><Space><ExportExcelButton variant="both" usersAll={users} usersFiltered={displayedUsers} logsAll={loginLogs} logsFiltered={filteredLoginLogs} /></Space></Col> */}
          </Row>
        </div>

        {/* KPI Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)", border: "1px solid rgba(25, 118, 210, 0.1)", borderRadius: 16, boxShadow: "0 4px 20px rgba(33, 150, 243, 0.08)" }}>
              <Statistic title="ผู้ใช้ทั้งหมด" value={users.length} prefix={<TeamOutlined style={{ color: "#1976d2" }} />} valueStyle={{ color: "#1976d2", fontSize: 28, fontWeight: "bold" }} style={{ textAlign: "center" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ background: "linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)", border: "1px solid rgba(76, 175, 80, 0.1)", borderRadius: 16, boxShadow: "0 4px 20px rgba(76, 175, 80, 0.08)" }}>
              <Statistic title="ออนไลน์" value={users.filter((u) => u.is_logged_in).length} prefix={<CheckCircleOutlined style={{ color: "#4caf50" }} />} valueStyle={{ color: "#4caf50", fontSize: 28, fontWeight: "bold" }} style={{ textAlign: "center" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ background: "linear-gradient(135deg, #ffffff 0%, #fce4ec 100%)", border: "1px solid rgba(233, 30, 99, 0.1)", borderRadius: 16, boxShadow: "0 4px 20px rgba(233, 30, 99, 0.08)" }}>
              <Statistic title="ออฟไลน์" value={users.filter((u) => !u.is_logged_in).length} prefix={<CloseCircleOutlined style={{ color: "#e91e63" }} />} valueStyle={{ color: "#e91e63", fontSize: 28, fontWeight: "bold" }} style={{ textAlign: "center" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ background: "linear-gradient(135deg, #ffffff 0%, #fff3e0 100%)", border: "1px solid rgba(255, 152, 0, 0.1)", borderRadius: 16, boxShadow: "0 4px 20px rgba(255, 152, 0, 0.08)" }}>
              <Statistic
                title="เข้าสู่ระบบวันนี้"
                value={loginLogs.filter((log) => dayjs(log.login_at).isSame(dayjs(), "day")).length}
                prefix={<LoginOutlined style={{ color: "#ff9800" }} />}
                valueStyle={{ color: "#ff9800", fontSize: 28, fontWeight: "bold" }}
                style={{ textAlign: "center" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} lg={12}>
            <Card
              title={<div style={{ color: "#1976d2", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}><GlobalOutlined />สัดส่วนผู้ใช้</div>}
              style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)", border: "1px solid rgba(25, 118, 210, 0.1)", borderRadius: 16, boxShadow: "0 4px 20px rgba(33, 150, 243, 0.08)", height: 180 }}
              headStyle={{ background: "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)", borderBottom: "1px solid rgba(25, 118, 210, 0.1)", borderRadius: "16px 16px 0 0" }}
              bodyStyle={{ height: 120, padding: 8 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleStats} cx="50%" cy="50%" outerRadius={45} fill="#8884d8" dataKey="value" label={({ percent }) => `${(percent! * 100).toFixed(0)}%`}>
                    {roleStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: "rgba(255, 255, 255, 0.95)", border: "1px solid rgba(25, 118, 210, 0.2)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={<div style={{ color: "#1976d2", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}><BarChartOutlined />ผู้ใช้รายเดือน</div>}
              style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)", border: "1px solid rgba(25, 118, 210, 0.1)", borderRadius: 16, boxShadow: "0 4px 20px rgba(33, 150, 243, 0.08)", height: 180 }}
              headStyle={{ background: "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)", borderBottom: "1px solid rgba(25, 118, 210, 0.1)", borderRadius: "16px 16px 0 0" }}
              bodyStyle={{ height: 120, padding: 8 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                {/* <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(25, 118, 210, 0.1)" />
                  <XAxis dataKey="month" stroke="#1976d2" fontSize={10} />
                  <YAxis stroke="#1976d2" fontSize={10} />
                  <RechartsTooltip contentStyle={{ background: "rgba(255, 255, 255, 0.95)", border: "1px solid rgba(25, 118, 210, 0.2)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", fontSize: 12 }} />
                  <Line type="monotone" dataKey="total" stroke="#1976d2" strokeWidth={2} dot={{ fill: "#1976d2", strokeWidth: 1, r: 3 }} activeDot={{ r: 4, stroke: "#1976d2", strokeWidth: 1 }} />
                </LineChart> */}
                  <LineChart data={monthlyUserData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(25,118,210,0.1)" />
                    <XAxis dataKey="month" stroke="#1976d2" fontSize={10} />
                    <YAxis stroke="#1976d2" fontSize={10} />
                    <RechartsTooltip contentStyle={{ background: "rgba(255, 255, 255, 0.95)", border: "1px solid rgba(25, 118, 210, 0.2)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="students" stroke="#1890ff" strokeWidth={2} />
                    <Line type="monotone" dataKey="companies" stroke="#fa8c16" strokeWidth={2} />
                    <Line type="monotone" dataKey="academic_staff" stroke="#722ed1" strokeWidth={2} />
                    <Line type="monotone" dataKey="admins" stroke="#52c41a" strokeWidth={2} />
                  </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Card style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)", border: "1px solid rgba(25, 118, 210, 0.1)", borderRadius: 16, boxShadow: "0 4px 20px rgba(33, 150, 243, 0.08)" }}>
          <Tabs defaultActiveKey="users">
            <TabPane
              tab={<span style={{ color: "#1976d2", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}><TeamOutlined />รายชื่อผู้ใช้</span>}
              key="users"
            >
              <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                <Input.Search
                  placeholder="ค้นหาด้วยอีเมลหรือบทบาท..."
                  allowClear
                  size="large"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ maxWidth: 400, borderRadius: 8 }}
                  enterButton={<Button type="primary" style={{ background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)", border: "none", borderRadius: "0 8px 8px 0" }}>ค้นหา</Button>}
                />
                <ExportExcelButton variant="users" usersAll={users} usersFiltered={displayedUsers} />
              </div>
              <Table
                columns={userColumns}
                dataSource={displayedUsers}
                rowKey="ID"
                onChange={handleUserTableChange}
                pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ` }}
              />
            </TabPane>

            <TabPane
              tab={<span style={{ color: "#1976d2", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}><LoginOutlined />บันทึกการเข้าสู่ระบบ</span>}
              key="loginLogs"
            >
              <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                <Input.Search
                  placeholder="ค้นหาด้วยอีเมล, IP หรืออุปกรณ์..."
                  allowClear
                  size="large"
                  value={loginSearchText}
                  onChange={(e) => setLoginSearchText(e.target.value)}
                  style={{ maxWidth: 400, borderRadius: 8 }}
                  enterButton={<Button type="primary" style={{ background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)", border: "none", borderRadius: "0 8px 8px 0" }}>ค้นหา</Button>}
                />
                <ExportExcelButton variant="logs" logsAll={loginLogs} logsFiltered={filteredLoginLogs} />
              </div>
              <Table
                columns={loginLogColumns}
                dataSource={filteredLoginLogs}
                rowKey="ID"
                pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ` }}
              />
            </TabPane>
          </Tabs>
        </Card>

        {/* View Modal */}
        <Modal
          title={<div style={{ color: "#1976d2", fontSize: 20, fontWeight: 600, textAlign: "center" }}>รายละเอียดผู้ใช้: {selectedUser?.Email}</div>}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[<Button key="close" onClick={() => setIsModalVisible(false)} style={{ borderColor: "#1976d2", color: "#1976d2", borderRadius: 8, background: "rgba(25, 118, 210, 0.02)" }}>ปิด</Button>]}
          width={900}
        >
          {selectedUser && (
            <div>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="อีเมล">{selectedUser.Email}</Descriptions.Item>
                <Descriptions.Item label="บทบาท"><Tag color="blue">{selectedUser.Role?.RoleNameTH}</Tag></Descriptions.Item>
                <Descriptions.Item label="สถานะการใช้งาน"><Badge status={selectedUser.is_active ? "success" : "error"} text={selectedUser.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"} /></Descriptions.Item>
                <Descriptions.Item label="สถานะออนไลน์"><Badge status={selectedUser.is_logged_in ? "processing" : "default"} text={selectedUser.is_logged_in ? "ออนไลน์" : "ออฟไลน์"} /></Descriptions.Item>
                <Descriptions.Item label="วันที่สร้าง">{dayjs(selectedUser.CreatedAt).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
                <Descriptions.Item label="อัปเดตล่าสุด">{dayjs(selectedUser.UpdatedAt).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
              </Descriptions>

              {/* โปรไฟล์ตามบทบาท */}
              {(() => {
                let profileData: StudentInterface | CompanyInterface | AcademicStaffInterface | undefined;
                if (selectedUser.Role?.RoleName === "Student") profileData = students.find((s) => s.UserID === selectedUser.ID);
                else if (selectedUser.Role?.RoleName === "Company") profileData = companies.find((c) => c.UserID === selectedUser.ID);
                else if (selectedUser.Role?.RoleName === "AcademicStaff") profileData = academicStaffs.find((a) => a.UserID === selectedUser.ID);

                return profileData ? (
                  <>
                    <Divider>ข้อมูลโปรไฟล์</Divider>
                    <Descriptions bordered column={2}>
                      {selectedUser.Role?.RoleName === "Student" && (
                        <>
                          <Descriptions.Item label="ชื่อ">{(profileData as StudentInterface).first_name}</Descriptions.Item>
                          <Descriptions.Item label="นามสกุล">{(profileData as StudentInterface).last_name}</Descriptions.Item>
                          <Descriptions.Item label="อายุ">{(profileData as StudentInterface).age} ปี</Descriptions.Item>
                          <Descriptions.Item label="สัญชาติ">{(profileData as StudentInterface).nationality}</Descriptions.Item>
                          <Descriptions.Item label="ศาสนา">{(profileData as StudentInterface).religion}</Descriptions.Item>
                          <Descriptions.Item label="เบอร์โทร">{(profileData as StudentInterface).phone_number}</Descriptions.Item>
                        </>
                      )}
                      {selectedUser.Role?.RoleName === "Company" && (
                        <>
                          <Descriptions.Item label="ชื่อบริษัท">{(profileData as CompanyInterface).company_name}</Descriptions.Item>
                          <Descriptions.Item label="โลโก้"><Avatar src={(profileData as CompanyInterface).logo} size={64} /></Descriptions.Item>
                        </>
                      )}
                      {selectedUser.Role?.RoleName === "AcademicStaff" && (
                        <>
                          <Descriptions.Item label="ชื่อ">{(profileData as AcademicStaffInterface).first_name}</Descriptions.Item>
                          <Descriptions.Item label="นามสกุล">{(profileData as AcademicStaffInterface).last_name}</Descriptions.Item>
                          <Descriptions.Item label="ตำแหน่งทางวิชาการ">{(profileData as AcademicStaffInterface).academic_position}</Descriptions.Item>
                          <Descriptions.Item label="อายุ">{(profileData as AcademicStaffInterface).age} ปี</Descriptions.Item>
                        </>
                      )}
                    </Descriptions>
                  </>
                ) : null;
              })()}
            </div>
          )}
        </Modal>

        {/* Edit Modal */}
        <Modal
          title={<div style={{ color: "#1976d2", fontSize: 20, fontWeight: 600, textAlign: "center" }}>แก้ไขข้อมูลผู้ใช้</div>}
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={async () => {
            if (!selectedUser) return;
            try {
              const payload = { Email: selectedUser.Email, RoleID: selectedUser.RoleID, is_active: selectedUser.is_active };
              const res = await UpdateUser(Number(selectedUser.ID), payload);
              setUsers((prev) => prev.map((u) => (u.ID === selectedUser.ID ? res.data : u)));
              setEditModalVisible(false);
            } catch (e) {
              console.error(e);
            }
          }}
          okText={<span style={{ fontWeight: 600 }}>บันทึก</span>}
          cancelText="ยกเลิก"
          okButtonProps={{ style: { background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)", border: "none", borderRadius: 8, boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)" } }}
          cancelButtonProps={{ style: { borderColor: "#1976d2", color: "#1976d2", borderRadius: 8, background: "rgba(25, 118, 210, 0.02)" } }}
          bodyStyle={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)", padding: 24 }}
        >
          <div>
            <div style={{ marginBottom: 16 }}>
              <label>อีเมล:</label>
              <Input value={selectedUser?.Email || ""} style={{ marginTop: 4 }} onChange={(e) => selectedUser && setSelectedUser({ ...selectedUser, Email: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
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
                    Role: Role ? { ID: Role.ID, RoleName: Role.RoleName, RoleNameTH: Role.RoleNameTH } : selectedUser.Role,
                  });
                }}
              >
                {roles.map((Role) => (<Option key={Role.ID} value={Role.ID}>{Role.RoleNameTH}</Option>))}
              </Select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>สถานะการใช้งาน:</label>
              <div style={{ marginTop: 4 }}>
                <Switch checked={selectedUser?.is_active} checkedChildren="เปิดใช้งาน" unCheckedChildren="ปิดใช้งาน" onChange={(checked) => selectedUser && setSelectedUser({ ...selectedUser, is_active: checked })} />
              </div>
            </div>
          </div>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default AdminUserDetailsPage;