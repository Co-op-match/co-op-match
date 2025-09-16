import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layout,
  Avatar,
  Card,
  Descriptions,
  Badge,
  Button,
  Tooltip,
  Skeleton,
  message,
} from "antd";
import {
  EnvironmentOutlined,
  MessageOutlined,
  UserOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import {
  CreateChatRoom,
  createChatSession,
  GetCompanyId,
  GetVerifyByUserId,
} from "../../../services/https";
import CompanyHeader from "../../Component/CompanyHeader";
import type { CompanyInterface } from "../../../interfaces/Company";
import "./CompanyProfileView.css";
import { useNavigate, useParams } from "react-router-dom";
import CompanyReviews from "./StudentReviews";
import CompanyJobList from "./CompanyJobList";
import { saveChatToken } from "../../../utils/chatToken";
import CoopMatchLoader from "../../Component/loading";
import CoopMatchHeader from "@/pages/Component/Coop_MatchHeader";
import AcademicStaffHeader from "@/pages/Component/AcademicStaffHeader";
import CoopMatchHeaderDefault from "@/pages/Component/CoopMatchHeaderDefault";

const { Content } = Layout;
const getStoredRoleId = (): number => {
  const raw = localStorage.getItem("roleId");
  return raw ? Number(raw) : 0;
};
// ✅ ควรตั้งใน .env เช่น VITE_API_BASE_URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
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
const CompanyProfileview: React.FC = () => {
  const [company, setCompany] = useState<CompanyInterface | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<string>("ยังไม่ได้ส่งคำขอ");
  const [loading, setLoading] = useState<boolean>(true);
  const [chatHovered, setChatHovered] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const isBusy = loading || creatingSession;

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const companyId = Number(id);

  // user_id ของบริษัท (เจ้าของโปรไฟล์นี้)
  const companyOwnerUserId = company?.user_id ?? null;
  // ผู้ใช้ปัจจุบัน
  const currentUserId = useMemo(
    () => Number(localStorage.getItem("id")) || null,
    []
  );
  const extractRoomId = (raw: any): number | null => {
    if (!raw) return null;
    // รองรับหลายรูปแบบ response
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
      return await createChatSession(roomId);
    } catch (e: any) {
      lastErr = e;
      const code = e?.response?.status;
      // ถ้าเป็น 404/400/409 ให้ลองใหม่ เผื่อห้องเพิ่งสร้าง
      if ([400, 404, 409].includes(Number(code))) {
        await wait(delayMs);
        continue;
      }
      // error อื่นไม่ต้อง retry
      throw e;
    }
  }
  throw lastErr;
}
  // map badge status/สีล่วงหน้า
  const verifyBadge = useMemo(() => {
    switch (verifyStatus) {
      case "รับรอง":
        return { status: "success" as const, text: "สถานะการรับรอง: รับรอง" };
      case "รอรับรอง":
        return { status: "processing" as const, text: "สถานะการรับรอง: รอรับรอง" };
      case "ปฏิเสธ":
        return { status: "error" as const, text: "สถานะการรับรอง: ปฏิเสธ" };
      default:
        return { status: "default" as const, text: "สถานะการรับรอง: ยังไม่ได้ส่งคำขอ" };
    }
  }, [verifyStatus]);

  useEffect(() => {
    let cancelled = false;
    const loadCompany = async () => {
      if (!Number.isFinite(companyId) || companyId <= 0) {
        message.error("ไม่พบรหัสบริษัทที่ถูกต้อง");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const companyData = await GetCompanyId(companyId);
        if (cancelled) return;

        setCompany(companyData ?? null);

        if (companyData?.user_id) {
          const verifyData = await GetVerifyByUserId(companyData.user_id);
          if (!cancelled) {
            const st = verifyData?.StatusVerify?.status_verify;
            setVerifyStatus(st || "ยังไม่ได้ส่งคำขอ");
          }
        } else {
          setVerifyStatus("ยังไม่ได้ส่งคำขอ");
        }
      } catch (error) {
        console.error("โหลดข้อมูลล้มเหลว:", error);
        if (!cancelled) message.error("ไม่สามารถโหลดโปรไฟล์บริษัทได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadCompany();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

const handleChatClick = useCallback(async () => {
  if (creatingSession) return; // กันกดซ้ำ
  if (!currentUserId || !companyOwnerUserId) return;

  if (currentUserId === companyOwnerUserId) {
    message.info("ไม่สามารถเริ่มแชทกับบัญชีของตนเองได้");
    return;
  }

  setCreatingSession(true);

  try {
    // 1) สร้าง/ดึงห้อง
    let roomId: number | null = null;
    try {
      const res = await CreateChatRoom(currentUserId, companyOwnerUserId);
      // รองรับทั้ง axios ที่โยน error เมื่อ 409 หรือไม่
      roomId = extractRoomId(res?.data) ?? extractRoomId(res) ?? null;
      // ถ้า backend ส่ง status 409 แบบ throw error จะไปเข้า catch ข้างล่าง
    } catch (err: any) {
      // 409 (room exists) ที่ axios โยน error ก็ handle ที่นี่
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

    // 2) mint token ด้วย retry กัน timing issue หลังสร้างห้อง
    const { token } = await mintSessionWithRetry(roomId, 6, 180);

    // 3) เก็บ token และนำทางทันที
    saveChatToken(token);
    navigate(`/chat/session/${token}`, { replace: true });
  } catch (e) {
    console.error("เริ่มแชทไม่สำเร็จ:", e);
    message.error("เริ่มแชทไม่สำเร็จ");
  } finally {
    setCreatingSession(false);
  }
}, [creatingSession, currentUserId, companyOwnerUserId, navigate]);

  return (
    <Layout>
          {isBusy && (
      <CoopMatchLoader
        overlay
        animation={creatingSession ? "bounce-assemble" : "wave-fold"}
        primaryColor="#2473b2"
        progressMode="indeterminate"
        text={creatingSession ? "กำลังเริ่มแชทกับบริษัท..." : "กำลังโหลดโปรไฟล์บริษัท..."}
        // size="lg"  // ถ้าอยากใหญ่ขึ้น ปลดคอมเมนต์ได้
      />
    )}
      <RoleHeader />
      <Layout className="company-layout">
        <Content>
          <div className="company-profile-title">
            <span className="company-profile-view-text">Company Profile</span>
            <div className="company-profile-line" />
          </div>

          {/* TOP: Company Info */}
          <div className="company-main-section">
            <Card className="company-profile-card">
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} avatar />
              ) : (
                <div className="company-profile-container">
                  <div className="company-profile-left">
                    <div className="company-logo-container">
                      <label style={{ cursor: "pointer" }}>
                        <Avatar
                          src={
                            company?.logo
                              ? `${API_BASE}${company.logo}`
                              : undefined
                          }
                          size={120}
                          icon={!company?.logo ? <UserOutlined /> : undefined}
                          style={{
                            border: "2px solid #fff",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          }}
                          alt={company?.company_name || "Company Logo"}
                        />
                      </label>
                    </div>

                    <p className="company-name">{company?.company_name || "-"}</p>

                    <Badge className="verify-badge" status={verifyBadge.status} text={verifyBadge.text} />
                  </div>

                  <div className="company-profile-details">
                    <div className="section-header">
                      <h4>
                        <UserOutlined style={{ color: "#0d47a1" }} /> ข้อมูลติดต่อ
                      </h4>
                    </div>
                    <Descriptions column={3}>
                      <Descriptions.Item label="เว็บไซต์">
                        {company?.Contact?.website || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="ไลน์">
                        {company?.Contact?.line || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="เบอร์">
                        {company?.Contact?.phone_number || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="เฟสบุ๊ค">
                        {company?.Contact?.facebook || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="อีเมล">
                        {company?.Contact?.email || "-"}
                      </Descriptions.Item>
                    </Descriptions>

                    <div className="section-header">
                      <h4>
                        <EnvironmentOutlined style={{ color: "#0d47a1" }} /> ที่อยู่
                      </h4>
                    </div>
                    <Descriptions column={3}>
                      <Descriptions.Item label="บ้านเลขที่">
                        {company?.Address?.house_number || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="หมู่บ้าน">
                        {company?.Address?.village || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="ซอย">
                        {company?.Address?.sub_street || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="ถนน">
                        {company?.Address?.street || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="ตำบล">
                        {company?.Address?.SubDistrict?.name_th || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="อำเภอ">
                        {company?.Address?.District?.name_th || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="จังหวัด">
                        {company?.Address?.Province?.name_th || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="รหัสไปรษณีย์">
                        {company?.Address?.Postcode?.post_code || "-"}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Reviews */}
          {companyOwnerUserId && (
            <div style={{ marginTop: 24 }}>
              <CompanyReviews user_id={companyOwnerUserId} />
            </div>
          )}

          {/* Job list */}
          <div style={{ marginTop: 24 }}>
            <CompanyJobList companyId={companyId} />
          </div>
        </Content>

        {/* Floating Chat Button */}
        <div className="chat-floating-wrapper">
          <Tooltip title="แชทกับบริษัท" placement="left">
            <Button
              type="primary"
              shape="circle"
              size="large"
              aria-label="แชทกับบริษัท"
              icon={chatHovered ? <WechatOutlined /> : <MessageOutlined />}
              onClick={handleChatClick}
              onMouseEnter={() => setChatHovered(true)}
              onMouseLeave={() => setChatHovered(false)}
              className={`chat-floating-button ${chatHovered ? "hovered" : ""}`}
              disabled={
                loading ||
                creatingSession ||
                !companyOwnerUserId ||
                !currentUserId ||
                currentUserId === companyOwnerUserId
              }
              loading={creatingSession}
            />
          </Tooltip>
        </div>
      </Layout>
    </Layout>
  );
};

export default CompanyProfileview;
