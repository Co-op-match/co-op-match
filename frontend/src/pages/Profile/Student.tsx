import React from "react";
import { Layout, Menu, Avatar, Card, Descriptions, Table, Calendar, Badge } from "antd";
import {
  UserOutlined,
  PictureOutlined,
  StarOutlined,
  EditOutlined,
  BellOutlined,
} from "@ant-design/icons";

const { Sider, Content } = Layout;

const Sidebar: React.FC = () => (
  <Sider width={80} style={{ background: "#fff", height: "100vh", position: "fixed", left: 0 }}>
    <Menu mode="vertical" defaultSelectedKeys={["2"]}>
      <Menu.Item key="1" icon={<PictureOutlined />} />
      <Menu.Item key="2" icon={<UserOutlined />} />
      <Menu.Item key="3" icon={<StarOutlined />} />
    </Menu>
  </Sider>
);

const ProfileCard: React.FC = () => (
  <Card title="Student Profile" bordered style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", gap: 40 }}>
      <div style={{ textAlign: "center" }}>
        <Avatar size={120} icon={<UserOutlined />} />
        <p style={{ marginTop: 10, fontWeight: "bold" }}>FirstName LastName</p>
        <p>Computer Engineering</p>
        <p>Suranaree University Of Technology</p>
      </div>

      <div style={{ flex: 1 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="เพศ">Male</Descriptions.Item>
          <Descriptions.Item label="วันเกิด">02/06/2003</Descriptions.Item>
          <Descriptions.Item label="เบอร์">093-1234567</Descriptions.Item>
          <Descriptions.Item label="อายุ">22</Descriptions.Item>
          <Descriptions.Item label="สัญชาติ">ไทย</Descriptions.Item>
          <Descriptions.Item label="ศาสนา">พุธ</Descriptions.Item>
          <Descriptions.Item label="GPA">4.00</Descriptions.Item>
          <Descriptions.Item label="อีเมล">Email@gmail.com</Descriptions.Item>
          <Descriptions.Item label="คณะ">Engineering</Descriptions.Item>
          <Descriptions.Item label="สาขา">Computer ENG</Descriptions.Item>
          <Descriptions.Item label="ที่อยู่">
            House Number: 222, หมู่ 17, ซอย 9, ถนนสุขา 3, แขวงลาดพร้าว, เขตบางกะปิ,
            กรุงเทพมหานคร 10240
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  </Card>
);

const JobTable: React.FC = () => {
  const columns = [
    { title: "ลำดับ", dataIndex: "index", key: "index" },
    { title: "บริษัท", dataIndex: "company", key: "company" },
    { title: "สถานะ", dataIndex: "status", key: "status" },
    { title: "ข้อมูล", dataIndex: "info", key: "info" },
  ];

  const data = [
    {
      key: "1",
      index: 1,
      company: "ตัวอย่างบริษัท",
      status: <span style={{ color: "orange" }}>รอสัมภาษณ์</span>,
      info: "ดู",
    },
  ];

  return <Table columns={columns} dataSource={data} pagination={false} />;
};

const CalendarCard: React.FC = () => (
  <Card title="ปฏิทินแจ้งเตือน" bordered>
    <Calendar fullscreen={false} />
    <div style={{ textAlign: "center", marginTop: 10 }}>
      <Badge status="success" text="No upcoming events" />
    </div>
  </Card>
);

const StudentProfile: React.FC = () => {
  return (
    <Layout>
      <Sidebar />
      <Layout style={{ marginLeft: 80, padding: 20, background: "#E3F2FD", minHeight: "100vh" }}>
        <Content>
          <ProfileCard />
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <JobTable />
            </div>
            <div style={{ width: 400 }}>
              <CalendarCard />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentProfile;
