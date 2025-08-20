import React from "react";
import { Card, Button, Row, Col } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

export type UserRoleDatum = {
  name: string;
  value: number;
  color: string;
};

type Props = {
  userRoleData: UserRoleDatum[];
  onViewDetail: () => void;
};

const UserRoleCard: React.FC<Props> = ({ userRoleData, onViewDetail }) => {
  return (
    <Card
      title="สัดส่วนผู้ใช้ตามบทบาท"
      className="adminpage-dashboard-chart-card"
      extra={
        <Button icon={<EyeOutlined />} onClick={onViewDetail}>
          ดูรายละเอียด
        </Button>
      }
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={userRoleData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {userRoleData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
        {userRoleData.map((item, index) => (
          <Col span={12} key={index}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: item.color,
                  marginRight: 8,
                  borderRadius: 2,
                }}
              />
              <span style={{ fontSize: 12 }}>
                {item.name}: {item.value}
              </span>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default UserRoleCard;