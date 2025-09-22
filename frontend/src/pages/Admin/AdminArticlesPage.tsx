import { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Row,
  Col,
  Typography,
  Tooltip,
  Divider,
  Statistic,
} from "antd";
import { CoopMatchLoader } from "../../components/loaders";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UserOutlined,
  TagOutlined,
  BookOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  EditFilled,
  PlusCircleFilled,
  DashboardOutlined,
  FileSearchOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import type { Article } from "../../interfaces/Article";
import {
  ListArticles,
  CreateArticle,
  UpdateArticle,
  DeleteArticle,
} from "../../services/https/Articles";
import AdminHeader from "./../Component/AdminCoopMatchHeaderDefault";
import type { ColumnsType } from "antd/es/table";

const { Content } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;

function AdminArticlesPage() {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [saving] = useState(false);

  const [items, setItems] = useState<Article[]>([]);
  const [filterType, setFilterType] = useState<"news" | "career" | undefined>();
  const [search, setSearch] = useState<string>("");
  const [onlyPublished, setOnlyPublished] = useState<boolean | undefined>(
    undefined
  );

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form] = Form.useForm();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const openArticleDetail = (a: Article) => { setSelectedArticle(a); setDetailOpen(true); };
  const closeArticleDetail = () => { setDetailOpen(false); setSelectedArticle(null); };
  /* =========================
   * Data Fetching
   * ========================= */
  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await ListArticles({
        type: filterType,
        q: search || undefined,
        is_published: onlyPublished,
      });

      const getTs = (x: any) =>
        new Date(
          x?.UpdatedAt || x?.updated_at || x?.CreatedAt || x?.created_at || 0
        ).getTime();

      const sorted = [...res.data].sort((a: any, b: any) => {
        const tb = getTs(b) - getTs(a);
        // ถ้าเวลาเท่ากัน ให้ ID มากกว่าอยู่บน (กันกรณีเวลาซ้ำ)
        return tb !== 0 ? tb : (b?.ID || 0) - (a?.ID || 0);
        // หมายเหตุ: คงตรรกะเดิมทุกจุด
      });

      setItems(sorted);
    } catch (e: any) {
      messageApi.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType, search, onlyPublished]);

  /* =========================
   * Handlers
   * ========================= */
  const handleCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpenModal(true);
  };

  const handleEdit = (row: Article) => {
    setEditing(row);
    form.setFieldsValue({
      title: row.title,
      subtitle: row.subtitle,
      body: row.body,
      category: row.category,
      type: row.type?.toLowerCase(),
      is_published: Boolean(row.is_published),
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    form.resetFields();
    setOpenModal(false);
  };

  const onSubmit = async () => {
    try {
      const v = await form.validateFields();

      const fd = new FormData();
      fd.append("title", v.title);
      if (v.subtitle) fd.append("subtitle", v.subtitle);
      if (v.body) fd.append("body", v.body);
      if (v.category) fd.append("category", v.category);
      fd.append("type", v.type);
      fd.append("media_type", v.media_type);
      fd.append("is_published", v.is_published ? "true" : "false");

      const fileList = form.getFieldValue("cover_image") as any[];
      if (fileList && fileList.length > 0 && fileList[0]?.originFileObj) {
        fd.append("cover_image", fileList[0].originFileObj);
      }

      // Debug log
      const debug: Record<string, any> = {};
      fd.forEach((val, key) => {
        // @ts-ignore
        debug[key] = val instanceof File ? `[File:${val.name}]` : val;
      });
      console.log(
        editing?.ID ? "UPDATE payload:" : "CREATE payload:",
        debug
      );

      if (editing?.ID) {
        const res = await UpdateArticle(editing.ID, fd);
        console.log("UPDATE response:", res?.status, res?.data);

        if (res?.status >= 200 && res?.status < 300) {
          messageApi.success("อัปเดตเรียบร้อย");
        } else {
          messageApi.error(
            `อัปเดตไม่สำเร็จ: ${res?.status || "-"} ${
              res?.data?.error || ""
            }`
          );
          return;
        }
      } else {
        const res = await CreateArticle(fd);
        console.log("CREATE response:", res?.status, res?.data);

        if (res?.status >= 200 && res?.status < 300) {
          messageApi.success(res?.data?.message || "สร้างเรียบร้อย");
        }
      }

      closeModal();
      fetchData();
    } catch (e: any) {
      console.warn("Submit error:", e);
    }
  };

  const handleDelete = async (row: Article) => {
    try {
      if (!row.ID) return;
      await DeleteArticle(row.ID);
      messageApi.success("ลบเรียบร้อย");
      fetchData();
    } catch {
      messageApi.error("ลบไม่สำเร็จ");
    }
  };

  /* =========================
   * Statistics
   * ========================= */
  const statistics = useMemo(() => {
    const total = items.length;
    const published = items.filter((item) => Boolean(item.is_published)).length;
    const news = items.filter((item) => item.type === "news").length;
    const career = items.filter((item) => item.type === "career").length;

    return { total, published, draft: total - published, news, career };
  }, [items]);

  /* =========================
   * Table Columns
   * ========================= */
   const columns: ColumnsType<Article> = [
    {
      title: "หัวข้อ",
      width: 300,
      dataIndex: "title",
      render: (title: string, record: Article) => (
        <div>
          <Text strong style={{ fontSize: 16, color: "#001d66" }}>
            {title}
          </Text>
          {record.subtitle && (
            <div>
              <Text
                type="secondary"
                style={{ fontSize: 13, color: "#64748b" }}
              >
                {record.subtitle}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <Space>
          <TagOutlined style={{ color: "#3b82f6" }} />
          หมวดหมู่
        </Space>
      ),
      width: 175,
      dataIndex: "category",
      render: (category?: string) =>
        category ? (
          <Tag
            style={{
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              color: "#d97706",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {category}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "ประเภท",
      dataIndex: "type",
      width: 175,
      render: (t: string) => {
        const config =
          t === "news"
            ? {
                bg: "#dbeafe",
                text: "ข่าวสาร",
                icon: <FileTextOutlined style={{ color: "#1d4ed8" }} />,
                border: "#93c5fd",
                color: "#1d4ed8",
              }
            : {
                bg: "#ede9fe",
                text: "บทความแนะแนว",
                icon: <UserOutlined style={{ color: "#6d28d9" }} />,
                border: "#c4b5fd",
                color: "#6d28d9",
              };

        return (
          <Tag
            style={{
              background: config.bg,
              border: `1px solid ${config.border}`,
              color: config.color,
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 500,
              padding: "4px 12px",
            }}
            icon={config.icon}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "สถานะ",
      width: 175,
      dataIndex: "is_published",
      render: (b: boolean) => (
        <Tag
          style={{
            background: b ? "#dcfce7" : "#f8fafc",
            border: b ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
            color: b ? "#15803d" : "#64748b",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
            padding: "4px 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: b ? "#16a34a" : "#94a3b8",
              }}
            />
            {b ? "เผยแพร่" : "ร่าง"}
          </div>
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      width: 120,
      render: (_: any, row: Article) => (
        <Space size={4}>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
              style={{
                color: "#1e3a8a",
                borderRadius: 8,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            />
          </Tooltip>

          <Popconfirm
            title="ยืนยันการลบ?"
            description="การกระทำนี้ไม่สามารถย้อนกลับได้"
            onConfirm={(e) => { /* @ts-ignore */ e?.stopPropagation?.(); handleDelete(row); }}
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{
              danger: true,
              type: "primary",
              style: { background: "#dc2626", borderColor: "#b91c1c" },
            }}
            cancelButtonProps={{ style: { borderRadius: 6 } }}
          >
            <Tooltip title="ลบ">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
                style={{
                  borderRadius: 8,
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* =========================
   * Render
   * ========================= */
  return (
    <>
      {contextHolder}
      <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <AdminHeader />

        <Layout className="adminpage-layout">
          {/* Header Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
              borderRadius: "12px",
              padding: "40px 24px 32px",
              margin: "0 24px 24px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: "16px",
                      padding: "16px",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    <FileTextOutlined style={{ fontSize: 36, color: "white" }} />
                  </div>

                  <div>
                    <Title
                      level={2}
                      style={{
                        margin: 0,
                        color: "white",
                        fontSize: 28,
                        fontWeight: 600,
                      }}
                    >
                      จัดการข่าวสารและบทความ
                    </Title>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: 16,
                        marginTop: 8,
                        display: "block",
                      }}
                    >
                      สร้าง แก้ไข และเผยแพร่ข่าวสารหรือบทความได้สะดวกในที่เดียว
                    </Text>
                  </div>
                </div>
              </Col>

              <Col>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  style={{
                    borderRadius: 12,
                    height: 48,
                    paddingLeft: 24,
                    paddingRight: 24,
                    fontWeight: 600,
                    fontSize: 16,
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  เพิ่มรายการใหม่
                </Button>
              </Col>
            </Row>
          </div>

          <Content
            style={{
              padding: "0 24px 24px",
              maxWidth: 1400,
              margin: "0 auto",
              width: "100%",
            }}
          >
            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={6}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: "1px solid #dbeafe",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    background: "white",
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  <Statistic
                    title={
                      <div
                        style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 600 }}
                      >
                        <DashboardOutlined style={{ marginRight: 6 }} />
                        ทั้งหมด
                      </div>
                    }
                    value={statistics.total}
                    valueStyle={{
                      color: "#1e3a8a",
                      fontSize: 28,
                      fontWeight: 700,
                    }}
                  />
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: "1px solid #d1fae5",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    background: "#f0fdf4",
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  <Statistic
                    title={
                      <div
                        style={{ color: "#059669", fontSize: 14, fontWeight: 600 }}
                      >
                        <CheckCircleOutlined style={{ marginRight: 6 }} />
                        เผยแพร่
                      </div>
                    }
                    value={statistics.published}
                    valueStyle={{
                      color: "#059669",
                      fontSize: 28,
                      fontWeight: 700,
                    }}
                  />
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: "1px solid #fed7aa",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    background: "#fffbeb",
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  <Statistic
                    title={
                      <div
                        style={{ color: "#d97706", fontSize: 14, fontWeight: 600 }}
                      >
                        <EditOutlined style={{ marginRight: 6 }} />
                        ฉบับร่าง
                      </div>
                    }
                    value={statistics.draft}
                    valueStyle={{
                      color: "#d97706",
                      fontSize: 28,
                      fontWeight: 700,
                    }}
                  />
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: "1px solid #ddd6fe",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    background: "#faf5ff",
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#7c3aed",
                          fontSize: 14,
                          fontWeight: 500,
                          marginBottom: 4,
                        }}
                      >
                        <ProfileOutlined style={{ marginRight: 6 }} />
                        ประเภท
                      </div>
                      <div
                        style={{ color: "#7c3aed", fontSize: 28, fontWeight: 600 }}
                      >
                        ข่าว: {statistics.news} | แนะแนว: {statistics.career}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* List Card */}
            <Card
              style={{
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                background: "#f8fafc",
              }}
              bodyStyle={{ padding: 0 }}
            >
              {/* Card Header */}
              <div
                style={{
                  padding: "24px 24px 0px",
                  background: "f8fafc",
                  borderRadius: "16px 16px 0 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Title
                      level={3}
                      style={{
                        color: "#001d66",
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 600,
                      }}
                    >
                      <FileSearchOutlined style={{ marginRight: 10 }} />
                      รายการทั้งหมด
                    </Title>
                    <Text
                      style={{
                        color: "#001d66",
                        fontSize: 14,
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      จัดการและควบคุมเนื้อหาของคุณ
                    </Text>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div
                style={{
                  padding: 24,
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <Row gutter={[16, 16]} align="middle">
                  <Col flex="auto">
                    <Space size={12} wrap>
                      <Select
                        allowClear
                        placeholder="เลือกประเภท"
                        style={{ width: 180 }}
                        value={filterType}
                        onChange={(v) => setFilterType(v)}
                        size="large"
                        options={[
                          { label: "📰 ข่าวสาร", value: "news" },
                          { label: "🎓 บทความแนะแนว", value: "career" },
                        ]}
                      />

                      <Select
                        allowClear
                        placeholder="สถานะเผยแพร่"
                        style={{ width: 180 }}
                        size="large"
                        value={
                          onlyPublished === undefined
                            ? undefined
                            : onlyPublished
                            ? "1"
                            : "0"
                        }
                        onChange={(v) =>
                          setOnlyPublished(v === undefined ? undefined : v === "1")
                        }
                        options={[
                          { label: "✅ เผยแพร่", value: "1" },
                          { label: "📝 ฉบับร่าง", value: "0" },
                        ]}
                      />
                    </Space>
                  </Col>

                  <Col>
                    <Input.Search
                      placeholder="ค้นหาชื่อ หัวข้อ หรือหมวดหมู่..."
                      allowClear
                      onSearch={setSearch}
                      size="large"
                      style={{ width: 320 }}
                    />
                  </Col>
                </Row>
              </div>

              {/* Table */}
              <div style={{ padding: 24, paddingTop: 0 }}>
                <style>{`
                  .clickable-row { cursor: pointer; }
                  .clickable-row:hover td { background: #f1f5f9 !important; }
                `}</style>
                <Table<Article>
                  rowKey={(r) => String(r.ID)}
                  loading={loading}
                  columns={columns}
                  dataSource={items}
                  pagination={false}
                  scroll={{ x: 1000 }}
                  onRow={(record) => ({
                    onClick: () => openArticleDetail(record),
                  })}
                  rowClassName={() => "clickable-row"}
                  style={{
                    "& .ant-table": { borderRadius: 8 },
                    "& .ant-table-thead > tr > th": {
                      background: "#f8fafc",
                      borderBottom: "2px solid #e2e8f0",
                      fontWeight: 600,
                      color: "#1e3a8a",
                    },
                    "& .ant-table-tbody > tr:hover > td": {
                      background: "#f1f5f9",
                    },
                  } as any}
                />
              </div>
            </Card>

            {/* Modal */}
            <Modal
              open={openModal}
              onCancel={saving ? undefined : closeModal}
              onOk={onSubmit}
              width={750}
              style={{ top: 20 }}
              bodyStyle={{
                padding: "24px",
                background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              }}
              okText={
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircleOutlined style={{ color: "#ffffff" }} />
                  {editing ? "บันทึกการแก้ไข" : "สร้างรายการใหม่"}
                </span>
              }
              cancelText="ยกเลิก"
              okButtonProps={{
                loading: saving,
                style: {
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  border: "none",
                  fontWeight: 600,
                  height: 38,
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.3s ease",
                },
                onMouseEnter: (e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.background =
                    "linear-gradient(135deg, #2563eb, #1e40af)";
                  target.style.transform = "translateY(-1px)";
                  target.style.boxShadow =
                    "0 6px 16px rgba(59, 130, 246, 0.4)";
                },
                onMouseLeave: (e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.background =
                    "linear-gradient(135deg, #3b82f6, #1d4ed8)";
                  target.style.transform = "translateY(0)";
                  target.style.boxShadow =
                    "0 4px 12px rgba(59, 130, 246, 0.3)";
                },
              }}
              cancelButtonProps={{
                disabled: saving,
                style: {
                  borderRadius: 8,
                  height: 38,
                  borderColor: "#94a3b8",
                  color: "#475569",
                  transition: "all 0.3s ease",
                },
              }}
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#1e3a8a",
                  }}
                >
                  {editing ? (
                    <>
                      <EditFilled
                        style={{ marginRight: 10, color: "#3b82f6" }}
                      />
                      แก้ไขบทความ/ข่าว
                    </>
                  ) : (
                    <>
                      <PlusCircleFilled
                        style={{ marginRight: 10, color: "#3b82f6" }}
                      />
                      เพิ่มบทความ/ข่าวใหม่
                    </>
                  )}
                </div>
              }
            >
              <Divider style={{ margin: "0 0 24px", borderColor: "#cbd5e1" }} />

              <Form layout="vertical" form={form} requiredMark={false}>
                {/* หัวข้อ + ประเภท */}
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      name="title"
                      rules={[{ required: true, message: "กรุณากรอกหัวข้อ" }]}
                      label={
                        <span
                          style={{
                            color: "#1e3a8a",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          <BookOutlined
                            style={{ marginRight: 6, color: "#3b82f6" }}
                          />
                          หัวข้อ
                        </span>
                      }
                    >
                      <Input
                        placeholder="กรอกหัวข้อบทความ"
                        style={{
                          borderRadius: 8,
                          borderColor: "#cbd5e1",
                          height: 40,
                          transition: "all 0.3s ease",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#cbd5e1";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        prefix={<EditOutlined style={{ color: "#1d4ed8" }} />}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="type"
                      rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
                      label={
                        <span
                          style={{
                            color: "#1e3a8a",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          <TagOutlined
                            style={{ marginRight: 6, color: "#3b82f6" }}
                          />
                          ประเภท
                        </span>
                      }
                    >
                      <Select
                        placeholder="เลือกประเภท"
                        size="large"
                        style={{ borderRadius: 8 }}
                        options={[
                          { label: "📰 ข่าวสาร", value: "news" },
                          { label: "🎓 บทความแนะแนว", value: "career" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* คำบรรยาย */}
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      name="subtitle"
                      label={
                        <span
                          style={{
                            color: "#1e3a8a",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          <FileTextOutlined
                            style={{ marginRight: 6, color: "#3b82f6" }}
                          />
                          คำบรรยาย
                        </span>
                      }
                    >
                      <Input
                        placeholder="คำบรรยายสั้นๆ (ไม่บังคับ)"
                        style={{
                          borderRadius: 8,
                          borderColor: "#cbd5e1",
                          height: 40,
                          transition: "all 0.3s ease",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#cbd5e1";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        prefix={<EditOutlined style={{ color: "#1d4ed8" }} />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* หมวดหมู่ + สถานะเผยแพร่ */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="category"
                      label={
                        <span
                          style={{
                            color: "#1e3a8a",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          <GlobalOutlined
                            style={{ marginRight: 6, color: "#3b82f6" }}
                          />
                          หมวดหมู่
                        </span>
                      }
                    >
                      <Input
                        placeholder="เช่น ประกาศ, กิจกรรม, การสัมภาษณ์งาน"
                        style={{
                          borderRadius: 8,
                          borderColor: "#cbd5e1",
                          height: 40,
                          transition: "all 0.3s ease",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#cbd5e1";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        prefix={<TagOutlined style={{ color: "#1d4ed8" }} />}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      name="is_published"
                      valuePropName="checked"
                      initialValue={false}
                      label={
                        <span
                          style={{
                            color: "#1e3a8a",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          <CheckCircleOutlined
                            style={{ marginRight: 6, color: "#3b82f6" }}
                          />
                          สถานะเผยแพร่
                        </span>
                      }
                    >
                      <Switch
                        size="default"
                        checkedChildren="เผยแพร่"
                        unCheckedChildren="ร่าง"
                        style={{ background: "#3b82f6" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* เนื้อหา */}
                <Form.Item
                  name="body"
                  label={
                    <span
                      style={{ color: "#1e3a8a", fontWeight: 600, fontSize: 14 }}
                    >
                      <FileTextOutlined
                        style={{ marginRight: 6, color: "#3b82f6" }}
                      />
                      เนื้อหา
                    </span>
                  }
                >
                  <TextArea
                    rows={6}
                    placeholder="กรอกรายละเอียดเนื้อหา"
                    style={{
                      resize: "vertical",
                      borderRadius: 8,
                      borderColor: "#cbd5e1",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </Form.Item>
              </Form>
            </Modal>
            {/* 🧩 Modal วางท้ายสุดของ Content */}
            <Modal
              open={detailOpen}
              onCancel={closeArticleDetail}
              footer={null}
              width={600}
              centered
              style={{ padding: 0 }}
              closable={false}
            >
              {selectedArticle && (
                <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      position: 'relative',
                      height: 120,
                      background:
                        selectedArticle.type === 'news'
                          ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                          : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 24px',
                      color: '#fff',
                    }}
                  >
                    {/* Icon & Type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 32 }}>{selectedArticle.type === 'news' ? '📰' : '📚'}</div>
                      <div>
                        <div style={{ fontSize: 14, opacity: 0.8 }}>
                          {selectedArticle.type === 'news' ? 'ข่าวสาร' : 'บทความ'}
                        </div>
                        {selectedArticle.category && (
                          <div style={{ fontSize: 12, opacity: 0.7 }}>{selectedArticle.category}</div>
                        )}
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={closeArticleDetail}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 18,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 10px rgba(0,0,0,0.25)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.35)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)';
                      }}
                      onMouseDown={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px) scale(0.9)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                      }}
                      onMouseUp={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 10px rgba(0,0,0,0.25)';
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <div style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px 0', color: '#1f2937', lineHeight: 1.3 }}>
                      {selectedArticle.title}
                    </h3>

                    {selectedArticle.published_at && (
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📅</span>
                        {new Date(selectedArticle.published_at).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}

                    {/* Subtitle */}
                    {selectedArticle.subtitle && (
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '16px',
                          borderRadius: 8,
                          marginBottom: 16,
                          borderLeft: `3px solid ${selectedArticle.type === 'news' ? '#3b82f6' : '#7c3aed'}`,
                          fontSize: 15,
                          color: '#475569',
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                        }}
                      >
                        {selectedArticle.subtitle}
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 20 }}>
                      {selectedArticle.body ? (
                        <div style={{ fontSize: 15, lineHeight: 1.6, color: '#374151', whiteSpace: 'pre-wrap' }}>
                          {selectedArticle.body}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: 14 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                          ไม่มีเนื้อหา
                        </div>
                      )}
                    </div>

                    {/* Footer Actions - Compact */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                      {/* Status */}
                      {selectedArticle.is_published !== undefined && (
                        <span
                          style={{
                            fontSize: 13,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: selectedArticle.is_published ? '#dcfce7' : '#fef2f2',
                            color: selectedArticle.is_published ? '#16a34a' : '#dc2626',
                            fontWeight: 500,
                          }}
                        >
                          {selectedArticle.is_published ? 'เผยแพร่' : 'ร่าง'}
                        </span>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {/* ปุ่มคัดลอก + แจ้งเตือนติดปุ่ม */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          {/* ปุ่มแก้ไข */}
                          <button
                            onClick={() => {
                              if (selectedArticle) {
                                handleEdit(selectedArticle);
                                closeArticleDetail();
                              }
                            }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 8,
                              border: '1px solid #d1d5db',
                              background: '#fff',
                              color: '#374151',
                              cursor: 'pointer',
                              fontSize: 14,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              transition: 'all 0.2s ease',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                                '0 6px 14px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                                '0 4px 8px rgba(0,0,0,0.1)';
                            }}
                          >
                            ✏️ แก้ไข
                          </button>
                        </div>
                        <button
                          onClick={closeArticleDetail}
                          style={{
                            padding: '8px 20px',
                            borderRadius: 8,
                            border: 'none',
                            background: selectedArticle?.type === 'news' ? '#3b82f6' : '#7c3aed',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            transition: 'all 0.25s ease',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.05)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                          }}
                        >
                          ปิด
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </>
  );
}

export default AdminArticlesPage;
