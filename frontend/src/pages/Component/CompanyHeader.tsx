import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Badge, Dropdown, Layout, Menu } from 'antd';
import {
  UserOutlined,
  HomeOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Logo from "../../assets/Co-op match-Photoroom.png";

import Notification from '../Component/Notification';
import { fileURL } from '@/config/env';
import { GetCompanyByUserID } from '@/services/https/Application';
import type { CompanyInterface } from '@/interfaces/Company';
import { createChatSession, createWsByToken, GetChatRoomsByUserId } from '@/services/https';

const { Header } = Layout;

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
}

const CompanyHeader: React.FC<CoopMatchHeaderDefaultProps> = ({ minimalMenu = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [company, setCompany] = useState<CompanyInterface | null>(null);
  const [avatarVersion, setAvatarVersion] = useState<number>(0);
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const unreadMapRef = useRef<Map<number, number>>(new Map());

  const updateTotalUnread = () => {
    const sum = Array.from(unreadMapRef.current.values()).reduce((a, b) => a + (b || 0), 0);
    setTotalUnread(sum);
  };

  const fetchCompany = async () => {
    const userId = Number(localStorage.getItem("id"));
    if (!userId || isNaN(userId)) return;
    try {
      const res = await GetCompanyByUserID(userId);
      const c: CompanyInterface | null = Array.isArray(res) ? (res[0] ?? null) : res;
      setCompany(c);
      setAvatarVersion(Date.now());
    } catch (e) {
      console.error("Failed to fetch company", e);
    }
  };

  useEffect(() => {
    const userId = Number(localStorage.getItem("id"));
    if (!userId || isNaN(userId)) return;

    // โหลดข้อมูลผู้ใช้ + แชทเริ่มต้น
    fetchCompany();

    GetChatRoomsByUserId(userId)
      .then((rooms: any[]) => {
        unreadMapRef.current.clear();
        if (Array.isArray(rooms)) {
          rooms.forEach(r => unreadMapRef.current.set(Number(r?.id), Number(r?.unread_count) || 0));
        }
        updateTotalUnread();
      })
      .catch(() => { /* ignore */ });

    // เปิด WS ล็อบบี้รับอัปเดต unread
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

          for (const line of raw.split('\n')) {
            const s = line.trim();
            if (!s) continue;
            let data: any;
            try { data = JSON.parse(s); } catch { continue; }

            if (data.event === 'room_meta' || data.event === 'unread') {
              const rid = Number(data.room_id);
              const count = Number(data.unread ?? data.count);
              if (Number.isFinite(rid) && Number.isFinite(count)) {
                unreadMapRef.current.set(rid, Math.max(0, count));
                updateTotalUnread();
              }
            }
          }
        };

        ws.onclose = () => { if (wsRef.current === ws) wsRef.current = null; };
      } catch {
      }
    })();

    const onFocus = () => fetchCompany();
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchCompany(); };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'company_logo_updated') fetchCompany();
    };
    const onCustom = () => fetchCompany();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);
    window.addEventListener('company-logo-updated', onCustom as EventListener);
    window.addEventListener('profile-image-updated', onCustom as EventListener);

    return () => {
      alive = false;
      if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('company-logo-updated', onCustom as EventListener);
      window.removeEventListener('profile-image-updated', onCustom as EventListener);
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

  // หา selectedKey แบบ longest-match เพื่อไฮไลต์รายการที่ถูกต้อง
  const selectedKey = useMemo(() => {
    const currentPath = location.pathname.replace(/\/+$/, '');
    // ไม่นับเมนูหลักที่มี children ก่อน
    for (const item of fullMenu) {
      if (item.children && Array.isArray(item.children)) {
        // เรียง key ยาวก่อน เพื่อให้ path เฉพาะเจาะจงกว่า (เช่น /confirm) ถูกจับก่อน
        const childrenSorted = [...item.children].sort(
          (a: any, b: any) => String(b.key).length - String(a.key).length
        );
        for (const child of childrenSorted) {
          const base = `/company/${child.key}`;
          if (currentPath === base || currentPath.startsWith(`${base}/`)) {
            return child.key as string;
          }
        }
      } else {
        const base = `/company/${item.key}`;
        if (currentPath === base) return item.key as string;
      }
    }
    return undefined;
  }, [location.pathname, fullMenu]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const target = routeMap[key] ?? `/company/${key}`;
    navigate(target);
    // ไม่คุม openKeys => เมนูย่อยจะปิดเองหลังเปลี่ยนหน้า
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

  const baseLogoUrl = company?.logo ? fileURL(company.logo) : undefined;
  const avatarSrc = baseLogoUrl
    ? `${baseLogoUrl}${baseLogoUrl.includes('?') ? '&' : '?'}v=${avatarVersion}`
    : undefined;

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
      {/* โลโก้ */}
      <div onClick={() => navigate("/company/dashboard")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
        <img src={Logo} alt="Logo" style={{ height: 40 }} />
      </div>

      {/* Menu + Notification + Avatar + Logout */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Menu
          mode="horizontal"
          items={menuItems}
          onClick={handleMenuClick}
          selectedKeys={selectedKey ? [selectedKey] : []}   // ✅ ไฮไลต์ตรงหน้า
          // ❌ เอา defaultOpenKeys/openKeys ออก -> dropdown จะไม่ค้างเปิด
          style={{ border: 'none', backgroundColor: 'transparent', minWidth: 160 }}
        />
        <Notification />
        <Dropdown overlay={logoutMenu} placement="bottomRight" trigger={['click']}>
          <Avatar
            src={avatarSrc}
            icon={!avatarSrc ? <UserOutlined /> : undefined}
            style={{ cursor: "pointer", marginLeft: 16 }}
          />
        </Dropdown>
      </div>
    </Header>
  );
};

export default CompanyHeader;
