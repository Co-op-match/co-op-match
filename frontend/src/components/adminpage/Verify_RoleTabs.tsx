import { Badge, Space, Tabs } from "antd";
import type { TabsProps } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import React from "react";
import type { RoleInterface } from "../../interfaces/Role";

interface RoleTabsProps {
  tabKey: string;
  setTabKey: (key: string) => void;
  role: RoleInterface;
}

const RoleTabs: React.FC<RoleTabsProps> = ({ tabKey, setTabKey, role }) => {
  if (!role) return null; // หรือแสดง loading หรือ placeholder ได้

  const items: TabsProps["items"] = [
    {
      label: (
        <Space>
          <TeamOutlined />
          <div style={{ gap: "0px" }}>{role.RoleNameTH}ทั้งหมด</div>
        </Space>
      ),
      key: "active",
    },
    {
      label: (
        <span style={{ fontSize: "16px", padding: "8px 16px" }}>
          <div style={{ gap: "0px" }}>{role.RoleNameTH}ที่ถูกลบ</div>
        </span>
      ),
      key: "deleted",
    },
  ];

  return (
    <Tabs
      defaultActiveKey="active"
      activeKey={tabKey}
      onChange={setTabKey}
      items={items}
      size="large"
      className="adminpage-tabs"
    />
  );
};

export default RoleTabs;
