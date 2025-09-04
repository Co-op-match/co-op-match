// import React, { useEffect, useState } from "react";
// import {
//   Layout,
//   Avatar,
//   Card,
//   Descriptions,
//   Table,
//   Calendar,
//   Badge,
//   Divider,
// } from "antd";
// import { EditOutlined, UserOutlined } from "@ant-design/icons";
// import { GetStudentByUserId } from "../../../services/https";
// import type { StudentInterface } from "../../../interfaces/Student";
// import "./StudentProfile.css";
// import CoopMatchHeader from '../../Component/CompanyHeader';
// import dayjs from "dayjs";

// // ✅ เพิ่ม Loader
// import CoopMatchLoader from "../../Component/loading";

// const { Content } = Layout;

// const ProfileCard: React.FC<{ student?: StudentInterface }> = ({ student }) => {
//   const firstEducation =
//     student?.Education && student.Education.length > 0
//       ? student.Education[0]
//       : undefined;

//   return (
//     <Card bordered style={{ marginBottom: 20 }}>
//       <div className="student-profile-container">
//         {/* ซ้าย */}
//         <div className="student-profile-left">
//           <div className="student-avatar-container">
//             <Avatar
//               src={
//                 student?.User?.ProfileImage?.[0]?.image_url
//                   ? `http://localhost:8000${student?.User?.ProfileImage[0].image_url}`
//                   : undefined
//               }
//               size={120}
//               icon={!student?.User?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
//             />
//             <div className="student-avatar-edit-icon">
//               <EditOutlined />
//             </div>
//           </div>
//           <p className="student-name">
//             {student?.first_name} {student?.last_name}
//           </p>
//           <p className="student-university">
//             {firstEducation?.University?.name_th || "Suranaree University Of Technology"}
//           </p>
//           <p className="student-major">
//             {firstEducation?.Faculty?.name_th|| "Computer Engineering"}
//           </p>
//         </div>

//         {/* เส้น Divider แนวตั้ง */}
//         <Divider type="vertical" className="studdent-vertical-divider" />

//         {/* ขวา */}
//         <div className="student-profile-details">
//           <Descriptions column={4}>
//             <Descriptions.Item label="เพศ">
//               {student?.Gender?.name || "-"}
//             </Descriptions.Item>
//             <Descriptions.Item label="วันเกิด">
//               {student?.birthday ? dayjs(student.birthday).format("DD/MM/YYYY") : "-"}
//             </Descriptions.Item>
//             <Descriptions.Item label="เบอร์">
//               {student?.phone_number || "-"}
//             </Descriptions.Item>
//             <Descriptions.Item label="อายุ">{student?.age || "-"}</Descriptions.Item>
//             <Descriptions.Item label="สัญชาติ">
//               {student?.nationality || "-"}
//             </Descriptions.Item>
//             <Descriptions.Item label="ศาสนา">
//               {student?.religion || "-"}
//             </Descriptions.Item>
//             <Descriptions.Item label="น้ำหนัก">
//               {student?.weight} ก.
//             </Descriptions.Item>
//             <Descriptions.Item label="ส่วนสูง">
//               {student?.height} ซม.
//             </Descriptions.Item>
//           </Descriptions>

//           <div className="studdent-divider-section"></div>
//           <Divider className="studdent-divider" />

//           <Descriptions column={4}>
//             <Descriptions.Item label="GPX">{firstEducation?.grade}</Descriptions.Item>
//             <Descriptions.Item label="อีเมล">
//               {student?.User?.Email || "-"}
//             </Descriptions.Item>
//             <Descriptions.Item label="คณะ">
//               {firstEducation?.Program?.name_th || "-"}
//             </Descriptions.Item>
//             <Descriptions.Item label="สาขา">{firstEducation?.Faculty?.name_th || "-"}</Descriptions.Item>
//             <Descriptions.Item label="ระดับการศึกษา">
//               {firstEducation?.EducationLevel.name || "-"}
//             </Descriptions.Item>
//             <Descriptions.Item label="ชั้นปี">{firstEducation?.year || "-"}</Descriptions.Item>
//           </Descriptions>

