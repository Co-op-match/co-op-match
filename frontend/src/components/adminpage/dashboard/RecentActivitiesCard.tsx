import React, { useMemo, useState } from "react";
import {
  Card, Space, Input, Button, Table, Drawer,
  Avatar, Tag, Descriptions, Badge, Timeline
} from "antd";
import {
  EyeOutlined, UserOutlined, BankOutlined,
  BookOutlined, TeamOutlined, MailOutlined, EditOutlined
} from "@ant-design/icons";

const { Search } = Input;

export type ActivityLog = {
  id: number | string;
  user: string;
  type: "Student" | "Company" | "AcademicStaff" | "Admin";
  action: string;
  time: string;
  company?: string;
  post?: string;
  document?: string;
};

export type UserDetail = {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  joinDate: string;
  lastActive: string;
  avatar?: string;
  department?: string;
  company?: string;
};

type Props = {
  title?: string;
  className?: string;
  activities: ActivityLog[];
  onViewAll: () => void;             // กด "ดูทั้งหมด"
  tableHeight?: number;              // ความสูงสกรอลของตาราง (default 280)
};

const getRoleIcon = (type: ActivityLog["type"]) => {
  switch (type) {
    case "Student": return <UserOutlined style={{ color: "#1890ff" }} />;
    case "Company": return <BankOutlined style={{ color: "#52c41a" }} />;
    case "AcademicStaff": return <BookOutlined style={{ color: "#722ed1" }} />;
    case "Admin": return <TeamOutlined style={{ color: "#faad14" }} />;
    default: return <UserOutlined />;
  }
};

const RecentActivitiesCard: React.FC<Props> = ({
  title = "กิจกรรมล่าสุด",
  className = "adminpage-dashboard-activity-card",
  activities,
  onViewAll,
  tableHeight = 280,
}) => {
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [userDetailDrawer, setUserDetailDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);

  const filtered = useMemo(() => {
    if (!searchText) return activities;
    const q = searchText.toLowerCase();
    return activities.filter(a => {
      const details = a.company || a.post || a.document || "-";
      return (
        a.user.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        (details?.toLowerCase?.() || "").includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.time.toLowerCase().includes(q)
      );
    });
  }, [activities, searchText]);

  const showUserDetail = (row: ActivityLog) => {
    setSelectedUser({
      id: row.id,
      name: row.user,
      email: `${row.user}@example.com`,
      phone: "ไม่ระบุ",
      role: row.type,
      status: "Active",
      joinDate: "2024-01-01",
      lastActive: row.time,
      company: row.company,
    });
    setUserDetailDrawer(true);
  };

  const columns = [
    {
      title: "ผู้ใช้",
      dataIndex: "user",
      key: "user",
      render: (_: any, record: ActivityLog) => (
        <Space>
          {getRoleIcon(record.type)}
          <Button type="link" onClick={() => showUserDetail(record)}>
            {record.user}
          </Button>
        </Space>
      ),
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
        <Button size="small" icon={<EyeOutlined />} onClick={() => showUserDetail(record)}>
          ดู
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card
        title={title}
        className={className}
        extra={
          <Space>
            <Search
              placeholder="ค้นหากิจกรรม"
              style={{ width: 200 }}
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Button icon={<EyeOutlined />} onClick={onViewAll}>
              ดูทั้งหมด
            </Button>
          </Space>
        }
      >
        <Table
          rowKey={(r) => String(r.id)}
          dataSource={filtered}
          columns={columns as any}
          pagination={{ pageSize: 5, showSizeChanger: true }}
          size="small"
          scroll={{ y: tableHeight }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      </Card>

      {/* User Detail Drawer */}
      <Drawer
        title="รายละเอียดผู้ใช้"
        width={600}
        open={userDetailDrawer}
        onClose={() => setUserDetailDrawer(false)}
        extra={
          <Space>
            <Button icon={<EditOutlined />}>แก้ไข</Button>
            <Button icon={<MailOutlined />}>ส่งอีเมล</Button>
          </Space>
        }
      >
        {selectedUser && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Avatar size={80} icon={<UserOutlined />} />
              <h3 style={{ margin: "8px 0" }}>{selectedUser.name}</h3>
              <Tag color="blue">{selectedUser.role}</Tag>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="อีเมล">
                {selectedUser.email}
              </Descriptions.Item>
              <Descriptions.Item label="โทรศัพท์">
                {selectedUser.phone}
              </Descriptions.Item>
              <Descriptions.Item label="สถานะ">
                <Badge status="success" text={selectedUser.status} />
              </Descriptions.Item>
              <Descriptions.Item label="วันที่เข้าร่วม">
                {selectedUser.joinDate}
              </Descriptions.Item>
              <Descriptions.Item label="เข้าใช้ล่าสุด">
                {selectedUser.lastActive}
              </Descriptions.Item>
              {selectedUser.department && (
                <Descriptions.Item label="แผนก">
                  {selectedUser.department}
                </Descriptions.Item>
              )}
              {selectedUser.company && (
                <Descriptions.Item label="บริษัท">
                  {selectedUser.company}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h4>กิจกรรมล่าสุด</h4>
              <Timeline>
                <Timeline.Item color="green">
                  เข้าสู่ระบบ - 2 ชั่วโมงที่แล้ว
                </Timeline.Item>
                <Timeline.Item color="blue">
                  อัปเดตโปรไฟล์ - 1 วันที่แล้ว
                </Timeline.Item>
                <Timeline.Item>สมัครงาน - 3 วันที่แล้ว</Timeline.Item>
              </Timeline>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default RecentActivitiesCard;