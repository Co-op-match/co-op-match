import React, { useEffect, useState } from "react";
import {
  Layout,
  Row,
  Col,
  Typography,
  Select,
  Input,
  Button,
  Table,
  Tabs,
  Flex,
  Popconfirm,
  message,
  Card,
  Badge,
  Space,
  Tooltip,
  Avatar,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
  TeamOutlined,
  DeleteFilled,
} from "@ant-design/icons";
import AdminHeader from "../../../Component/AdminCoopMatchHeaderDefault";
import "../users.css";
import type { StudentInterface } from "../../../../interfaces/Student";
import {
  GetAllActiveStudents,
  GetAllDeletedStudents,
  DeleteStudent,
} from "../../../../services/https/Admin";
import type { ColumnsType } from "antd/es/table";
import EditStudentForm from "./EditStudentModal";
import RoleTabs from "../../../../components/adminpage/Verify_RoleTabs";

const { Title, Text } = Typography;

const StudentManagementPage: React.FC = () => {
  const [tabKey, setTabKey] = useState("active");
  const [activeStudents, setActiveStudents] = useState<StudentInterface[]>([]);
  const [deletedStudents, setDeletedStudents] = useState<StudentInterface[]>(
    []
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentInterface | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [resActive, resDeleted] = await Promise.all([
      GetAllActiveStudents(),
      GetAllDeletedStudents(),
    ]);
    if (resActive.status === 200) setActiveStudents(resActive.data);
    if (resDeleted.status === 200) setDeletedStudents(resDeleted.data);
  };

  const role = activeStudents[0]?.User?.Role;

  const columns: ColumnsType<StudentInterface> = [
    {
      title: "นักศึกษา",
      key: "student",
      width: 200,
      fixed: "left" as const,
      render: (_: any, record: StudentInterface) => (
        <Space>
          <Avatar size={40} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600, fontSize: "14px" }}>
              {record.first_name} {record.last_name}
            </div>
            <Text type="secondary" style={{ fontSize: "14px" }}>
              ID: {record.ID}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "ข้อมูลติดต่อ",
      key: "contact",
      width: 180,
      render: (_: any, record: StudentInterface) => (
        <div>
          <div style={{ fontSize: "14px", marginBottom: "4px" }}>
            📧 {record.User?.Email}
          </div>
          <div style={{ fontSize: "14px" }}>📱 {record.phone_number}</div>
        </div>
      ),
    },
    {
      title: "ข้อมูลส่วนตัว",
      key: "personal",
      width: 150,
      render: (_: any, record: StudentInterface) => (
        <div>
          <div style={{ fontSize: "14px", marginBottom: "2px" }}>
            {record.Gender?.name_th}
          </div>
          <div style={{ fontSize: "14px" }}>อายุ {record.age} ปี</div>
          <div style={{ fontSize: "14px" }}>{record.nationality}</div>
        </div>
      ),
    },
    {
      title: "ข้อมูลทางกาย",
      key: "physical",
      width: 120,
      render: (_: any, record: StudentInterface) => (
        <div>
          <div style={{ fontSize: "14px" }}>ส่วนสูง: {record.height} ซม.</div>
          <div style={{ fontSize: "14px" }}>น้ำหนัก: {record.weight} กก.</div>
        </div>
      ),
    },
    {
      title: "ที่อยู่",
      key: "address",
      width: 200,
      render: (_: any, record: StudentInterface) => (
        <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
          <div>{record.Address?.SubDistrict?.name_th}</div>
          <div>{record.Address?.District?.name_th}</div>
          <div>{record.Address?.Province?.name_th}</div>
          <div style={{ color: "#666" }}>
            {record.Address?.Postcode?.post_code}
          </div>
        </div>
      ),
    },
    {
      title: "การจัดการ",
      key: "action",
      width: 100,
      fixed: "right" as const,
      render: (_: any, rec: StudentInterface) => (
        <Space size="small">
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => showEditStudentModal(rec)}
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Popconfirm
              title="ลบนักศึกษา"
              description="คุณแน่ใจหรือไม่ที่จะลบนักศึกษาคนนี้?"
              onConfirm={() => handleDeleteStudent(rec.ID!)}
              okText="ลบ"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleDeleteStudent = async (id: number) => {
    try {
      const res = await DeleteStudent(id);
      if (res.status === 200) {
        message.success("ลบนักศึกษาสำเร็จ");
        fetchData();
      } else {
        message.error("เกิดข้อผิดพลาดในการลบ");
      }
    } catch (err) {
      message.error("ลบไม่สำเร็จ");
    }
  };

  const showEditStudentModal = (student: StudentInterface) => {
    setSelectedStudent(student);
    setIsEditModalVisible(true);
  };

  const filteredStudents = (
    tabKey === "active" ? activeStudents : deletedStudents
  ).filter((student) => {
    const matchesSearch =
      student.first_name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      student.User?.Email?.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesSearch;
  });

  const statsCards = [
    {
      title: "นักศึกษาทั้งหมด",
      value: activeStudents.length,
      icon: <TeamOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      color: "#e6f7ff",
      borderColor: "#91d5ff",
    },
    {
      title: "นักศึกษาที่ถูกลบ",
      value: deletedStudents.length,
      icon: <DeleteFilled style={{ fontSize: 24, color: "#ff4d4f" }} />,
      color: "#fff2f0",
      borderColor: "#ffadd2",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <div className="admin-header-box">
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
                <TeamOutlined style={{ marginRight: "12px" }} />
                จัดการนักศึกษา
              </Title>
              <Text type="secondary">จัดการข้อมูลนักศึกษาในระบบ CoopMatch</Text>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalVisible(true)}
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                }}
              >
                เพิ่มนักศึกษา
              </Button>
            </Col>
          </Row>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          {statsCards.map((card, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: `1px solid ${card.borderColor}`,
                  background: card.color,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                styles={{
                  body: { padding: "20px" },
                }}
              >
                <Flex align="center" justify="space-between">
                  <div>
                    <div
                      style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#262626",
                        lineHeight: 1,
                      }}
                    >
                      {card.value}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      {card.title}
                    </div>
                  </div>
                  <div>{card.icon}</div>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Main Content */}
        <Card
          style={{
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          styles={{
            body: { padding: "24px" },
          }}
        >
          {role && (
            <RoleTabs tabKey={tabKey} setTabKey={setTabKey} role={role} />
          )}

          {/* Search Bar */}
          <Row
            gutter={[16, 16]}
            style={{ marginBottom: "24px", alignItems: "center" }}
          >
            <Col xs={24} sm={16} md={12} lg={8}>
              <Input
                placeholder="ค้นหาชื่อ นามสกุล หรือ อีเมล..."
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                size="large"
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              />
            </Col>
            <Col>
              <Text type="secondary">
                แสดง {filteredStudents.length} รายการ
              </Text>
            </Col>
          </Row>

          {/* Table */}

          <Table
            columns={columns}
            dataSource={filteredStudents}
            rowKey="ID"
            className="adminpage-table"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} จาก ${total} รายการ`,
              pageSizeOptions: ["10", "20", "50"],
            }}
            scroll={{ x: 1200 }}
            size="middle"
            style={{
              background: "#fff",
              borderRadius: "8px",
            }}
            rowClassName="hover-row"
          />
        </Card>

        {/* Modal แก้ไขนักศึกษา */}
        {selectedStudent && (
          <EditStudentForm
            visible={isEditModalVisible}
            onCancel={() => setIsEditModalVisible(false)}
            student={selectedStudent}
            onSuccess={() => {
              fetchData();
              setIsEditModalVisible(false);
            }}
          />
        )}
      </Layout>
    </Layout>
  );
};

export default StudentManagementPage;