//           <div className="studdent-divider-section">
//             <Divider className="studdent-divider" />
//             <Descriptions column={4}>
//               <Descriptions.Item label="บ้านเลขที่">
//                 {student?.Address?.house_number}
//               </Descriptions.Item>
//               <Descriptions.Item label="หมู่บ้าน">
//                 {student?.Address?.village}
//               </Descriptions.Item>
//               <Descriptions.Item label="ซอย">
//                 {student?.Address?.sub_street}
//               </Descriptions.Item>
//               <Descriptions.Item label="ถนน">{student?.Address?.street}</Descriptions.Item>
//               <Descriptions.Item label="ตำบล/แขวง">
//                 {student?.Address?.SubDistrict?.name_th}
//               </Descriptions.Item>
//               <Descriptions.Item label="อำเภอ/เขต">
//                 {student?.Address?.District?.name_th}
//               </Descriptions.Item>
//               <Descriptions.Item label="จังหวัด">
//                 {student?.Address?.Province?.name_th}
//               </Descriptions.Item>
//               <Descriptions.Item label="รหัสไปรษณีย์">
//                 {student?.Address?.Postcode?.post_code}
//               </Descriptions.Item>
//             </Descriptions>
//           </div>
//         </div>
//       </div>
//     </Card>
//   );
// };

// const JobTable: React.FC = () => {
//   const columns = [
//     { title: "ลำดับ", dataIndex: "index", key: "index" },
//     { title: "บริษัท", dataIndex: "company", key: "company" },
//     { title: "สถานะ", dataIndex: "status", key: "status" },
//     { title: "ข้อมูล", dataIndex: "info", key: "info" },
//   ];

//   const data = [
//     {
//       key: "1",
//       index: 1,
//       company: "ตัวอย่างบริษัท",
//       status: <span style={{ color: "orange" }}>รอสัมภาษณ์</span>,
//       info: "ดู",
//     },
//   ];

//   return <Table columns={columns} dataSource={data} pagination={false} />;
// };

// const CalendarCard: React.FC = () => (
//   <Card title="ปฏิทินแจ้งเตือน" bordered>
//     <Calendar fullscreen={false} />
//     <div className="student-calendar-footer">
//       <Badge status="success" text="No upcoming events" />
//     </div>
//   </Card>
// );

// const StudentProfile: React.FC = () => {
//   const [student, setStudent] = useState<StudentInterface | undefined>(undefined);

//   // ✅ สถานะ Loader หน้าโปรไฟล์
//   const [loadingPage, setLoadingPage] = useState(true);
//   const [pagePct, setPagePct] = useState(0);
//   const [loadingText, setLoadingText] = useState("กำลังโหลดโปรไฟล์นักศึกษา...");

//   useEffect(() => {
//     const loadStudent = async () => {
//       setLoadingPage(true);
//       setLoadingText("กำลังโหลดโปรไฟล์นักศึกษา...");
//       setPagePct(30);
//       const userIdString = localStorage.getItem("id");

//       try {
//         if (userIdString) {
//           const userId = Number(userIdString);
//           if (!isNaN(userId)) {
//             const studentData = await GetStudentByUserId(userId);
//             setStudent(studentData);
//             setPagePct(100);
//           } else {
//             console.error("userId ที่ได้ไม่ใช่ตัวเลข");
//             setPagePct(100);
//           }
//         } else {
//           console.error("ไม่พบ id ใน localStorage");
//           setPagePct(100);
//         }
//       } catch (error) {
//         console.error("ไม่พบข้อมูลนักเรียนหรือเกิดข้อผิดพลาด:", error);
//         setPagePct(100);
//       } finally {
//         setTimeout(() => setLoadingPage(false), 250); // หน่วงเล็กน้อยให้เห็น 100%
//       }
//     };

//     loadStudent();
//   }, []);

//   return (
//     <Layout>
//       {/* ✅ Loader Overlay */}
//       {loadingPage && (
//         <CoopMatchLoader
//           overlay
//           animation="puzzle-fold"
//           progressMode="determinate"
//           progress={pagePct}
//           text={loadingText}
//           // primaryColor="#1890ff"
//           // speed={2.0}
//         />
//       )}

//       <CoopMatchHeader />
//       <Layout className="student-layout">
//         <Content>
//           <div className="student-profile-title">
//             <span className="student-profile-text">Student Profile</span>
//             <div className="student-profile-line" />
//           </div>
//           <ProfileCard student={student} />
//           <div className="student-job-calendar-section">
//             <div style={{ flex: 1 }}>
//               <JobTable />
//             </div>
//             <div className="student-calendar-card">
//               <CalendarCard />
//             </div>
//           </div>
//         </Content>
//       </Layout>
//     </Layout>
//   );
// };

// export default StudentProfile;
