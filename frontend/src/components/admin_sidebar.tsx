import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  UserOutlined,
  MenuOutlined,
  BellOutlined,
  AppstoreOutlined,
  PieChartOutlined,
  ScheduleOutlined,
  TeamOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Button, message, Avatar } from "antd";
import Co_op from "../assets/Co_op.png";
import "./admin_sidebar.css";

const { Header, Content, Sider } = Layout;

const AdminSidebar: React.FC = () => {
  const page = localStorage.getItem("page");
  const [messageApi, contextHolder] = message.useMessage();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const setCurrentPage = (val: string) => {
    localStorage.setItem("page", val);
  };

  const Logout = () => {
    localStorage.clear();
    messageApi.success("Logout successful");
    setTimeout(() => {
      location.href = "/";
    }, 2000);
  };

  const Navbar: React.FC = () => (
    <Header style={{ minHeight: "10vh", padding: "0 20px", background: "#FFFFFF" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignSelf: "center" }}>
        <div onClick={toggleCollapsed} className="custom-icon" style={{ marginLeft: 0 }} >
          {collapsed ? <MenuOutlined /> : <MenuOutlined />}
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", outline: "none", userSelect: "none",}}>
          <img src={Co_op} alt="Logo" style={{ width: "auto", height: "7vh", objectFit: "contain" }}/>
        </div>
        <div style={{ display: "flex", justifyContent: "end", alignItems: "center", gap: "2vw" }}>
          <BellOutlined className="custom-icon" />
          <Avatar style={{ backgroundColor: "#096dd9" }} icon={<UserOutlined />}/>
        </div>
      </div>
    </Header>
  );

  const Sidebar: React.FC = () => (
    <Sider>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", background: "#FFFFFF", }}>
        <div>
          <Menu
            className={`custom-menu ${collapsed ? 'fade-in' : 'fade-out'}`}
            defaultSelectedKeys={[page ? page : "dashboard"]}
            mode="inline"
          >
            <Menu.Item key="dashboard" onClick={() => setCurrentPage("dashboard")}>
              <Link to="/admin/dashboard">
                <AppstoreOutlined className="custom-icon" />
                <span>แดชบอร์ด</span>
              </Link>
            </Menu.Item>

            <Menu.Item key="analysis" onClick={() => setCurrentPage("analysis")}>
              <Link to="/admin/analysis">
                <PieChartOutlined className="custom-icon" />
                <span>วิเคราะห์</span>
              </Link>
            </Menu.Item>

            <Menu.SubMenu key="member" icon={<UserOutlined className="custom-icon" />} title="สมาชิก">
              <Menu.Item key="allMembers" onClick={() => setCurrentPage("allMembers")}>
                <Link to="/admin/member/all">
                  <TeamOutlined className="custom-icon" />
                  <span>สมาชิกทั้งหมด</span>
                </Link>
              </Menu.Item>
              <Menu.Item key="pendingMembers" onClick={() => setCurrentPage("pendingMembers")}>
                <Link to="/admin/member/pending">
                  <AuditOutlined className="custom-icon" />
                  <span>รออนุมัติ</span>
                </Link>
              </Menu.Item>
            </Menu.SubMenu>

            <Menu.Item key="permission" onClick={() => setCurrentPage("permission")}>
              <Link to="/admin/permission">
                <ScheduleOutlined className="custom-icon" />
                <span>จัดการสิทธิ์</span>
              </Link>
            </Menu.Item>
          </Menu>
        </div>

        <Button onClick={Logout} style={{ margin: 4 }}>
          ออกจากระบบ
        </Button>
      </div>
    </Sider>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Navbar />
      <Layout>
        {contextHolder}
        {collapsed && <Sidebar />}
        <Layout>
          <Content style={{ background: "#CDE4F3" }} onClick={() => {if (collapsed) toggleCollapsed();}}>
            <div style={{ padding: 24, minHeight: "100%" }}>
              <Outlet /> {/* <<< หน้า dashboard, analysis ฯลฯ จะแสดงตรงนี้ */}
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AdminSidebar;
