import { useState, useEffect } from "react";
import { Card, Button, Space, Tag, message, Row, Col, Typography, Divider, Layout, Empty, Spin } from "antd";
import { ArrowLeftOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { GetAdminById, GetInternshipPostsInAdminByIPostID, UpdateStatusPost } from "../../../services/https/index";
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
import AdminHeader from "../../Component/AdminHeader";
import type { AdminInterface } from "../../../interfaces/Admin";

const { Title, Text } = Typography;

const PostDetailPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const user_id = Number(localStorage.getItem("id"));
  const { id } = useParams();
  const [admin, setAdmin] = useState<AdminInterface>();
  const [post, setPost] = useState<IntershipPostInterface>();
  const [status, setStatus] = useState<StatusPostInterface[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Mock loading data
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const res_post = await GetInternshipPostsInAdminByIPostID(Number(id));
        const res_status = await GetStatusPosts();
        const res_admin = await GetAdminById(user_id);
        if (res_post.status === 200) setPost(res_post.data);
        setStatus(res_status);
        if (res_admin.status === 200) setAdmin(res_admin.data);
      } catch (error) {
        messageApi.error("ไม่สามารถโหลดข้อมูลโพสต์ได้");
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

  const handleUpdateStatus = async (next: "Open" | "Closed") => {
    if (!post) return;
    if (!admin?.ID) {
      messageApi.error("ไม่พบบัญชีแอดมิน");
      return;
    }
    setActionLoading(true);
    try {
      const target = status.find((s) => s.status_post === next);
      if (!target) throw new Error(`ไม่พบสถานะ '${next}'`);

      const res = await UpdateStatusPost(post.ID!, {
        StatusPostID: target.ID!,
        AdminID: admin.ID,
      });
      if (res.status !== 200) throw new Error();

      // sync UI
      setPost((prev) =>
        prev
          ? {
              ...prev,
              StatusPost: {
                ...prev.StatusPost,
                status_post: target.status_post,
                status_post_th: target.status_post_th,
              },
              AdminID: admin.ID,
            }
          : prev
      );

      messageApi.success(
        next === "Open"
          ? "อนุมัติโพสต์เรียบร้อยแล้ว"
          : "ปิดรับสมัครเรียบร้อยแล้ว"
      );
    } catch {
      messageApi.error(
        next === "Open" ? "ไม่สามารถอนุมัติโพสต์ได้" : "ไม่สามารถปิดรับสมัครได้"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = () => handleUpdateStatus("Open");
  const handleReject = () => handleUpdateStatus("Closed");

  const applicationColumns: ColumnsType<ApplicationInterface> = [
    {
      title: "ชื่อ-นามสกุล",
      key: "student_name",
      render: (_, record) => {
        const first = record.Student?.first_name ?? "-";
        const last = record.Student?.last_name ?? "";
        return `${first} ${last}`.trim();
      },
    },
    {
      title: "รหัสนักศึกษา",
      dataIndex: "student_id",
      key: "student_id",
      render: (_, record) => record.Student?.user_id ?? "-",
    },
    {
      title: "GPA",
      dataIndex: "grade",
      key: "grade",
      render: (_, record) => record.Student?.Education?.[0]?.grade ?? "-",
    },
    {
      title: "วันที่สมัคร",
      dataIndex: "submit_at",
      key: "submit_at",
      render: (dt?: string) =>
        dt ? new Date(dt).toLocaleDateString("th-TH") : "-",
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (val) => <Tag color="processing">{val}</Tag>,
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
    <Layout>
      {contextHolder}
      <AdminHeader />
      <Layout className="adminpage-layout">
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
                  <Text type="secondary">รหัสโพสต์งาน: {post.ID}</Text>
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
      </Layout>
    </Layout>
  );
};

export default PostDetailPage;
