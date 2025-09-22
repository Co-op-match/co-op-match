import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Layout, Avatar, Card, Descriptions, Result, Button, Tooltip, message } from "antd";
import { BookOutlined, EnvironmentOutlined, UserOutlined, MessageOutlined, WechatOutlined } from "@ant-design/icons";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import CoopMatchHeader from "../../Component/Coop_MatchHeader";
import CoopMatchLoader from "../../Component/loading";

import { GetStudentByUserId } from "../../../services/https";
import type { StudentInterface } from "../../../interfaces/Student";
import { fileURL } from "@/config/env";
import "./StudentProfile.css";

// ✅ NEW: imports สำหรับแชท
import { CreateChatRoom, createChatSession } from "../../../services/https";
import { saveChatToken } from "../../../utils/chatToken";

import ApplicationListCard from "./ApplicationListCard";
import CompanyHeader from "@/pages/Component/CompanyHeader";
import CoopMatchHeaderDefault from "@/pages/Component/CoopMatchHeaderDefault";
import AcademicStaffHeader from "@/pages/Component/AcademicStaffHeader";
import ProfileSkeleton from "./ProfileSkeleton";

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
  const navigate = useNavigate();

  const [student, setStudent] = useState<StudentInterface | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ✅ NEW: state สำหรับปุ่มแชท
  const [creatingSession, setCreatingSession] = useState(false);
  const [chatHovered, setChatHovered] = useState(false);

  // userId ของ “เจ้าของโปรไฟล์นักศึกษา” (ปลายทางแชท)
  const resolvedUserId = useMemo(() => {
    if (userIdParam && !isNaN(Number(userIdParam))) return Number(userIdParam);
    const q = query.get("userId");
    if (q && !isNaN(Number(q))) return Number(q);
    return undefined;
  }, [userIdParam, query]);

  // ผู้ใช้ปัจจุบัน
  const currentUserId = useMemo(() => {
    const raw = localStorage.getItem("id");
    return raw ? Number(raw) : null;
  }, []);

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

  // ===== helper/flow สำหรับแชท =====
  const extractRoomId = (raw: any): number | null => {
    if (!raw) return null;
    return (
      raw.room_id ??
      raw.id ??
      raw.room?.id ??
      raw.data?.room_id ??
      raw.data?.id ??
      raw.data?.room?.id ??
      null
    );
  };

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function mintSessionWithRetry(roomId: number, maxTries = 5, delayMs = 150) {
    let lastErr: any = null;
    for (let i = 0; i < maxTries; i++) {
      try {
        console.log(`🔄 Attempting to create chat session for room ${roomId} (attempt ${i + 1}/${maxTries})`);
        return await createChatSession(roomId);
      } catch (e: any) {
        lastErr = e;
        const code = e?.response?.status;
        console.log(`❌ Chat session creation failed (attempt ${i + 1}): ${code} - ${e?.response?.data?.error || e.message}`);
        
        // Retry สำหรับ 400, 403, 404, 409 (เพิ่ม 403 เพื่อจัดการ timing issue)
        if ([400, 403, 404, 409].includes(Number(code))) {
          console.log(`⏳ Waiting ${delayMs}ms before retry...`);
          await wait(delayMs);
          continue;
        }
        throw e;
      }
    }
    console.error(`❌ All ${maxTries} attempts failed for room ${roomId}`);
    throw lastErr;
  }

  const handleChatClick = useCallback(async () => {
    if (creatingSession) return;
    if (!currentUserId || !resolvedUserId) {
      message.info("กรุณาเข้าสู่ระบบก่อนเริ่มแชท");
      return;
    }
    if (currentUserId === resolvedUserId) {
      message.info("ไม่สามารถแชทกับบัญชีของตนเองได้");
      return;
    }

    setCreatingSession(true);
    try {
      // 1) สร้าง/ดึงห้องระหว่าง currentUserId ↔ resolvedUserId
      let roomId: number | null = null;
      try {
        const res = await CreateChatRoom(currentUserId, resolvedUserId);
        roomId = extractRoomId(res?.data) ?? extractRoomId(res) ?? null;
      } catch (err: any) {
        const data = err?.response?.data ?? {};
        roomId = extractRoomId(data);
        if (!roomId) {
          console.error("CreateChatRoom error:", err);
          message.error("ไม่สามารถเริ่มแชทได้ (สร้างห้องไม่สำเร็จ)");
          setCreatingSession(false);
          return;
        }
      }
      if (!roomId) {
        message.error("ไม่พบห้องแชท");
        setCreatingSession(false);
        return;
      }

      // 2) mint token (กัน timing issue) - เพิ่มการ delay เล็กน้อยให้ห้องได้ถูกสร้างเสร็จ
      console.log("🏠 Room created/found with ID:", roomId, "- waiting before creating session...");
      await wait(100); // รอ 100ms ให้การสร้างห้องเสร็จสิ้น
      const { token } = await mintSessionWithRetry(roomId, 6, 250); // เพิ่ม delay เป็น 250ms

      // 3) เก็บ token และไปหน้าแชท
      saveChatToken(token);
      navigate(`/chat/session/${token}`, { replace: true });
    } catch (e) {
      console.error("เริ่มแชทไม่สำเร็จ:", e);
      message.error("เริ่มแชทไม่สำเร็จ");
    } finally {
      setCreatingSession(false);
    }
  }, [creatingSession, currentUserId, resolvedUserId, navigate]);

  const disableChat =
    loading ||
    creatingSession ||
    !resolvedUserId ||
    !currentUserId ||
    currentUserId === resolvedUserId ||
    notFound;

  return (
    <Layout>
      {/* แสดง Loader เมื่อกำลังโหลดหรือสร้างแชท */}
      {(loading || creatingSession) && (
        <CoopMatchLoader
          overlay
          animation={creatingSession ? "bounce-assemble" : "puzzle-fold"}
          progressMode="indeterminate"
          text={creatingSession ? "กำลังเริ่มแชทกับนักศึกษา..." : "กำลังโหลดโปรไฟล์..."}
        />
      )}

      <RoleHeader />
      
      {/* แสดง content เฉพาะเมื่อโหลดเสร็จแล้วเท่านั้น */}
      {!loading ? (
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
            ) : student ? (
              <div className="student-profile-content-loaded">
                <ProfileCard student={student} />

                {/* รายการสมัครของ user นี้ */}
                {resolvedUserId && (
                  <div style={{ marginTop: 16 }}>
                    <ApplicationListCard userId={resolvedUserId} />
                  </div>
                )}
              </div>
            ) : (
              // แสดง Skeleton เมื่อยังไม่มีข้อมูล student
              <>
                <ProfileSkeleton />
                {resolvedUserId && (
                  <div style={{ marginTop: 16 }}>
                    <ApplicationListCard userId={resolvedUserId} />
                  </div>
                )}
              </>
            )}
          </Content>

          {/* ✅ NEW: Floating Chat Button */}
          {!notFound && resolvedUserId && (
            <div
              className="chat-floating-wrapper"
              style={{
                position: "fixed",
                right: 24,
                bottom: 24,
                zIndex: 1100,
              }}
            >
              <Tooltip title={disableChat ? undefined : "แชทกับนักศึกษา"} placement="left">
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  aria-label="แชทกับนักศึกษา"
                  icon={chatHovered ? <WechatOutlined /> : <MessageOutlined />}
                  onClick={handleChatClick}
                  onMouseEnter={() => setChatHovered(true)}
                  onMouseLeave={() => setChatHovered(false)}
                  className={`chat-floating-button ${chatHovered ? "hovered" : ""}`}
                  disabled={disableChat}
                  loading={creatingSession}
                />
              </Tooltip>
            </div>
          )}
        </Layout>
      ) : (
        // แสดงพื้นหลังสวยๆ เมื่อกำลังโหลด เพื่อให้ Loader เด่นขึ้น
        <div className="student-loading-background" style={{ minHeight: '100vh' }} />
      )}
    </Layout>
  );
};

export default StudentProfilePublic;
