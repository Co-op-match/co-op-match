import React, { useEffect, useState } from "react";
import {
  Layout,
  Input,
  Select,
  Table,
  Button,
  Modal,
  Form,
  message,
  Card,
  Tag,
  Space,
  Typography,
  Avatar,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  GetApplicationsByCompanyID,
  GetCompanyByUserID,
  UpdateApplicationStatus,
  UpdateInterviewAppointmentStatus,
} from "../../../services/https/Application/index";
import { SendEmailinterview } from "../../../services/https";
import CompanyHeader from "../../Component/CompanyHeader";
import { CoopMatchLoader } from '../../../components/loaders';

const { Title, Text } = Typography;
const { Content } = Layout;

const InterviewDashboard: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      const userId = Number(localStorage.getItem("id"));
      if (!userId) {
        setLoading(false);
        return;
      }

      const company = await GetCompanyByUserID(userId);
      if (!company || !company.ID) {
        setLoading(false);
        return;
      }

      const cid = company.ID;
      setCompanyId(cid);

      const res = await GetApplicationsByCompanyID(cid);
      if (res.status === 200 && Array.isArray(res.data.data)) {
        const filtered = res.data.data.filter(
          (app: any) => app.status === "นัดสัมภาษณ์แล้ว"
        );

        const appsWithKey = filtered.map((app: any) => ({
          ...app,
          key: app.ID,
          student_id: app.StudentID,
          student_name: `${app.Student?.first_name || "-"} ${app.Student?.last_name || ""}`,
          post_name: app.IntershipPost?.post_name || "-",
        }));

        setApplications(appsWithKey);
      } else {
        message.error("ไม่สามารถโหลดข้อมูลผู้สมัครได้");
      }
      setLoading(false);
    };

    fetchApplications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "รอการนัดสัมภาษณ์":
        return "#1890ff";
      case "นัดสัมภาษณ์แล้ว":
        return "#52c41a";
      default:
        return "#d9d9d9";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "รอการนัดสัมภาษณ์":
        return <ClockCircleOutlined />;
      case "นัดสัมภาษณ์แล้ว":
        return <CheckCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const columns = [
    {
      title: "ผู้สมัคร",
      dataIndex: "student_name",
      key: "student_name",
      render: (name: string) => (
        <Space>
          <Avatar size="large" icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
          <div>
            <Text strong style={{ color: "#1976d2" }}>{name}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "ตำแหน่งที่สมัคร",
      dataIndex: "post_name",
      key: "post_name",
      render: (position: string) => (
        <Tag color="blue" style={{ fontSize: "13px", padding: "4px 12px" }}>
          {position}
        </Tag>
      ),
    },
    {
      title: "วันที่สมัคร",
      dataIndex: "submit_at",
      key: "submit_at",
      render: (date: string) => (
        <Space>
          <CalendarOutlined style={{ color: "#1890ff" }} />
          <Text>{dayjs(date).format("DD/MM/YYYY")}</Text>
        </Space>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          icon={getStatusIcon(status)}
          color={getStatusColor(status)}
          style={{ fontSize: "12px", padding: "4px 8px" }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "การจัดการ",
      render: (_: any, record: any) => (
        <Tooltip title="คลิกเพื่อยืนยันการสัมภาษณ์">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedApplicant(record);
              setIsModalOpen(true);
            }}
            disabled={record.status !== "นัดสัมภาษณ์แล้ว"}
          >
            เปลี่ยนสถานะ
          </Button>
        </Tooltip>
      ),
    },
  ];

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newStatus = values.status;
      const note = values.note || "";

      const res = await UpdateApplicationStatus(selectedApplicant.ID, newStatus, note);

      if (res.status === 200 || res.status === 201) {
        const updateInterviewRes = await UpdateInterviewAppointmentStatus(
          selectedApplicant.StudentID,
          Number(companyId),
          newStatus
        );
        if (updateInterviewRes.status !== 200 && updateInterviewRes.status !== 201) {
          message.warning("อัปเดตสถานะในตาราง interview_appointments ไม่สำเร็จ");
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const emailRes = await SendEmailinterview(selectedApplicant.StudentID, Number(companyId));
        if (emailRes.status === 200) {
          message.success("อัปเดตสถานะและส่งอีเมลเรียบร้อยแล้ว");
        } else {
          message.warning("อัปเดตสถานะแล้ว แต่ส่งอีเมลไม่สำเร็จ");
        }

        setApplications((prev) => prev.filter((app) => app.ID !== selectedApplicant.ID));
        setIsModalOpen(false);
        form.resetFields();
      } else {
        message.error("ไม่สามารถอัปเดตสถานะใบสมัครได้");
      }
    } catch {
      message.error("กรุณาเลือกสถานะ");
    }
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#f0f8ff" }}>
        <CompanyHeader />
        <CoopMatchLoader 
          size="lg" 
          overlay={true}
          showText={true}
          text="กำลังโหลดข้อมูลการนัดสัมภาษณ์..."
        />
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f8ff" }}>
      {/* ✅ แท็บบาร์/ส่วนหัวระบบ */}
      <CompanyHeader />

      {/* ✅ จัดวางเต็มหน้าจอ ชิดซ้ายขวาพอดี เหมือนหน้าตัวอย่าง */}
      <Content style={{ padding: 0 }}>
        <div
          style={{
            width: "100vw",
            maxWidth: "100vw",
            margin: 0,
            padding: 24,              // ← เว้นขอบด้านในเหมือนหน้าแรก
            boxSizing: "border-box",
          }}
        >
          {/* Header Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              padding: 20,
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e3f2fd",
            }}
          >
            <div>
              <Title level={2} style={{ color: "#1976d2", marginBottom: 4, fontSize: 28, fontWeight: 600 }}>
                ยืนยันการนัดสัมภาษณ์
              </Title>
              <Text style={{ color: "#666", fontSize: 16 }}>รายชื่อผู้รอการผลการสัมภาษณ์</Text>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                padding: 20,
                borderRadius: 12,
                textAlign: "center",
                minWidth: 120,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Text style={{ fontSize: 32, fontWeight: 700, color: "#1976d2", lineHeight: 1 }}>
                  {applications.length}
                </Text>
                <Text style={{ fontSize: 14, color: "#1976d2", fontWeight: 500, marginTop: 4 }}>
                  รอการผลการสัมภาษณ์
                </Text>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <Card
            style={{ borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,.08)", border: "1px solid #e3f2fd" }}
            title={
              <Space>
                <UserOutlined style={{ color: "#1976d2" }} />
                <Text strong style={{ color: "#1976d2" }}>รายชื่อผู้สมัครที่นัดสัมภาษณ์แล้ว</Text>
              </Space>
            }
            extra={<Tag color="processing" style={{ fontSize: 12 }}>{applications.length} รายการ</Tag>}
          >
            <Table
              dataSource={applications}
              columns={columns}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              }}
              style={{ borderRadius: 8, overflow: "hidden" }}
              rowClassName="table-row"
            />
          </Card>
        </div>
      </Content>

      {/* Modal */}
      <Modal
        title="เปลี่ยนสถานะการสัมภาษณ์"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={handleModalSubmit}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={500}
      >
        {selectedApplicant && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <p><strong>ชื่อผู้สมัคร:</strong> {selectedApplicant.student_name}</p>
            <p><strong>ตำแหน่ง:</strong> {selectedApplicant.post_name}</p>
          </Card>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="กรุณาเลือกสถานะใหม่"
            rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
          >
            <Select placeholder="เลือกสถานะ">
              <Select.Option value="ผ่าน">✅ ผ่านการสัมภาษณ์</Select.Option>
              <Select.Option value="ไม่ผ่าน">❌ ไม่ผ่านการสัมภาษณ์</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label="หมายเหตุเพิ่มเติม (ไม่บังคับ)">
            <Input.TextArea rows={4} placeholder="เช่น คะแนนสัมภาษณ์ไม่ถึงเกณฑ์ หรือไม่ตรงตามคุณสมบัติ ฯลฯ" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default InterviewDashboard;
