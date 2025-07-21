// frontend/pages/AdminPostManagement.tsx
import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Input,
  Segmented,
  message,
  Layout,
  Typography,
  Badge,
  Row,
  Col,
  Card,
  Modal,
  Space,
} from "antd";
import axios from "axios";
import AdminHeader from "../../Component/AdminHeader";
import { GetAllIntershipPostsAllStatus } from "../../../services/https";
import { GetPostById } from "../../../services/https/post";

const { Search } = Input;
const { Title, Text, Paragraph } = Typography;

const AdminPostManagement = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [originalPosts, setOriginalPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState("ทั้งหมด");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await GetAllIntershipPostsAllStatus();
      if (Array.isArray(res.data)) {
        setPosts(res.data);
        setOriginalPosts(res.data);
      }
    } catch (err) {
      message.error("ไม่สามารถโหลดข้อมูลโพสต์ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const approvePost = async (id: number) => {
    const res = await GetPostById(id);
    if (res?.data) {
      setSelectedPost(res.data);
      setModalVisible(true);
    }
  };

  const confirmApprove = async () => {
    await axios.put(`/admin/posts/${selectedPost.id}/approve`);
    message.success("อนุมัติโพสต์แล้ว");
    setModalVisible(false);
    fetchPosts();
  };

  const confirmReject = async () => {
    await axios.put(`/admin/posts/${selectedPost.id}/reject`);
    message.success("ไม่อนุมัติโพสต์แล้ว");
    setModalVisible(false);
    fetchPosts();
  };

  const filteredPosts = Array.isArray(posts)
    ? posts
        .filter((p) => {
          if (filter === "ทั้งหมด") return true;
          if (filter === "รออนุมัติ")
            return p.StatusPost?.status_post === "Pending Approval";
          if (filter === "อนุมัติ") return p.StatusPost?.status_post === "Open";
          if (filter === "ไม่อนุมัติ")
            return p.StatusPost?.status_post === "Reject";
          return false;
        })
        .sort((a, b) => {
          const statusA = a.StatusPost?.status_post;
          const statusB = b.StatusPost?.status_post;
          if (statusA === "Pending Approval" && statusB !== "Pending Approval")
            return -1;
          if (statusA !== "Pending Approval" && statusB === "Pending Approval")
            return 1;
          return 0;
        })
    : [];

  return (
    <Layout style={{ minHeight: "100vh", background: "#eaf6ff" }}>
      <AdminHeader />
      <Layout style={{ padding: "2rem" }}>
        <Card style={{ padding: 24, borderRadius: 16 }}>
          <Title level={2}>การจัดการโพสต์</Title>

          <Row align="middle" justify="space-between" style={{ marginBottom: 24 }}>
            <Col>
              <Segmented
                options={["ทั้งหมด", "รออนุมัติ", "อนุมัติ", "ไม่อนุมัติ"]}
                value={filter}
                onChange={(val) => setFilter(val as string)}
              />
            </Col>
            <Col>
              <Search
                placeholder="ค้นหาชื่อโพสต์/บริษัท"
                onSearch={(val) => {
                  const q = val.toLowerCase();
                  const filtered = originalPosts.filter(
                    (p) =>
                      p.post_name.toLowerCase().includes(q) ||
                      p.Company?.company_name?.toLowerCase().includes(q)
                  );
                  setPosts(filtered);
                }}
                style={{ width: 300 }}
                allowClear
              />
            </Col>
            <Col>
              <Badge
                count={filteredPosts.length}
                style={{ backgroundColor: "#000", fontSize: 16 }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    padding: "4px 16px",
                    background: "white",
                    borderRadius: 12,
                  }}
                >
                  จำนวน
                </div>
              </Badge>
            </Col>
          </Row>

          <Table
            dataSource={filteredPosts}
            rowKey={(record) => record.id}
            pagination={{ pageSize: 6 }}
            loading={loading}
            scroll={{ x: true }}
            columns={[
              {
                title: "ชื่อโพสต์",
                dataIndex: "post_name",
              },
              {
                title: "บริษัท",
                dataIndex: ["Company", "company_name"],
              },
              {
                title: "วันที่ส่ง",
                dataIndex: "created_at",
                render: (date: string) => new Date(date).toLocaleDateString(),
              },
              {
                title: "สถานะ",
                dataIndex: ["StatusPost", "status_post"],
                render: (status: string) => {
                  if (!status) return <Tag color="default">ไม่ทราบ</Tag>;
                  let label = status;
                  if (status === "Open") label = "อนุมัติแล้ว";
                  if (status === "Pending Approval") label = "รอตรวจสอบ";
                  if (status === "Reject") label = "ไม่อนุมัติ";
                  if (status === "Closed") label = "ปิดรับสมัคร";
                  return <span style={{ fontWeight: 500 }}>{label}</span>;
                },
              },
              {
                title: "การจัดการ",
                fixed: "right" as const,
                align: "center" as const,
                render: (_: any, record: any) => (
                  <Button
                    style={{
                      backgroundColor: "#f0f0f0",
                      color: "#000",
                      fontWeight: 500,
                    }}
                    onClick={() => approvePost(record.id)}
                    icon={<span>⏳</span>}
                  >
                    รออนุมัติ
                  </Button>
                ),
              },
            ]}
          />

          <Modal
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={
              <Space>
                <Button onClick={confirmReject} danger>
                  ไม่อนุมัติ
                </Button>
                <Button type="primary" onClick={confirmApprove}>
                  อนุมัติ
                </Button>
              </Space>
            }
            title="รายละเอียดโพสต์ก่อนอนุมัติ"
            width={800}
          >
            {selectedPost && (
              <div>
                <Title level={4}>{selectedPost.post_name}</Title>
                <Paragraph>{selectedPost.post_description}</Paragraph>
                <Text strong>จำนวน:</Text> {selectedPost.quantity} ตำแหน่ง
                <br />
                <Text strong>สถานที่:</Text>{" "}
                {[
                  selectedPost.location_detail,
                  selectedPost.subdistrict,
                  selectedPost.district,
                  selectedPost.province,
                ]
                  .filter(Boolean)
                  .join(" / ")}
                <br />
                <Text strong>คุณสมบัติ:</Text>{" "}
                {selectedPost.company_required_skills
                  ?.map((s: any) => s?.Skill?.skill_name)
                  .join(", ")}
                <br />
                <Text strong>Work Day:</Text> {selectedPost.WorkDay?.work_day}
                <br />
                <Text strong>Work Mode:</Text>{" "}
                {selectedPost.WorkMode?.work_mode}
                <br />
                <Text strong>ค่าตอบแทน:</Text> {selectedPost.Stipend?.stipend}
                <br />
                <Text strong>สิทธิประโยชน์:</Text>{" "}
                {selectedPost.Benefit?.benefit_name}
                <br />
              </div>
            )}
          </Modal>
        </Card>
      </Layout>
    </Layout>
  );
};

export default AdminPostManagement;