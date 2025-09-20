import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Badge, Button, Dropdown, Layout, Menu, Drawer, Grid, message } from "antd";
import { UserOutlined, HomeOutlined, MenuOutlined, LogoutOutlined, MessageOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

import Logo from "../../assets/Co-op match-Photoroom.png";
import { GetUserByIdhaveStatusData, GetChatRoomsByUserId, createChatSession, createWsByToken } from "../../services/https";
import type { UserInterface } from "../../interfaces/User";
import { UserContext } from "../../components/UserContext";
import { fileURL } from "@/config/env";
import { fetchVerifyStatus } from "../authentication/Login/routeAfterAuth";
import Notification from "../Component/Notification";

const { Header } = Layout;
const { useBreakpoint } = Grid;

interface CoopMatchHeaderDefaultProps {
  minimalMenu?: boolean;
}

const AcademicStaffHeader: React.FC<CoopMatchHeaderDefaultProps> = ({ minimalMenu = false }) => {
  /* ============================ state / ctx ============================ */
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const { logout } = useContext(UserContext);

  const [user, setUser] = useState<UserInterface | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null); // ยังไม่ได้ส่งคำขอ / รอรับรอง / รับรอง / ปฏิเสธ

  // ---- chat unread / ws ----
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const unreadMapRef = useRef<Map<number, number>>(new Map());

  const userID = Number(localStorage.getItem("id"));
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  /* ============================ helpers ============================ */
  const updateTotalUnread = () => {
    const sum = Array.from(unreadMapRef.current.values()).reduce((a, b) => a + (b || 0), 0);
    setTotalUnread(sum);
  };

  const resolveCurrentKey = (pathname: string, keys: string[]): string => {
    if (pathname === "/chat" || pathname.startsWith("/chat/")) return "chat";
    if (pathname.includes("profile")) return "profile";
    return "dashboard";
  };

  /* ============================ fetchers ============================ */
  const fetchUser = async () => {
    if (!userID || Number.isNaN(userID)) return;
    try {
      const res = await GetUserByIdhaveStatusData(userID);
      const status = await fetchVerifyStatus(Number(userID));
      if (res.status !== 200) {
        messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง!!!");
      }
      setUser(res.data);
      setVerifyStatus(status);
    } catch (err) {
      console.error("Failed to fetch user", err);
      messageApi.error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
    }
  };

  const initChatLobby = async () => {
    if (!userID || Number.isNaN(userID)) return;

    // โหลดห้องแชทเพื่อคำนวณ unread เริ่มต้น
    try {
      const rooms: any[] = await GetChatRoomsByUserId(userID);
      unreadMapRef.current.clear();
      if (Array.isArray(rooms)) {
        rooms.forEach((r) => unreadMapRef.current.set(Number(r?.id), Number(r?.unread_count) || 0));
      }
      updateTotalUnread();
    } catch {
      // ignore
    }

    // เปิด WS ล็อบบี้
    try {
      const { token } = await createChatSession(0); // rid=0 (ล็อบบี้รวม)
      const ws = createWsByToken(token);
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        let raw = "";
        if (typeof event.data === "string") raw = event.data;
        else if (event.data instanceof ArrayBuffer) raw = new TextDecoder().decode(event.data);
        else if (event.data instanceof Blob) raw = await event.data.text();
        else return;

        for (const line of raw.split("\n")) {
          const s = line.trim();
          if (!s) continue;
          let data: any;
          try {
            data = JSON.parse(s);
          } catch {
            continue;
          }
          if (data.event === "room_meta" || data.event === "unread") {
            const rid = Number(data.room_id);
            const count = Number(data.unread ?? data.count);
            if (Number.isFinite(rid) && Number.isFinite(count)) {
              unreadMapRef.current.set(rid, Math.max(0, count));
              updateTotalUnread();
            }
          }
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
      };
    } catch {
      // ignore
    }
  };

  /* ============================ effects ============================ */
  useEffect(() => {
    if (userID) {
      fetchUser();
      initChatLobby(); // เปิดแชทล็อบบี้ + นับ unread
    }
    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userID]);

  // เมื่อสถานะ pending ให้ redirect มา /lecturer/profile เสมอ
  const isPending = verifyStatus === "รอรับรอง" || verifyStatus === "ปฏิเสธ";
  useEffect(() => {
    if (isPending && !location.pathname.includes("/lecturer/profile")) {
      navigate("/lecturer/profile", { replace: true });
    }
  }, [isPending, location.pathname, navigate]);

  /* ============================ menu config ============================ */
  const allMenu = useMemo(
    () => [
      { key: "dashboard", icon: <HomeOutlined />, label: "หน้าหลัก" },
      {
        key: "chat",
        icon: <MessageOutlined />,
        label: (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            แชท
            <Badge count={totalUnread} overflowCount={99} />
          </span>
        ),
      },
      { key: "profile", icon: <UserOutlined />, label: "โปรไฟล์" },
    ],
    [totalUnread]
  );

  const profileOnlyMenu = useMemo(() => allMenu.filter((i) => i.key === "profile"), [allMenu]);

  // ถ้า minimal หรือ pending → ให้เหลือเฉพาะโปรไฟล์
  const menuItems = minimalMenu || isPending ? profileOnlyMenu : allMenu;

  const logoutMenuItem = {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "ออกจากระบบ",
    danger: true,
    onClick: () => handleLogout(),
  };

  const drawerMenuItems = [...menuItems, { type: "divider" as const }, logoutMenuItem];

  const profileDropdownItems = [
    {
      key: "logout",
      danger: true,
      icon: <LogoutOutlined />,
      label: "ออกจากระบบ",
      onClick: () => handleLogout(),
    },
  ];

  const availableKeys = useMemo(() => menuItems.map((m: any) => m.key as string), [menuItems]);
  const currentPage = resolveCurrentKey(location.pathname, availableKeys);

  /* ============================ handlers ============================ */
  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      handleLogout();
      return;
    }

    if (isPending && key !== "profile") {
      navigate("/lecturer/profile", { replace: true });
      setDrawerVisible(false);
      return;
    }

    if (key === "chat") {
      navigate("/chat"); // แชทใช้เส้นทางรวม
    } else {
      navigate(`/lecturer/${key}`);
    }
    setDrawerVisible(false);
  };

  const handleLogout = async () => {
    localStorage.clear();
    await logout();
    navigate("/sign-in");
    setDrawerVisible(false);
  };

  /* ============================ render ============================ */
  return (
    <>
      {contextHolder}
      <Header
        style={{
          background: "#fff",
          padding: isMobile ? "0 16px" : "0 24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          height: "64px",
        }}
      >
        {/* Left: Logo (ถ้า pending → ไปโปรไฟล์, ไม่งั้นไปแดชบอร์ด) */}
        <div
          onClick={() => navigate(isPending ? "/lecturer/profile" : "/lecturer/dashboard")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", flex: "0 0 auto" }}
        >
          <img src={Logo} alt="Logo" style={{ height: isMobile ? 32 : 40, maxWidth: isMobile ? 120 : 150 }} />
        </div>

        {/* Right: Menu / Hamburger / Notification / Avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: "1 1 auto",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          {/* Desktop Menu */}
          {!isMobile && (
            <Menu
              mode="horizontal"
              selectedKeys={[currentPage]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{
                border: "none",
                backgroundColor: "transparent",
                flex: "1 1 auto",
                justifyContent: "flex-end",
                maxWidth: isTablet ? "400px" : "600px",
              }}
            />
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)} style={{ marginRight: 8 }} />
          )}

          {/* ใช้ Notification component แทนเมนู "การแจ้งเตือน" */}
          {!isPending && <Notification />}

          {/* Profile Avatar */}
          <Dropdown menu={{ items: profileDropdownItems }} placement="bottomRight" trigger={["click"]}>
            <Avatar
              size={30}
              src={user?.ProfileImage?.[0]?.image_url ? fileURL(user.ProfileImage[0].image_url) : undefined}
              icon={!user?.ProfileImage?.[0]?.image_url ? <UserOutlined /> : undefined}
              style={{ cursor: "pointer", marginLeft: 5, marginRight: 5, flex: "0 0 auto" }}
            />
          </Dropdown>
        </div>
      </Header>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={<div style={{ display: "flex", alignItems: "center" }}><span>เมนู</span></div>}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
        styles={{ body: { padding: 0 } }}
      >
        <Menu mode="inline" selectedKeys={[currentPage]} items={drawerMenuItems} onClick={handleMenuClick} style={{ border: "none" }} />
      </Drawer>
    </>
  );
};

export default AcademicStaffHeader;
