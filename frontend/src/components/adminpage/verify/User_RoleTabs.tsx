import { Space, Tabs } from "antd";
import type { TabsProps } from "antd";
import {
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  DeleteFilled,
  SettingOutlined,
} from "@ant-design/icons";
import React from "react";
import type { RoleInterface } from "../../../interfaces/Role";
import "./User.css";

interface RoleTabsProps {
  tabKey: string;
  setTabKey: (key: string) => void;
  role: RoleInterface;
}

// เลือก Icon ตาม Role
const getRoleIcon = (roleName: string) => {
  switch (roleName) {
    case "Student":
      return <TeamOutlined style={{ color: "#1890ff" }} />;
    case "Admin":
      return <SettingOutlined style={{ color: "#1890ff" }} />;
    case "Company":
      return <BankOutlined style={{ color: "#1890ff" }} />;
    case "AcademicStaff":
      return <BookOutlined style={{ color: "#1890ff" }} />;
    default:
      return <TeamOutlined />;
  }
};

const RoleTabs: React.FC<RoleTabsProps> = ({ tabKey, setTabKey, role }) => {
  if (!role) return null;

  const icon = getRoleIcon(role.RoleName);

  const items: TabsProps["items"] = [
    {
      label: (
        <Space>
          {icon}
          <div style={{ gap: "0px" }}>{role.RoleNameTH}ทั้งหมด</div>
        </Space>
      ),
      key: "active",
    },
    {
      label: (
        <Space>
          <DeleteFilled />
          <span style={{ paddingLeft: "2px" }}>{role.RoleNameTH}ที่ถูกลบ</span>
        </Space>
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
