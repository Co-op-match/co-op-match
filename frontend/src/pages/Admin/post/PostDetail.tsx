import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Layout,
  Avatar,
  Descriptions,
  Empty,
  Spin,
  Badge,
  Alert,
  Modal,
  Table,
} from "antd";
import {
  ArrowLeftOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  StarOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  GiftOutlined,
  DesktopOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  FacebookOutlined,
  EditOutlined,
  EyeOutlined,
  CheckOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { GetInternshipPostsInAdminByIPostID, UpdateStatusPost } from "../../../services/https/Admin";
import { GetStatusPosts } from "../../../services/https/post";
import { useNavigate, useParams } from "react-router-dom";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";
import type { StatusPostInterface } from "../../../interface/IStatusPost";
import type { ApplicationInterface } from "../../../interface/IApplication";
import type { ColumnsType } from "antd/es/table";
import QuickStatsCard from "../../../components/adminpage/post/PDetail_QuickStatsCard";
import CompanyInfoCard from "../../../components/adminpage/post/PDetail_CompanyInfoCard";
import ApplicationsCard from "../../../components/adminpage/post/PDetail_ApplicationsCard";
import PostInfoCard from "../../../components/adminpage/post/PDetail_PostInfoCard";
import AdminHeader from "../../Component/AdminCoopMatchHeaderDefault";

const { Title, Text, Paragraph } = Typography;

const PostDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState<IntershipPostInterface>();
  const [status, setStatus] = useState<StatusPostInterface[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [applicationsVisible, setApplicationsVisible] = useState<
    ApplicationInterface[]
  >([]);

  // Mock loading data
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const res_post = await GetInternshipPostsInAdminByIPostID(Number(id));
        const res_status = await GetStatusPosts();
        setPost(res_post.data);
        setStatus(res_status);
      } catch (error) {
        message.error("ไม่สามารถโหลดข้อมูลโพสต์ได้");
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, [id]);

  const getStatusStyle = (statusTh: string | undefined) => {
    switch (statusTh) {
      case "เปิดรับสมัคร":
        return {
          bgColor: "#f6ffed",
          textColor: "#389e0d",
          border: "1px solid #b7eb8f",
          boxShadow: "0 2px 4px rgba(56, 158, 13, 0.1)",
        };
      case "ปิดรับสมัคร":
        return {
          bgColor: "#fff2f0",
          textColor: "#cf1322",
          border: "1px solid #ffccc7",
          boxShadow: "0 2px 4px rgba(207, 19, 34, 0.1)",
        };
      case "รอตรวจสอบ":
        return {
          bgColor: "#fffbe6",
          textColor: "#d48806",
          border: "1px solid #ffe58f",
          boxShadow: "0 2px 4px rgba(212, 136, 6, 0.1)",
        };
      default:
        return {
          bgColor: "#f5f5f5",
          textColor: "#8c8c8c",
          border: "1px solid #d9d9d9",
          boxShadow: "0 2px 4px rgba(140, 140, 140, 0.1)",
        };
    }
  };

  const handleApprove = async () => {
    if (!post) return;
    setActionLoading(true);
    try {
      // หาค่า status_post_id ที่ตรงกับ "เปิดรับสมัคร"
      const openStatus = status.find((s) => s.status_post === "Open");
      if (!openStatus) throw new Error("ไม่พบสถานะ 'เปิดรับสมัคร'");

      await UpdateStatusPost(post.ID!, openStatus.ID!);

      setPost((prev) =>
        prev
          ? {
              ...prev,
              StatusPost: {
                ...prev.StatusPost,
                status_post: openStatus.status_post,
                status_post_th: openStatus.status_post_th,
              },
            }
          : prev
      );

      message.success("อนุมัติโพสต์เรียบร้อยแล้ว");
    } catch (error) {
      message.error("ไม่สามารถอนุมัติโพสต์ได้");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!post) return;
    setActionLoading(true);
    try {
      // หาค่า status_post_id ที่ตรงกับ "ปิดรับสมัคร"
      const closedStatus = status.find((s) => s.status_post === "Closed");
      if (!closedStatus) throw new Error("ไม่พบสถานะ 'ปิดรับสมัคร'");

      await UpdateStatusPost(post.ID!, closedStatus.ID!);

      setPost((prev) =>
        prev
          ? {
              ...prev,
              StatusPost: {
                ...prev.StatusPost,
                status_post: closedStatus.status_post,
                status_post_th: closedStatus.status_post_th,
              },
            }
          : prev
      );

      message.success("ปิดรับสมัครเรียบร้อยแล้ว");
    } catch (error) {
      message.error("ไม่สามารถปฏิเสธโพสต์ได้");
    } finally {
      setActionLoading(false);
    }
  };

  const applicationColumns: ColumnsType<ApplicationInterface> = [
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "student_name",
      key: "student_name",
    },
    {
      title: "รหัสนักศึกษา",
      dataIndex: "student_id",
      key: "student_id",
    },
    {
      title: "GPA",
      dataIndex: "gpa",
      key: "gpa",
      render: (gpa) => <span style={{ fontWeight: 600 }}>{gpa}</span>,
    },
    {
      title: "วันที่สมัคร",
      dataIndex: "applied_date",
      key: "applied_date",
      render: (date) => new Date(date).toLocaleDateString("th-TH"),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color="processing">{status}</Tag>,
    },
  ];

  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
        <div style={{ padding: "2rem" }}>
          <Empty description="ไม่พบข้อมูลโพสต์" />
        </div>
      </Layout>
    );
  }

  const statusStyle = getStatusStyle(post.StatusPost?.status_post_th);
  const statusIcon = {
    เปิดรับสมัคร: <CheckCircleOutlined />,
    ปิดรับสมัคร: <CloseOutlined />,
    รอตรวจสอบ: <ClockCircleOutlined />,
  }[post.StatusPost?.status_post_th!] || <ExclamationCircleOutlined />;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <AdminHeader />
      <div style={{ padding: "2rem" }}>
        {/* Header */}
        <Card
          style={{
            marginBottom: "1.5rem",
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate("/admin/manage-posts")}
                  style={{ borderRadius: "8px" }}
                >
                  กลับ
                </Button>
                <Divider type="vertical" />
                <div>
                  <Title level={3} style={{ margin: 0, color: "#1677ff" }}>
                    รายละเอียดโพสต์ฝึกงาน
                  </Title>
                  <Text type="secondary">ID: {post.ID}</Text>
                </div>
              </Space>
            </Col>
            <Col></Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Left Column */}
          <Col xs={24} lg={16}>
            <PostInfoCard
              post={post}
              statusStyle={statusStyle}
              statusIcon={statusIcon}
              actionLoading={actionLoading}
              handleApprove={handleApprove}
              handleReject={handleReject}
              status={status.map((s) => ({
                status_post: s.status_post || "",
                status_post_th: s.status_post_th || "",
              }))}
            />

            <ApplicationsCard
              post={post}
              applicationColumns={applicationColumns}
            />
          </Col>

          {/* Right Column */}
          <Col xs={24} lg={8}>
            <CompanyInfoCard post={post} />
            <QuickStatsCard post={post} />
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default PostDetailPage;
