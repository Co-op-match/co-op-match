import React, { useEffect, useState } from "react";
import {
  Layout,
  Avatar,
  Card,
  Descriptions,
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
  Alert,
  Grid,
} from "antd";
import {
  EditOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  LockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/th";
import {
  GetAcademicStaffByUserId,
  GetVerifyByUserId,
  GetAdviseeStudents,
  GetAdviseeCompanySummary,
  UpdateProfileImage,
} from "../../../services/https";
import CompanyHeader from "../../Component/AcademicStaffHeader";
import type { AcademicStaffInterface } from "../../../interfaces/AcademicStaff";
import "./AcademicStaffProfile.css";
import { fileURL } from "@/config/env";
import { CoopMatchLoader } from "../../../components/loaders";
import EditProfileCompanyModal from "../AcademicStaff/Edit/Popup";
import { useNavigate } from "react-router-dom";

dayjs.locale("th");

const { Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

/* ========= Types ========= */
export interface StudentForAdvisor {
  id: number; // NOTE: ปรับเป็น user_id ถ้าระบบคุณใช้ field อื่นเป็นตัวชี้โปรไฟล์
  user_id: number;
  prefix_name?: string;
  first_name: string;
  last_name: string;
  program_name?: string;
  faculty_name?: string;
  year?: number;
  gpa?: number;
  avatar_url?: string;
  student_id?: string;
  current_internship?:
    | {
        company_id: number;
        company_name: string;
        position?: string;
        start_date?: string;
        end_date?: string;
        status?: string;
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

/* ========= ตั้งค่าว่าจะใช้ MOCK ไหม (ปิด) ========= */
const USE_MOCK_DATA = false;

/* ===== helpers ลิงก์ & รูป ===== */
const safeHttp = (url?: string) => {
  if (!url) return undefined;
  const hasProto = /^https?:\/\//i.test(url);
  return hasProto ? url : `https://${url}`;
};
const toTel = (p?: string) => (p ? `tel:${p.replace(/\s+/g, "")}` : undefined);
const toMail = (m?: string) => (m ? `mailto:${m}` : undefined);
const toLine = (id?: string) => (id ? `https://line.me/R/ti/p/~${id}` : undefined); // รองรับไอดีไลน์
const toFb = (fb?: string) => {
  if (!fb) return undefined;
  return fb.startsWith("http") ? fb : `https://facebook.com/${fb}`;
};
const linkOrDash = (text?: string, href?: string) =>
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {text || href}
    </a>
  ) : (
    text || "-"
  );
const toSrc = (raw?: string) => (raw ? fileURL(raw) : undefined);

const AcademicStaffProfile: React.FC = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  const [academicstaff, setAcademicStaff] = useState<AcademicStaffInterface | undefined>(undefined);
  const [verifyStatus, setVerifyStatus] = useState<string>("ยังไม่ได้ส่งคำขอ");
  const [editSection, setEditSection] = useState<"contact" | "address" | "personal" | null>(null);

  // ใหม่: นักศึกษาที่ดูแล + บริษัทสรุป
  const [students, setStudents] = useState<StudentForAdvisor[]>([]);
  const [companySummary, setCompanySummary] = useState<CompanySummaryItem[]>([]);
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);
  const isLoading = staffLoading || studentsLoading;

  // อัปโหลดรูป
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const userId = localStorage.getItem("id");

  // ✅ ใช้ค่านี้ควบคุมสิทธิ์การเข้าถึงแท็บ/การโหลดข้อมูล
  const isVerified = verifyStatus === "รับรอง";

  // อัปเดตรูปใน state ทันทีที่อัปโหลดสำเร็จ
  const onImageUpdated = (newUrl: string) => setAvatarUrl(fileURL(newUrl));

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && academicstaff?.User?.ID) {
      const formData = new FormData();
      formData.append("user_id", String(academicstaff.User.ID));
      formData.append("image", file);

      setIsUploading(true);
      const res = await UpdateProfileImage(academicstaff.User.ID, formData);
      setIsUploading(false);

      if (res?.status === 200 && res.data?.data?.image_url) {
        onImageUpdated(res.data.data.image_url);
      }
    }
  };

  // โหลดข้อมูลอาจารย์ + สถานะการรับรอง
  useEffect(() => {
    const loadStaff = async () => {
      const userIdString = localStorage.getItem("id");
      if (!userIdString) return;
      const uid = Number(userIdString);
      try {
        setStaffLoading(true);

        const academicstaffData = await GetAcademicStaffByUserId(uid);
        setAcademicStaff(academicstaffData);

        const verifyData = await GetVerifyByUserId(uid);
        const v =
          verifyData?.StatusVerify?.status_verify ??
          verifyData?.StatusVerify?.status_verify ??
          "ยังไม่ได้ส่งคำขอ";
        setVerifyStatus(v);
      } catch (error) {
        console.error("โหลดข้อมูลอาจารย์ล้มเหลว:", error);
      } finally {
        setStaffLoading(false);
      }
    };
    loadStaff();
  }, []);

  // ตั้งค่า avatar เริ่มต้น → ใช้รูป "ล่าสุด" ถ้ามีหลายรูป
  useEffect(() => {
    const images = academicstaff?.User?.ProfileImage ?? [];
    const latest = images?.length ? images[images.length - 1] : undefined;
    const url = latest?.image_url;
    setAvatarUrl(url ? fileURL(url) : undefined);
  }, [academicstaff]);

  // โหลดนักศึกษา + บริษัทสรุป (เฉพาะกรณี "รับรอง")
  useEffect(() => {
    (async () => {
      if (!userId) return;

      if (!isVerified) {
        setStudents([]);
        setCompanySummary([]);
        return;
      }

      const uid = Number(userId);
      setStudentsLoading(true);
      try {
        if (USE_MOCK_DATA) {
          setStudents([]);
          setCompanySummary([]);
        } else {
          // 1) โหลดนักศึกษา
          const resStd = await GetAdviseeStudents(uid);
          if (resStd?.status === 200) {
            const data = resStd.data?.students ?? resStd.data ?? [];
            setStudents(data as StudentForAdvisor[]);
          } else {
            throw new Error(resStd?.data?.error || "load students failed");
          }

          // 2) โหลดสรุปบริษัท
          const resSum = await GetAdviseeCompanySummary(uid);
          if (resSum?.status === 200) {
            const data = resSum.data?.companies ?? resSum.data ?? [];
            setCompanySummary(data as CompanySummaryItem[]);
          } else {
            throw new Error(resSum?.data?.error || "load companies failed");
          }
        }
      } catch (err) {
        console.error("โหลดรายชื่อนักศึกษาที่ดูแล/สรุปบริษัท ล้มเหลว:", err);
        message.error("ไม่สามารถโหลดข้อมูลนักศึกษา/บริษัทได้");
        if (!USE_MOCK_DATA) {
          setStudents([]);
          setCompanySummary([]);
        }
      } finally {
        setStudentsLoading(false);
      }
    })();
  }, [userId, isVerified]);

  const onEditSection = (section: "contact" | "address" | "personal") => setEditSection(section);

  // ✅ การ์ดแจ้งเตือนเมื่อยังไม่ได้รับการรับรอง
  const NotVerifiedNotice = (
    <Alert
      type="warning"
      showIcon
      message={
        <span style={{ fontWeight: 600 }}>
          <LockOutlined /> ยังไม่สามารถเข้าถึงข้อมูลนักศึกษาและสรุปบริษัทได้
        </span>
      }
      description={
        <span>
          สถานะการรับรองปัจจุบัน: <b>{verifyStatus}</b>
          <br />
          โปรดส่งคำขอรับรอง/รอการอนุมัติจากผู้ดูแลระบบก่อน จึงจะสามารถดูข้อมูล “นักศึกษาที่ดูแล” และ
          “บริษัทที่นักศึกษาไปฝึก” ได้
        </span>
      }
      style={{ marginBottom: 16 }}
    />
  );

  return (
    <Layout>
      <CompanyHeader />

      {/* Loader รวม (โหลดข้อมูล) */}
      {isLoading && (
        <CoopMatchLoader
          overlay
          animation="wave-fold"
          primaryColor="#2473b2"
          progressMode="indeterminate"
          text="กำลังโหลดข้อมูลอาจารย์และนักศึกษา..."
        />
      )}

      {/* Loader อัปโหลดรูป */}
      {isUploading && (
        <CoopMatchLoader
          overlay
          animation="bounce-assemble"
          primaryColor="#2473b2"
          progressMode="indeterminate"
          text="กำลังอัปโหลดรูปโปรไฟล์..."
        />
      )}

      <Layout className={`academicstaff-layout ${isMobile ? 'academicstaff-mobile' : ''} ${isTablet ? 'academicstaff-tablet' : ''}`}>
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
                        src={avatarUrl}
                        size={120}
                        icon={!avatarUrl ? <UserOutlined /> : undefined}
                        style={{ border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                      />
                    </label>

                    <button
                      type="button"
                      className="student-avatar-edit-icon"
                      title="เปลี่ยนรูปโปรไฟล์"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      <EditOutlined />
                    </button>

                    {/* input ตัวเดียวสำหรับทั้ง Avatar และปุ่มดินสอ */}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleImageUpload}
                    />
                  </div>

                  <p className="academicstaff-name">
                    {academicstaff?.academic_position} {academicstaff?.first_name} {academicstaff?.last_name}
                  </p>
                  <p className="student-university-major">
                    {academicstaff?.University?.name_th || "-"} <br />
                  </p>
                  <p className="student-major">{academicstaff?.Faculty?.name_th || "-"}</p>

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
                  <div className="section-header">
                    <h4>
                      <UserOutlined style={{ color: "#0d47a1" }} /> ข้อมูลส่วนตัว
                    </h4>
                    {/* <button className="edit-profile-button" onClick={() => onEditSection("personal")}>
                      <EditOutlined /> แก้ไข
                    </button> */}
                  </div>
                  <div style={{ padding: "0px 24px 0px 24px" }}>
                    <Descriptions column={{ xs: 1, sm: 2, md: 3, lg: 4 }}>
                      <Descriptions.Item label="ตำแหน่ง">
                        {academicstaff?.academic_position || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="เพศ">{academicstaff?.Gender?.name_th || "-"}</Descriptions.Item>
                      <Descriptions.Item label="วันเกิด">
                        {academicstaff?.birthday ? dayjs(academicstaff.birthday).format("DD/MM/YYYY") : "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="มหาวิทยาลัย">
                        {academicstaff?.University?.name_th || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="คณะ">{academicstaff?.Faculty?.name_th || "-"}</Descriptions.Item>
                      <Descriptions.Item label="สาขา">{academicstaff?.Program?.name_th || "-"}</Descriptions.Item>
                    </Descriptions>
                  </div>

                  <div className="academicstaff-section-header">
                    <h4>
                      <UserOutlined style={{ color: "#0d47a1" }} /> ข้อมูลติดต่อ
                    </h4>
                    <button className="academicstaff-edit-button" onClick={() => onEditSection("contact")}>
                      <EditOutlined /> แก้ไข
                    </button>
                  </div>
                  <div style={{ padding: "0px 24px 0px 24px" }}>
                    <Descriptions column={{ xs: 1, sm: 2, md: 3, lg: 4 }}>
                      <Descriptions.Item label="เว็บไซต์">
                        {linkOrDash(academicstaff?.Contact?.website, safeHttp(academicstaff?.Contact?.website))}
                      </Descriptions.Item>
                      <Descriptions.Item label="ไลน์">
                        {linkOrDash(academicstaff?.Contact?.line, toLine(academicstaff?.Contact?.line))}
                      </Descriptions.Item>
                      <Descriptions.Item label="เบอร์">
                        {linkOrDash(academicstaff?.Contact?.phone_number, toTel(academicstaff?.Contact?.phone_number))}
                      </Descriptions.Item>
                      <Descriptions.Item label="เฟสบุ๊ค">
                        {linkOrDash(academicstaff?.Contact?.facebook, toFb(academicstaff?.Contact?.facebook))}
                      </Descriptions.Item>
                      <Descriptions.Item label="อีเมล">
                        {linkOrDash(academicstaff?.Contact?.email, toMail(academicstaff?.Contact?.email))}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>

                  <div className="academicstaff-section-header">
                    <h4>
                      <EnvironmentOutlined style={{ color: "#0d47a1" }} /> ที่อยู่
                    </h4>
                    <button className="academicstaff-edit-button" onClick={() => onEditSection("address")}>
                      <EditOutlined /> แก้ไข
                    </button>
                  </div>
                  <div style={{ padding: "0px 24px 0px 24px" }}>
                    <Descriptions column={{ xs: 1, sm: 2, md: 3, lg: 4 }}>
                      <Descriptions.Item label="บ้านเลขที่">
                        {academicstaff?.Address?.house_number || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="หมู่บ้าน">{academicstaff?.Address?.village || "-"}</Descriptions.Item>
                      <Descriptions.Item label="ซอย">{academicstaff?.Address?.sub_street || "-"}</Descriptions.Item>
                      <Descriptions.Item label="ถนน">{academicstaff?.Address?.street || "-"}</Descriptions.Item>
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
              </div>
            </Card>
          </div>

          {/* CONTENT ROWS */}
          <Row gutter={[{ xs: 8, sm: 12, md: 16, lg: 20 }, { xs: 16, sm: 20, md: 24, lg: 28 }]}>
            <Col span={24}>
              {/* แจ้งเตือนถ้ายังไม่รับรอง */}
              {!isVerified && NotVerifiedNotice}

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
                    disabled: !isVerified,
                    children: (
                      <Card
                        title={
                          <div className="card-title">
                            <div className="card-title__icon card-title__icon--blue">
                              <TeamOutlined />
                            </div>
                            <div>
                              <div className="card-title__text">นักศึกษาที่ดูแล</div>
                              <div className="card-title__subtext">รายชื่อและข้อมูลการฝึกงานของนักศึกษา</div>
                            </div>
                          </div>
                        }
                        className="academicstaff-profile-card advisor-students-card"
                        headStyle={{ borderBottom: "0" }}
                      >
                        {studentsLoading ? (
                          <Skeleton active paragraph={{ rows: 8 }} />
                        ) : students.length === 0 ? (
                          <div className="empty-center-wrap">
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description={
                                <div className="enty">
                                  <div>ยังไม่มีนักศึกษาที่ดูแล</div>
                                  <div className="empty-subtext">นักศึกษาจะปรากฏที่นี่เมื่อได้รับการมอบหมาย</div>
                                </div>
                              }
                            />
                          </div>
                        ) : (
                          <Table<StudentForAdvisor>
                            dataSource={students}
                            rowKey="id"
                            size="middle"
                            sticky
                            tableLayout="fixed"
                            scroll={{ x: 1200 }}
                            className="table-zebra nice-table"
                            // ✅ คลิกทั้งแถวไปโปรไฟล์นักศึกษา
                            onRow={(record) => ({
                              onClick: () => {
                                // NOTE: ถ้า field user id จริงชื่ออื่น เช่น user_id → เปลี่ยนตามจริง
                                navigate(`/profile/${record.user_id}`);
                              },
                              style: { cursor: "pointer" },
                            })}
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
                            rowClassName={(_, index) => (index % 2 === 0 ? "table-row-even" : "table-row-odd")}
                            columns={[
                              {
                                title: <div className="th-title">นักศึกษา</div>,
                                key: "name",
                                width: 260,
                                align: "center",
                                render: (_, record) => {
                                  const fullName = `${record.prefix_name ?? ""}${record.first_name} ${record.last_name}`.trim();
                                  const src = toSrc(record.avatar_url);
                                  return (
                                    <div className="cell-student">
                                      <Avatar
                                        size={44}
                                        src={src}
                                        icon={!src ? <UserOutlined /> : undefined}
                                        className="cell-student__avatar"
                                      />
                                      <div className="cell-student__namewrap">
                                        <div className="cell-student__name">{fullName}</div>
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
                                align: "center",
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
                                        gpa >= 3.5 ? "tag-chip--green" : gpa >= 3.0 ? "tag-chip--amber" : "tag-chip--red"
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
                                align: "center",
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
                                className: "col-hide-sm",
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
                                    ci.status === "ผ่าน"
                                      ? "tag-chip--green"
                                      : ci.status === "เสร็จสิ้น"
                                      ? "tag-chip--blue"
                                      : ci.status === "รอเริ่ม"
                                      ? "tag-chip--amber"
                                      : "tag-chip--gold";
                                  return <Tag className={`tag-chip ${cls} ellipsis-1`}>{ci.status}</Tag>;
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
                    disabled: !isVerified,
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
                          <div className="empty-center-wrap">
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description={
                                <div className="enty">
                                  <div>ยังไม่มีข้อมูลบริษัทที่นักศึกษาไปฝึก</div>
                                  <div className="empty-subtext">ข้อมูลจะปรากฏเมื่อนักศึกษาเริ่มฝึกงาน</div>
                                </div>
                              }
                            />
                          </div>
                        ) : (
                          <Table<CompanySummaryItem>
                            dataSource={companySummary}
                            rowKey={(r) => `${r.company_id}-${r.company_name}`}
                            size="middle"
                            tableLayout="fixed"
                            className="table-zebra nice-table"
                            // ✅ คลิกทั้งแถวไปหน้าโปรไฟล์บริษัท
                            onRow={(record) => ({
                              onClick: () => navigate(`/company-profile/${record.company_id}`),
                              style: { cursor: "pointer" },
                            })}
                            pagination={{
                              pageSize: 8,
                              showSizeChanger: true,
                              showTotal: (total, range) => (
                                <span className="pagination-total">
                                  แสดง {range[0]}-{range[1]} จาก {total} บริษัท
                                </span>
                              ),
                            }}
                            rowClassName={(_, index) => (index % 2 === 0 ? "table-row-even" : "table-row-odd")}
                            expandable={{
                              expandedRowRender: (record) => (
                                <div className="company-expand">
                                  <div className="company-expand__title">
                                    🎓 รายชื่อนักศึกษาทั้งหมด ({record.students.length} คน)
                                  </div>
                                  <div className="company-expand__grid">
                                    {record.students.map((s) => {
                                      const stuSrc = toSrc(s.avatar_url);
                                      return (
                                        <div className="company-expand__item" key={s.id}>
                                          <Avatar
                                            size={36}
                                            src={stuSrc}
                                            icon={!stuSrc ? <UserOutlined /> : undefined}
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
                                      );
                                    })}
                                  </div>
                                </div>
                              ),
                              rowExpandable: (record) => record.students && record.students.length > 0,
                              expandIconColumnIndex: 0,
                              // ✅ กันคลิกลามไป onRow
                              expandIcon: ({ expanded, onExpand, record }) => (
                                <button
                                  className={`expand-btn ${expanded ? "is-open" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onExpand(record, e);
                                  }}
                                  aria-label={expanded ? "ย่อ" : "ขยาย"}
                                >
                                  <span className="expand-btn__chev">{expanded ? "−" : "+"}</span>
                                </button>
                              ),
                            }}
                            columns={[
                              {
                                title: <div className="th-title">บริษัท</div>,
                                dataIndex: "company_name",
                                key: "company_name",
                                width: 360,
                                render: (company_name, record) => {
                                  const logoSrc = toSrc(record.logo_url);
                                  return (
                                    <div className="cell-company-main">
                                      <Avatar
                                        shape="square"
                                        size={56}
                                        src={logoSrc}
                                        icon={!logoSrc ? <BankOutlined /> : undefined}
                                        className="cell-company-main__logo"
                                      />
                                      <div className="cell-company-main__textwrap">
                                        <div className="cell-company-main__name">{company_name}</div>
                                        <div className="cell-company-main__tagline">องค์กรพันธมิตร</div>
                                      </div>
                                    </div>
                                  );
                                },
                              },
                              {
                                title: <div className="th-title th-center">จำนวนนักศึกษา</div>,
                                dataIndex: "student_count",
                                key: "student_count",
                                width: 360,
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
                                width: 360,
                                render: (students: StudentForAdvisor[]) => (
                                  <div className="students-preview">
                                    {students.slice(0, 3).map((s, index) => {
                                      const sSrc = toSrc(s.avatar_url);
                                      return (
                                        <div
                                          key={s.id}
                                          className={`students-preview__row ${index % 2 === 0 ? "is-alt" : ""}`}
                                        >
                                          <Avatar
                                            size={28}
                                            src={sSrc}
                                            icon={!sSrc ? <UserOutlined /> : undefined}
                                            className="students-preview__avatar"
                                          />
                                          <div className="students-preview__name ellipsis-1">
                                            {(s.prefix_name ?? "") + s.first_name + " " + s.last_name}
                                          </div>
                                        </div>
                                      );
                                    })}
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

          {academicstaff && editSection && (
            <EditProfileCompanyModal
              open={!!editSection}
              section={editSection}
              initialData={academicstaff}
              onClose={() => {
                setEditSection(null);
                const userIdString = localStorage.getItem("id");
                if (userIdString) {
                  GetAcademicStaffByUserId(Number(userIdString)).then(setAcademicStaff);
                }
              }}
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AcademicStaffProfile;
