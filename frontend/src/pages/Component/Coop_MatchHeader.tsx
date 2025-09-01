import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Dropdown, Layout, Menu } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  HomeOutlined,
  SolutionOutlined,
  HistoryOutlined,
  MessageOutlined, // 👈 แชท
  LogoutOutlined,
  DownOutlined,
  HeartOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserById } from '../../services/https';
import type { UserInterface } from '../../interfaces/User';
import Notification from '../Component/Notification';
import { UserContext } from '../../components/UserContext';


const { Header } = Layout;

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
  postId?: number;
}

// ---- helper: flatten keys (รองรับ children) ----
type MenuItem = Required<React.ComponentProps<typeof Menu>>['items'][number];

const flattenKeys = (items: MenuItem[] = []): string[] => {
  const res: string[] = [];
  items.forEach((it: any) => {
    if (!it) return;
    if (it.key) res.push(String(it.key));
    if (Array.isArray(it.children)) {
      res.push(...flattenKeys(it.children));
    }
  });
  return res;
};

const CoopMatchHeader: React.FC<CoopMatchHeaderDefaultProps> = ({ minimalMenu = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);
  const userId = Number(localStorage.getItem("id"));

  const { logout } = useContext(UserContext);


  const handleLogout = async () => {
    await logout();
    navigate("/sign-in");
  };

  useEffect(() => {
    if (!userId || isNaN(userId)) return;
    GetUserById(userId).then(setUser).catch(err => console.error("Failed to fetch user", err));
  }, []);

  // --- เมนูหลัก พร้อมเมนูย่อยใต้ "โปรไฟล์" ---
  const fullMenu: MenuItem[] = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'หน้าหลัก' },
    { key: 'search', icon: <SearchOutlined />, label: 'ค้นหางาน' },
    { key: 'recommendations', icon: <SolutionOutlined />, label: 'งานแนะนำ' },
    { key: 'applications/history', label: 'ประวัติการสมัคร' },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <span>
          โปรไฟล์ <DownOutlined style={{ fontSize: 10, marginLeft: 6 }} />
        </span>
      ),
      children: [
        { key: 'profile', icon: <UserOutlined />, label: 'ดูโปรไฟล์' },
        {
          key: 'favorite-posts',
          icon: <HeartOutlined  />,
          label: 'โพสต์งานที่สนใจ',
        },
        { key: 'settings', icon: <SettingOutlined />, label: 'ตั้งค่า' },
        { key: 'notifications', icon: <BellOutlined />, label: 'การแจ้งเตือน' },
      ],
    },
  ];

  const menuItems = minimalMenu
    ? [fullMenu.find((item: any) => item?.key === 'profile')!]
    : fullMenu;

  // --- คำนวณ current key ให้รองรับ path กับเมนูย่อย ---
  const allKeys = flattenKeys(menuItems);
  // หา key ที่ path ปัจจุบันมีคำนี้อยู่
  const currentKey =
    allKeys.find((k) => location.pathname.includes(k)) ||
    // fallback: ถ้าอยู่หน้า /student/profile/... ให้ active 'profile'
    (location.pathname.includes('/student/profile') ? 'profile' : allKeys[0]);

  const handleMenuClick = ({ key }: { key: string }) => {
    // นำทางตาม key เดิม
    navigate(`/student/${key}`);

  };

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        borderBottom: '1px solid #e5e7eb', // ⬅️ ใช้เส้นบางๆ แทนเงา
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Left: Logo */}
      <div
        onClick={() => navigate("/student/dashboard")}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", marginRight: 24, flexShrink: 0 }}
      >
        <img src={Logo} alt="Logo" style={{ height: 40 }} />
      </div>

      {/* Right: Menu + Notifications + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto', minWidth: 0 }}>
        <Menu
          mode="horizontal"
          selectedKeys={[currentKey!]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            minWidth: minimalMenu ? 'auto' : 600,
            flex: '0 0 auto'
          }}
        />
        {/* Dropdown ที่ Avatar: เหลือเฉพาะออกจากระบบ */}
        <Dropdown
          overlay={
            <Menu
              onClick={({ key }) => {
                if (key === "logout") {
                  handleLogout();
                } else {
                  navigate(`/student/${key}`);
                }
              }}
              items={[
                { type: 'divider' as const },
                { key: 'logout', icon: <LogoutOutlined />, label: 'ออกจากระบบ', danger: true },
              ]}
            />
          }
          placement="bottomRight"
          trigger={['hover']}
        >
          <Avatar
            size={40}
            src={user?.ProfileImage?.[0]?.image_url ? `http://localhost:8000${user.ProfileImage[0].image_url}` : undefined}
            icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
            style={{
              cursor: "pointer",
              marginLeft: 5,
              marginRight: 5,
              flex: '0 0 auto'
            }}
          />
        </Dropdown>
      </div>
    </Header>
  );
};

export default CoopMatchHeader;
