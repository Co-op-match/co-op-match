import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Table, Space, Tag, Input, Row, Col, Typography, Layout, Tabs, Empty, message } from "antd";
import { FileTextOutlined, TeamOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseOutlined, SearchOutlined, UserOutlined, StarOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { GetAllInternshipPostsInAdmin } from "../../../services/https/index";
import { GetStatusPosts } from "../../../services/https/post";
import type { StatusPostInterface } from "../../../interface/IStatusPost";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";
import AdminHeader from "../../Component/AdminCoopMatchHeaderDefault";
import { getStatusStyle } from "../../../components/adminpage/statusStyle";
import ExportPostsButton from "../../../components/adminpage/post/Post_ExportButton";
import "./Post.css";
import "../main.css";
import AdminSectionHeader from "../AdminSectionHeader";
import { Post_StatCard } from "../StatCard";

const { Text } = Typography;

const getStatusTabs = ({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (key: string) => void;
}) => {
  const items = [
    {
      key: "all",
      label: (
        <span style={{ fontSize: "14px", fontWeight: "600" }}>
          <FileTextOutlined /> ทั้งหมด
        </span>
      ),
    },
    {
      key: "pending",
      label: (
        <span style={{ fontSize: "14px", fontWeight: "600" }}>
          <ClockCircleOutlined style={{ color: "#faad14" }} /> รอตรวจสอบ
        </span>
      ),
    },
    {
      key: "approved",
      label: (
        <span style={{ fontSize: "14px", fontWeight: "600" }}>
          <CheckCircleOutlined style={{ color: "#52c41a" }} /> เปิดรับสมัคร
        </span>
      ),
    },
    {
      key: "rejected",
      label: (
        <span style={{ fontSize: "14px", fontWeight: "600" }}>
          <CloseOutlined style={{ color: "#ff4d4f" }} /> ปิดรับสมัคร
        </span>
      ),
    },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      onChange={onChange}
      size="large"
      items={items}
      className="enhanced-tabs"
    />
  );
};

const ManagePostsPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [posts, setPosts] = useState<IntershipPostInterface[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<IntershipPostInterface[]>(
    []
  );

  const [status, setStatus] = useState<StatusPostInterface[]>([]);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [pagination, setPagination] = useState({ current: 1, pageSize: 8 });

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

  useEffect(() => {
    loadPosts();
  }, []); // เรียกครั้งเดียวตอน component mount

  useEffect(() => {
    filterPosts();
  }, [posts, searchText, activeTab]); // เรียกเฉพาะตอน filter เปลี่ยน

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res_post = await GetAllInternshipPostsInAdmin();
      const res_status = await GetStatusPosts();
      setPosts(res_post.data);
      setStatus(res_status);
    } catch (error) {
      messageApi.error("ไม่สามารถโหลดข้อมูลโพสต์ได้");
    } finally {
      setLoading(false);
    }
  };

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
        // All: sort so Pending Approval shows first
        filtered = [...posts].sort((a, b) => {
          const getPriority = (status: string | undefined) => {
            switch (status) {
              case "Pending Approval":
                return 1;
              case "Open":
                return 2;
              case "Closed":
                return 3;
              default:
                return 99;
            }
          };
          return (
            getPriority(a.StatusPost?.status_post) -
            getPriority(b.StatusPost?.status_post)
          );
        });
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        (post) =>
          (post.post_name || "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          post.Company?.company_name?.toLowerCase()
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

  const columns: ColumnsType<IntershipPostInterface> = [
    {
      title: "ชื่อตำแหน่ง",
      dataIndex: "post_name",
      key: "post_name",
      width: 280,
      render: (text: any, record: any) => (
        <div
          style={{
            padding: "12px 0",
            cursor: "pointer",
          }}
        >
          {/* ชื่อโพสต์ + ไอคอน */}
          <div
            className="post-title-enhanced"
            style={{
              fontSize: "16px",
              marginBottom: "6px",
              lineHeight: "1.4",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{text}</span>
          </div>

          {/* บริษัท */}
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
            <TeamOutlined className="table-icon-enhanced" style={{ marginRight: "6px" }} />
            {record.Company?.company_name || "ไม่ระบุบริษัท"}
          </div>

          {/* ประเภทงาน */}
          <Tag className="job-type-tag-enhanced">
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
      title: "จำนวนรับสมัคร / เกรด",
      key: "quantity_gpa",
      width: 150,
      align: "center",
      render: (record: IntershipPostInterface) => (
        <div
          style={{
            fontSize: "13px",
            color: "#4c4c4c",
            lineHeight: "1.7",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          {/* จำนวน */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <UserOutlined className="table-icon-enhanced" style={{ fontSize: "13px" }} />
            <span style={{ minWidth: "50px", textAlign: "left" }}>
              {record.quantity || 0} คน
            </span>
          </div>

          {/* GPA */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StarOutlined className="table-icon-enhanced" style={{ fontSize: "13px" }} />
            <span style={{ minWidth: "50px", textAlign: "left" }}>
              GPA{" "}
              {record.min_gpa !== undefined
                ? Number(record.min_gpa).toFixed(1)
                : "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "สถานที่",
      key: "location",
      render: (record: IntershipPostInterface) => {
        const parts = [
          record.location_detail?.trim(),
          record.subdistrict?.trim(),
          record.district?.trim(),
          record.province?.trim(),
        ].filter(Boolean);

        const locationText = parts.length > 0 ? parts.join(", ") : "-";

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
        <div style={{ fontSize: "13px", color: "#4c4c4c", textAlign: "center" }}>
          <div className="applicant-count-enhanced">
            {record.Applications?.length || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>ใบสมัคร</div>
        </div>
      ),
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      align: "center",
      render: (date: any) => (
        <Text style={{ fontSize: "12px", color: "#8c8c8c" }}>
          {date ? new Date(date).toLocaleDateString("th-TH") : "-"}
        </Text>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 160,
      fixed: "right",
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
            className="status-tag-enhanced"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: style.bgColor,
              color: style.textColor,
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
  ];

  return (
    <Layout>
      <style>{enhancedStyles}</style>
      {contextHolder}
      <AdminHeader />
      <Layout className="adminpage-layout" style={{ padding: 16 }}>
        <div style={{ margin: 32, marginTop: 8 }}>
          <AdminSectionHeader
            icon={<FileTextOutlined style={{ fontSize: 32, color: "white" }} />}
            title="การจัดการโพสต์ฝึกงาน"
            subtitle="อนุมัติและปฏิเสธโพสต์ฝึกงานจากบริษัทต่างๆ"
            actions={
              <Space>
                <ExportPostsButton posts={filteredPosts} />
              </Space>
            }
          />

          <Post_StatCard
            statusList={status}
            totalPosts={totalPosts}
            pendingPosts={pendingPosts}
            approvedPosts={approvedPosts}
            rejectedPosts={rejectedPosts}
          />

          {/* Main Content */}
          <Card className="enhanced-main-card">
            {/* Search and Filters */}
            <div style={{ marginBottom: "24px" }}>
              <Row justify="space-between" align="middle">
                <Col xs={24} md={12}>
                  <Input
                    placeholder="ค้นหาตำแหน่งงาน, บริษัท, หรือประเภทงาน..."
                    prefix={<SearchOutlined style={{ color: "rgb(59, 130, 246)" }} />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="enhanced-search-input"
                    size="large"
                  />
                </Col>
              </Row>
            </div>

            {getStatusTabs({ activeTab, onChange: setActiveTab })}

            <Text
              type="secondary"
              style={{ fontSize: "14px", marginTop: "10px", fontWeight: "500" }}
            >
              แสดง {getCurrentTabCount()} รายการ
            </Text>

            <Table
              columns={columns}
              dataSource={filteredPosts}
              rowKey="ID"
              loading={loading}
              className="enhanced-table"
              onRow={(record) => ({
                onClick: (e) => {
                  // กันกรณีคลิกโดนปุ่ม/ลิงก์ภายในเซลล์
                  const target = e.target as HTMLElement;
                  const interactive = target.closest(
                    'a,button,[role="button"],.ant-btn,.ant-switch,.ant-checkbox-input,.ant-radio-input,.ant-select,.ant-input'
                  );
                  if (interactive) return;

                  navigate(`/admin/manage-post/${record.ID}`);
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/admin/manage-post/${record.ID}`);
                  }
                },
                tabIndex: 0,   // โฟกัสด้วยคีย์บอร์ดได้
                role: "navigation",
              })}
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
                borderRadius: "16px",
                overflow: "hidden",
              }}
              rowClassName={(record, index) => {
                const s = record.StatusPost?.status_post;
                let cls = index % 2 === 0 ? "even-row" : "odd-row";
                if (s === "Pending Approval") cls += " pending-highlight";
                return cls + " clickable-row";
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
        </div>
      </Layout>
    </Layout>
  );
};

export default ManagePostsPage;

// Enhanced styles with blue gradient theme and animations
const enhancedStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
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

  @keyframes gradientShift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .adminpost-header-box {
    background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
    animation: fadeInUp 0.8s ease-out;
    box-shadow: 0 20px 40px rgba(30, 58, 138, 0.25);
    background-size: 200% 200%;
    animation: fadeInUp 0.8s ease-out, gradientShift 4s ease infinite;
  }

  .gradient-title-frame {
    position: relative;
  }

  .gradient-title-content {
    border-radius: 12px;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
    z-index: 2;
  }

  .enhanced-icon-container {
    background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%);
    border-radius: 16px;
    padding: 16px;
    animation: slideInLeft 0.8s ease-out 0.3s both;
    border: 1px solid #fff;
    transition: all 0.3s ease;
  }

  .enhanced-icon-container:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5);
  }

  .enhanced-main-card {
    border-radius: 20px;
    border: none;
    background: white;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.08);
    animation: fadeInUp 0.8s ease-out 0.4s both;
    position: relative;
    overflow: hidden;
  }

  .enhanced-search-input {
    border-radius: 12px;
    border: 2px solid transparent;
    background: linear-gradient(white, white) padding-box,
                rgba(239, 236, 236, 1) border-box;
    font-size: 14px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }

  .enhanced-search-input:hover,
  .enhanced-search-input:focus {
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
    transform: translateY(-1px);
  }

  .enhanced-tabs .ant-tabs-tab {
    border-radius: 12px;
    margin-right: 8px;
    transition: all 0.3s ease;
    position: relative;
  }

  .enhanced-tabs .ant-tabs-tab:hover {
    transform: translateY(-2px);
  }

  .enhanced-table .ant-table-thead > tr > th {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
    border-bottom: 2px solid rgba(59, 130, 246, 0.1);
    font-weight: 600;
    color: rgb(30, 58, 138);
    position: relative;
  }

  .enhanced-table .ant-table-tbody > tr {
    transition: all 0.3s ease;
  }

  .enhanced-table .ant-table-tbody > tr:hover > td {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%) !important;
    transform: scale(1.002);
  }

  .enhanced-table .ant-table-tbody > tr.pending-highlight > td {
    position: relative;
  }

  .post-title-enhanced {
    color: rgb(59, 130, 246) !important;
    font-weight: 600;
    transition: all 0.3s ease;
    text-decoration: none;
    position: relative;
  }

  .post-title-enhanced:hover {
    color: rgb(30, 58, 138) !important;
    transform: translateX(4px);
  }

  .status-tag-enhanced {
    border-radius: 20px;
    font-weight: 600;
    font-size: 13px;
    padding: 6px 16px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .status-tag-enhanced:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .job-type-tag-enhanced {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: rgb(30, 58, 138);
    font-size: 11px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .job-type-tag-enhanced:hover {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
    transform: scale(1.05);
  }

  .applicant-count-enhanced {
    font-size: 16px;
    font-weight: 600;
    color: rgb(59, 130, 246);
    margin-bottom: 2px;
    transition: all 0.3s ease;
  }

  .table-icon-enhanced {
    color: rgb(59, 130, 246);
    transition: all 0.3s ease;
  }

  .table-icon-enhanced:hover {
    color: rgb(30, 58, 138);
    transform: scale(1.1);
  }

  /* Animation delays for sequential loading */
  .adminpost-header-box { animation-delay: 0s; }
  .enhanced-main-card { animation-delay: 0.2s; }

  .enhanced-table .ant-table-tbody > tr.clickable-row { cursor: pointer; }
  .enhanced-table .ant-table-tbody > tr.clickable-row:active > td { transform: scale(0.999); }
`;