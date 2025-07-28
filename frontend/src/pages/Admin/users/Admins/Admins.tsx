import React, { useEffect, useState } from "react";
import {
  Layout,
  Row,
  Col,
  Typography,
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
  Tag,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
  TeamOutlined,
  DeleteFilled,
  SettingOutlined,
  CrownOutlined,
  CalendarOutlined,
  MailOutlined,
} from "@ant-design/icons";
import AdminHeader from "../../../Component/AdminCoopMatchHeaderDefault";
import "../users.css";
import "../../main.css";
import type { AdminInterface } from "../../../../interfaces/Admin";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  DeleteAdmin,
  GetAllActiveAdmins,
  GetAllDeletedAdmins,
} from "../../../../services/https/Admin";
import EditAdminsModal from "./EditAdminsModal";
import RoleTabs from "../../../../components/adminpage/verify/User_RoleTabs";
import PageHeaderSection from "../../../../components/adminpage/verify/User_PageHeaderSection";

const { Title, Text } = Typography;

const AdminManagementPage: React.FC = () => {
  const [tabKey, setTabKey] = useState("active");
  const [activeAdmins, setActiveAdmins] = useState<AdminInterface[]>([]);
  const [deletedAdmins, setDeletedAdmins] = useState<AdminInterface[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminInterface | null>(
    null
  );
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 6,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [resActive, resDeleted] = await Promise.all([
      GetAllActiveAdmins(),
      GetAllDeletedAdmins(),
    ]);
    if (resActive.status === 200) setActiveAdmins(resActive.data);
    if (resDeleted.status === 200) setDeletedAdmins(resDeleted.data);
  };

  const handleUpdateAdmin = async (data: any) => {
    try {
      // TODO: เรียก API อัปเดต admin ตรงนี้ เช่น:
      // const res = await UpdateAdmin(selectedAdmin?.ID!, data);
      // if (res.status === 200) {
      message.success("แก้ไขข้อมูลผู้ดูแลระบบสำเร็จ");
      setIsEditModalVisible(false);
      fetchData();
      // } else {
      //   message.error("เกิดข้อผิดพลาดในการอัปเดต");
      // }
    } catch (error) {
      console.error("Update error:", error);
      message.error("ไม่สามารถอัปเดตข้อมูลได้");
    }
  };

  const role = activeAdmins[0]?.User?.Role;

  const columns: ColumnsType<AdminInterface> = [
    {
      title: "ผู้ดูแลระบบ",
      key: "admin",
      width: 200,
      fixed: "left" as const,
      render: (_: any, record: AdminInterface) => (
        <Space>
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "15px",
                color: "#262626",
              }}
            >
              {record.first_name} {record.last_name}
            </div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              ID: {record.ID}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "ข้อมูลติดต่อ",
      key: "contact",
      width: 220,
      render: (_: any, record: AdminInterface) => (
        <div>
          <div
            style={{
              fontSize: "13px",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <MailOutlined style={{ color: "#1890ff" }} />
            <span style={{ wordBreak: "break-all" }}>
              {record.User?.Email || "ไม่มีข้อมูล"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "ข้อมูลส่วนตัว",
      key: "personal",
      width: 160,
      render: (_: any, record: AdminInterface) => (
        <div>
          <div
            style={{
              fontSize: "13px",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CalendarOutlined style={{ color: "#52c41a" }} />
            <span>
              {record.birthday
                ? dayjs(record.birthday).format("DD/MM/YYYY")
                : "ไม่ระบุ"}
            </span>
          </div>
          {record.birthday && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              อายุ {dayjs().diff(dayjs(record.birthday), "year")} ปี
            </div>
          )}
        </div>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 120,
      render: (_: any, record: AdminInterface) => (
        <div>
          <Badge
            status={tabKey === "active" ? "success" : "error"}
            text={
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: tabKey === "active" ? "#52c41a" : "#ff4d4f",
                }}
              >
                {tabKey === "active" ? "ใช้งาน" : "ถูกลบ"}
              </span>
            }
          />
          <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
            {tabKey === "active" ? "พร้อมใช้งาน" : "ไม่สามารถใช้งาน"}
          </div>
        </div>
      ),
    },
    {
      title: "การจัดการ",
      key: "action",
      width: 65,
      fixed: "right" as const,
      render: (_: any, rec: AdminInterface) => (
        <Space size="small">
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => showEditAdminModal(rec)}
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Popconfirm
              title="ลบผู้ดูแลระบบ"
              description="คุณแน่ใจหรือไม่ที่จะลบผู้ดูแลระบบคนนี้?"
              onConfirm={() => handleDeleteAdmin(rec.ID!)}
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

  const handleDeleteAdmin = async (id: number) => {
    try {
      const res = await DeleteAdmin(id);
      if (res.status === 200) {
        message.success("ลบผู้ดูแลระบบสำเร็จ");
        fetchData();
      } else {
        message.error("เกิดข้อผิดพลาดในการลบ");
      }
    } catch (err) {
      message.error("ลบไม่สำเร็จ");
    }
  };

  const showEditAdminModal = (admin: AdminInterface) => {
    setSelectedAdmin(admin);
    setIsEditModalVisible(true);
  };

  const filteredAdmins = (
    tabKey === "active" ? activeAdmins : deletedAdmins
  ).filter((admin) => {
    const matchesSearch =
      admin.first_name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      admin.last_name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      admin.User?.Email?.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesSearch;
  });

  const statsCards = [
    {
      title: "ผู้ดูแลระบบทั้งหมด",
      value: activeAdmins.length,
      icon: <SettingOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      color: "#e6f7ff",
      borderColor: "#91d5ff",
    },
    {
      title: "ผู้ดูแลที่ถูกลบ",
      value: deletedAdmins.length,
      icon: <DeleteFilled style={{ fontSize: 24, color: "#ff4d4f" }} />,
      color: "#fff2f0",
      borderColor: "#ffadd2",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <PageHeaderSection
          role={role!}
          onAddClick={() => setIsAddModalVisible(true)}
        />

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
                styles={{ body: { padding: "20px" } }}
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
          styles={{ body: { padding: "24px" } }}
        >
          {/* Tabs */}
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
              <Text type="secondary">แสดง {filteredAdmins.length} รายการ</Text>
            </Col>
          </Row>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={filteredAdmins}
            rowKey="ID"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} จาก ${total} รายการ`,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
              },
            }}
            scroll={{ x: 1000 }}
            size="middle"
            style={{
              background: "#fff",
              borderRadius: "8px",
            }}
            rowClassName="hover-row"
            locale={{
              emptyText: (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <SettingOutlined
                    style={{
                      fontSize: "48px",
                      color: "#d9d9d9",
                      marginBottom: "16px",
                    }}
                  />
                  <div style={{ fontSize: "16px", color: "#999" }}>
                    {tabKey === "active"
                      ? "ยังไม่มีผู้ดูแลระบบในระบบ"
                      : "ไม่มีผู้ดูแลระบบที่ถูกลบ"}
                  </div>
                </div>
              ),
            }}
          />
        </Card>

        <EditAdminsModal
          visible={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          adminData={selectedAdmin}
          onSave={handleUpdateAdmin}
        />
      </Layout>
    </Layout>
  );
};

export default AdminManagementPage;
