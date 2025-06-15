import React from "react";
import { Card, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
const { Meta } = Card;

const Profile: React.FC = () => (
  <Card
    style={{ width: "30vw", display: "flex", flexDirection: "column", alignItems: "center" }}
  >
    
    <Meta
      avatar={<Avatar style={{ backgroundColor: "#096dd9" }} icon={<UserOutlined />}/>}
      title="Card title"
      description="This is the description"
    />
  </Card>
);

const ProfileAnalysis: React.FC = () => {
  return (
    <>
      <Profile />
    </>
  );
};

export default ProfileAnalysis;
