import React from "react";
import { Card, Row, Col, Statistic, Typography, Space } from "antd";
import { RiseOutlined, FallOutlined, TrophyOutlined, UserOutlined, StarOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, DashboardOutlined } from "@ant-design/icons";
import type { OverviewInterface } from "../../../interfaces/Analysis";

const { Title } = Typography;

type PostStatusCounts = {
  open: number;
  closed: number;
  pending: number;
};

type Props = {
  loading?: boolean;
  overview: OverviewInterface | null;
  postStatusCounts: PostStatusCounts;
};

const toPercent = (v: number | undefined | null, digits = 1) =>
  `${(((v ?? 0) as number) * 100).toFixed(digits)}%`;

const Overview: React.FC<Props> = ({
  loading = false,
  overview,
  postStatusCounts,
}) => {
  const interviewRate = overview?.interviewRate ?? 0;
  const offerRate = overview?.offerRate ?? 0;
  const rejectRate = overview?.rejectRate ?? 0;
  const avgReview = overview?.avgReviewScore ?? 0;

  return (
    <Card className="chart-card" 
      loading={loading}
      styles={{
        body: { padding: "12px 16px" }, // body บาง ๆ
        header: { borderBottom: "1px solid #f0f0f0", padding: "12px 16px" },
      }}
      title={
        <Space size={8}>
          <div className="icon-circle">
            <DashboardOutlined className="inner-icon" />
          </div>
          <Title level={4} className="section-title" style={{ marginBottom: "0px" }}>
            ภาพรวมผลการดำเนินงาน
          </Title>
        </Space>
      }
      bodyStyle={{ padding: "12px 16px 16px 16px" }}
    >
      <Row gutter={[16, 16]}>
        {/* KPI 4 ใบแถวบน */}
        <Col xs={12} sm={12} md={6}>
          <Card size="small" className="kpi-card info">
            <Statistic
              title="ผู้สมัครรวม"
              value={overview?.totalApplications ?? 0}
              prefix={<UserOutlined style={{ color: "#1677ff" }} />}
              valueStyle={{ color: "#1677ff", fontWeight: 600 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card size="small" className="kpi-card success">
            <Statistic
              title="อัตรานัดสัมภาษณ์"
              value={toPercent(interviewRate)}
              prefix={<RiseOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a", fontWeight: 600 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card size="small" className="kpi-card success">
            <Statistic
              title="อัตราผ่านคัดเลือก"
              value={toPercent(offerRate)}
              prefix={<TrophyOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a", fontWeight: 600 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card size="small" className="kpi-card danger">
            <Statistic
              title="อัตราปฏิเสธ"
              value={toPercent(rejectRate)}
              prefix={<FallOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f", fontWeight: 600 }}
            />
          </Card>
        </Col>

        {/* แถวล่าง: คะแนนรีวิว + สถานะโพสต์ */}
        <Col xs={24} md={6}>
          <Card size="small" className="kpi-card warning">
            <Statistic
              title="คะแนนรีวิวเฉลี่ย"
              value={avgReview.toFixed(1)}
              suffix="/ 5.0"
              prefix={<StarOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#faad14", fontWeight: 600 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={18}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}>
              <Card size="small" className="kpi-card success">
                <Statistic
                  title="เปิดรับสมัคร"
                  value={postStatusCounts.open}
                  prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#52c41a", fontWeight: 600 }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card size="small" className="kpi-card" style={{ borderColor: "#8c8c8c25" }}>
                <Statistic
                  title="ปิดรับสมัคร"
                  value={postStatusCounts.closed}
                  prefix={<CloseCircleOutlined style={{ color: "#8c8c8c" }} />}
                  valueStyle={{ color: "#8c8c8c", fontWeight: 600 }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card size="small" className="kpi-card warning">
                <Statistic
                  title="รอตรวจสอบ"
                  value={postStatusCounts.pending}
                  prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                  valueStyle={{ color: "#faad14", fontWeight: 600 }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export default Overview;
