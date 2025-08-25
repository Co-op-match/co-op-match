import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Badge, Dropdown, Layout, Menu } from 'antd';
import {
  UserOutlined,
  HomeOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Logo from "../../assets/Co-op match-Photoroom.png";
import { createChatSession, createWsByToken, GetChatRoomsByUserId, GetUserById } from '../../services/https';
import type { UserInterface } from '../../interfaces/User';
import Notification from '../component/Notification';

const { Header } = Layout;

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
}

const CompanyHeader: React.FC<CoopMatchHeaderDefaultProps> = ({ minimalMenu = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInterface | null>(null);
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const unreadMapRef = useRef<Map<number, number>>(new Map());
  const updateTotalUnread = () => {
    const sum = Array.from(unreadMapRef.current.values()).reduce((a, b) => a + (b || 0), 0);
    setTotalUnread(sum);
  };

  useEffect(() => {
    const userId = Number(localStorage.getItem("id"));
    if (!userId || isNaN(userId)) return;
    GetUserById(userId).then(setUser).catch(err => console.error("Failed to fetch user", err));
    GetChatRoomsByUserId(userId)
    .then((rooms: any[]) => {
      unreadMapRef.current.clear();
      if (Array.isArray(rooms)) {
        rooms.forEach(r => unreadMapRef.current.set(Number(r?.id), Number(r?.unread_count) || 0));
      }
      updateTotalUnread();
    })
    .catch(() => { /* ignore */ });

  // 2) เปิด WS แบบล็อบบี้เพื่อรับอัปเดตแบบเรียลไทม์
  let alive = true;
  (async () => {
    try {
      const { token } = await createChatSession(0); // rid=0
      if (!alive) return;

      const ws = createWsByToken(token);
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        let raw = '';
        if (typeof event.data === 'string') raw = event.data;
        else if (event.data instanceof ArrayBuffer) raw = new TextDecoder().decode(event.data);
        else if (event.data instanceof Blob) raw = await event.data.text();
        else return;

        // บาง backend ส่งหลายบรรทัด
        for (const line of raw.split('\n')) {
          const s = line.trim();
          if (!s) continue;
          let data: any;
          try { data = JSON.parse(s); } catch { continue; }

          // อัปเดตจาก meta/ unread
          if (data.event === 'room_meta') {
            const rid = Number(data.room_id);
            const count = Number(data.unread ?? data.count);
            if (Number.isFinite(rid) && Number.isFinite(count)) {
              unreadMapRef.current.set(rid, Math.max(0, count));
              updateTotalUnread();
            }
          } else if (data.event === 'unread') {
            const rid = Number(data.room_id);
            const count = Number(data.unread ?? data.count);
            if (Number.isFinite(rid) && Number.isFinite(count)) {
              unreadMapRef.current.set(rid, Math.max(0, count));
              updateTotalUnread();
            }
          }
          // หมายเหตุ: ไม่จำเป็นต้องจัดการ event "message"
          // เพราะเซิร์ฟเวอร์ควรยิง 'unread' ให้เสมอเมื่อมีการอ่าน/มีข้อความเข้า
        }
      };

      ws.onclose = () => { if (wsRef.current === ws) wsRef.current = null; };
    } catch {
      // เงียบไว้
    }
  })();

  // cleanup
  return () => {
    alive = false;
    if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
  };
}, []);

const buildMenu = () => ([
  { key: 'dashboard', icon: <HomeOutlined />, label: 'หน้าหลัก' },
  {
    key: 'recruitment',
    icon: <UserOutlined />,
    label: 'รับสมัคร',
    children: [
      { key: 'post', label: <Link to="/company/post">โพสต์</Link> },
      { key: 'interview_appointments', label: <Link to="/company/interview_appointments">นัดสัมภาษณ์</Link> },
      { key: 'interview_appointments/confirm', label: <Link to="/company/interview_appointments/confirm">ยืนยันการนัดสัมภาษณ์</Link> },
    ],
  },
  { key: 'profile', icon: <UserOutlined />, label: 'โปรไฟล์' },
  {
    key: 'chat',
    icon: <MessageOutlined />,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        แชท
        <Badge count={totalUnread} overflowCount={99} />
      </span>
    ),
  },
]);
const fullMenu = useMemo(buildMenu, [totalUnread]);

const routeMap: Record<string, string> = { chat: '/chat' };
const menuItems = minimalMenu
  ? fullMenu.filter(item => item.key === 'profile')
  : fullMenu;


  // ✅ หา selectedKey (ไฮไลต์เมนูย่อย) และ openKey (เปิดเมนูพาเร้นท์)
  const { selectedKey, openKey } = useMemo(() => {
    const currentPath = location.pathname;

    for (const item of fullMenu) {
      if (item.children) {
        for (const child of item.children) {
          if (currentPath.startsWith(`/company/${child.key}`)) {
            return { selectedKey: child.key as string | undefined, openKey: item.key as string | undefined };
          }
        }
      } else {
        if (currentPath === `/company/${item.key}`) {
          return { selectedKey: item.key as string | undefined, openKey: undefined as string | undefined };
        }
      }
    }
    return { selectedKey: undefined as string | undefined, openKey: undefined as string | undefined };
  }, [location.pathname, fullMenu]);

  // ✅ กันคลิกที่เมนูพาเร้นท์ (ไม่มีเพจจริง)
  const handleMenuClick = ({ key }: { key: string }) => {
    const target = routeMap[key] ?? `/company/${key}`;
    navigate(target);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/sign-in');
  };

  const logoutMenu = (
    <Menu onClick={({ key }) => { if (key === 'logout') handleLogout(); }}>
      <Menu.Item key="logout" danger>
        ออกจากระบบ
      </Menu.Item>
    </Menu>
  );

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <div onClick={() => navigate("/company/dashboard")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
        <img src={Logo} alt="Logo" style={{ height: 40 }} />
      </div>

      {/* Menu + Notification + Avatar + Logout */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Menu
          mode="horizontal"
          items={menuItems}
          onClick={handleMenuClick}
          // ✅ ถ้าไม่มี selectedKey ให้เป็น [] (ป้องกัน type error)
          selectedKeys={selectedKey ? [selectedKey] : []}
          // ✅ เปิดเมนูพาเร้นท์ถ้ามี
          defaultOpenKeys={openKey ? [openKey] : []}
          style={{ border: 'none', backgroundColor: 'transparent', minWidth: 160 }}
        />

        <Notification />

        <Dropdown overlay={logoutMenu} placement="bottomRight" trigger={['click']}>
          <Avatar
            src={user?.ProfileImage?.[0]?.image_url ? `http://localhost:8000${user.ProfileImage[0].image_url}` : undefined}
            icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
            style={{ cursor: "pointer", marginLeft: 16 }}
          />
        </Dropdown>
      </div>
    </Header>
  );
};

export default CompanyHeader;
