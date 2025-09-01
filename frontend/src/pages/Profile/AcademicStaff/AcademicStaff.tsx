import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Avatar,
  Card,
  Descriptions,
  List,
  Typography,
  Badge,
  Row,
  Col,
  Tag,
  message,
  Skeleton,
  Empty,
  Table,
  Tabs,
} from "antd";
import {
  EditOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  BankOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/th";
import {
  GetAcademicStaffByUserId,
  GetVerifyByUserId,
} from "../../../services/https";
import CompanyHeader from "../../Component/CompanyHeader";
import type { AcademicStaffInterface } from "../../../interfaces/AcademicStaff";
import "./AcademicStaffProfile.css";
// ตั้ง locale ภาษาไทยให้ dayjs
dayjs.locale("th");

const { Content } = Layout;
const { Text } = Typography;

// ===== Types =====
export interface StudentForAdvisor {
  id: number;
  prefix_name?: string;
  first_name: string;
  last_name: string;
  program_name?: string;
  faculty_name?: string;
  year?: number;
  gpa?: number;
  avatar_url?: string;
  current_internship?:
    | {
        company_id: number;
        company_name: string;
        position?: string;
        start_date?: string; // ISO
        end_date?: string; // ISO
        status?: string; // "กำลังฝึก" | "สำเร็จ" | "ยกเลิก" | ...
        logo_url?: string;
        province_name?: string;
      }
    | null;
}

export interface CompanySummaryItem {
  company_id: number;
  company_name: string;
  logo_url?: string;
  student_count: number;
  students: StudentForAdvisor[];
}

// ===== MOCK DATA (เปิดใช้ชั่วคราวได้ที่สวิตช์นี้) =====
const USE_MOCK_DATA = true;

const MOCK_STUDENTS: StudentForAdvisor[] = [
  {
    id: 1,
    prefix_name: "นางสาว ",
    first_name: "ปวีณา",
    last_name: "พัฒน์",
    program_name: "วิศวกรรมคอมพิวเตอร์",
    faculty_name: "คณะวิศวกรรมศาสตร์",
    year: 3,
    gpa: 3.45,
    avatar_url: "",
    current_internship: {
      company_id: 101,
      company_name: "SCB TechX",
      position: "Frontend Intern",
      start_date: "2025-06-01",
      end_date: "2025-08-31",
      status: "กำลังฝึก",
      logo_url: "",
      province_name: "กรุงเทพมหานคร",
    },
  },
  {
    id: 2,
    prefix_name: "นาย ",
    first_name: "ธนภัทร",
    last_name: "รัตน์",
    program_name: "วิศวกรรมซอฟต์แวร์",
    faculty_name: "คณะวิศวกรรมศาสตร์",
    year: 4,
    gpa: 3.22,
    avatar_url: "",
    current_internship: {
      company_id: 102,
      company_name: "LINE MAN Wongnai",
      position: "Web Intern",
      start_date: "2025-06-01",
      end_date: "2025-08-31",
      status: "กำลังฝึก",
      logo_url: "",
      province_name: "กรุงเทพมหานคร",
    },
  },
  {
    id: 3,
    prefix_name: "นางสาว ",
    first_name: "ชลธิชา",
    last_name: "เจริญ",
    program_name: "วิทยาการข้อมูล",
    faculty_name: "คณะวิทยาศาสตร์",
    year: 3,
    gpa: 3.75,
    avatar_url: "",
    current_internship: {
      company_id: 103,
      company_name: "Data Co., Ltd.",
      position: "Data Analyst Intern",
      start_date: "2025-06-10",
      end_date: "2025-09-10",
      status: "กำลังฝึก",
      logo_url: "",
      province_name: "เชียงใหม่",
    },
  },
  {
    id: 4,
    prefix_name: "นาย ",
    first_name: "กิตติภพ",
    last_name: "สุนทร",
    program_name: "วิศวกรรมคอมพิวเตอร์",
    faculty_name: "คณะวิศวกรรมศาสตร์",
    year: 4,
    gpa: 3.1,
    avatar_url: "",
    current_internship: null,
  },
  {
    id: 5,
    prefix_name: "นางสาว ",
    first_name: "ศิรินาถ",
    last_name: "คำแหง",
    program_name: "วิศวกรรมคอมพิวเตอร์",
    faculty_name: "คณะวิศวกรรมศาสตร์",
    year: 3,
    gpa: 3.6,
    avatar_url: "",
    current_internship: {
      company_id: 104,
      company_name: "A Tech Solutions",
      position: "Backend Intern",
      start_date: "2025-06-03",
      end_date: "2025-08-30",
      status: "กำลังฝึก",
      logo_url: "",
      province_name: "ปทุมธานี",
    },
  },
  {
    id: 6,
    prefix_name: "นาย ",
    first_name: "นรินทร์",
    last_name: "ศรีสุข",
    program_name: "วิศวกรรมซอฟต์แวร์",
    faculty_name: "คณะวิศวกรรมศาสตร์",
    year: 2,
    gpa: 3.05,
    avatar_url: "",
    current_internship: {
      company_id: 103,
      company_name: "Data Co., Ltd.",
      position: "QA Intern",
      start_date: "2025-06-20",
      end_date: "2025-09-20",
      status: "กำลังฝึก",
      logo_url: "",
      province_name: "เชียงใหม่",
    },
  },
];

const AcademicStaffProfile: React.FC = () => {
  const [academicstaff, setAcademicStaff] = useState<
    AcademicStaffInterface | undefined
  >(undefined);
  const [verifyStatus, setVerifyStatus] = useState<string>("ยังไม่ได้ส่งคำขอ");

  const [editSection, setEditSection] = useState<"contact" | "address" | null>(
    null
  );

  // ใหม่: นักศึกษาที่ดูแล + บริษัทสรุป
  const [students, setStudents] = useState<StudentForAdvisor[]>([]);
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);

  const userId = localStorage.getItem("id");

  // โหลดข้อมูลอาจารย์ + รับรอง
  useEffect(() => {
    const loadStaff = async () => {
      const userIdString = localStorage.getItem("id");
      if (!userIdString) return;
      const uid = Number(userIdString);
      try {
        const academicstaffData = await GetAcademicStaffByUserId(uid);
        setAcademicStaff(academicstaffData);

        const verifyData = await GetVerifyByUserId(uid);
        if (verifyData?.StatusVerify?.status_verify) {
          setVerifyStatus(verifyData.StatusVerify.status_verify);
        } else {
          setVerifyStatus("ยังไม่ได้ส่งคำขอ");
        }
      } catch (error) {
        console.error("โหลดข้อมูลล้มเหลว:", error);
      }
    };

    loadStaff();
  }, []);

  // โหลดรายชื่อนักศึกษาที่ดูแล (ตอนนี้ใช้ MOCK)
  useEffect(() => {
    async function loadStudents() {
      if (!userId) return;
      setStudentsLoading(true);
      try {
        if (USE_MOCK_DATA) {
          setStudents(MOCK_STUDENTS);
        } else {
          // TODO: เรียก API จริงเมื่อพร้อม เช่น GetStudentsByAdvisorUserId(Number(userId))
          setStudents([]);
        }
      } catch (err) {
        console.error("โหลดรายชื่อนักศึกษาที่ดูแลล้มเหลว:", err);
        if (USE_MOCK_DATA) {
          setStudents(MOCK_STUDENTS);
        } else {
          message.error("ไม่สามารถโหลดรายชื่อนักศึกษาที่ดูแลได้");
          setStudents([]);
        }
      } finally {
        setStudentsLoading(false);
      }
    }
    loadStudents();
  }, [userId]);

  // รวมบริษัทที่นักศึกษาไปฝึกจาก current_internship
  const companySummary: CompanySummaryItem[] = useMemo(() => {
    const map = new Map<number, CompanySummaryItem>();
    for (const s of students) {
      const ci = s.current_internship;
      if (!ci || !ci.company_id) continue;
      if (!map.has(ci.company_id)) {
        map.set(ci.company_id, {
          company_id: ci.company_id,
          company_name: ci.company_name,
          logo_url: ci.logo_url,
          student_count: 0,
          students: [],
        });
      }
      const entry = map.get(ci.company_id)!;
      entry.student_count += 1;
      entry.students.push(s);
    }
    return Array.from(map.values()).sort((a, b) => b.student_count - a.student_count);
  }, [students]);

  const onEditSection = (section: "contact" | "address") => setEditSection(section);

  const formatRange = (start?: string, end?: string) => {
    if (!start && !end) return "-";
    const s = start ? dayjs(start).format("DD MMM YYYY") : "?";
    const e = end ? dayjs(end).format("DD MMM YYYY") : "?";
    return `${s} - ${e}`;
  };

  return (
    <Layout>
      <CompanyHeader />
      <Layout className="academicstaff-layout">
        <Content>
          <div className="academicstaff-profile-title">
            <span className="academicstaff-profile-text">AcademicStaff Profile</span>
            <div className="academicstaff-profile-line" />
          </div>

          {/* TOP: Academic Staff Info */}
          <div className="academicstaff-main-section">
            <Card className="academicstaff-profile-card">
              <div className="academicstaff-profile-container">
                <div className="academicstaff-profile-left">
                  <div className="academicstaff-avatar-container">
                    <label style={{ cursor: "pointer" }}>
                      <Avatar
                        src={
                          academicstaff?.User?.ProfileImage?.[0]?.image_url
                            ? `http://localhost:8000${academicstaff.User.ProfileImage[0].image_url}`
                            : undefined
                        }
                        size={120}
                        icon={
                          !academicstaff?.User?.ProfileImage?.[0]?.image_url ? (
                            <UserOutlined />
                          ) : undefined
                        }
                        style={{
                          border: "2px solid #fff",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                      />
                    </label>
                    <label
                      className="academicstaff-avatar-edit-icon"
                      title="เปลี่ยนรูปโปรไฟล์"
                    >
                      <EditOutlined />
                    </label>
                  </div>
                  <p className="academicstaff-name">
                    {academicstaff?.first_name} {academicstaff?.last_name}
                  </p>
                  <Badge
                    className="academicstaff-verify-badge"
                    status={
                      verifyStatus === "รับรอง"
                        ? "success"
                        : verifyStatus === "รอรับรอง"
                        ? "processing"
                        : verifyStatus === "ปฏิเสธ"
                        ? "error"
                        : "default"
                    }
                    text={`สถานะการรับรอง: ${verifyStatus}`}
                  />
                </div>

                <div className="academicstaff-profile-details">
                  <div className="academicstaff-section-header">
                    <h4>
                      <UserOutlined style={{ color: "#0d47a1" }} /> ข้อมูลติดต่อ
                    </h4>
                    <button
                      className="academicstaff-edit-button"
                      onClick={() => onEditSection("contact")}
                    >
                      <EditOutlined /> แก้ไข
                    </button>
                  </div>
                  <Descriptions column={3}>
                    <Descriptions.Item label="เว็บไซต์">
                      {academicstaff?.Contact?.website || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="ไลน์">
                      {academicstaff?.Contact?.line || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="เบอร์">
                      {academicstaff?.Contact?.phone_number || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="เฟสบุ๊ค">
                      {academicstaff?.Contact?.facebook || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="อีเมล">
                      {academicstaff?.Contact?.email || "-"}
                    </Descriptions.Item>
                  </Descriptions>

                  <div className="academicstaff-section-header">
                    <h4>
                      <EnvironmentOutlined style={{ color: "#0d47a1" }} /> ที่อยู่
                    </h4>
                    <button
                      className="academicstaff-edit-button"
                      onClick={() => onEditSection("address")}
                    >
                      <EditOutlined /> แก้ไข
                    </button>
                  </div>
                  <Descriptions column={3}>
                    <Descriptions.Item label="บ้านเลขที่">
                      {academicstaff?.Address?.house_number || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="หมู่บ้าน">
                      {academicstaff?.Address?.village || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="ซอย">
                      {academicstaff?.Address?.sub_street || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="ถนน">
                      {academicstaff?.Address?.street || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="ตำบล">
                      {academicstaff?.Address?.SubDistrict?.name_th || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="อำเภอ">
                      {academicstaff?.Address?.District?.name_th || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="จังหวัด">
                      {academicstaff?.Address?.Province?.name_th || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="รหัสไปรษณีย์">
                      {academicstaff?.Address?.Postcode?.post_code || "-"}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </div>
            </Card>
          </div>

 {/* CONTENT ROWS */}

  <Row gutter={[16, 24]}>
    <Col span={24}>
  <Tabs
    defaultActiveKey="students"
    className="advisor-tabs"
    items={[
      {
        key: "students",
        label: (
          <span className="tab-label">
            <TeamOutlined />
            <span>นักศึกษาที่ดูแล</span>
          </span>
        ),
        children: (
          <Card
            title={
              <div className="card-title">
                <div className="card-title__icon card-title__icon--blue">
                  <TeamOutlined />
                </div>
                <div>
                  <div className="card-title__text">นักศึกษาที่ดูแล</div>
                  <div className="card-title__subtext">
                    รายชื่อและข้อมูลการฝึกงานของนักศึกษา
                  </div>
                </div>
              </div>
            }
            className="academicstaff-profile-card advisor-students-card"
            headStyle={{ borderBottom: "0" }}
          >
            {studentsLoading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : students.length === 0 ? (
              <Empty
                description={
                  <div>
                    <div>ยังไม่มีนักศึกษาที่ดูแล</div>
                    <div className="empty-subtext">
                      นักศึกษาจะปรากฏที่นี่เมื่อได้รับการมอบหมาย
                    </div>
                  </div>
                }
              />
            ) : (
              <Table<StudentForAdvisor>
                dataSource={students}
                rowKey="id"
                size="middle"
                sticky
                tableLayout="fixed"              
                scroll={{ x: 1200 }}
                className="table-zebra nice-table"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => (
                    <span className="pagination-total">
                      แสดง {range[0]}-{range[1]} จาก {total} คน
                    </span>
                  ),
                }}
                rowClassName={(_, index) =>
                  index % 2 === 0 ? "table-row-even" : "table-row-odd"
                }
                columns={[
                  {
                    title: <div className="th-title">นักศึกษา</div>,
                    key: "name",
                    width: 260,
                    fixed: "left",
                    render: (_, record) => {
                      const fullName = `${record.prefix_name ?? ""}${record.first_name} ${record.last_name}`.trim();
                      return (
                        <div className="cell-student">
                          <Avatar
                            size={44}
                            src={record.avatar_url || undefined}
                            icon={!record.avatar_url ? <UserOutlined /> : undefined}
                            className="cell-student__avatar"
                          />
                          <div>
                            <div className="cell-student__name ellipsis-1">{fullName}</div>
                            <div className="cell-student__id">
                              รหัสนักศึกษา: {record.student_id || "N/A"}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  },
                  {
                    title: <div className="th-title">หลักสูตร</div>,
                    dataIndex: "program_name",
                    key: "program_name",
                    width: 200,
                    render: (program_name) =>
                      program_name ? (
                        <Tag className="tag-chip tag-chip--blue ellipsis-1">{program_name}</Tag>
                      ) : (
                        <span className="muted">-</span>
                      ),
                  },
                  {
                    title: <div className="th-title th-center">ชั้นปี</div>,
                    dataIndex: "year",
                    key: "year",
                    width: 100,
                    align: "center",
                    render: (year) =>
                      typeof year === "number" ? (
                        <Tag className="tag-chip tag-chip--indigo">ปี {year}</Tag>
                      ) : (
                        <span className="muted">-</span>
                      ),
                  },
                  {
                    title: <div className="th-title th-center">GPA</div>,
                    dataIndex: "gpa",
                    key: "gpa",
                    width: 100,
                    align: "center",
                    render: (gpa) =>
                      typeof gpa === "number" ? (
                        <Tag
                          className={`tag-chip ${
                            gpa >= 3.5
                              ? "tag-chip--green"
                              : gpa >= 3.0
                              ? "tag-chip--amber"
                              : "tag-chip--red"
                          }`}
                        >
                          {gpa.toFixed(2)}
                        </Tag>
                      ) : (
                        <span className="muted">-</span>
                      ),
                  },
                  {
                    title: <div className="th-title">บริษัท & ตำแหน่ง</div>,
                    key: "company",
                    width: 300,
                    render: (_, record) => {
                      const ci = record.current_internship;
                      return ci ? (
                        <div className="cell-company">
                          <div className="cell-company__name ellipsis-1">
                            <BankOutlined className="cell-company__icon" />
                            {ci.company_name}
                          </div>
                          {ci.position && (
                            <Tag className="tag-chip tag-chip--cyan ellipsis-1">{ci.position}</Tag>
                          )}
                        </div>
                      ) : (
                        <div className="warn-text">ยังไม่มีข้อมูล</div>
                      );
                    },
                  },
                  {
                    title: <div className="th-title th-center">จังหวัด</div>,
                    key: "province",
                    width: 140,
                    align: "center",
                    className: "col-hide-sm",       /* ✅ ซ่อนบนจอเล็ก */
                    render: (_, record) => {
                      const ci = record.current_internship;
                      return ci?.province_name ? (
                        <Tag className="tag-chip tag-chip--blue ellipsis-1">{ci.province_name}</Tag>
                      ) : (
                        <span className="muted">-</span>
                      );
                    },
                  },
                  {
                    title: <div className="th-title th-center">สถานะ</div>,
                    key: "status",
                    width: 140,
                    align: "center",
                    render: (_, record) => {
                      const ci = record.current_internship;
                      if (!ci?.status) return <Tag className="tag-chip tag-chip--gray">ยังไม่ได้ฝึก</Tag>;
                      const cls =
                        ci.status === "กำลังฝึก"
                          ? "tag-chip--green"
                          : ci.status === "เสร็จสิ้น"
                          ? "tag-chip--blue"
                          : ci.status === "รอเริ่ม"
                          ? "tag-chip--amber"
                          : "tag-chip--gold";
                      return <Tag className={`tag-chip ${cls} ellipsis-1`}>{ci.status}</Tag>;
                    },
                  },
                  {
                    title: <div className="th-title th-center">ระยะเวลา</div>,
                    key: "duration",
                    width: 220,
                    align: "center",
                    className: "col-hide-sm",       /* ✅ ซ่อนบนจอเล็ก */
                    render: (_, record) => {
                      const ci = record.current_internship;
                      return ci ? (
                        <Tag className="tag-range ellipsis-1">
                          <CalendarOutlined className="tag-range__icon" />
                          {formatRange(ci.start_date, ci.end_date)}
                        </Tag>
                      ) : (
                        <span className="muted">-</span>
                      );
                    },
                  },
                ]}
              />
            )}
          </Card>
        ),
      },
      {
        key: "companies",
        label: (
          <span className="tab-label">
            <BankOutlined />
            <span>บริษัทที่นักศึกษาไปฝึก</span>
          </span>
        ),
        children: (
          <Card
            title={
              <div className="card-title">
                <div className="card-title__icon card-title__icon--green">
                  <BankOutlined />
                </div>
                <div>
                  <div className="card-title__text">บริษัทที่นักศึกษาไปฝึก</div>
                  <div className="card-title__subtext">สรุปการฝึกงานตามบริษัท</div>
                </div>
              </div>
            }
            className="academicstaff-profile-card advisor-companies-card"
            headStyle={{ borderBottom: "0" }}
          >
            {studentsLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : companySummary.length === 0 ? (
              <Empty
                description={
                  <div>
                    <div>ยังไม่มีข้อมูลบริษัทที่นักศึกษาไปฝึก</div>
                    <div className="empty-subtext">ข้อมูลจะปรากฏเมื่อนักศึกษาเริ่มฝึกงาน</div>
                  </div>
                }
              />
            ) : (
              <Table<CompanySummaryItem>
                dataSource={companySummary}
                rowKey={(r) => `${r.company_id}-${r.company_name}`}
                size="middle"
                tableLayout="fixed"          
                className="table-zebra nice-table"
                pagination={{
                  pageSize: 8,
                  showSizeChanger: true,
                  showTotal: (total, range) => (
                    <span className="pagination-total">
                      แสดง {range[0]}-{range[1]} จาก {total} บริษัท
                    </span>
                  ),
                }}
                rowClassName={(_, index) =>
                  index % 2 === 0 ? "table-row-even" : "table-row-odd"
                }
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="company-expand">
                      <div className="company-expand__title">
                        🎓 รายชื่อนักศึกษาทั้งหมด ({record.students.length} คน)
                      </div>
                      <div className="company-expand__grid">
                        {record.students.map((s) => (
                          <div className="company-expand__item" key={s.id}>
                            <Avatar
                              size={36}
                              src={s.avatar_url || undefined}
                              icon={!s.avatar_url ? <UserOutlined /> : undefined}
                              className="company-expand__avatar"
                            />
                            <div className="company-expand__text">
                              <div className="company-expand__name ellipsis-1">
                                {(s.prefix_name ?? "") + s.first_name + " " + s.last_name}
                              </div>
                              {s.current_internship?.position && (
                                <Tag className="tag-chip tag-chip--cyan ellipsis-1">
                                  {s.current_internship.position}
                                </Tag>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                  rowExpandable: (record) => record.students && record.students.length > 0,
                }}
                columns={[
                  {
                    title: <div className="th-title">บริษัท</div>,
                    dataIndex: "company_name",
                    key: "company_name",
                    width: 360,
                    render: (company_name, record) => (
                      <div className="cell-company-main">
                        <Avatar
                          shape="square"
                          size={56}
                          src={record.logo_url || undefined}
                          icon={!record.logo_url ? <BankOutlined /> : undefined}
                          className="cell-company-main__logo"
                        />
                        <div>
                          <div className="cell-company-main__name ellipsis-1">{company_name}</div>
                          <div className="cell-company-main__tagline">องค์กรพันธมิตร</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: <div className="th-title th-center">จำนวนนักศึกษา</div>,
                    dataIndex: "student_count",
                    key: "student_count",
                    width: 180,
                    align: "center",
                    render: (count) => (
                      <div className="cell-count">
                        <div className="cell-count__num">{count}</div>
                        <Tag className="tag-chip tag-chip--blue">คน</Tag>
                      </div>
                    ),
                  },
                  {
                    title: <div className="th-title">นักศึกษา (แสดง 3 คนแรก)</div>,
                    dataIndex: "students",
                    key: "students_preview",
                    render: (students: StudentForAdvisor[]) => (
                      <div className="students-preview">
                        {students.slice(0, 3).map((s, index) => (
                          <div
                            key={s.id}
                            className={`students-preview__row ${index % 2 === 0 ? "is-alt" : ""}`}
                          >
                            <Avatar
                              size={28}
                              src={s.avatar_url || undefined}
                              icon={!s.avatar_url ? <UserOutlined /> : undefined}
                              className="students-preview__avatar"
                            />
                            <div className="students-preview__name ellipsis-1">
                              {(s.prefix_name ?? "") + s.first_name + " " + s.last_name}
                            </div>
                          </div>
                        ))}
                        {students.length > 3 && (
                          <div className="students-preview__more">
                            <Text type="secondary" className="muted-italic">
                              และอีก {students.length - 3} คน
                            </Text>
                          </div>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </Card>
        ),
      },
    ]}
  />

    </Col>
  </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AcademicStaffProfile;
