import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Row,
  Col,
  Table,
  Tag,
  Space,
  message,
  Segmented,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

// ---------- Types ----------
export type UserRoleDatum = {
  name: string;     // "นักศึกษา" | "บริษัท" | "อาจารย์" | "แอดมิน"
  value: number;
  color: string;    // hex color for pie
};

export type UsersByRolePoint = {
  label: string;     // e.g. "ม.ค.", "ไตรมาส 1", "2568"
  students: number;
  companies: number;
  academic_staff: number;
  admins: number;
};

type LocationState = {
  userRoleData?: UserRoleDatum[];         // summary pie
  userRoleSeries?: UsersByRolePoint[];    // time series
  defaultYearBE?: number;                 // optional default year (พ.ศ.)
  yearsBE?: number[];                     // optional year list (พ.ศ.)
  defaultMode?: "month" | "quarter" | "year";
};

// ---------- Component ----------
const UserRoleStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: LocationState };

  // รับข้อมูลจาก AdminDashboard ผ่าน navigate state
  const userRoleData = useMemo<UserRoleDatum[]>(
    () => (Array.isArray(state?.userRoleData) ? state!.userRoleData! : []),
    [state?.userRoleData]
  );

  const userRoleSeries = useMemo<UsersByRolePoint[]>(
    () => (Array.isArray(state?.userRoleSeries) ? state!.userRoleSeries! : []),
    [state?.userRoleSeries]
  );

  const userRoleTotal = useMemo(
    () => userRoleData.reduce((sum, r) => sum + (r.value || 0), 0),
    [userRoleData]
  );

  // ตัวเลือก filter (ถ้ามีส่งมาจากหน้า Dashboard ก็ใช้ได้เลย)
  const yearsBE = state?.yearsBE ?? [];
  const [yearBE, setYearBE] = useState<number | undefined>(state?.defaultYearBE);
  const [mode, setMode] = useState<"month" | "quarter" | "year">(
    state?.defaultMode ?? "month"
  );

  const exportCSV = () => {
    if (!userRoleData.length && !userRoleSeries.length) {
      message.warning("ยังไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    // CSV1: สรุปสัดส่วนผู้ใช้ (pie)
    const headers1 = ["บทบาท", "จำนวน", "เปอร์เซ็นต์"];
    const rows1 = userRoleData.map((r) => [
      r.name,
      r.value,
      userRoleTotal ? ((r.value / userRoleTotal) * 100).toFixed(1) + "%" : "0%",
    ]);

    // CSV2: Time series รายบทบาท
    const headers2 = ["ช่วงเวลา", "นักศึกษา", "บริษัท", "อาจารย์", "แอดมิน"];
    const rows2 = userRoleSeries.map((p) => [
      p.label,
      p.students,
      p.companies,
      p.academic_staff,
      p.admins,
    ]);

    const toCSV = (h: any[], rows: any[][]) =>
      [h, ...rows]
        .map((line) =>
          line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const sections = [
      "สรุปสัดส่วนผู้ใช้ตามบทบาท",
      toCSV(headers1, rows1),
      "",
      "สถิติจำนวนผู้ใช้(สะสม/ตามช่วงเวลา)",
      toCSV(headers2, rows2),
    ].join("\n");

    const blob = new Blob([sections], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "user_role_stats.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // แปลง series เพื่อโชว์ในตาราง (รวมทุกบทบาทต่อแถว)
  const seriesTableData = userRoleSeries.map((p, idx) => ({
    key: idx,
    label: p.label,
    students: p.students,
    companies: p.companies,
    academic_staff: p.academic_staff,
    admins: p.admins,
    total: p.students + p.companies + p.academic_staff + p.admins,
  }));

  return (
    <div style={{ padding: 16 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            ย้อนกลับ
          </Button>
        </Col>
        <Col>
          <Space>
            {yearsBE.length > 0 && (
              <Select
                placeholder="ปี (พ.ศ.)"
                value={yearBE}
                onChange={setYearBE}
                options={yearsBE.map((y) => ({ label: y, value: y }))}
                style={{ width: 120 }}
              />
            )}
            <Segmented
              value={mode}
              onChange={(v) => setMode(v as any)}
              options={[
                { label: "เดือน", value: "month" },
                { label: "ไตรมาส", value: "quarter" },
                { label: "ปี", value: "year" },
              ]}
            />
            <Button icon={<DownloadOutlined />} onClick={exportCSV}>
              Export CSV
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Card 1: Pie สัดส่วนผู้ใช้ */}
      <Card
        title="สัดส่วนผู้ใช้ตามบทบาท"
        className="adminpage-dashboard-chart-card"
        style={{ marginBottom: 16 }}
      >
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={userRoleData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {userRoleData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RTooltip />
          </PieChart>
        </ResponsiveContainer>

        <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
          {userRoleData.map((item, index) => (
            <Col span={12} key={index}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: item.color,
                    marginRight: 8,
                    borderRadius: 2,
                  }}
                />
                <span style={{ fontSize: 12 }}>
                  {item.name}: {item.value}{" "}
                  {userRoleTotal
                    ? `(${((item.value / userRoleTotal) * 100).toFixed(1)}%)`
                    : ""}
                </span>
              </div>
            </Col>
          ))}
        </Row>

        <Table
          style={{ marginTop: 12 }}
          size="small"
          pagination={false}
          dataSource={userRoleData.map((d, i) => ({
            key: i,
            ...d,
            percent: userRoleTotal
              ? ((d.value / userRoleTotal) * 100).toFixed(1) + "%"
              : "0%",
          }))}
          columns={[
            { title: "บทบาท", dataIndex: "name", key: "name" },
            { title: "จำนวน", dataIndex: "value", key: "value" },
            { title: "เปอร์เซ็นต์", dataIndex: "percent", key: "percent" },
          ]}
        />
      </Card>

      {/* Card 2: AreaChart trend ตามช่วงเวลา */}
      <Card
        title="แนวโน้มจำนวนผู้ใช้ตามบทบาท (ตามช่วงเวลา)"
        className="adminpage-dashboard-chart-card"
      >
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={userRoleSeries.map((p) => ({
              name: p.label,
              students: p.students,
              companies: p.companies,
              academicStaff: p.academic_staff,
              admins: p.admins,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RTooltip />
            <Area
              type="monotone"
              dataKey="students"
              stackId="1"
              stroke="#1890ff"
              fill="#1890ff"
              name="นักศึกษา"
            />
            <Area
              type="monotone"
              dataKey="companies"
              stackId="1"
              stroke="#52c41a"
              fill="#52c41a"
              name="บริษัท"
            />
            <Area
              type="monotone"
              dataKey="academicStaff"
              stackId="1"
              stroke="#722ed1"
              fill="#722ed1"
              name="อาจารย์"
            />
            <Area
              type="monotone"
              dataKey="admins"
              stackId="1"
              stroke="#faad14"
              fill="#faad14"
              name="แอดมิน"
            />
          </AreaChart>
        </ResponsiveContainer>

        <Table
          style={{ marginTop: 12 }}
          size="small"
          pagination={false}
          dataSource={seriesTableData}
          columns={[
            { title: "ช่วงเวลา", dataIndex: "label", key: "label" },
            { title: "นักศึกษา", dataIndex: "students", key: "students" },
            { title: "บริษัท", dataIndex: "companies", key: "companies" },
            { title: "อาจารย์", dataIndex: "academic_staff", key: "academic_staff" },
            { title: "แอดมิน", dataIndex: "admins", key: "admins" },
            { title: "รวม", dataIndex: "total", key: "total" },
          ]}
        />
      </Card>
    </div>
  );
};

export default UserRoleStatsPage;