import React, { useMemo } from "react";
import { Card, Table, Empty, Badge } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ApplicationInterface } from "../../../interface/IApplication";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";

type Props = {
  post: IntershipPostInterface;
  applicationColumns: ColumnsType<ApplicationInterface>;
};

const ApplicationsCard: React.FC<Props> = ({ post, applicationColumns }) => {
  const apps = useMemo(() => post?.Applications ?? [], [post]);
  const count = apps.length;

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TeamOutlined style={{ color: "#1677ff" }} />
          <span>รายการสมัครงาน</span>
          <Badge count={count} style={{ backgroundColor: "#1677ff" }} />
        </div>
      }
      style={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      bodyStyle={{ paddingTop: 12 }}
    >
      {count > 0 ? (
        <Table
          columns={applicationColumns}
          dataSource={apps}
          rowKey={(r) => (r as any).ID ?? (r as any).id}
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