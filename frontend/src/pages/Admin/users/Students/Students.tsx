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
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
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

const { Title } = Typography;

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

  const columns: ColumnsType<StudentInterface> = [
    { title: "ID", dataIndex: "ID", key: "ID" },

    { title: "ชื่อ", dataIndex: "first_name", key: "first_name" },
    { title: "นามสกุล", dataIndex: "last_name", key: "last_name" },
    { title: "อีเมล", dataIndex: ["User", "Email"], key: "email" },
    { title: "เพศ", dataIndex: ["Gender", "name"], key: "gender" },
    { title: "เบอร์โทรศัพท์", dataIndex: "phone_number", key: "phone_number" },
    { title: "สัญชาติ", dataIndex: "nationality", key: "nationality" },
    { title: "ศาสนา", dataIndex: "religion", key: "religion" },
    { title: "อายุ", dataIndex: "age", key: "age" },
    { title: "วันเกิด", dataIndex: "birthday", key: "birthday" },
    { title: "ส่วนสูง", dataIndex: "height", key: "height" },
    { title: "น้ำหนัก", dataIndex: "weight", key: "weight" },
    {
      title: "จังหวัด",
      dataIndex: ["Address", "Province", "name_th"],
      key: "province",
    },
    {
      title: "อำเภอ",
      dataIndex: ["Address", "District", "name_th"],
      key: "district",
    },
    {
      title: "ตำบล",
      dataIndex: ["Address", "SubDistrict", "name_th"],
      key: "subdistrict",
    },
    {
      title: "รหัสไปรษณีย์",
      dataIndex: ["Address", "Postcode", "post_code"],
      key: "postcode",
    },
    {
      title: "การจัดการ",
      key: "action",
      fixed: "right" as const,
      render: (_: any, rec: StudentInterface) => (
        <Flex gap={16}>
          <EditOutlined
            style={{ fontSize: 18, cursor: "pointer" }}
            onClick={() => showEditStudentModal(rec)}
          />
          <Popconfirm
            title="คุณแน่ใจหรือไม่ที่จะลบนักศึกษาคนนี้?"
            onConfirm={() => handleDeleteStudent(rec.ID!)}
          >
            <DeleteOutlined style={{ cursor: "pointer", color: "red" }} />
          </Popconfirm>
        </Flex>
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
      student.last_name?.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesSearch;
  });

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <Row justify="space-between" style={{ marginBottom: "1rem" }}>
          <Col>
            <Title level={3}>นักศึกษา (Student)</Title>
          </Col>{" "}
          <Col>
            <Flex align="center" gap={16}>
              จำนวน
              <Card
                size="small"
                style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
              >
                <div style={{ fontSize: 18, fontWeight: "bold" }}>
                  {tabKey == "active"
                    ? activeStudents.length
                    : deletedStudents.length}
                </div>
              </Card>
            </Flex>
          </Col>
        </Row>

        <Tabs
          defaultActiveKey="active"
          onChange={(key) => setTabKey(key)}
          items={[
            { label: "นักศึกษาทั้งหมด", key: "active" },
            { label: "นักศึกษาที่ถูกลบ", key: "deleted" },
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
              เพิ่มนักศึกษา
            </Button>
          </Col>
        </Flex>

        <Table
          className="custom-table"
          columns={columns}
          dataSource={filteredStudents}
          rowKey="ID"
          pagination={{ pageSize: 6 }}
          size="middle"
          scroll={{ x: "max-content" }}
        />

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