import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Avatar,
  Card,
  Descriptions,
  List,
  Typography,
  Rate,
  Badge,
  Divider,
  Progress,
  Row,
  Col,
  Tag,
  message,
  Grid,
} from "antd";
import {
  EditOutlined,
  EnvironmentOutlined,
  UserOutlined,
  StarFilled,
  CommentOutlined,
  LikeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  GetCompanyByUserId,
  GetRwviewCompanyByUserId,
  GetVerifyByUserId,
  UpdateCompanyLogo,
} from "../../../services/https";
import CompanyHeader from "../../Component/CompanyHeader";
import type { CompanyInterface } from "../../../interfaces/Company";
import "./CompanyProfile.css";
import CompanyCalendarCard from "./CompanyCalendar";
import EditProfileCompanyModal from "./Edit/Popup";
import { fileURL } from "@/config/env";

// ✅ เพิ่ม Loader
import { CoopMatchLoader } from '../../../components/loaders';

const { Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

interface ReviewResponse {
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
  position: string;
  image_url: string;
  tags: string[];
  helpful: number;
  student_id: number;
}

const CompanyProfile: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  const [company, setCompany] = useState<CompanyInterface | undefined>(undefined);
  const [verifyStatus, setVerifyStatus] = useState<string>("ยังไม่ได้ส่งคำขอ");
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const totalReviews = useMemo(() => reviews.length, [reviews]);
  const [editSection, setEditSection] = useState<"contact" | "address" | null>(null);

  const userId = localStorage.getItem("id");

  // ✅ สถานะโหลดหน้า (company + reviews)
  const [loadingCompany, setLoadingCompany] = useState<boolean>(true);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  // ✅ สถานะอัปโหลดโลโก้
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ✅ ใช้สำหรับ cache-busting รูปโลโก้
  const [avatarVer, setAvatarVer] = useState<number>(Date.now());

  // ✅ Progress สำหรับหน้า (คิดเป็น 2 งาน: company + reviews)
  const pageProgress = useMemo(() => {
    const total = 2;
    let done = 0;
    if (!loadingCompany) done += 1;
    if (!loadingReviews) done += 1;
    return Math.round((done / total) * 100);
  }, [loadingCompany, loadingReviews]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      setUploadingLogo(true);
      const res = await UpdateCompanyLogo(Number(userId), formData);
      if (res?.status === 200) {
        message.success("อัปเดตโลโก้เรียบร้อยแล้ว");
        // ดึงข้อมูลบริษัทใหม่ + อัปเดตเวอร์ชันรูปกัน cache
        const updated = await GetCompanyByUserId(Number(userId));
        setCompany(updated);
        setAvatarVer(Date.now());

        // แจ้งส่วนอื่น ๆ ให้รีเฟรชรูป (เช่น CompanyHeader)
        try {
          localStorage.setItem("company_logo_updated", String(Date.now()));
        } catch {}
        window.dispatchEvent(new Event("company-logo-updated"));
      } else {
        message.error("อัปเดตโลโก้ไม่สำเร็จ");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการอัปโหลดโลโก้");
    } finally {
      setUploadingLogo(false);
      // เคลียร์ค่า input เพื่อให้อัปโหลดไฟล์เดิมซ้ำได้
      (e.target as HTMLInputElement).value = "";
    }
  };

  useEffect(() => {
    async function fetchReviews() {
      setLoadingReviews(true);
      try {
        const res = await GetRwviewCompanyByUserId(Number(userId));
        const data: ReviewResponse[] = res?.data ?? [];
        setReviews(data);

        if (data.length > 0) {
          const total = data.reduce((sum, r) => sum + r.rating, 0);
          const avg = total / data.length;
          setAverageRating(avg);

          const counts = [0, 0, 0, 0, 0];
          data.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) {
              counts[5 - r.rating] += 1;
            }
          });

          setRatingCounts(counts);
        } else {
          setAverageRating(0);
          setRatingCounts([0, 0, 0, 0, 0]);
        }
      } catch (error) {
        console.error("❌ Error fetching reviews:", error);
        setReviews([]);
        setAverageRating(0);
        setRatingCounts([0, 0, 0, 0, 0]);
      } finally {
        setLoadingReviews(false);
      }
    }

    fetchReviews();
  }, [userId]);

  useEffect(() => {
    const loadCompany = async () => {
      setLoadingCompany(true);
      const userIdString = localStorage.getItem("id");
      if (userIdString) {
        const userId = Number(userIdString);
        try {
          const companyData = await GetCompanyByUserId(userId);
          setCompany(companyData);

          const verifyData = await GetVerifyByUserId(userId);
          if (verifyData?.StatusVerify?.status_verify) {
            setVerifyStatus(verifyData.StatusVerify.status_verify);
          } else {
            setVerifyStatus("ยังไม่ได้ส่งคำขอ");
          }
        } catch (error) {
          console.error("โหลดข้อมูลล้มเหลว:", error);
        } finally {
          setLoadingCompany(false);
        }
      } else {
        setLoadingCompany(false);
      }
    };

    loadCompany();

    // ถ้ารูปถูกอัปเดตจากแท็บอื่น ให้เด้งเวอร์ชันภาพ
    const onStorage = (e: StorageEvent) => {
      if (e.key === "company_logo_updated") {
        setAvatarVer(Date.now());
        const uid = Number(localStorage.getItem("id"));
        if (uid) GetCompanyByUserId(uid).then(setCompany).catch(() => {});
      }
    };
    const onCustom = () => {
      setAvatarVer(Date.now());
      const uid = Number(localStorage.getItem("id"));
      if (uid) GetCompanyByUserId(uid).then(setCompany).catch(() => {});
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("company-logo-updated", onCustom as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("company-logo-updated", onCustom as EventListener);
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const onEditSection = (section: "contact" | "address") => {
    setEditSection(section);
  };

  // ✅ รองรับทั้ง company.logo และ company.logo_image โดยไม่ชน TypeScript
  const logoPath: string | undefined =
    (company as any)?.logo ?? (company as any)?.logo_image ?? undefined;

  const baseLogoUrl = logoPath ? fileURL(logoPath) : undefined;
  const logoSrc = baseLogoUrl
    ? `${baseLogoUrl}${baseLogoUrl.includes("?") ? "&" : "?"}v=${avatarVer}`
    : undefined;

  // ✅ เงื่อนไขแสดง Loader
  const showPageLoader = loadingCompany || loadingReviews;
  const showLogoLoader = uploadingLogo;

  return (
    <Layout>
      {/* ✅ Loader Overlay (หน้าโหลดข้อมูล) */}
      {(showPageLoader || showLogoLoader) && (
        <CoopMatchLoader
          overlay
          animation={showLogoLoader ? "piece-rotate" : "puzzle-fold"}
          progressMode={showLogoLoader ? "indeterminate" : "determinate"}
          progress={showLogoLoader ? undefined : pageProgress}
          text={showLogoLoader ? "กำลังอัปโหลดโลโก้..." : "กำลังโหลดข้อมูลบริษัท..."}
          // primaryColor="#1890ff"
          // speed={2.0}
        />
      )}

      <CompanyHeader />
      <Layout className={`company-layout ${isMobile ? 'company-mobile' : ''} ${isTablet ? 'company-tablet' : ''}`}>
        <Content>
          <div className="company-profile-title">
            <span className="company-profile-text">Company Profile</span>
            <div className="company-profile-line" />
          </div>

          {/* TOP: Company Info */}
          <div className="company-main-section">
            <Card className="company-profile-card">
              <div className="company-profile-container">
                <div className="company-profile-left">
                  <div className="company-logo-container">
                    <label style={{ cursor: "pointer" }}>
                      <Avatar
                        src={logoSrc}
                        size={120}
                        icon={!logoSrc ? <UserOutlined /> : undefined}
                        style={{
                          border: "2px solid #fff",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleLogoUpload}
                      />
                    </label>
                    <label className="company-logo-edit-icon" title="เปลี่ยนโลโก้บริษัท">
                      <EditOutlined />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleLogoUpload}
                      />
                    </label>

                    {/* ❌ ตัด overlay เดิมออก ใช้ Loader overlay แทน */}
                    {/* {uploadingLogo && <div className="uploading-overlay">กำลังอัปโหลด...</div>} */}
                  </div>
                  <p className="company-name">{company?.company_name}</p>
                  <Badge
                    className="verify-badge"
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

                <div className="company-profile-details">
                  <div className="section-header">
                    <h4>
                      <UserOutlined style={{ color: "#0d47a1" }} /> ข้อมูลติดต่อ
                    </h4>
                    <button
                      className="edit-profile-button"
                      onClick={() => onEditSection("contact")}
                    >
                      <EditOutlined /> แก้ไข
                    </button>
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
                    <button
                      className="edit-profile-button"
                      onClick={() => onEditSection("address")}
                    >
                      <EditOutlined /> แก้ไข
                    </button>
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
            </Card>
          </div>

          {/* BOTTOM: Calendar + Reviews */}
          <div className="company-dashboard-section">
            <div className="application-list-wrapper">
              <Card
                className="company-review-card"
                style={{ borderRadius: 12, overflow: "hidden" }}
                headStyle={{
                  background: "linear-gradient(135deg, #1890ff 0%, #0d47a1 100%)",
                  borderBottom: "none",
                  height: 5,
                  display: "flex",
                  padding: "10px 14px",
                  borderRadius: "12px 12px 0 0",
                  position: "relative",
                  overflow: "hidden",
                }}
                bodyStyle={{
                  padding: 16,
                  background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)",
                }}
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 600,
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                      letterSpacing: "-0.2px",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <CommentOutlined
                      style={{
                        color: "#ffffff",
                        fontSize: 18,
                        filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
                      }}
                    />
                    <span>รีวิวจากนักศึกษา</span>
                  </div>
                }
              >
                {/* สรุปรีวิว */}
                <div
                  style={{
                    marginBottom: 20,
                    padding: 16,
                    background: "linear-gradient(145deg, #ffffff 0%, #f8fafe 100%)",
                    borderRadius: 12,
                    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.08)",
                    border: "1px solid rgba(24, 144, 255, 0.08)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-50%",
                      right: "-20%",
                      width: 200,
                      height: 200,
                      background:
                        "radial-gradient(circle, rgba(250, 173, 20, 0.05) 0%, transparent 70%)",
                      borderRadius: "50%",
                      pointerEvents: "none",
                    }}
                  />
                  <Row gutter={[{ xs: 8, sm: 12, md: 16 }, { xs: 12, sm: 14, md: 16 }]} align="middle" style={{ position: "relative", zIndex: 1 }}>
                    <Col xs={24} sm={12} md={8}>
                      <div
                        style={{
                          textAlign: "center",
                          padding: 12,
                          background: "rgba(255, 255, 255, 0.6)",
                          borderRadius: 8,
                          backdropFilter: "blur(5px)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          boxShadow: "0 1px 6px rgba(0, 0, 0, 0.04)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 32,
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #faad14 0%, #ff9800 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            marginBottom: 6,
                            lineHeight: 1,
                          }}
                        >
                          {averageRating.toFixed(1)}
                        </div>
                        <Rate
                          disabled
                          value={averageRating}
                          allowHalf
                          style={{ fontSize: 16, marginBottom: 6 }}
                        />
                        <div style={{ color: "#666", fontSize: 13, fontWeight: 500 }}>
                          จาก {totalReviews.toLocaleString()} รีวิว
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} sm={12} md={16}>
                      <div style={{ padding: "4px 0" }}>
                        {[5, 4, 3, 2, 1].map((star, index) => (
                          <div
                            key={star}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: 8,
                              padding: "4px 6px",
                              borderRadius: 6,
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              const target = e.currentTarget as HTMLElement;
                              target.style.backgroundColor = "rgba(250, 173, 20, 0.04)";
                            }}
                            onMouseLeave={(e) => {
                              const target = e.currentTarget as HTMLElement;
                              target.style.backgroundColor = "transparent";
                            }}
                          >
                            <div
                              style={{
                                width: 55,
                                display: "flex",
                                alignItems: "center",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#444",
                              }}
                            >
                              <span>{star}</span>
                              <StarFilled style={{ color: "#faad14", marginLeft: 5, fontSize: 14 }} />
                            </div>
                            <Progress
                              percent={
                                totalReviews > 0
                                  ? (ratingCounts[index] / totalReviews) * 100
                                  : 0
                              }
                              showInfo={false}
                              strokeColor={{ "0%": "#faad14", "100%": "#ffd666" }}
                              trailColor="rgba(0, 0, 0, 0.05)"
                              strokeWidth={8}
                              style={{ flex: 1, marginLeft: 10, marginRight: 10 }}
                            />
                            <div style={{ minWidth: 35, textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>
                                {ratingCounts[index]}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Col>
                  </Row>
                </div>

                {totalReviews === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                      ยังไม่มีรีวิวจากนักศึกษา
                    </Text>
                  </div>
                ) : (
                  <>
                    <Divider>รีวิวล่าสุด</Divider>

                    <List
                      itemLayout="vertical"
                      dataSource={reviews}
                      renderItem={(item) => (
                        <List.Item
                          style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}
                        >
                          <div style={{ marginBottom: 8 }}>
                            <Row justify="space-between" align="top">
                              <Col>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 4,
                                  }}
                                >
                                  <Avatar
                                    src={item.image_url ? fileURL(item.image_url) : undefined}
                                    size={35}
                                    icon={!item.image_url ? <UserOutlined /> : undefined}
                                  />
                                  <Text strong style={{ fontSize: 16 }}>
                                    {item.reviewer}
                                  </Text>
                                  <Tag color="blue">{item.position}</Tag>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    marginBottom: 8,
                                  }}
                                >
                                  <Rate disabled defaultValue={item.rating} style={{ fontSize: 14 }} />
                                  <span style={{ color: "#666", fontSize: 12 }}>
                                    <CalendarOutlined style={{ marginRight: 4 }} />
                                    {formatDate(item.date)}
                                  </span>
                                </div>
                              </Col>
                            </Row>
                          </div>

                          <div style={{ marginBottom: 12 }}>
                            <Text style={{ lineHeight: 1.6, color: "#333" }}>{item.comment}</Text>
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                            {(item.tags ?? []).map((tag, index) => (
                              <Tag key={index} color="green" style={{ fontSize: 11 }}>
                                {tag}
                              </Tag>
                            ))}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#666" }}>
                            <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                              <LikeOutlined />
                              มีประโยชน์ {item.helpful} คน
                            </span>
                          </div>
                        </List.Item>
                      )}
                    />

                    <div style={{ textAlign: "center", marginTop: 16 }}>
                      <Text type="secondary">
                        แสดง {reviews.length} จาก {totalReviews} รีวิว
                      </Text>
                    </div>
                  </>
                )}
              </Card>
            </div>

            <div className="calendar-card-wrapper">
              <CompanyCalendarCard />
            </div>
          </div>

          {company && editSection && (
            <EditProfileCompanyModal
              open={!!editSection}
              section={editSection}
              initialData={company}
              onClose={() => {
                setEditSection(null);
                const userIdString = localStorage.getItem("id");
                if (userIdString) {
                  GetCompanyByUserId(Number(userIdString))
                    .then((c) => {
                      setCompany(c);
                      setAvatarVer(Date.now()); // รีเฟรชโลโก้ทันทีหากมีการแก้ไขที่เกี่ยวข้อง
                    })
                    .catch(() => {});
                }
              }}
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default CompanyProfile;
