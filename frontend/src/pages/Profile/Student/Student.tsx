import React, { useContext, useEffect, useState } from "react";
import {
  Layout,
  Avatar,
  Card,
  Descriptions,
} from "antd";
import { BookOutlined, EditOutlined, EnvironmentOutlined, UserOutlined } from "@ant-design/icons";
import { GetStudentByUserId, UpdateProfileImage } from "../../../services/https";
import type { StudentInterface } from "../../../interfaces/Student";
import "./StudentProfile.css";
import CoopMatchHeader from "../../Component/Coop_MatchHeader";
import dayjs from "dayjs";
import EditProfileModal from "../Student/Edit/Popup";
import StudentCalendarCard from "./StudentCalendar";
import ApplicationListCard from "./ApplicationListCard";
import { fileURL } from "@/config/env";

// ✅ เพิ่ม Loader
import CoopMatchLoader from '../../Component/loading';
import { UserContext } from "@/components/UserContext";

const { Content } = Layout;

const ProfileCard: React.FC<{
  student?: StudentInterface;
  onEditSection: (section: "personal" | "education" | "address") => void;
  onImageUpdated: (newImageUrl: string) => void;
  // ✅ แจ้งสถานะอัปโหลดให้ parent เพื่อเปิด/ปิด Loader กลางจอ
  onUploadStatusChange?: (uploading: boolean) => void;
}> = ({ student, onEditSection, onImageUpdated, onUploadStatusChange }) => {
  const firstEducation = student?.Education?.[0];
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && student?.User?.ID) {
      const formData = new FormData();
      formData.append("user_id", String(student.User.ID));
      formData.append("image", file);

      setUploading(true);
      onUploadStatusChange?.(true);
      try {
        const res = await UpdateProfileImage(student.User.ID, formData);
        if (res?.status === 200 && res.data?.data?.image_url) {
          onImageUpdated(res.data.data.image_url); // ส่ง URL กลับให้ StudentProfile
        }
      } finally {
        setUploading(false);
        onUploadStatusChange?.(false);
        // เคลียร์ค่า input เพื่อให้อัปโหลดไฟล์เดิมซ้ำได้
        (event.target as HTMLInputElement).value = "";
      }
    }
  };

  return (
    <Card bordered className="student-profile-card">
      <div className="student-profile-container">
        <div className="student-profile-left">
          <div className="student-avatar-container">
            <label style={{ cursor: uploading ? "not-allowed" : "pointer" }}>
              <Avatar
                src={fileURL(student?.User?.ProfileImage?.[0]?.image_url)}
                size={120}
                icon={!student?.User?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
                style={{ border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
              />
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>

            {/* Edit icon overlay (คลิกได้เหมือนกัน) */}
            <label className="student-avatar-edit-icon" title="เปลี่ยนรูปโปรไฟล์">
              <EditOutlined />
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <p className="student-name">
            {student?.first_name} {student?.last_name}
          </p>
          <p className="student-university-major">
            {firstEducation?.University?.name_th || "-"} <br />
            {firstEducation?.Faculty?.name_th || "-"} - {firstEducation?.Program?.name_th || "-"}
          </p>
          <p className="student-major">
            {firstEducation?.Program?.name_th || "-"}
          </p>
        </div>

        <div className="student-profile-details">
          <div className="section-header">
            <h4><UserOutlined style={{ color: "#0d47a1" }} /> ข้อมูลส่วนตัว</h4>
            <button className="edit-profile-button" onClick={() => onEditSection("personal")}>
              <EditOutlined /> แก้ไข
            </button>
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

          <div className="section-header">
            <h4><BookOutlined style={{ color: "#0d47a1" }} /> ข้อมูลการศึกษา</h4>
            <button className="edit-profile-button" onClick={() => onEditSection("education")}>
              <EditOutlined /> แก้ไข
            </button>
          </div>
          <div style={{ padding: "0px 24px 0px 24px" }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="GPX">{firstEducation?.grade}</Descriptions.Item>
              <Descriptions.Item label="อีเมล">{student?.User?.Email || "-"}</Descriptions.Item>
              <Descriptions.Item label="คณะ">{firstEducation?.Program?.name_th || "-"}</Descriptions.Item>
              <Descriptions.Item label="สาขา">{firstEducation?.Faculty?.name_th || "-"}</Descriptions.Item>
              <Descriptions.Item label="ระดับการศึกษา">{firstEducation?.EducationLevel?.name || "-"}</Descriptions.Item>
              <Descriptions.Item label="ชั้นปี">{firstEducation?.year || "-"}</Descriptions.Item>
            </Descriptions>
          </div>

          <div className="section-header">
            <h4><EnvironmentOutlined style={{ color: "#0d47a1" }} /> ที่อยู่</h4>
            <button className="edit-profile-button" onClick={() => onEditSection("address")}>
              <EditOutlined /> แก้ไข
            </button>
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

const StudentProfile: React.FC = () => {
  const [student, setStudent] = useState<StudentInterface | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [section, setSection] = useState<"personal" | "education" | "address">("personal");
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const { loading: authLoading } = useContext(UserContext);

  // ✅ สถานะโหลดหน้า + อัปโหลดรูป
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
   const userIdString = localStorage.getItem("id");
const showLoader = !authLoading && (loadingStudent || uploadingImage);
  const loaderText = uploadingImage ? "กำลังอัปโหลดรูปโปรไฟล์..." : "กำลังโหลดโปรไฟล์นักศึกษา...";
  useEffect(() => {
    loadStudent();
  }, []);

  const loadStudent = async () => {
    setLoadingStudent(true);
    try {
      if (userIdString) {
        const userId = Number(userIdString);
        if (!isNaN(userId)) {
          const studentData = await GetStudentByUserId(userId);
          setStudent(studentData);
        }
      }
    } catch (error) {
      console.error("ไม่พบข้อมูลนักเรียนหรือเกิดข้อผิดพลาด:", error);
    } finally {
      setLoadingStudent(false);
    }
  };

  const handleImageUpdated = (newImageUrl: string) => {
    if (student && student.User?.ProfileImage?.[0]) {
      const updatedStudent = {
        ...student,
        User: {
          ...student.User,
          ProfileImage: [
            {
              ...student.User.ProfileImage[0],
              image_url: newImageUrl,
            },
          ],
        },
      };
      setStudent(updatedStudent);
      setImageRefreshKey((prev) => prev + 1); // ✅ รีเฟรช Header
    }
  };
  
  return (
    <Layout>
      {/* ✅ Loader Overlay สำหรับหน้า/อัปโหลดรูป */}
      {showLoader && (
        <CoopMatchLoader
          overlay
          animation={uploadingImage ? "piece-rotate" : "puzzle-fold"}
          progressMode="indeterminate"
          text={loaderText}
        />
      )}

      <CoopMatchHeader key={imageRefreshKey} />
      <Layout className="student-layout">
        <Content>
          <div className="student-profile-title">
            <span className="student-profile-text">Student Profile</span>
            <div className="student-profile-line" />
          </div>

          <ProfileCard
            student={student}
            onEditSection={(sec) => {
              setSection(sec);
              setModalOpen(true);
            }}
            onImageUpdated={handleImageUpdated}
            onUploadStatusChange={setUploadingImage} // ✅ รับสถานะจากลูก
          />

          <div className="student-dashboard-section">
            <div className="application-list-wrapper">
              {userIdString && <ApplicationListCard userId={Number(userIdString)} />}
            </div>
            <div className="calendar-card-wrapper">
              <StudentCalendarCard />
            </div>
          </div>

          <EditProfileModal
            open={modalOpen}
            section={section}
            onClose={() => {
              setModalOpen(false);
              loadStudent(); // รีโหลดข้อมูลหลังปิด Modal
            }}
            initialData={student}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentProfile;
