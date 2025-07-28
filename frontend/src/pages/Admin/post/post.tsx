import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  message,
  Popconfirm,
  Row,
  Col,
  Typography,
  Tooltip,
  Layout,
  Tabs,
  Empty,
} from "antd";
import {
  EyeOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import AdminHeader from "../../Component/AdminCoopMatchHeaderDefault";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";
import { GetAllInternshipPostsByAdmin } from "../../../services/https/Admin";
import type { ColumnsType } from "antd/es/table";
import "./Post.css";
import "../main.css";
import { getStatusStyle } from "../../../components/adminpage/verify/statusStyle";
import Post_StatCard from "../../../components/adminpage/verify/Post_StatCard";
import { GetStatusPosts } from "../../../services/https/post";
import type { StatusPostInterface } from "../../../interface/IStatusPost";

const { Title, Text } = Typography;

const ManagePostsPage = () => {
  const [posts, setPosts] = useState<IntershipPostInterface[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<IntershipPostInterface[]>(
    []
  );

  const [status, setStatus] = useState<StatusPostInterface[]>([]);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>(
    {}
  );
  const [activeTab, setActiveTab] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
  });

  // โหลดโพสต์จาก API
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const res_post = await GetAllInternshipPostsByAdmin();
        const res_status = await GetStatusPosts();
        setPosts(res_post.data);
        setStatus(res_status);
      } catch (error) {
        message.error("ไม่สามารถโหลดข้อมูลโพสต์ได้");
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchText, activeTab]);

  const filterPosts = () => {
    let filtered = posts;

    // Filter by tab
    switch (activeTab) {
      case "pending":
        filtered = posts.filter(
          (post) => post.StatusPost?.status_post === "Pending Approval"
        );
        break;
      case "approved":
        filtered = posts.filter(
          (post) => post.StatusPost?.status_post === "Open"
        );
        break;
      case "rejected":
        filtered = posts.filter(
          (post) => post.StatusPost?.status_post === "Closed"
        );
        break;
      default:
        filtered = posts;
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        (post) =>
          (post.post_name || "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          post.Company?.company_name
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          post.JobType?.job_type
            .toLowerCase()
            .includes(searchText.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  };

  const getCurrentTabCount = () => {
    switch (activeTab) {
      case "pending":
        return pendingPosts;
      case "approved":
        return approvedPosts;
      case "rejected":
        return rejectedPosts;
      case "all":
      default:
        return totalPosts;
    }
  };

  const handleApprove = async (post: IntershipPostInterface) => {
    if (!post.ID) return;

    setActionLoading((prev) => ({ ...prev, [post.ID!]: true }));
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.ID === post.ID
            ? {
                ...p,
                StatusPost: {
                  ...p.StatusPost,
                  status_post: "Open",
                  status_post_th: "เปิดรับสมัคร",
                },
              }
            : p
        )
      );

      message.success(`อนุมัติโพสต์ "${post.post_name}" เรียบร้อยแล้ว`);
    } catch (error) {
      message.error("ไม่สามารถอนุมัติโพสต์ได้");
    } finally {
      setActionLoading((prev) => ({ ...prev, [post.ID!]: false }));
    }
  };

  const handleReject = async (post: IntershipPostInterface) => {
    if (!post.ID) return;

    setActionLoading((prev) => ({ ...prev, [post.ID!]: true }));
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.ID === post.ID
            ? {
                ...p,
                StatusPost: {
                  ...p.StatusPost,
                  status_post: "Closed",
                  status_post_th: "ปิดรับสมัคร",
                },
              }
            : p
        )
      );

      message.success(`ปฏิเสธโพสต์ "${post.post_name}" เรียบร้อยแล้ว`);
    } catch (error) {
      message.error("ไม่สามารถปฏิเสธโพสต์ได้");
    } finally {
      setActionLoading((prev) => ({ ...prev, [post.ID!]: false }));
    }
  };

  const columns: ColumnsType<IntershipPostInterface> = [
    {
      title: "ชื่อตำแหน่ง",
      dataIndex: "post_name",
      key: "post_name",
      width: 280,
      render: (text: any, record: any) => (
        <div style={{ padding: "8px 0" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#1890ff", // Blue theme
              marginBottom: "4px",
              lineHeight: "1.4",
            }}
          >
            {text}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#666",
              marginBottom: "2px",
            }}
          >
            <TeamOutlined style={{ marginRight: "4px", color: "#1890ff" }} />
            {record.Company?.company_name || "ไม่ระบุบริษัท"}
          </div>
          <Tag
            style={{
              backgroundColor: "#e6f7ff",
              border: "1px solid #91d5ff",
              color: "#096dd9",
              fontSize: "11px",
            }}
          >
            {record.JobType?.job_type || "ไม่ระบุประเภทงาน"}
          </Tag>
        </div>
      ),
    },
    {
      title: "รายละเอียด",
      dataIndex: "post_description",
      key: "post_description",
      width: 300,
      render: (text: any) => (
        <div
          style={{
            maxWidth: "280px",
            lineHeight: "1.5",
            color: "#595959",
          }}
        >
          <Text ellipsis={{ tooltip: text }} style={{ fontSize: "13px" }}>
            {text || "ไม่มีรายละเอียด"}
          </Text>
        </div>
      ),
    },
    {
      title: "จำนวน/GPA",
      key: "quantity_gpa",
      width: 120,
      align: "center",
      render: (record: IntershipPostInterface) => (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              backgroundColor: "#1890ff", // Blue theme
              color: "white",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "600",
              margin: "0 auto 8px",
            }}
          >
            {record.quantity || 0}
          </div>
          <Tag color="blue" style={{ fontSize: "11px" }}>
            GPA
            {record.min_gpa !== undefined
              ? Number(record.min_gpa).toFixed(1)
              : "-"}
          </Tag>
        </div>
      ),
    },
    {
      title: "สถานที่",
      key: "location",
      width: 200,
      render: (record: IntershipPostInterface) => {
        const parts = [
          record.location_detail?.trim(),
          record.subdistrict?.trim(),
          record.district?.trim(),
          record.province?.trim(),
        ].filter(Boolean);

        const locationText =
          parts.length > 0 ? parts.join(", ") : "ไม่ระบุสถานที่";

        return (
          <div
            style={{
              fontSize: "13px",
              color: "#595959",
              lineHeight: "1.4",
            }}
          >
            {locationText}
          </div>
        );
      },
    },
    {
      title: "ผู้สมัคร",
      key: "Applications",
      width: 90,
      align: "center",
      render: (record) => (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#1677ff",
            }}
          >
            {record.Applications?.length || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>ใบสมัคร</div>
        </div>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 160,
      align: "center",
      render: (record) => {
        const statusTh = record.StatusPost?.status_post_th || "ไม่ระบุสถานะ";
        const style = getStatusStyle(statusTh);

        const iconMap: Record<string, React.ReactNode> = {
          เปิดรับสมัคร: <CheckCircleOutlined style={{ marginRight: 6 }} />,
          ปิดรับสมัคร: <CloseOutlined style={{ marginRight: 6 }} />,
          รอตรวจสอบ: <ClockCircleOutlined style={{ marginRight: 6 }} />,
        };

        const icon = iconMap[statusTh] || (
          <ExclamationCircleOutlined style={{ marginRight: 6 }} />
        );

        return (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 16px",
              borderRadius: "999px",
              background: style.bgColor,
              color: style.textColor,
              fontWeight: 600,
              fontSize: "13px",
              border: style.border,
              boxShadow: style.boxShadow,
            }}
          >
            {icon}
            {statusTh}
          </div>
        );
      },
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "CreatedAt",
      key: "CreatedAt",
      width: 120,
      align: "center",
      render: (date: any) => (
        <Text style={{ fontSize: "12px", color: "#8c8c8c" }}>
          {date ? new Date(date).toLocaleDateString("th-TH") : "-"}
        </Text>
      ),
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 180,
      fixed: "right",
      align: "center",
      render: (record: IntershipPostInterface) => {
        const isPending = record.StatusPost?.status_post === "Pending Approval";
        const isApproved = record.StatusPost?.status_post === "Open";
        const isRejected = record.StatusPost?.status_post === "Closed";
        const isLoading = actionLoading[record.ID || 0];

        return (
          <div
            style={{ display: "flex", gap: "6px", justifyContent: "center" }}
          >
            <Tooltip title="ดูรายละเอียด">
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                style={{
                  color: "#1890ff", // Blue theme
                  backgroundColor: "#e6f7ff",
                  border: "1px solid #91d5ff",
                  borderRadius: "6px",
                }}
              />
            </Tooltip>

            {isPending && (
              <>
                <Tooltip title="อนุมัติโพสต์">
                  <Popconfirm
                    title="คุณต้องการอนุมัติโพสต์นี้หรือไม่?"
                    onConfirm={() => handleApprove(record)}
                    okText="อนุมัติ"
                    cancelText="ยกเลิก"
                    okButtonProps={{
                      style: {
                        background: "#52c41a",
                        borderColor: "#52c41a",
                        fontWeight: "500",
                      },
                    }}
                  >
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      size="small"
                      loading={isLoading}
                      style={{
                        backgroundColor: "#52c41a",
                        borderColor: "#52c41a",
                        borderRadius: "6px",
                        fontWeight: "500",
                        boxShadow: "0 2px 4px rgba(82, 196, 26, 0.3)",
                      }}
                    >
                      อนุมัติ
                    </Button>
                  </Popconfirm>
                </Tooltip>

                <Tooltip title="ปฏิเสธโพสต์">
                  <Popconfirm
                    title="คุณต้องการปฏิเสธโพสต์นี้หรือไม่?"
                    onConfirm={() => handleReject(record)}
                    okText="ปฏิเสธ"
                    cancelText="ยกเลิก"
                    okButtonProps={{
                      danger: true,
                      style: { fontWeight: "500" },
                    }}
                  >
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      size="small"
                      loading={isLoading}
                      style={{
                        borderRadius: "6px",
                        fontWeight: "500",
                        boxShadow: "0 2px 4px rgba(255, 77, 79, 0.3)",
                      }}
                    >
                      ปฏิเสธ
                    </Button>
                  </Popconfirm>
                </Tooltip>
              </>
            )}

            {isApproved && (
              <Tag
                icon={<CheckCircleOutlined />}
                color="success"
                style={{
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  fontWeight: "500",
                  border: "none",
                }}
              >
                อนุมัติแล้ว
              </Tag>
            )}

            {isRejected && (
              <Tag
                icon={<CloseOutlined />}
                color="error"
                style={{
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  fontWeight: "500",
                  border: "none",
                }}
              >
                ปฏิเสธแล้ว
              </Tag>
            )}
          </div>
        );
      },
    },
  ];

  // Calculate statistics
  const totalPosts = posts.length;
  const pendingPosts = posts.filter(
    (p) => p.StatusPost?.status_post === "Pending Approval"
  ).length;
  const approvedPosts = posts.filter(
    (p) => p.StatusPost?.status_post === "Open"
  ).length;
  const rejectedPosts = posts.filter(
    (p) => p.StatusPost?.status_post === "Closed"
  ).length;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <div className="admin-header-box">
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
                  <FileTextOutlined
                    style={{ fontSize: "32px", color: "#1677ff" }}
                  />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, color: "#1677ff" }}>
                    การจัดการโพสต์ฝึกงาน
                  </Title>
                  <Text style={{ color: "#555", fontSize: "16px" }}>
                    อนุมัติและปฏิเสธโพสต์ฝึกงานจากบริษัทต่างๆ
                  </Text>
                </div>
              </div>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  style={{
                    backgroundColor: "#e6f4ff",
                    border: "1px solid #91caff",
                    color: "#1677ff",
                    borderRadius: "8px",
                  }}
                  loading={loading}
                  onClick={() => setLoading(true)}
                >
                  รีเฟรช
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  style={{
                    backgroundColor: "#e6f4ff",
                    border: "1px solid #91caff",
                    color: "#1677ff",
                    borderRadius: "8px",
                  }}
                >
                  ส่งออกข้อมูล
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Post_StatCard
          statusList={status}
          totalPosts={totalPosts}
          pendingPosts={pendingPosts}
          approvedPosts={approvedPosts}
          rejectedPosts={rejectedPosts}
        />

        {/* Main Content */}
        <Card
          style={{
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            background: "white",
          }}
        >
          {/* Search and Filters */}
          <div style={{ marginBottom: "24px" }}>
            <Row justify="space-between" align="middle">
              <Col xs={24} md={12}>
                <Input
                  placeholder="ค้นหาตำแหน่งงาน, บริษัท, หรือประเภทงาน..."
                  prefix={<SearchOutlined style={{ color: "#1890ff" }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e6f7ff", // Blue border
                    fontSize: "14px",
                  }}
                  size="large"
                />
              </Col>
            </Row>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            items={[
              {
                key: "all",
                label: (
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    <FileTextOutlined /> ทั้งหมด
                  </span>
                ),
              },
              {
                key: "pending",
                label: (
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    <ClockCircleOutlined style={{ color: "#faad14" }} />{" "}
                    รอตรวจสอบ
                  </span>
                ),
              },
              {
                key: "approved",
                label: (
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />{" "}
                    อนุมัติแล้ว
                  </span>
                ),
              },
              {
                key: "rejected",
                label: (
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    <CloseOutlined style={{ color: "#ff4d4f" }} /> ปฏิเสธแล้ว
                  </span>
                ),
              },
            ]}
          />

          <Text
            type="secondary"
            style={{ fontSize: "14px", marginTop: "10px" }}
          >
            แสดง {getCurrentTabCount()} รายการ
          </Text>

          <Table
            columns={columns}
            dataSource={filteredPosts}
            rowKey="ID"
            loading={loading}
            className="adminpage-table"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} จาก ${total} รายการ`,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
              },
              style: { marginTop: "24px" },
            }}
            scroll={{ x: 1400 }}
            style={{
              borderRadius: "12px",
              overflow: "hidden",
            }}
            rowClassName={(record, index) => {
              const status = record.StatusPost?.status_post;
              let baseClass = index % 2 === 0 ? "even-row" : "odd-row";
              if (status === "Pending Approval")
                baseClass += " pending-highlight";
              return baseClass;
            }}
            locale={{
              emptyText: (
                <Empty
                  description="ไม่พบข้อมูลโพสต์"
                  style={{ padding: "40px" }}
                />
              ),
            }}
          />
        </Card>
      </Layout>
    </Layout>
  );
};

export default ManagePostsPage;
