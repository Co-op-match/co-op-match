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
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import AdminHeader from "../../../Component/AdminCoopMatchHeaderDefault";
import "../users.css";
import type { AdminInterface } from "../../../../interfaces/Admin";

import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { DeleteAdmin, GetAllActiveAdmins, GetAllDeletedAdmins } from "../../../../services/https/Admin";

const { Title } = Typography;

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

  const columns: ColumnsType<AdminInterface> = [
    { title: "ID", dataIndex: "ID", key: "ID" },
    { title: "ชื่อ", dataIndex: "first_name", key: "first_name" },
    { title: "นามสกุล", dataIndex: "last_name", key: "last_name" },
    {
      title: "วันเกิด",
      dataIndex: "birthday",
      key: "birthday",
      render: (_: any, rec: AdminInterface) =>
        rec.birthday ? dayjs(rec.birthday).format("DD/MM/YYYY") : "-",
    },
    { title: "อีเมล", dataIndex: ["User", "Email"], key: "email" },
    {
      title: "การจัดการ",
      key: "action",
      fixed: "right" as const,
      render: (_: any, rec: AdminInterface) => (
        <Flex gap={16}>
          <EditOutlined
            style={{ fontSize: 18, cursor: "pointer" }}
            onClick={() => showEditAdminModal(rec)}
          />
          <Popconfirm
            title="คุณแน่ใจหรือไม่ที่จะลบผู้ดูแลระบบคนนี้?"
            onConfirm={() => handleDeleteAdmin(rec.ID!)}
          >
            <DeleteOutlined style={{ cursor: "pointer", color: "red" }} />
          </Popconfirm>
        </Flex>
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
      admin.last_name?.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesSearch;
  });

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <Row justify="space-between" style={{ marginBottom: "1rem" }}>
          <Col>
            <Title level={3}>ผู้ดูแลระบบ (Admin)</Title>
          </Col>
          <Col>
            <Flex align="center" gap={16}>
              จำนวน
              <Card
                size="small"
                style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
              >
                <div style={{ fontSize: 18, fontWeight: "bold" }}>
                  {tabKey == "active"
                    ? activeAdmins.length
                    : deletedAdmins.length}
                </div>
              </Card>
            </Flex>
          </Col>
        </Row>

        <Tabs
          defaultActiveKey="active"
          onChange={(key) => setTabKey(key)}
          items={[
            { label: "ผู้ดูแลทั้งหมด", key: "active" },
            { label: "ผู้ดูแลที่ถูกลบ", key: "deleted" },
          ]}
          style={{ marginTop: "1rem" }}
        />

        <Flex
          justify="center"
          align="center"
          gap="5vw"
          style={{ margin: "1rem 0" }}
        >
          <Input
            placeholder="ค้นหา..."
            suffix={<SearchOutlined style={{ color: "#999" }} />}
            className="searchInput"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <Col>
            <Button type="primary" onClick={() => setIsAddModalVisible(true)}>
              เพิ่มผู้ดูแลระบบ
            </Button>
          </Col>
        </Flex>

        <Table
          className="custom-table"
          columns={columns}
          dataSource={filteredAdmins}
          rowKey="ID"
          pagination={{ pageSize: 6 }}
          size="middle"
          scroll={{ x: "max-content" }}
        />
      </Layout>
    </Layout>
  );
};

export default AdminManagementPage;