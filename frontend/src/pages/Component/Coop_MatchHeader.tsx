import React, { useContext, useEffect,  useRef, useState } from 'react';
import { Avatar, Dropdown, Layout, Menu, Badge, Button, Drawer, Grid } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  HomeOutlined,
  SolutionOutlined,
  HistoryOutlined,
  MessageOutlined,
  LogoutOutlined,
  DownOutlined,
  HeartOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserById, GetChatRoomsByUserId, createChatSession, createWsByToken } from '../../services/https';
import type { UserInterface } from '../../interfaces/User';
import Notification from '../Component/Notification';
import { UserContext } from '../../components/UserContext';
import './CoopMStchHeader.css';
import "./Header.css";
import { fileURL } from '@/config/env';

const { Header } = Layout;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isSmallMobile = !screens.sm;
  const isLargeScreen = screens.xl;
  const isDesktop = screens.lg && !screens.xl;
  
  // Force re-render เมื่อหน้าจอ resize
  const [, forceRender] = useState({});
  const [user, setUser] = useState<UserInterface | null>(null);
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const unreadMapRef = useRef<Map<number, number>>(new Map());
  const { logout } = useContext(UserContext);
  // --- เพิ่ม helper ใกล้ๆ ที่ประกาศ availableKeys ---
const resolveCurrentKey = (pathname: string, keys: string[]): string | null => {
  // ครอบคลุม /chat และ /chat/session/xxxx
  if (pathname === '/chat' || pathname.startsWith('/chat/')) {
    return 'chat';
  }

  // ครอบคลุม /student/<key> หรือ path ย่อยที่ลงท้ายด้วย key
  // รองรับ key แบบมี "/" ภายใน เช่น "applications/history"
  for (const key of keys) {
    if (pathname === `/${key}` || pathname.endsWith(`/${key}`) || pathname === `/student/${key}` || pathname.endsWith(`/student/${key}`)) {
      return key;
    }
  }
  return null;
};


  const userId = Number(localStorage.getItem("id"));

  const updateTotalUnread = () => {
    const sum = Array.from(unreadMapRef.current.values()).reduce((a, b) => a + (b || 0), 0);
    setTotalUnread(sum);
  };

  const fetchUser = async () => {
    if (!userId || isNaN(userId)) return;
    try {
      const u = await GetUserById(userId);
      setUser(u);
    } catch (e) {
      console.error("Failed to fetch user", e);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/sign-in");
  };

  useEffect(() => {
    if (!userId || isNaN(userId)) return;

    // โหลดข้อมูลผู้ใช้
    fetchUser();

    // โหลดห้องแชทเพื่อคำนวณ unread เริ่มต้น
    GetChatRoomsByUserId(userId)
      .then((rooms: any[]) => {
        unreadMapRef.current.clear();
        if (Array.isArray(rooms)) {
          rooms.forEach(r => unreadMapRef.current.set(Number(r?.id), Number(r?.unread_count) || 0));
        }
        updateTotalUnread();
      })
      .catch(() => { /* ignore */ });

    // เปิด WS ล็อบบี้เพื่อรับอัปเดต unread
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
        // เงียบไว้
      }
    })();

    //  อัปเดตรูปอัตโนมัติเมื่อโฟกัส/visible/มีสัญญาณอัปเดตรูป
    const onFocus = () => fetchUser();
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchUser(); };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'profile_image_updated') fetchUser();
    };
    const onCustom = () => fetchUser(); // window.dispatchEvent(new Event('profile-image-updated'))

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);
    window.addEventListener('profile-image-updated', onCustom as EventListener);

    return () => {
      alive = false;
      if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('profile-image-updated', onCustom as EventListener);
    };
  }, [userId]);

  // Handle window resize เพื่อแก้ปัญหาเมนูหายตอน resize
  useEffect(() => {
    const handleResize = () => {
      forceRender({});
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [forceRender]);

  const fullMenu = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'หน้าหลัก' },
    { key: 'search', icon: <SearchOutlined />, label: 'ค้นหางาน' },
    { key: 'recommendations', icon: <SolutionOutlined />, label: 'งานแนะนำ' },
    { key: 'applications/history', icon: <HistoryOutlined />, label: 'ประวัติการสมัคร' },
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
      ],
    },
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
  ];

  const visibleMenuItems = minimalMenu ? fullMenu.slice(-2) : fullMenu;
  const availableKeys = fullMenu.map(item => item.key);
  //const currentPage = availableKeys.find(key => location.pathname.includes(key)) || availableKeys[0];
 const currentPage = resolveCurrentKey(location.pathname, availableKeys);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'chat') {
      navigate('/chat');
    } else {
      navigate(`/student/${key}`);
    }
  };

  const avatarUrl = user?.ProfileImage?.[0]?.image_url? fileURL( user?.ProfileImage?.[0]?.image_url) : undefined;

  return (
    <>
      <Header
        className="student-header-responsive"
        style={{
          background: '#fff',
          padding: isSmallMobile ? "0 12px" : isMobile ? "0 16px" : "0 24px",
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: isLargeScreen ? "1400px" : "100%",
          margin: "0 auto",
          width: "100%",
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
        {/* Left: Logo */}
        <div
          onClick={() => navigate("/student/dashboard")}
          className="student-logo-container"
          style={{ 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            marginLeft: isSmallMobile ? 4 : isMobile ? 4 : isTablet ? 6 : isLargeScreen ? 12 : 8,
            marginRight: isSmallMobile ? 8 : isMobile ? 8 : isTablet ? 12 : isLargeScreen ? 20 : 16, 
            flexShrink: 0,
            transition: "all 0.3s ease"
          }}
        >
          <img 
            src={Logo} 
            alt="Logo" 
            style={{ 
              height: isSmallMobile ? 28 : isMobile ? 32 : isTablet ? 36 : 40,
              maxWidth: isSmallMobile ? 100 : isMobile ? 120 : isTablet ? 140 : 150,
              transition: "all 0.3s ease"
            }} 
          />
        </div>

        {/* Right: Menu + Notifications + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, marginLeft: 'auto', minWidth: 0, flex: 1 }}>
          {/* Desktop Menu */}
          {!isMobile && (
            <div className="header-menu-wrap" style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
              <Menu
                className="no-ellipsis-menu student-responsive-menu-horizontal"
                mode="horizontal"
                selectedKeys={currentPage ? [currentPage] : []}
                items={visibleMenuItems}
                onClick={handleMenuClick}
                style={{ 
                  border: 'none', 
                  backgroundColor: 'transparent',
                  width: '100%',
                  minWidth: isSmallMobile ? "280px" : isTablet ? "320px" : isDesktop ? "450px" : "500px",
                  maxWidth: isSmallMobile ? "350px" : isTablet ? "400px" : isDesktop ? "600px" : "700px",
                  fontSize: isSmallMobile ? "12px" : isTablet ? "13px" : "14px",
                  whiteSpace: 'nowrap',
                  flex: 1,
                  overflow: 'visible',
                }}
                overflowedIndicator={null}
              />
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: isSmallMobile ? "18px" : "20px" }} />}
              onClick={() => setDrawerVisible(true)}
              className="student-mobile-menu-button"
              style={{ 
                marginRight: 8,
                width: isSmallMobile ? "40px" : "44px",
                height: isSmallMobile ? "40px" : "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            />
          )}

          <Notification />

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
              size={isSmallMobile ? 28 : isMobile ? 32 : 36}
              shape="circle"
              src={avatarUrl}
              icon={!avatarUrl ? <UserOutlined /> : undefined}
              className="student-profile-avatar-responsive"
              style={{ 
                border: '2px solid #f0f0f0', 
                overflow: 'hidden', 
                flexShrink: 0, 
                cursor: 'pointer',
                transition: "all 0.3s ease"
              }}
            />
          </Dropdown>
        </div>
      </Header>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={
          <div style={{ 
            display: "flex", 
            alignItems: "center",
            fontSize: isSmallMobile ? "16px" : "18px"
          }}>
            <span>เมนู</span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={isSmallMobile ? 260 : 280}
        styles={{ body: { padding: 0 } }}
        className="student-responsive-drawer"
      >
        <Menu
          mode="inline"
          selectedKeys={currentPage ? [currentPage] : []}
          items={[...visibleMenuItems, { type: "divider" as const }, {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "ออกจากระบบ",
            danger: true,
            onClick: () => {
              handleLogout();
            },
          }]}
          onClick={(info) => {
            if (info.key !== 'logout') {
              handleMenuClick(info);
            }
            setDrawerVisible(false);
          }}
          className="student-responsive-drawer-menu"
          style={{ 
            border: "none",
            fontSize: isSmallMobile ? "14px" : "15px"
          }}
        />
      </Drawer>
    </>
  );
};

export default CoopMatchHeader;