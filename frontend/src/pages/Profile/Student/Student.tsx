import React, { useEffect, useState } from "react";
import {
  Layout,
  Avatar,
  Card,
  Descriptions,
  Table,
  Calendar,
  Badge,
  Divider,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { GetStudentByUserId } from "../../../services/https";
import type { StudentInterface } from "../../../interfaces/Student";
import "./StudentProfile.css";
import AppHeader from "../../component/header/Header";

const { Content } = Layout;

const ProfileCard: React.FC<{ student?: StudentInterface }> = ({ student }) => {
  const firstEducation =
    student?.Education && student.Education.length > 0
      ? student.Education[0]
      : undefined;

  return (
    <Card title="Student Profile" bordered style={{ marginBottom: 20 }}>
      <div className="student-profile-container">
        {/* ซ้าย */}
        <div className="student-profile-left">
          <div className="student-avatar-container">
            <Avatar size={120} icon={<UserOutlined />} />
            <div className="student-avatar-edit-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="16"
                viewBox="0 0 24 24"
                width="16"
                fill="#fff"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
              </svg>
            </div>
          </div>
          <p className="student-name">
            {student?.first_name} {student?.last_name}
          </p>
          <p>{firstEducation?.major || "Computer Engineering"}</p>
          <p>{firstEducation?.university || "Suranaree University Of Technology"}</p>
        </div>

        {/* เส้น Divider แนวตั้ง */}
        <Divider type="vertical" className="studdent-vertical-divider" />

        {/* ขวา */}
        <div className="student-profile-details">
          <Descriptions column={4}>
            <Descriptions.Item label="เพศ">
              {student?.Gender?.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="วันเกิด">
              {student?.birthday || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="เบอร์">
              {student?.phone_number || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="อายุ">{student?.age || "-"}</Descriptions.Item>
            <Descriptions.Item label="สัญชาติ">
              {student?.nationality || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="ศาสนา">
              {student?.religion || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="น้ำหนัก">
              {student?.weight} ก.
            </Descriptions.Item>
            <Descriptions.Item label="ส่วนสูง">
              {student?.height} ซม.
            </Descriptions.Item>
          </Descriptions>

          <div className="studdent-divider-section"></div>
          <Divider className="studdent-divider" />

          <Descriptions column={4}>
            <Descriptions.Item label="GPX">{firstEducation?.grade}</Descriptions.Item>
            <Descriptions.Item label="อีเมล">
              {student?.User?.Email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="คณะ">
              {firstEducation?.faculty || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="สาขา">{firstEducation?.major || "-"}</Descriptions.Item>
            <Descriptions.Item label="ระดับการศึกษา">
              {firstEducation?.education_level || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="ชั้นปี">{firstEducation?.year || "-"}</Descriptions.Item>
          </Descriptions>

          <div className="studdent-divider-section">
            <Divider className="studdent-divider" />
            <Descriptions column={4}>
              <Descriptions.Item label="บ้านเลขที่">
                {student?.Address?.house_number}
              </Descriptions.Item>
              <Descriptions.Item label="หมู่บ้าน">
                {student?.Address?.village}
              </Descriptions.Item>
              <Descriptions.Item label="ซอย">
                {student?.Address?.sub_street}
              </Descriptions.Item>
              <Descriptions.Item label="ถนน">{student?.Address?.street}</Descriptions.Item>
              <Descriptions.Item label="ตำบล/แขวง">
                {student?.Address?.subdistrict}
              </Descriptions.Item>
              <Descriptions.Item label="อำเภอ/เขต">
                {student?.Address?.district}
              </Descriptions.Item>
              <Descriptions.Item label="จังหวัด">
                {student?.Address?.province}
              </Descriptions.Item>
              <Descriptions.Item label="รหัสไปรษณีย์">
                {student?.Address?.post_code}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      </div>
    </Card>
  );
};

const JobTable: React.FC = () => {
  const columns = [
    { title: "ลำดับ", dataIndex: "index", key: "index" },
    { title: "บริษัท", dataIndex: "company", key: "company" },
    { title: "สถานะ", dataIndex: "status", key: "status" },
    { title: "ข้อมูล", dataIndex: "info", key: "info" },
  ];

  const data = [
    {
      key: "1",
      index: 1,
      company: "ตัวอย่างบริษัท",
      status: <span style={{ color: "orange" }}>รอสัมภาษณ์</span>,
      info: "ดู",
    },
  ];

  return <Table columns={columns} dataSource={data} pagination={false} />;
};

const CalendarCard: React.FC = () => (
  <Card title="ปฏิทินแจ้งเตือน" bordered>
    <Calendar fullscreen={false} />
    <div className="student-calendar-footer">
      <Badge status="success" text="No upcoming events" />
    </div>
  </Card>
);

const StudentProfile: React.FC = () => {
  const [student, setStudent] = useState<StudentInterface | undefined>(undefined);

  useEffect(() => {
    const loadStudent = async () => {
      const userIdString = localStorage.getItem("id");

      if (userIdString) {
        const userId = Number(userIdString);
        if (!isNaN(userId)) {
          try {
            const studentData = await GetStudentByUserId(userId);
            setStudent(studentData);
            console.log(studentData);
          } catch (error) {
            console.error("ไม่พบข้อมูลนักเรียนหรือเกิดข้อผิดพลาด:", error);
          }
        } else {
          console.error("userId ที่ได้ไม่ใช่ตัวเลข");
        }
      } else {
        console.error("ไม่พบ id ใน localStorage");
      }
    };

    loadStudent();
  }, []);

  return (
    <Layout>
      <AppHeader />
      <Layout className="student-layout">
        <Content>
          <ProfileCard student={student} />
          <div className="student-job-calendar-section">
            <div style={{ flex: 1 }}>
              <JobTable />
            </div>
            <div className="student-calendar-card">
              <CalendarCard />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentProfile;
