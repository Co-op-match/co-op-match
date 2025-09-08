import React, { useEffect, useState } from "react";
import {
  Layout,
  Input,
  Select,
  DatePicker,
  Table,
  Button,
  Modal,
  Form,
  TimePicker,
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
  VideoCameraOutlined,
  HomeOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  GetApplicationsByCompanyID,
  CreateInterviewAppointment,
  GetCompanyByUserID,
  UpdateApplicationStatus,
} from "../../../services/https/Application/index";
import { SendEmailinterview } from "../../../services/https";
import CompanyHeader from "../../Component/CompanyHeader";
import "./Appointment.css";

const { Title, Text } = Typography;
const { Header, Content } = Layout; // ⬅️ เพิ่ม Header เข้ามา

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
          (app: any) => app.status === "รอการนัดสัมภาษณ์"
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
          {status === "รอการนัดสัมภาษณ์" ? "รอการนัดสัมภาษณ์" : "นัดสัมภาษณ์แล้ว"}
        </Tag>
      ),
    },
    {
      title: "การจัดการ",
      render: (_: any, record: any) => (
        <Tooltip title="คลิกเพื่อนัดหมายสัมภาษณ์">
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => {
              setSelectedApplicant(record);
              setIsModalOpen(true);
            }}
            disabled={record.status !== "รอการนัดสัมภาษณ์"}
            style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(24, 144, 255, 0.2)" }}
          >
            นัดสัมภาษณ์
          </Button>
        </Tooltip>
      ),
    },
  ];

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!values.date || !values.time) {
        message.error("กรุณาเลือกวันและเวลาสัมภาษณ์");
        return;
      }

      const appointmentDate = dayjs(
        `${values.date.format("YYYY-MM-DD")} ${values.time.format("HH:mm")}`
      ).format();

      const payload = {
        appointment_date: appointmentDate,
        status: "นัดสัมภาษณ์แล้ว",
        mode: values.mode,
        details: values.note || "",
        CompanyID: Number(companyId),
        StudentID: selectedApplicant.StudentID,
      };

      const res = await CreateInterviewAppointment(payload);

      if (res.status === 201) {
        const updateRes = await UpdateApplicationStatus(
          selectedApplicant.ID,
          "นัดสัมภาษณ์แล้ว",
          values.note || ""
        );

        if (updateRes.status === 200 || updateRes.status === 201) {
          await delay(1000);

          const emailRes = await SendEmailinterview(
            selectedApplicant.StudentID,
            Number(companyId)
          );

          if (emailRes.status === 200) {
            message.success("ส่งนัดหมาย อัปเดตสถานะ และส่งอีเมลเรียบร้อยแล้ว");
          } else {
            message.warning("ส่งนัดหมายสำเร็จ และอัปเดตสถานะแล้ว แต่ส่งอีเมลไม่สำเร็จ");
          }

          setIsModalOpen(false);
          form.resetFields();
          setApplications((prev) => prev.filter((app) => app.ID !== selectedApplicant.ID));
        } else {
          message.warning("สร้างนัดหมายสำเร็จ แต่ไม่สามารถอัปเดตสถานะใบสมัครได้");
        }
      } else {
        message.error("เกิดข้อผิดพลาดในการส่งนัดหมาย");
      }
    } catch {
      message.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f8ff" }}>
      {/* ✅ แท็บบาร์/ส่วนหัวของระบบ (ของคุณเอง) */}
      <CompanyHeader />

      {/* ✅ คอนเทนต์เต็มหน้าจอ (full width) */}
      <Content style={{ padding: 0 }}>
        <div
          style={{
            width: "100vw",
            maxWidth: "100vw", // ให้เต็มความกว้างหน้าจอ
            margin: 0,
            padding: 24,
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
                🎯 จัดการการสัมภาษณ์
              </Title>
              <Text style={{ color: "#666", fontSize: 16 }}>จัดการนัดหมายสัมภาษณ์สำหรับผู้สมัครงาน</Text>
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
                  รอนัดสัมภาษณ์
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
                <Text strong style={{ color: "#1976d2" }}>
                  รายชื่อผู้สมัครที่รอการนัดสัมภาษณ์
                </Text>
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

      {/* Interview Modal */}
      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center" }}>
            <CalendarOutlined style={{ marginRight: 8, color: "#1976d2" }} />
            <span style={{ color: "#1976d2" }}>นัดหมายสัมภาษณ์</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={handleModalSubmit}
        okText="📤 ส่งนัดหมาย"
        cancelText="❌ ยกเลิก"
        width={600}
        styles={{ header: { backgroundColor: "#f8f9fa", borderBottom: "1px solid #e3f2fd" }, body: { padding: 24 } }}
        okButtonProps={{ style: { backgroundColor: "#1976d2", borderColor: "#1976d2", borderRadius: 8, fontWeight: 500 } }}
        cancelButtonProps={{ style: { borderRadius: 8, fontWeight: 500 } }}
      >
        {selectedApplicant && (
          <Card
            size="small"
            style={{ backgroundColor: "#f8f9fa", border: "1px solid #e3f2fd", borderRadius: 8, marginBottom: 16 }}
            title={
              <Space>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1976d2" }} />
                <Text strong>ข้อมูลผู้สมัคร</Text>
              </Space>
            }
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <Text type="secondary">ชื่อ-นามสกุล:</Text>
                <Text strong>{selectedApplicant.student_name}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <Text type="secondary">ตำแหน่งที่สมัคร:</Text>
                <Tag color="blue">{selectedApplicant.post_name}</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <Text type="secondary">วันที่สมัคร:</Text>
                <Text>{dayjs(selectedApplicant.submit_at).format("DD/MM/YYYY")}</Text>
              </div>
            </div>
          </Card>
        )}

        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="date"
            label={<Space><CalendarOutlined style={{ color: "#1976d2" }} /><span>วันที่สัมภาษณ์</span></Space>}
            rules={[{ required: true, message: "กรุณาเลือกวันที่สัมภาษณ์" }]}
          >
            <DatePicker
              style={{ width: "100%", borderRadius: 8, border: "1px solid #d9d9d9" }}
              placeholder="เลือกวันที่สัมภาษณ์"
              disabledDate={(current) => current && current < dayjs().startOf("day")}
            />
          </Form.Item>

          <Form.Item
            name="time"
            label={<Space><ClockCircleOutlined style={{ color: "#1976d2" }} /><span>เวลาสัมภาษณ์</span></Space>}
            rules={[{ required: true, message: "กรุณาเลือกเวลา" }]}
          >
            <TimePicker format="HH:mm" style={{ width: "100%", borderRadius: 8, border: "1px solid #d9d9d9" }} placeholder="เลือกเวลาสัมภาษณ์" />
          </Form.Item>

          <Form.Item
            name="mode"
            label={<Space><VideoCameraOutlined style={{ color: "#1976d2" }} /><span>รูปแบบการสัมภาษณ์</span></Space>}
            rules={[{ required: true, message: "กรุณาเลือกรูปแบบการสัมภาษณ์" }]}
          >
            <Select
              style={{ width: "100%", borderRadius: 8 }}
              placeholder="เลือกรูปแบบการสัมภาษณ์"
              options={[
                { label: <Space><VideoCameraOutlined /><span>ออนไลน์ (Video Call)</span></Space>, value: "ออนไลน์" },
                { label: <Space><HomeOutlined /><span>ออนไซต์ (ที่บริษัท)</span></Space>, value: "ออนไซต์" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="note"
            label={<Space><EditOutlined style={{ color: "#1976d2" }} /><span>หมายเหตุเพิ่มเติม</span></Space>}
          >
            <Input.TextArea
              placeholder="เช่น กรุณาเตรียม portfolio, ใส่ชุดสุภาพ, หรือข้อมูลสำคัญอื่นๆ..."
              rows={4}
              style={{ borderRadius: 8, border: "1px solid #d9d9d9", resize: "vertical" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default InterviewDashboard;
