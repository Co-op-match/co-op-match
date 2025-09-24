import React, { useEffect, useState } from 'react';
import { fileURL } from '@/config/env';
import { Avatar, Layout, Dropdown, Menu } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserById } from '../../services/https';
import type { UserInterface } from '../../interfaces/User';
import "./Header.css";

const { Header } = Layout;


const CoopMatchHeaderDefault: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInterface | null>(null);
  // simplified header: no responsive menu logic needed

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userIdString = localStorage.getItem("id");
        if (!userIdString) return;

        const userId = Number(userIdString);
        if (isNaN(userId)) return;

        const data = await GetUserById(userId);
        setUser(data);
         console.log("user",data)
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);



  // Logo no longer clickable per request

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  return (
    <>
      <Header className="coop-match-default-header">
        <div 
          className="coop-match-default-logo-container"
          style={{
            marginLeft: isMobile ? 4 : 12,
            marginRight: isMobile ? 8 : 20,
            cursor: 'default'
          }}
        >
          <img src={Logo} alt="Logo" className="coop-match-default-logo" />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <Dropdown
            overlay={
              <Menu
                items={[{ key: 'logout', icon: <LogoutOutlined />, label: 'ออกจากระบบ', danger: true }]}
                onClick={({ key }) => key === 'logout' && handleLogout()}
              />
            }
            placement="bottomRight"
            trigger={['click']}
          >
            <Avatar
              src={user?.ProfileImage?.[0]?.image_url ? fileURL(user.ProfileImage[0].image_url) : undefined}
              icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
              style={{ cursor: 'pointer' }}
              className="coop-match-default-avatar-only"
              size={isMobile ? 32 : 36}
            />
          </Dropdown>
        </div>
      </Header>
    </>
  );
};

export default CoopMatchHeaderDefault;
