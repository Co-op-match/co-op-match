import React, { useEffect, useState } from "react";
import {
  Layout,
  Avatar,
  Card,
  Descriptions,
  Divider,
  List,
  Typography,
  Rate,
  Badge,
} from "antd";
import { EditOutlined, UserOutlined } from "@ant-design/icons";
import { GetCompanyByUserId ,GetVerifyByUserId} from "../../../services/https";
import CompanyHeader from "../../component/CompanyHeader";
import type { CompanyInterface } from "../../../interfaces/Company";
import "./CompanyProfile.css";
const { Content } = Layout;
const { Text } = Typography;


const CompanyProfile: React.FC = () => {
  const [company, setCompany] = useState<CompanyInterface | undefined>(undefined);
  const [verifyStatus, setVerifyStatus] = useState<string>("ยังไม่ได้ส่งคำขอ");
  const reviews = [
    { reviewer: "ณัฐพล สายใจ", rating: 5, comment: "ประสบการณ์ดีมาก ได้เรียนรู้งานจริงจากพี่ๆ" },
    { reviewer: "ศิริพร ใจดี", rating: 4, comment: "บริษัทดูแลดี ได้ลองทำโปรเจกต์จริง" },
  ];

useEffect(() => {
  const loadCompany = async () => {
    const userIdString = localStorage.getItem("id");
    if (userIdString) {
      const userId = Number(userIdString);
      try {
        const companyData = await GetCompanyByUserId(userId);
        setCompany(companyData);

        const verifyData = await GetVerifyByUserId(userId);
        console.log(verifyData)
        if (verifyData?.StatusVerify?.status_verify) {
          setVerifyStatus(verifyData.StatusVerify.status_verify);
        } else {
          setVerifyStatus("ยังไม่ได้ส่งคำขอ");
        }
      } catch (error) {
        console.error("โหลดข้อมูลล้มเหลว:", error);
      }
    }
  };

  loadCompany();
}, []);


  return (
    <Layout>
      <CompanyHeader />
      <Layout className="company-layout">
        <Content>
          <div className="company-grid-container">
          <div className="company-profile-title">
            <span className="company-profile-text">Company Profile</span>
            <div className="company-profile-line" />
          </div>

          <div className="company-main-section">
            {/* LEFT: Company Info */}
            <Card className="company-left-card">
              <div className="company-profile-container">
                <div className="company-profile-left">
                  <div className="company-logo-container">
                    <Avatar
                      src={company?.logo ? `http://localhost:8000${company.logo}` : undefined}
                      size={120}
                      icon={!company?.logo ? <UserOutlined /> : undefined}
                    />
                    <div className="company-logo-edit-icon">
                      <EditOutlined />
                    </div>
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

                <Divider type="vertical" className="company-vertical-divider" />

                <div className="company-profile-details">
                  <Descriptions column={3}>
                    <Descriptions.Item label="เว็บไซต์">{company?.Contact?.website || "-"}</Descriptions.Item>
                    <Descriptions.Item label="ไลน์">{company?.Contact?.line || "-"}</Descriptions.Item>
                    <Descriptions.Item label="เบอร์">{company?.Contact?.phone_number || "-"}</Descriptions.Item>
                    <Descriptions.Item label="เฟสบุ๊ค">{company?.Contact?.facebook || "-"}</Descriptions.Item>
                    <Descriptions.Item label="อีเมล">{company?.Contact?.email || "-"}</Descriptions.Item>
                  </Descriptions>
                  <div className="company-divider-section">
                    <Divider className="company-divider" />
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
              </div>
            </Card>

            {/* RIGHT: Review */}
            <Card className="company-review-card" title="รีวิวจากนักศึกษา">
              <List
                itemLayout="vertical"
                dataSource={reviews}
                renderItem={(item) => (
                  <List.Item>
                    <Text strong>{item.reviewer}</Text>
                    <br />
                    <Rate disabled defaultValue={item.rating} />
                    <p>{item.comment}</p>
                  </List.Item>
                )}
              />
            </Card>
          </div>

          {/* BOTTOM: Internship Posts */}
          <Card className="company-post-list-card" title="รายการโพสต์">
            <List
              dataSource={company?.IntershipPosts || []}
              renderItem={(post) => (
                <List.Item>
                  <b>{post.post_name}</b> -{" "}
                  <span style={{ color: post.StatusPost?.name === "Open" ? "green" : "gray" }}>
                    {post.StatusPost?.name}
                  </span>
                </List.Item>
              )}
            />
          </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CompanyProfile;
