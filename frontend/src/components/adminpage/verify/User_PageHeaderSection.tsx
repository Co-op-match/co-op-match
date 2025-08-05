import { Row, Col, Typography, Button, Space } from "antd";
import {
  PlusOutlined,
  TeamOutlined,
  CrownOutlined,
  UserOutlined,
  BankOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import React from "react";
import type { RoleInterface } from "../../../interfaces/Role";

const { Title, Text } = Typography;

interface PageHeaderSectionProps {
  role: RoleInterface;
  onAddClick?: () => void;
}

const roleConfig = (role: RoleInterface) => {
  switch (role.RoleName) {
    case "Student":
      return {
        title: `จัดการ${role.RoleNameTH}`,
        subtitle: `จัดการข้อมูล${role.RoleNameTH}ในระบบ CoopMatch`,
        icon: <UserOutlined />,
        buttonText: "เพิ่มนักศึกษา",
      };
    case "Admin":
      return {
        title: `จัดการ${role.RoleNameTH}`,
        subtitle: `จัดการข้อมูล${role.RoleNameTH} CoopMatch`,
        icon: <SettingOutlined />,
        buttonText: "เพิ่มผู้ดูแลระบบ",
      };
    case "Company":
      return {
        title: `จัดการ${role.RoleNameTH}`,
        subtitle: `ระบบจัดการและตรวจสอบสถานะ${role.RoleNameTH}`,
        icon: <BankOutlined />,
        buttonText: undefined, // ไม่แสดงปุ่ม
      };
    case "AcademicStaff":
      return {
        title: `จัดการ${role.RoleNameTH}`,
        subtitle: `ระบบจัดการและตรวจสอบสถานะ${role.RoleNameTH}`,
        icon: <TeamOutlined />,
        buttonText: undefined,
      };
    default:
      return {
        title: `จัดการ ${role.RoleNameTH}`,
        subtitle: `จัดการข้อมูล ${role.RoleNameTH} ในระบบ`,
        icon: <TeamOutlined />,
        buttonText: `เพิ่ม${role.RoleNameTH}`,
      };
  }
};

const PageHeaderSection: React.FC<PageHeaderSectionProps> = ({
  role,
  onAddClick,
}) => {
  if (!role) return null;

  const config = roleConfig(role);

  return (
    <div className="adminpage-header-box">
      <Row justify="space-between" align="middle">
        <Col>
          <Space direction="vertical" size={0}>
            <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
              <span style={{ marginRight: 12 }}>{config.icon}</span>
              {config.title}
            </Title>
            <Text type="secondary">{config.subtitle}</Text>
          </Space>
        </Col>
        {config.buttonText && onAddClick && (
          <Col>
            <Button
              type="primary"
              size="large"
              onClick={onAddClick}
              icon={<PlusOutlined />}
              style={{
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                background: "#1890ff",
                borderColor: "#1890ff",
              }}
            >
              {config.buttonText}
            </Button>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default PageHeaderSection;
