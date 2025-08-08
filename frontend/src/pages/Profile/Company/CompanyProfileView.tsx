import React, { useEffect, useState } from "react";
import {
  Layout,
  Avatar,
  Card,
  Descriptions,
  Badge,
  Button,
  Tooltip,
} from "antd";
import { 
  EnvironmentOutlined, 
  MessageOutlined, 
  UserOutlined,
  WechatOutlined, 
} from "@ant-design/icons";
import { CreateChatRoom, GetCompanyId ,GetVerifyByUserId} from "../../../services/https";
import CompanyHeader from "../../Component/CompanyHeader";
import type { CompanyInterface } from "../../../interfaces/Company";
import "./CompanyProfileView.css";
import { useNavigate, useParams } from "react-router-dom";
import CompanyReviews from "./StudentReviews";
import "./CompanyProfileView.css";
import CompanyJobList from "./CompanyJobList";


const { Content } = Layout;


const CompanyProfileview: React.FC = () => {
  const [company, setCompany] = useState<CompanyInterface | undefined>(undefined);
  const [verifyStatus, setVerifyStatus] = useState<string>("ยังไม่ได้ส่งคำขอ");
  const [chatHovered, setChatHovered] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
    const companyId = Number(id); 

  const userId = company?.user_id

  useEffect(() => {
    const loadCompany = async () => {

        try {
          const companyData = await GetCompanyId(companyId);
          setCompany(companyData);
          const verifyData = await GetVerifyByUserId(companyData.user_id);
          console.log(verifyData)
          if (verifyData?.StatusVerify?.status_verify) {
            setVerifyStatus(verifyData.StatusVerify.status_verify);
          } else {
            setVerifyStatus("ยังไม่ได้ส่งคำขอ");
          }
        } catch (error) {
          console.error("โหลดข้อมูลล้มเหลว:", error);
        }
    };

    loadCompany();
  }, []);
  
const handleChatClick = async () => {
  const user1Id = Number(localStorage.getItem("id"));
  const user2Id = company?.user_id;

  if (!user1Id || !user2Id) return;

  const res = await CreateChatRoom(user1Id, user2Id);

  if (res.status === 200 || res.status === 201) {
    const roomId = res.data.room_id;
    console.log("✅ สร้างห้องสำเร็จ:", roomId);
    navigate(`/chat/${roomId}/${user1Id}`);
  } else if (res.status === 409) {
    const roomId = res.data.room_id;
    console.log("⚠️ ห้องมีอยู่แล้ว:", roomId);
    navigate(`/chat/${roomId}/${user1Id}`);
  } else {
    console.error("❌ ไม่สามารถสร้างห้องแชทได้:", res);
  }
};


  return (
    <Layout>
      <CompanyHeader />
      <Layout className="company-layout">
        <Content>
          <div className="company-profile-title">
            <span className="company-profile-view-text">Company Profile</span>
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
                        src={company?.logo ? `http://localhost:8000${company.logo}` : undefined}
                        size={120}
                        icon={!company?.logo ? <UserOutlined /> : undefined}
                        style={{ border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                      />
                    </label>
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
                    <h4><UserOutlined style={{ color: "#0d47a1" }} /> ข้อมูลติดต่อ</h4>
                  </div>
                  <Descriptions column={3}>
                    <Descriptions.Item label="เว็บไซต์">{company?.Contact?.website || "-"}</Descriptions.Item>
                    <Descriptions.Item label="ไลน์">{company?.Contact?.line || "-"}</Descriptions.Item>
                    <Descriptions.Item label="เบอร์">{company?.Contact?.phone_number || "-"}</Descriptions.Item>
                    <Descriptions.Item label="เฟสบุ๊ค">{company?.Contact?.facebook || "-"}</Descriptions.Item>
                    <Descriptions.Item label="อีเมล">{company?.Contact?.email || "-"}</Descriptions.Item>
                  </Descriptions>

                  <div className="section-header">
                    <h4><EnvironmentOutlined style={{ color: "#0d47a1" }} /> ที่อยู่</h4>
                  </div>
                  <Descriptions column={3}>
                    <Descriptions.Item label="บ้านเลขที่">{company?.Address?.house_number}</Descriptions.Item>
                    <Descriptions.Item label="หมู่บ้าน">{company?.Address?.village}</Descriptions.Item>
                    <Descriptions.Item label="ซอย">{company?.Address?.sub_street}</Descriptions.Item>
                    <Descriptions.Item label="ถนน">{company?.Address?.street}</Descriptions.Item>
                    <Descriptions.Item label="ตำบล">{company?.Address?.SubDistrict?.name_th}</Descriptions.Item>
                    <Descriptions.Item label="อำเภอ">{company?.Address?.District?.name_th}</Descriptions.Item>
                    <Descriptions.Item label="จังหวัด">{company?.Address?.Province?.name_th}</Descriptions.Item>
                    <Descriptions.Item label="รหัสไปรษณีย์">{company?.Address?.Postcode?.post_code}</Descriptions.Item>
                  </Descriptions>
                </div>
              </div>
            </Card>
          </div>
          {/* เพิ่มส่วนนี้ */}
          <div style={{ marginTop: "24px" }}>
            {userId && <CompanyReviews user_id={userId} />}
          </div>
      <div style={{ marginTop: "24px" }}>
        <CompanyJobList  companyId={companyId} />
      </div>
        </Content>
<div className="chat-floating-wrapper">
  <Tooltip title="แชทกับบริษัท" placement="left">
    <Button
      type="primary"
      shape="circle"
      size="large"
      icon={chatHovered ? <WechatOutlined /> : <MessageOutlined />}
      onClick={handleChatClick}
      onMouseEnter={() => setChatHovered(true)}
      onMouseLeave={() => setChatHovered(false)}
      className={`chat-floating-button ${chatHovered ? "hovered" : ""}`}
    />
  </Tooltip>
</div>
      </Layout>

    </Layout>
    
  );
};

export default CompanyProfileview;