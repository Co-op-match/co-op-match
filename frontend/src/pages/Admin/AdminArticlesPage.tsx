import React, { useEffect, useMemo, useState } from "react";
import {
  Layout, Card, Table, Button, Space, Tag, Modal, Form,
  Input, Select, Switch, message, Popconfirm, Row, Col,
  Typography, Tooltip, Divider, Statistic
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, FilterOutlined, FileTextOutlined,
  UserOutlined, TagOutlined, BookOutlined, GlobalOutlined,
  CheckCircleOutlined, EditFilled, PlusCircleFilled,
  DashboardOutlined, FileSearchOutlined, ProfileOutlined
} from "@ant-design/icons";
import type { Article } from "../../interfaces/Article";
import { ListArticles, CreateArticle, UpdateArticle, DeleteArticle } from "../../services/https/Articles";
import AdminHeader from "./../Component/AdminCoopMatchHeaderDefault";
const { Content } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;

const AdminArticlesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [ messageApi,contextHolder] = message.useMessage();
  const [saving] = useState(false);
  const [items, setItems] = useState<Article[]>([]);
  const [filterType, setFilterType] = useState<'news'|'career'|undefined>();
  const [search, setSearch] = useState<string>("");
  const [onlyPublished, setOnlyPublished] = useState<boolean | undefined>(undefined);

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await ListArticles({
        type: filterType,
        q: search || undefined,
        is_published: onlyPublished,
      });
      setItems(res.data);
    } catch (e:any) {
      message.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterType, search, onlyPublished]);

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

    // 🔎 LOG
    const debug: Record<string, any> = {};
    fd.forEach((val, key) => {
      // @ts-ignore
      debug[key] = val instanceof File ? `[File:${val.name}]` : val;
    });
    console.log(editing?.ID ? "UPDATE payload:" : "CREATE payload:", debug);

    if (editing?.ID) {
      const res = await UpdateArticle(editing.ID, fd);
      console.log("UPDATE response:", res?.status, res?.data);
      if (res?.status >= 200 && res?.status < 300) {
        messageApi.success("อัปเดตเรียบร้อย");
      } else {
        messageApi.error(
          `อัปเดตไม่สำเร็จ: ${res?.status || "-"} ${res?.data?.error || ""}`
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

  // สถิติข้อมูล
  const statistics = useMemo(() => {
    const total = items.length;
    const published = items.filter(item => Boolean(item.is_published)).length;
    const news = items.filter(item => item.type === 'news').length;
    const career = items.filter(item => item.type === 'career').length;
    return { total, published, draft: total - published, news, career };
  }, [items])

  const columns = [
    {
      title: "หัวข้อ",
      width: 250,
      dataIndex: "title",
      render: (title: string, record: Article) => (
        <div>
          <Text strong style={{ fontSize: 16, color: '#1e3a8a' }}>{title}</Text>
          {record.subtitle && <div><Text type="secondary" style={{ fontSize: 13, color: '#64748b' }}>{record.subtitle}</Text></div>}
        </div>
      )
    },
    {
      title: (<Space><TagOutlined style={{ color: '#3b82f6' }} />หมวดหมู่</Space>),
      width: 175,
      dataIndex: "category",
      render: (category?: string) =>
        category ? (
          <Tag style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            color: '#475569',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500
          }}>
            {category}
          </Tag>
        ) : (<Text type="secondary">-</Text>)
    },
    {
      title: "ประเภท",
      dataIndex: "type",
      width: 175,
      render: (t: string) => {
        const config = t === "news"
          ? {
              bg: '#dbeafe',
              text: "ข่าวสาร",
              icon: <FileTextOutlined style={{ color: '#1e40af' }} />,
              border: '#93c5fd',
              color: '#1e40af'
            }
          : {
              bg: '#e0e7ff',
              text: "บทความแนะแนว",
              icon: <UserOutlined style={{ color: '#4338ca' }} />,
              border: '#a5b4fc',
              color: '#4338ca'
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
              padding: '4px 12px'
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
      width: 200,
      dataIndex: "is_published",
      render: (b: boolean) => (
        <Tag style={{
          background: b ? '#dcfce7' : '#f8fafc',
          border: b ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
          color: b ? '#15803d' : '#64748b',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 500,
          padding: '4px 12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: b ? '#16a34a' : '#94a3b8'
            }} />
            {b ? "เผยแพร่" : "ร่าง"}
          </div>
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      width: 140,
      render: (_: any, row: Article) => {
        return (
          <Space size={4}>
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(row)}
                style={{
                  color: '#059669',
                  borderRadius: 8,
                  background: '#ecfdf5',
                  border: '1px solid #d1fae5'
                }}
              />
            </Tooltip>
            <Popconfirm
              title="ยืนยันการลบ?"
              description="การกระทำนี้ไม่สามารถย้อนกลับได้"
              onConfirm={() => handleDelete(row)}
              okText="ลบ"
              cancelText="ยกเลิก"
            >
              <Tooltip title="ลบ">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  style={{
                    borderRadius: 8,
                    background: '#fef2f2',
                    border: '1px solid #fecaca'
                  }}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
     <>
    {contextHolder} {/* วางบนสุดของ return ภายใน Fragment */}
    <Layout style={{
      minHeight: "100vh",
      background: '#f8fafc'
    }}>
      <AdminHeader />
      <Content
        style={{
          padding: 24,
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{
            margin: 0,
            color: '#1e3a8a',
            fontSize: 28
          }}>
            <FileTextOutlined style={{ marginRight: 12, color: '#3b82f6' }} />
            จัดการข่าวสารและบทความ
          </Title>
        </div>

        {/* Statistics Cards - ด้านบนสุด */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                background: 'white'
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Statistic
                title={
                  <div style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>
                    <DashboardOutlined style={{ marginRight: 6 }} />
                    ทั้งหมด
                  </div>
                }
                value={statistics.total}
                valueStyle={{ color: '#1e3a8a', fontSize: 28, fontWeight: 600 }}
              />
            </Card>
          </Col>
          
          <Col xs={12} sm={6}>
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #d1fae5',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                background: '#f0fdf4'
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Statistic
                title={
                  <div style={{ color: '#059669', fontSize: 14, fontWeight: 500 }}>
                    <CheckCircleOutlined style={{ marginRight: 6 }} />
                    เผยแพร่
                  </div>
                }
                value={statistics.published}
                valueStyle={{ color: '#059669', fontSize: 28, fontWeight: 600 }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #fed7aa',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                background: '#fffbeb'
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Statistic
                title={
                  <div style={{ color: '#d97706', fontSize: 14, fontWeight: 500 }}>
                    <EditOutlined style={{ marginRight: 6 }} />
                    ฉบับร่าง
                  </div>
                }
                value={statistics.draft}
                valueStyle={{ color: '#d97706', fontSize: 28, fontWeight: 600 }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #ddd6fe',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                background: '#faf5ff'
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#7c3aed', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    <ProfileOutlined style={{ marginRight: 6 }} />
                    ประเภท
                  </div>
                  <div style={{ color: '#7c3aed', fontSize: 28, fontWeight: 600 }}>
                    ข่าว: {statistics.news} | แนะแนว: {statistics.career}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Card style={{
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          background: 'white'
        }} bodyStyle={{ padding: 0 }}>
          {/* Card Header */}
          <div style={{
            padding: 24,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            borderRadius: '16px 16px 0 0',
            color: 'white'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <Title level={3} style={{ color: 'white', margin: 0, fontSize: 20 }}>
                  <FileSearchOutlined style={{ marginRight: 10 }} />
                  รายการทั้งหมด
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                  จัดการและควบคุมเนื้อหาของคุณ
                </Text>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                style={{
                  borderRadius: 12,
                  height: 44,
                  paddingLeft: 20,
                  paddingRight: 20,
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                เพิ่มรายการใหม่
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            padding: 24,
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <Row gutter={[16, 16]} align="middle">
              <Col flex="auto">
                <Space size={12} wrap>
                  <Select
                    allowClear
                    placeholder="เลือกประเภท"
                    prefix={<FilterOutlined style={{ color: '#3b82f6' }} />}
                    style={{ width: 180 }}
                    value={filterType}
                    onChange={(v) => setFilterType(v)}
                    size="large"
                    options={[
                      { label: "📰 ข่าวสาร", value: "news" },
                      { label: "🎓 บทความแนะแนว", value: "career" }
                    ]}
                  />
                  <Select
                    allowClear
                    placeholder="สถานะเผยแพร่"
                    style={{ width: 180 }}
                    size="large"
                    value={onlyPublished === undefined ? undefined : (onlyPublished ? "1" : "0")}
                    onChange={(v) => setOnlyPublished(v === undefined ? undefined : v === "1")}
                    options={[
                      { label: "✅ เผยแพร่", value: "1" },
                      { label: "📝 ฉบับร่าง", value: "0" }
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
                  prefix={<SearchOutlined style={{ color: '#3b82f6' }} />}
                />
              </Col>
            </Row>
          </div>

          {/* Table */}
          <div style={{ padding: 24, paddingTop: 0 }}>
            <Table
              rowKey={(r) => String(r.ID)}
              loading={loading}
              columns={columns as any}
              dataSource={items}
              pagination={false}
              scroll={{ x: 1000 }}
              style={{
                '& .ant-table': { borderRadius: 8 },
                '& .ant-table-thead > tr > th': {
                  background: '#f8fafc',
                  borderBottom: '2px solid #e2e8f0',
                  fontWeight: 600,
                  color: '#1e3a8a'
                },
                '& .ant-table-tbody > tr:hover > td': {
                  background: '#f1f5f9'
                }
              } as any}
            />
          </div>
        </Card>
      {/* Modal */}
        <Modal
          open={openModal}
          title={
            <div style={{
              display: 'flex', alignItems: 'center', fontSize: 18, fontWeight: 600,
              color: '#1e3a8a'
            }}>
              {editing ? (
                <>
                  <EditFilled style={{ marginRight: 10, color: '#3b82f6' }} />
                  แก้ไขบทความ/ข่าว
                </>
              ) : (
                <>
                  <PlusCircleFilled style={{ marginRight: 10, color: '#3b82f6' }} />
                  เพิ่มบทความ/ข่าวใหม่
                </>
              )}
            </div>
          }
          onCancel={saving ? undefined : closeModal}
          onOk={onSubmit}
          okButtonProps={{
            loading: saving,
            style: {
              borderRadius: 8,
              background: '#3b82f6',
              border: 'none',
              fontWeight: 600,
              height: 38
            }
          }}
          cancelButtonProps={{
            disabled: saving,
            style: {
              borderRadius: 8,
              height: 38,
              borderColor: '#d1d5db'
            }
          }}
          okText={
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircleOutlined />
              {editing ? "บันทึกการแก้ไข" : "สร้างรายการใหม่"}
            </span>
          }
          cancelText="ยกเลิก"
          width={750}
          style={{ top: 20 }}
          bodyStyle={{
            padding: '24px',
            background: '#f8fafc'
          }}
        >
          <Divider style={{ margin: '0 0 24px', borderColor: '#e2e8f0' }} />
          <Form layout="vertical" form={form} requiredMark={false}>
            {/* หัวข้อและประเภท */}
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  label={
                    <span style={{ color: '#1e3a8a', fontWeight: 600, fontSize: 14 }}>
                      <BookOutlined style={{ marginRight: 6 }} />
                      หัวข้อ
                    </span>
                  }
                  name="title"
                  rules={[{ required: true, message: "กรุณากรอกหัวข้อ" }]}
                >
                  <Input
                    placeholder="กรอกหัวข้อบทความ"
                    style={{
                      borderRadius: 8,
                      borderColor: '#d1d5db',
                      height: 40
                    }}
                    prefix={<EditOutlined style={{ color: '#6b7280' }} />}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span style={{ color: '#1e3a8a', fontWeight: 600, fontSize: 14 }}>
                      <TagOutlined style={{ marginRight: 6 }} />
                      ประเภท
                    </span>
                  }
                  name="type"
                  rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
                >
                  <Select
                    placeholder="เลือกประเภท"
                    style={{ borderRadius: 8 }}
                    size="large"
                    options={[
                      { label: "📰 ข่าวสาร", value: "news" },
                      { label: "🎓 บทความแนะแนว", value: "career" }
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* คำบรรยาย */}
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  label={
                    <span style={{ color: '#1e3a8a', fontWeight: 600, fontSize: 14 }}>
                      <FileTextOutlined style={{ marginRight: 6 }} />
                      คำบรรยาย
                    </span>
                  }
                  name="subtitle"
                >
                  <Input
                    placeholder="คำบรรยายสั้นๆ (ไม่บังคับ)"
                    style={{
                      borderRadius: 8,
                      borderColor: '#d1d5db',
                      height: 40
                    }}
                    prefix={<EditOutlined style={{ color: '#6b7280' }} />}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* หมวดหมู่และสถานะเผยแพร่ */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span style={{ color: '#1e3a8a', fontWeight: 600, fontSize: 14 }}>
                      <GlobalOutlined style={{ marginRight: 6 }} />
                      หมวดหมู่
                    </span>
                  }
                  name="category"
                >
                  <Input
                    placeholder="เช่น ประกาศ, กิจกรรม, การสัมภาษณ์งาน"
                    style={{
                      borderRadius: 8,
                      borderColor: '#d1d5db',
                      height: 40
                    }}
                    prefix={<TagOutlined style={{ color: '#6b7280' }} />}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span style={{ color: '#1e3a8a', fontWeight: 600, fontSize: 14 }}>
                      <CheckCircleOutlined style={{ marginRight: 6 }} />
                      สถานะเผยแพร่
                    </span>
                  }
                  name="is_published"
                  valuePropName="checked"
                  initialValue={false}
                >
                  <Switch
                    checkedChildren="เผยแพร่"
                    unCheckedChildren="ร่าง"
                    style={{ background: '#3b82f6' }}
                    size="default"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* เนื้อหา */}
            <Form.Item
              label={
                <span style={{ color: '#1e3a8a', fontWeight: 600, fontSize: 14 }}>
                  <FileTextOutlined style={{ marginRight: 6 }} />
                  เนื้อหา
                </span>
              }
              name="body"
            >
              <TextArea
                rows={6}
                placeholder="ใส่รายละเอียดเนื้อหา (สำหรับบทความแนะแนวเป็นหลัก)"
                style={{
                  resize: 'vertical',
                  borderRadius: 8,
                  borderColor: '#d1d5db'
                }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
    </>
  );
};

export default AdminArticlesPage;