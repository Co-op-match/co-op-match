import React, { useEffect, useState } from "react";
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
} from "antd";
import {
  EnvironmentOutlined,
  UserOutlined,
  StarFilled,
  CommentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { GetCompanyByUserId, GetRwviewCompanyByUserId } from "../../../services/https";
import type { CompanyInterface } from "../../../interfaces/Company";
import CompanyCalendarCard from "./CompanyCalendar";
import "./CompanyProfile.css";

const { Content } = Layout;
const { Text } = Typography;

const CompanyProfileView: React.FC = () => {
  const [company, setCompany] = useState<CompanyInterface>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const userId = localStorage.getItem("id");

  useEffect(() => {
    const loadCompany = async () => {
      if (!userId) return;
      const data = await GetCompanyByUserId(Number(userId));
      setCompany(data);
    };
    loadCompany();
  }, [userId]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userId) return;
      const res = await GetRwviewCompanyByUserId(Number(userId));
      const data = res?.data ?? [];
      setReviews(data);

      const total = data.reduce((sum: number, r: any) => sum + r.rating, 0);
      setAverageRating(data.length ? total / data.length : 0);

      const counts = [0, 0, 0, 0, 0];
      data.forEach((r: any) => {
        if (r.rating >= 1 && r.rating <= 5) {
          counts[5 - r.rating]++;
        }
      });
      setRatingCounts(counts);
    };
    fetchReviews();
  }, [userId]);

  const totalReviews = reviews.length;

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Layout className="company-layout">
      <Content>
        <div className="company-profile-title">
          <span className="company-profile-text">Company Profile</span>
          <div className="company-profile-line" />
        </div>

        <Card className="company-profile-card">
          <Row gutter={32}>
            <Col span={6} style={{ textAlign: "center" }}>
              <Avatar
                src={company?.logo ? `http://localhost:8000${company.logo}` : undefined}
                size={120}
                icon={<UserOutlined />}
              />
              <p className="company-name">{company?.company_name}</p>
              <Badge status="processing" text={`สถานะการรับรอง: ${company?.Status?.Name || "ไม่พบข้อมูล"}`} />
            </Col>

            <Col span={18}>
              <Descriptions column={2} title={<><UserOutlined /> ข้อมูลติดต่อ</>}>
                <Descriptions.Item label="เว็บไซต์">{company?.Contact?.website || "-"}</Descriptions.Item>
                <Descriptions.Item label="อีเมล">{company?.Contact?.email || "-"}</Descriptions.Item>
                <Descriptions.Item label="เบอร์">{company?.Contact?.phone_number || "-"}</Descriptions.Item>
                <Descriptions.Item label="เฟสบุ๊ค">{company?.Contact?.facebook || "-"}</Descriptions.Item>
              </Descriptions>
              <Descriptions column={2} title={<><EnvironmentOutlined /> ที่อยู่</>}>
                <Descriptions.Item label="บ้านเลขที่">{company?.Address?.house_number}</Descriptions.Item>
                <Descriptions.Item label="ตำบล">{company?.Address?.SubDistrict?.name_th}</Descriptions.Item>
                <Descriptions.Item label="อำเภอ">{company?.Address?.District?.name_th}</Descriptions.Item>
                <Descriptions.Item label="จังหวัด">{company?.Address?.Province?.name_th}</Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>

        <div style={{ display: "flex", gap: 24, marginTop: 32 }}>
          <Card title={<><CommentOutlined /> รีวิวจากนักศึกษา</>} style={{ flex: 1 }}>
            {totalReviews > 0 ? (
              <>
                <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
                  <Col span={8}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 36, fontWeight: "bold", color: "#faad14" }}>{averageRating.toFixed(1)}</div>
                      <Rate disabled value={averageRating} allowHalf />
                      <div style={{ color: "#666", marginTop: 4 }}>จาก {totalReviews} รีวิว</div>
                    </div>
                  </Col>
                  <Col span={16}>
                    {[5, 4, 3, 2, 1].map((star, index) => (
                      <div key={star} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ width: 40 }}>{star} <StarFilled style={{ color: "#faad14" }} /></span>
                        <Progress
                          percent={(ratingCounts[index] / totalReviews) * 100}
                          strokeColor="#faad14"
                          showInfo={false}
                          style={{ flex: 1, marginLeft: 8, marginRight: 8 }}
                        />
                        <span style={{ width: 30 }}>{ratingCounts[index]}</span>
                      </div>
                    ))}
                  </Col>
                </Row>

                <List
                  itemLayout="vertical"
                  dataSource={reviews}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} src={`http://localhost:8000${item.image_url}`} />}
                        title={<span>{item.reviewer} <Tag>{item.position}</Tag></span>}
                        description={<>
                          <Rate disabled defaultValue={item.rating} />
                          <span style={{ marginLeft: 12, color: '#666' }}>
                            <CalendarOutlined style={{ marginRight: 4 }} />{formatDate(item.date)}
                          </span>
                        </>}
                      />
                      <div>{item.comment}</div>
                      <div style={{ marginTop: 8 }}>
                        {item.tags?.map((tag: string, i: number) => (
                          <Tag key={i} color="green">{tag}</Tag>
                        ))}
                      </div>
                    </List.Item>
                  )}
                />
              </>
            ) : <Text type="secondary">ยังไม่มีรีวิวจากนักศึกษา</Text>}
          </Card>

          <div className="calendar-card-wrapper">
            <CompanyCalendarCard />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default CompanyProfileView;
