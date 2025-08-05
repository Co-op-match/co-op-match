import React from "react";
import { Card, Table, Empty, Badge } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ApplicationInterface } from "../../../interface/IApplication";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";

interface ApplicationsCardProps {
  post: IntershipPostInterface;
  applicationColumns: ColumnsType<ApplicationInterface>;
}

const ApplicationsCard: React.FC<ApplicationsCardProps> = ({ post, applicationColumns }) => {
  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <TeamOutlined style={{ color: "#1677ff" }} />
          <span>รายการสมัครงาน</span>
          <Badge
            count={post.Applications?.length || 0}
            style={{ backgroundColor: "#1677ff" }}
          />
        </div>
      }
      style={{
        borderRadius: "12px",
        border: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {post.Applications && post.Applications.length > 0 ? (
        <Table
          columns={applicationColumns}
          dataSource={post.Applications}
          rowKey="id"
          size="small"
          pagination={false}
        />
      ) : (
        <Empty description="ยังไม่มีการสมัครงาน" style={{ padding: "2rem 0" }} />
      )}
    </Card>
  );
};

export default ApplicationsCard;