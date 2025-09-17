import React, { useEffect, useState } from "react";
import { Layout, Avatar, Card, Descriptions, Result } from "antd";
import { BookOutlined, EnvironmentOutlined, UserOutlined } from "@ant-design/icons";
import { useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";

import CoopMatchHeader from "../../Component/Coop_MatchHeader";
import CoopMatchLoader from "../../Component/loading";

import { GetStudentByUserId } from "../../../services/https";
import type { StudentInterface } from "../../../interfaces/Student";
import { fileURL } from "@/config/env";
import "./StudentProfile.css";

// ✅ NEW: import ApplicationListCard (ต้องเป็นเวอร์ชันที่รองรับ prop userId)
import ApplicationListCard from "./ApplicationListCard";
import CompanyHeader from "@/pages/Component/CompanyHeader";
import CoopMatchHeaderDefault from "@/pages/Component/CoopMatchHeaderDefault";
import AcademicStaffHeader from "@/pages/Component/AcademicStaffHeader";

const { Content } = Layout;
const getStoredRoleId = (): number => {
  const raw = localStorage.getItem("roleId");
  return raw ? Number(raw) : 0;
};

const RoleHeader: React.FC = () => {
  const [roleId, setRoleId] = useState<number>(getStoredRoleId());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "roleId") {
        setRoleId(getStoredRoleId());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  switch (roleId) {    
    case 2:
      return <CompanyHeader />;
    case 3:
      return <CoopMatchHeader />;
    case 4:
      return <AcademicStaffHeader />;
    default:
      return <CoopMatchHeaderDefault />;
  }
};
const ProfileCard: React.FC<{ student?: StudentInterface }> = ({ student }) => {
  const edu = student?.Education?.[0];

  return (
    <Card bordered className="student-profile-card">
      <div className="student-profile-container">
        {/* Left */}
        <div className="student-profile-left">
          <div className="student-avatar-container">
            <Avatar
              src={fileURL(student?.User?.ProfileImage?.[0]?.image_url)}
              size={120}
              icon={!student?.User?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
              style={{ border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
            />
          </div>

          <p className="student-name">
            {student?.first_name} {student?.last_name}
          </p>

          <p className="student-university-major">
            {edu?.University?.name_th || "-"} <br />
            {edu?.Faculty?.name_th || "-"} - {edu?.Program?.name_th || "-"}
          </p>

          <p className="student-major">{edu?.Program?.name_th || "-"}</p>
        </div>

        {/* Right */}
        <div className="student-profile-details">
          {/* Personal */}
          <div className="section-header">
            <h4>
              <UserOutlined style={{ color: "#0d47a1" }} /> ข้อมูลทั่วไป
            </h4>
          </div>
          <div style={{ padding: "0px 24px 0px 24px" }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 3, lg: 4 }}>
              <Descriptions.Item label="เพศ">{student?.Gender?.name || "-"}</Descriptions.Item>
              <Descriptions.Item label="วันเกิด">{student?.birthday ? dayjs(student.birthday).format("DD/MM/YYYY") : "-"}</Descriptions.Item>
              <Descriptions.Item label="เบอร์">{student?.phone_number || "-"}</Descriptions.Item>
              <Descriptions.Item label="อายุ">{student?.age || "-"}</Descriptions.Item>
              <Descriptions.Item label="สัญชาติ">{student?.nationality || "-"}</Descriptions.Item>
              <Descriptions.Item label="ศาสนา">{student?.religion || "-"}</Descriptions.Item>
              <Descriptions.Item label="น้ำหนัก">{student?.weight} ก.</Descriptions.Item>
              <Descriptions.Item label="ส่วนสูง">{student?.height} ซม.</Descriptions.Item>
            </Descriptions>
          </div>

          {/* Education */}
          <div className="section-header">
            <h4>
              <BookOutlined style={{ color: "#0d47a1" }} /> ข้อมูลการศึกษา
            </h4>
          </div>
          <div style={{ padding: "0px 24px 0px 24px" }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
             <Descriptions.Item label="GPX">{edu?.grade}</Descriptions.Item>
              <Descriptions.Item label="อีเมล">{student?.User?.Email || "-"}</Descriptions.Item>
              <Descriptions.Item label="คณะ">{edu?.Program?.name_th || "-"}</Descriptions.Item>
              <Descriptions.Item label="สาขา">{edu?.Faculty?.name_th || "-"}</Descriptions.Item>
              <Descriptions.Item label="ระดับการศึกษา">{edu?.EducationLevel?.name || "-"}</Descriptions.Item>
              <Descriptions.Item label="ชั้นปี">{edu?.year || "-"}</Descriptions.Item>
            </Descriptions>
          </div>

          {/* Address */}
          <div className="section-header">
            <h4>
              <EnvironmentOutlined style={{ color: "#0d47a1" }} /> พื้นที่อาศัย 
            </h4>
          </div>
          <div style={{ padding: "0px 24px 0px 24px" }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 3, lg: 4 }}>
              <Descriptions.Item label="บ้านเลขที่">{student?.Address?.house_number}</Descriptions.Item>
              <Descriptions.Item label="หมู่บ้าน">{student?.Address?.village}</Descriptions.Item>
              <Descriptions.Item label="ซอย">{student?.Address?.sub_street}</Descriptions.Item>
              <Descriptions.Item label="ถนน">{student?.Address?.street}</Descriptions.Item>
              <Descriptions.Item label="ตำบล/แขวง">{student?.Address?.SubDistrict?.name_th}</Descriptions.Item>
              <Descriptions.Item label="อำเภอ/เขต">{student?.Address?.District?.name_th}</Descriptions.Item>
              <Descriptions.Item label="จังหวัด">{student?.Address?.Province?.name_th}</Descriptions.Item>
              <Descriptions.Item label="รหัสไปรษณีย์">{student?.Address?.Postcode?.post_code}</Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      </div>
    </Card>
  );
};

const StudentProfilePublic: React.FC = () => {
  const { userId: userIdParam } = useParams<{ userId?: string }>();
  const [query] = useSearchParams();

  const [student, setStudent] = useState<StudentInterface | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // รับ userId จาก path param หรือ query (?userId=)
  const resolvedUserId = (() => {
    if (userIdParam && !isNaN(Number(userIdParam))) return Number(userIdParam);
    const q = query.get("userId");
    if (q && !isNaN(Number(q))) return Number(q);
    return undefined;
  })();

  useEffect(() => {
    const fetchData = async () => {
      if (!resolvedUserId) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await GetStudentByUserId(resolvedUserId);
        if (!data) {
          setNotFound(true);
        } else {
          setStudent(data);
        }
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resolvedUserId]);

  return (
    <Layout>
      {loading && (
        <CoopMatchLoader overlay animation="puzzle-fold" progressMode="indeterminate" text="กำลังโหลดโปรไฟล์..." />
      )}

      <RoleHeader />
      <Layout className="student-layout">
        <Content>
          <div className="student-profile-title">
            <span className="student-profile-text">Student Profile</span>
            <div className="student-profile-line" />
          </div>

          {notFound ? (
            <Result
              status="404"
              title="ไม่พบโปรไฟล์"
              subTitle={resolvedUserId ? `ไม่พบผู้ใช้ userId = ${resolvedUserId}` : "กรุณาระบุ userId ใน URL"}
            />
          ) : (
            <>
              <ProfileCard student={student} />

              {/* ✅ NEW: แสดงรายการที่ผู้ใช้คนนี้สมัคร (ใช้ userId จาก URL) */}
              {resolvedUserId && (
                <div style={{ marginTop: 16 }}>
                  <ApplicationListCard userId={resolvedUserId} />
                </div>
              )}
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentProfilePublic;
