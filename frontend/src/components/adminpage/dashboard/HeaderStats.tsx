import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

export interface DashboardOverviewData {
  total_users?: number;
  applications?: number;
  interviews?: number;
  pending_posts?: number;
  pending_verifications?: number;
}

type Props = {
  overviewData: DashboardOverviewData;
};

const HeaderStats: React.FC<Props> = ({ overviewData }) => {
  const totalPending =
    (overviewData?.pending_posts ?? 0) +
    (overviewData?.pending_verifications ?? 0);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card className="adminpage-dashboard-stats-card">
          <Statistic
            title="ผู้ใช้ทั้งหมด"
            value={overviewData?.total_users ?? 0}
            prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
            valueStyle={{ color: "#1890ff", fontSize: 24 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="adminpage-dashboard-stats-card">
          <Statistic
            title="การสมัครงาน"
            value={overviewData?.applications ?? 0}
            prefix={<FileTextOutlined style={{ color: "#52c41a" }} />}
            valueStyle={{ color: "#52c41a", fontSize: 24 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="adminpage-dashboard-stats-card">
          <Statistic
            title="การสัมภาษณ์"
            value={overviewData?.interviews ?? 0}
            prefix={<CheckCircleOutlined style={{ color: "#722ed1" }} />}
            valueStyle={{ color: "#722ed1", fontSize: 24 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="adminpage-dashboard-stats-card">
          <Statistic
            title="รอยืนยัน"
            value={totalPending}
            prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
            valueStyle={{ color: "#faad14", fontSize: 24 }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default HeaderStats;