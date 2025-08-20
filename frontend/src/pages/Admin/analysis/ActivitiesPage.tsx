import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Table,
  Space,
  Input,
  Row,
  Col,
  Tag,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { GetAdminRecentActivities } from "../../../services/https";


type ActivityLog = {
  id?: number | string;
  user: string;
  type: "student" | "company" | "academic" | "admin" | string;
  action: string;
  company?: string;
  post?: string;
  document?: string;
  time: string; // แนะนำเก็บเป็น ISO string
};

type LocationState = {
  recentActivities?: ActivityLog[];
};

const iconByRole = (role: string) => {
  switch (role) {
    case "student":
      return <UserOutlined />;
    case "company":
      return <TeamOutlined />;
    case "academic":
      return <SolutionOutlined />;
    case "admin":
      return <CrownOutlined />;
    default:
      return <UserOutlined />;
  }
};

const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>(
    Array.isArray(state.recentActivities) ? state.recentActivities! : []
  );

  // ถ้าไม่ได้ส่ง state มา ให้ลองดึงเองจาก API
  useEffect(() => {
    if (activities.length === 0) {
      (async () => {
        try {
          setLoading(true);
          const res = await GetAdminRecentActivities();
          setActivities(res?.data || []);
        } catch (e) {
          message.error("ไม่สามารถดึงข้อมูลกิจกรรมได้");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    if (!searchText) return activities;
    const q = searchText.toLowerCase();
    return activities.filter((a) => {
      const details = a.company || a.post || a.document || "-";
      return (
        a.user?.toLowerCase().includes(q) ||
        a.action?.toLowerCase().includes(q) ||
        details?.toLowerCase().includes(q) ||
        a.type?.toLowerCase().includes(q) ||
        a.time?.toLowerCase().includes(q)
      );
    });
  }, [activities, searchText]);

  const exportCSV = () => {
    if (filtered.length === 0) {
      message.warning("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const headers = ["ผู้ใช้", "บทบาท", "กิจกรรม", "รายละเอียด", "เวลา"];
    const rows = filtered.map((r) => [
      r.user,
      r.type,
      r.action,
      r.company || r.post || r.document || "-",
      r.time,
    ]);
    const csv = [headers, ...rows]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activities.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: "ผู้ใช้",
      dataIndex: "user",
      key: "user",
      render: (_: any, record: ActivityLog) => (
        <Space>
          {iconByRole(record.type)}
          <Button type="link" onClick={() => message.info(`ดูโปรไฟล์: ${record.user}`)}>
            {record.user}
          </Button>
        </Space>
      ),
    },
    {
      title: "บทบาท",
      dataIndex: "type",
      key: "type",
      render: (t: string) => {
        const m: Record<string, { color: string; label: string }> = {
          student: { color: "blue", label: "นักศึกษา" },
          company: { color: "green", label: "บริษัท" },
          academic: { color: "purple", label: "อาจารย์" },
          admin: { color: "gold", label: "แอดมิน" },
        };
        const it = m[t] || { color: "default", label: t };
        return <Tag color={it.color}>{it.label}</Tag>;
      },
    },
    { title: "กิจกรรม", dataIndex: "action", key: "action" },
    {
      title: "รายละเอียด",
      key: "details",
      render: (record: ActivityLog) =>
        record.company || record.post || record.document || "-",
    },
    { title: "เวลา", dataIndex: "time", key: "time" },
    {
      title: "การกระทำ",
      key: "actions",
      render: (record: ActivityLog) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => message.info(`แสดงรายละเอียด: ${record.user} • ${record.action}`)}
          >
            ดู
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              ย้อนกลับ
            </Button>
          </Space>
        </Col>
        <Col>
          <Space>
            <Input.Search
              allowClear
              placeholder="ค้นหากิจกรรม"
              style={{ width: 240 }}
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
              enterButton={<SearchOutlined />}
            />
            <Button icon={<DownloadOutlined />} onClick={exportCSV}>
              Export CSV
            </Button>
          </Space>
        </Col>
      </Row>

      <Card title="กิจกรรมทั้งหมด" className="adminpage-dashboard-activity-card">
        <Table
          loading={loading}
          rowKey={(r) => r.id ?? `${r.user}-${r.time}`}
          dataSource={filtered}
          columns={columns as any}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="small"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      </Card>
    </div>
  );
};

export default ActivitiesPage;