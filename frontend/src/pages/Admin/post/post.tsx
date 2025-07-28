import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Typography,
  Avatar,
  Tooltip,
  Badge,
  Divider,
  Layout,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AdminHeader from "../../Component/AdminCoopMatchHeaderDefault";
import { GetAllInternshipPosts } from "../../../services/https/Application";
import type { InternshipPostInterface } from "../../../interface/IIntershipPost";
import { GetAllInternshipPostsByAdmin } from "../../../services/https/Admin";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ManagePostsPage: React.FC = () => {
  const [posts, setPosts] = useState<InternshipPostInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] =
    useState<InternshipPostInterface | null>(null);

  const [form] = Form.useForm();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 6,
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await GetAllInternshipPostsByAdmin();
      console.log(response.data);
      setPosts(response.data);
    } catch (error) {
      message.error("ไม่สามารถโหลดข้อมูลโพสต์ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPost(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (post: InternshipPostInterface) => {
    setEditingPost(post);
    form.setFieldsValue({
      PostName: post.post_name,
      PostDescription: post.post_description,
      Quantity: post.quantity,
      MinGpa: post.min_gpa,
      LocationDetail: post.location_detail,
      Subdistrict: post.subdistrict,
      District: post.district,
      Province: post.province,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPosts(posts.filter((post) => post.ID !== id));
      message.success("ลบโพสต์สำเร็จ");
    } catch (error) {
      message.error("ไม่สามารถลบโพสต์ได้");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (editingPost) {
        // Update existing post
        setPosts(
          posts.map((post) =>
            post.ID === editingPost.ID ? { ...post, ...values } : post
          )
        );
        message.success("แก้ไขโพสต์สำเร็จ");
      } else {
        // Create new post
        const newPost: InternshipPostInterface = {
          ID: Date.now(),
          ...values,
          CreatedAt: new Date().toISOString(),
          CompanyID: 1,
          Company: {
            CompanyName: "Tech Solutions Co., Ltd.",
            Logo: "/api/placeholder/40/40",
          },
          JobType: { ID: 1, TypeName: "Development" },
          Stipend: { ID: 1, Amount: 15000 },
          WorkDay: { ID: 1, DayName: "จันทร์-ศุกร์" },
          WorkMode: { ID: 1, ModeName: "ออนไซต์" },
          StatusPost: { ID: 1, StatusName: "เปิดรับสมัคร" },
          Applications: [],
        };
        setPosts([newPost, ...posts]);
        message.success("สร้างโพสต์สำเร็จ");
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "เปิดรับสมัคร":
        return "success";
      case "ปิดรับสมัคร":
        return "default";
      case "ยกเลิก":
        return "error";
      default:
        return "processing";
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case "ผ่านการพิจารณา":
        return "success";
      case "ไม่ผ่านการพิจารณา":
        return "error";
      case "รอพิจารณา":
        return "processing";
      default:
        return "default";
    }
  };

  const columns: ColumnsType<InternshipPostInterface> = [
    {
      title: "ชื่อตำแหน่ง",
      dataIndex: "post_name",
      key: "post_name",
      width: 200,
      render: (text: string, record: InternshipPostInterface) => (
        <div>
          <Text strong style={{ color: "#1890ff" }}>
            {text}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: "14px" }}>
            {record.JobType?.job_type}
          </Text>
        </div>
      ),
    },
    {
      title: "รายละเอียด",
      dataIndex: "post_description",
      key: "post_description",
      width: 250,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200, display: "block" }}>
            {text}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "จำนวนที่รับ",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center",
      render: (quantity: number) => (
        <Badge count={quantity} showZero color="#1890ff" />
      ),
    },
    {
      title: "GPA ขั้นต่ำ",
      dataIndex: "min_gpa",
      key: "min_gpa",
      width: 100,
      align: "center",
      render: (gpa: any) =>
        gpa !== undefined && !isNaN(Number(gpa)) ? (
          <Tag color="blue">{Number(gpa).toFixed(1)}</Tag>
        ) : (
          <Tag color="default">-</Tag>
        ),
    },
    {
      title: "สถานที่",
      key: "location",
      width: 180,
      render: (_, record: InternshipPostInterface) => {
        const parts = [
          record.location_detail?.trim(),
          record.subdistrict?.trim(),
          record.district?.trim(),
          record.province?.trim(),
        ].filter(Boolean); // ตัด field ที่เป็น "" หรือ undefined ออก

        const locationText = parts.length > 0 ? parts.join(", ") : "-";

        return <Text style={{ fontSize: "14px" }}>{locationText}</Text>;
      },
    },
    {
      title: "ผู้สมัคร",
      key: "Applications",
      width: 100,
      align: "center",
      render: (_, record: InternshipPostInterface) => (
        <div>
          <TeamOutlined style={{ color: "#1890ff", marginRight: 4 }} />
          <Text strong>{record.Applications?.length}</Text>
        </div>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: ["StatusPost", "status_post_th"],
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "CreatedAt",
      key: "CreatedAt",
      width: 120,
      render: (date: string) => (
        <Text style={{ fontSize: "14px" }}>
          {dayjs(date).format("DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record: InternshipPostInterface) => (
        <Space size="small">
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
              style={{ color: "#52c41a" }}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Popconfirm
              title="คุณแน่ใจว่าต้องการลบโพสต์นี้?"
              onConfirm={() => handleDelete(record.ID || 0)}
              okText="ลบ"
              cancelText="ยกเลิก"
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

  // Calculate statistics
  const totalPosts = posts.length;

  const activePosts = posts.filter(
    (p) => p.StatusPost?.status_post === "เปิดรับสมัคร"
  ).length;

  const totalApplications = posts.reduce(
    (sum, post) => sum + (post.Applications?.length || 0),
    0
  );

  const pendingApplications = posts.reduce(
    (sum, post) =>
      sum +
      (post.Applications?.filter((app) => app.status === "กำลังพิจารณา")
        .length || 0),
    0
  );

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        {/* Header */}

        <div className="admin-header-box">
          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical" size={0}>
                <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
                  <span style={{ marginRight: 12 }}>
                    <FileTextOutlined />
                  </span>
                  การจัดการโพสต์ฝึกงาน
                </Title>
                <Text type="secondary">
                  จัดการและติดตามโพสต์ฝึกงานของบริษัท
                </Text>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="โพสต์ทั้งหมด"
                value={totalPosts}
                prefix={<FileTextOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="โพสต์ที่เปิดรับ"
                value={activePosts}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="ผู้สมัครทั้งหมด"
                value={totalApplications}
                prefix={<TeamOutlined style={{ color: "#722ed1" }} />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="รอพิจารณา"
                value={pendingApplications}
                prefix={<ClockCircleOutlined style={{ color: "#fa8c16" }} />}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: "#1890ff" }} />
              <span>รายการโพสต์ฝึกงาน</span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              style={{
                background: "linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)",
                border: "none",
              }}
            >
              สร้างโพสต์ใหม่
            </Button>
          }
          style={{
            boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
            borderRadius: "8px",
          }}
        >
          <Table
            columns={columns}
            dataSource={posts}
            rowKey="ID"
            loading={loading}
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
            scroll={{ x: 1200 }}
            style={{ marginTop: "16px" }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={
            <Space>
              <FileTextOutlined style={{ color: "#1890ff" }} />
              <span>{editingPost ? "แก้ไขโพสต์" : "สร้างโพสต์ใหม่"}</span>
            </Space>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={800}
          style={{ top: 20 }}
        >
          <Divider />
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ marginTop: "16px" }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="ชื่อตำแหน่ง"
                  name="PostName"
                  rules={[{ required: true, message: "กรุณากรอกชื่อตำแหน่ง" }]}
                >
                  <Input placeholder="เช่น Frontend Developer Intern" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="รายละเอียดงาน"
                  name="PostDescription"
                  rules={[
                    { required: true, message: "กรุณากรอกรายละเอียดงาน" },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder="อธิบายรายละเอียดงาน ความรับผิดชอบ และคุณสมบัติที่ต้องการ"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="จำนวนที่รับ"
                  name="Quantity"
                  rules={[{ required: true, message: "กรุณากรอกจำนวนที่รับ" }]}
                >
                  <InputNumber
                    min={1}
                    max={100}
                    style={{ width: "100%" }}
                    placeholder="จำนวนคน"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="เกรดเฉลี่ยขั้นต่ำ"
                  name="MinGpa"
                  rules={[
                    { required: true, message: "กรุณากรอกเกรดเฉลี่ยขั้นต่ำ" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={4}
                    step={0.1}
                    style={{ width: "100%" }}
                    placeholder="เช่น 3.0"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="รายละเอียดที่ตั้ง"
                  name="LocationDetail"
                  rules={[
                    { required: true, message: "กรุณากรอกรายละเอียดที่ตั้ง" },
                  ]}
                >
                  <Input placeholder="เช่น 123 ถนนสุขุมวิท" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="ตำบล/แขวง"
                  name="Subdistrict"
                  rules={[{ required: true, message: "กรุณากรอกตำบล/แขวง" }]}
                >
                  <Input placeholder="ตำบล/แขวง" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="อำเภอ/เขต"
                  name="District"
                  rules={[{ required: true, message: "กรุณากรอกอำเภอ/เขต" }]}
                >
                  <Input placeholder="อำเภอ/เขต" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="จังหวัด"
                  name="Province"
                  rules={[{ required: true, message: "กรุณากรอกจังหวัด" }]}
                >
                  <Input placeholder="จังหวัด" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
              <Space>
                <Button
                  onClick={() => {
                    setModalVisible(false);
                    form.resetFields();
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{
                    background:
                      "linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)",
                    border: "none",
                  }}
                >
                  {editingPost ? "บันทึกการแก้ไข" : "สร้างโพสต์"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default ManagePostsPage;
