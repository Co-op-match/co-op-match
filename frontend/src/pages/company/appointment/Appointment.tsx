import React, { useEffect, useState } from "react";
import {
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

const { Title, Text } = Typography;

const InterviewDashboard: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [companyId, setCompanyId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = Number(localStorage.getItem("id"));
        if (!userId) {
            console.warn("❌ ไม่พบ user_id ใน localStorage");
            return;
        }
    
        const fetchCompanyId = async () => {
            try {
                const res = await GetCompanyByUserID(userId);
                if (res && res.ID) {
                    setCompanyId(res.ID);
                    console.log("✅ ดึง company_id สำเร็จ:", res.ID);
                } else {
                    console.warn("❌ ไม่พบข้อมูลบริษัทสำหรับ user_id นี้");
                }
            } catch (error) {
                console.error("❌ ดึง company_id ล้มเหลว:", error);
            }
        };
    
        fetchCompanyId();
    }, []);

    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true);
            const userId = Number(localStorage.getItem("id"));
            if (!userId) {
                console.warn("❌ ไม่พบ user_id ใน localStorage");
                setLoading(false);
                return;
            }
    
            const company = await GetCompanyByUserID(userId);
            if (!company || !company.ID) {
                console.warn("❌ ไม่พบ company จาก user_id นี้");
                setLoading(false);
                return;
            }
    
            const companyId = company.ID;
            console.log("📦 ดึงใบสมัครของบริษัท ID:", companyId);
    
            const res = await GetApplicationsByCompanyID(userId);
            if (res.status === 200 && Array.isArray(res.data.data)) {
                const filtered = res.data.data.filter(
                    (app: any) => app.status === "รอการนัดสัมภาษณ์"
                );
                
                const appsWithKey = filtered.map((app: any) => {
                    console.log("📍 app จาก backend:", app);
                
                    return {
                        ...app,
                        key: app.ID,
                        student_id: app.StudentID,
                        student_name: `${app.Student?.first_name || "-"} ${app.Student?.last_name || ""}`,
                        post_name: app.IntershipPost?.post_name || "-",
                    };
                });
    
                setApplications(appsWithKey);
                console.log("📦 applications:", appsWithKey);
                
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
                    <Avatar 
                        size="large" 
                        icon={<UserOutlined />} 
                        style={{ backgroundColor: '#1890ff' }}
                    />
                    <div>
                        <Text strong style={{ color: '#1976d2' }}>{name}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: "ตำแหน่งที่สมัคร",
            dataIndex: "post_name",
            key: "post_name",
            render: (position: string) => (
                <Tag color="blue" style={{ fontSize: '13px', padding: '4px 12px' }}>
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
                    <CalendarOutlined style={{ color: '#1890ff' }} />
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
                    style={{ fontSize: '12px', padding: '4px 8px' }}
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
                        style={{
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
                        }}
                    >
                        นัดสัมภาษณ์
                    </Button>
                </Tooltip>
            ),
        },
    ];

    const handleModalSubmit = async () => {
        try {
            const values = await form.validateFields();
            const datetime = dayjs(values.date)
                .set("hour", values.time.hour())
                .set("minute", values.time.minute());
    
            const payload = {
                AppointmentDate: datetime.toISOString(),
                Status: "นัดสัมภาษณ์แล้ว",
                Mode: values.mode,
                Details: values.note || "",
                CompanyID: Number(companyId),
                StudentID: selectedApplicant.StudentID,
            };
    
            const res = await CreateInterviewAppointment(payload);
    
            if (res.status === 201) {
                const updateRes = await UpdateApplicationStatus(selectedApplicant.ID, "นัดสัมภาษณ์แล้ว");
    
                if (updateRes.status === 200 || updateRes.status === 201) {
                    // ✅ เรียกส่งอีเมล
                    const emailRes = await SendEmailinterview(selectedApplicant.StudentID);
    
                    if (emailRes.status === 200) {
                        message.success("ส่งนัดหมาย อัปเดตสถานะ และส่งอีเมลเรียบร้อยแล้ว");
                    } else {
                        message.warning("ส่งนัดหมายสำเร็จ และอัปเดตสถานะแล้ว แต่ส่งอีเมลไม่สำเร็จ");
                    }
    
                    setIsModalOpen(false);
                    form.resetFields();
    
                    setApplications(prev =>
                        prev.filter(app => app.ID !== selectedApplicant.ID)
                    );
                } else {
                    message.warning("สร้างนัดหมายสำเร็จ แต่ไม่สามารถอัปเดตสถานะใบสมัครได้");
                }
            } else {
                message.error("เกิดข้อผิดพลาดในการส่งนัดหมาย");
            }
        } catch (error) {
            message.error("กรุณากรอกข้อมูลให้ครบถ้วน");
        }
    };

    return (
        <div style={containerStyle}>
            {/* Header Section */}
            <div style={headerStyle}>
                <div>
                    <Title level={2} style={titleStyle}>
                        🎯 จัดการการสัมภาษณ์
                    </Title>
                    <Text style={subtitleStyle}>
                        จัดการนัดหมายสัมภาษณ์สำหรับผู้สมัครงาน
                    </Text>
                </div>
                <div style={statsCardStyle}>
                    <div style={statItemStyle}>
                        <Text style={statNumberStyle}>{applications.length}</Text>
                        <Text style={statLabelStyle}>รอนัดสัมภาษณ์</Text>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <Card 
                style={tableCardStyle}
                title={
                    <Space>
                        <UserOutlined style={{ color: '#1976d2' }} />
                        <Text strong style={{ color: '#1976d2' }}>
                            รายชื่อผู้สมัครที่รอการนัดสัมภาษณ์
                        </Text>
                    </Space>
                }
                extra={
                    <Tag color="processing" style={{ fontSize: '12px' }}>
                        {applications.length} รายการ
                    </Tag>
                }
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
                    style={tableStyle}
                    rowClassName="table-row"
                />
            </Card>

            {/* Interview Modal */}
            <Modal
                title={
                    <div style={modalHeaderStyle}>
                        <CalendarOutlined style={{ marginRight: 8, color: '#1976d2' }} />
                        <span style={{ color: '#1976d2' }}>นัดหมายสัมภาษณ์</span>
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
                styles={{
                    header: { backgroundColor: '#f8f9fa', borderBottom: '1px solid #e3f2fd' },
                    body: { padding: '24px' },
                }}
                okButtonProps={{
                    style: {
                        backgroundColor: '#1976d2',
                        borderColor: '#1976d2',
                        borderRadius: '8px',
                        fontWeight: '500',
                    }
                }}
                cancelButtonProps={{
                    style: {
                        borderRadius: '8px',
                        fontWeight: '500',
                    }
                }}
            >
                {selectedApplicant && (
                    <Card
                        size="small"
                        style={applicantInfoStyle}
                        title={
                            <Space>
                                <Avatar 
                                    icon={<UserOutlined />} 
                                    style={{ backgroundColor: '#1976d2' }}
                                />
                                <Text strong>ข้อมูลผู้สมัคร</Text>
                            </Space>
                        }
                    >
                        <div style={infoGridStyle}>
                            <div style={infoItemStyle}>
                                <Text type="secondary">ชื่อ-นามสกุล:</Text>
                                <Text strong>{selectedApplicant.student_name}</Text>
                            </div>
                            <div style={infoItemStyle}>
                                <Text type="secondary">ตำแหน่งที่สมัคร:</Text>
                                <Tag color="blue">{selectedApplicant.post_name}</Tag>
                            </div>
                            <div style={infoItemStyle}>
                                <Text type="secondary">วันที่สมัคร:</Text>
                                <Text>{dayjs(selectedApplicant.submit_at).format("DD/MM/YYYY")}</Text>
                            </div>
                        </div>
                    </Card>
                )}

                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="date"
                        label={
                            <Space>
                                <CalendarOutlined style={{ color: '#1976d2' }} />
                                <span>วันที่สัมภาษณ์</span>
                            </Space>
                        }
                        rules={[{ required: true, message: "กรุณาเลือกวันที่สัมภาษณ์" }]}
                    >
                        <DatePicker 
                            style={inputStyle} 
                            placeholder="เลือกวันที่สัมภาษณ์"
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="time"
                        label={
                            <Space>
                                <ClockCircleOutlined style={{ color: '#1976d2' }} />
                                <span>เวลาสัมภาษณ์</span>
                            </Space>
                        }
                        rules={[{ required: true, message: "กรุณาเลือกเวลา" }]}
                    >
                        <TimePicker 
                            format="HH:mm" 
                            style={inputStyle} 
                            placeholder="เลือกเวลาสัมภาษณ์"
                        />
                    </Form.Item>

                    <Form.Item 
                        name="mode" 
                        label={
                            <Space>
                                <VideoCameraOutlined style={{ color: '#1976d2' }} />
                                <span>รูปแบบการสัมภาษณ์</span>
                            </Space>
                        }
                        rules={[{ required: true, message: "กรุณาเลือกรูปแบบการสัมภาษณ์" }]}
                    >
                        <Select
                            style={inputStyle}
                            placeholder="เลือกรูปแบบการสัมภาษณ์"
                            options={[
                                { 
                                    label: (
                                        <Space>
                                            <VideoCameraOutlined />
                                            <span>ออนไลน์ (Video Call)</span>
                                        </Space>
                                    ), 
                                    value: "ออนไลน์" 
                                },
                                { 
                                    label: (
                                        <Space>
                                            <HomeOutlined />
                                            <span>ออนไซต์ (ที่บริษัท)</span>
                                        </Space>
                                    ), 
                                    value: "ออนไซต์" 
                                },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item 
                        name="note" 
                        label={
                            <Space>
                                <EditOutlined style={{ color: '#1976d2' }} />
                                <span>หมายเหตุเพิ่มเติม</span>
                            </Space>
                        }
                    >
                        <Input.TextArea 
                            placeholder="เช่น กรุณาเตรียม portfolio, ใส่ชุดสุภาพ, หรือข้อมูลสำคัญอื่นๆ..."
                            rows={4}
                            style={textareaStyle}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <style jsx>{`
                .table-row:hover {
                    background-color: #f8f9fa !important;
                    transition: background-color 0.2s ease;
                }
                
                .ant-table-thead > tr > th {
                    background-color: #e3f2fd !important;
                    color: #1976d2 !important;
                    font-weight: 600 !important;
                    border-bottom: 2px solid #bbdefb !important;
                }
                
                .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f0f0f0 !important;
                }
                
                .ant-btn-primary {
                    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2) !important;
                }
                
                .ant-btn-primary:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3) !important;
                }
            `}</style>
        </div>
    );
};

// Enhanced Styles
const containerStyle: React.CSSProperties = {
    background: '#f0f8ff',
    minHeight: '100vh',
    padding: '24px',
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '20px',
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e3f2fd',
};

const titleStyle: React.CSSProperties = {
    color: '#1976d2',
    marginBottom: '4px',
    fontSize: '28px',
    fontWeight: '600',
};

const subtitleStyle: React.CSSProperties = {
    color: '#666',
    fontSize: '16px',
};

const statsCardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    minWidth: '120px',
};

const statItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
};

const statNumberStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1976d2',
    lineHeight: '1',
};

const statLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#1976d2',
    fontWeight: '500',
    marginTop: '4px',
};

const tableCardStyle: React.CSSProperties = {
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e3f2fd',
};

const tableStyle: React.CSSProperties = {
    borderRadius: '8px',
    overflow: 'hidden',
};

const modalHeaderStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
};

const applicantInfoStyle: React.CSSProperties = {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e3f2fd',
    borderRadius: '8px',
    marginBottom: '16px',
};

const infoGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
};

const infoItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #d9d9d9',
};

const textareaStyle: React.CSSProperties = {
    borderRadius: '8px',
    border: '1px solid #d9d9d9',
    resize: 'vertical',
};

export default InterviewDashboard;