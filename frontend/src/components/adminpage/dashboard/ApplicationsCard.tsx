import React, { useMemo } from "react";
import { Card, Row, Col, Tag, Button, Empty } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

export type ApplicationPoint = {
  month: string;        // เช่น "ม.ค.", "ก.พ." หรือ "Jan", "Feb"
  applications: number;
  interviews: number;
  approved: number;
};

type Props = {
  title?: string;
  className?: string;
  applicationData: ApplicationPoint[];
  onViewDetail?: () => void; // กดปุ่ม "ดูรายละเอียด"
};

const ApplicationsCard: React.FC<Props> = ({
  title = "สถิติการสมัครงานรายเดือน",
  className = "adminpage-dashboard-chart-card",
  applicationData,
  onViewDetail,
}) => {
  const hasData = useMemo(() => Array.isArray(applicationData) && applicationData.length > 0, [applicationData]);

  return (
    <Card
      title={title}
      className={className}
      extra={
        <Button icon={<EyeOutlined />} onClick={onViewDetail}>
          ดูรายละเอียด
        </Button>
      }
    >
      {hasData ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={applicationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" fill="#1890ff" name="การสมัคร" />
              <Bar dataKey="interviews" fill="#52c41a" name="การสัมภาษณ์" />
              <Bar dataKey="approved" fill="#722ed1" name="ผ่านการคัดเลือก" />
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col>
                <Tag color="#1890ff">🟦 การสมัคร</Tag>
              </Col>
              <Col>
                <Tag color="#52c41a">🟩 การสัมภาษณ์</Tag>
              </Col>
              <Col>
                <Tag color="#722ed1">🟪 ผ่านการคัดเลือก</Tag>
              </Col>
            </Row>
          </div>
        </>
      ) : (
        <Empty description="ยังไม่มีข้อมูล" />
      )}
    </Card>
  );
};

export default ApplicationsCard;