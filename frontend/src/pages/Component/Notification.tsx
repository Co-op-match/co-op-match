import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Dropdown, Badge, Typography, Button, Space, Divider, Empty, message } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

dayjs.extend(relativeTime);
dayjs.locale('th');

type NotificationType = 'success' | 'warning' | 'info' | 'interview' | 'verify' | string;

interface NotificationItem {
  id: number;
  title: string;
  description: string; // message
  time: string;        // "x นาทีที่แล้ว"
  read: boolean;
  type: NotificationType;
  createdAt?: string;  // เก็บไว้เผื่อเรียง
}

const { Text } = Typography;

// ====== ปรับตามสภาพแวดล้อมของคุณ ======
const API_BASE = import.meta.env.VITE_API_BASE || 'api.coop-match.online';
const WS_URL   = import.meta.env.VITE_WS_URL  || 'ws://api.coop-match.online/ws/notifications';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ถ้าใช้ cookie auth
});

const Notification: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [serverUnreadCount, setServerUnreadCount] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
const PAGE_SIZE = 20;

const [loading, setLoading] = useState(false);
const [hasMore, setHasMore] = useState(true);
const [cursor, setCursor] = useState<string | null>(null); // ใช้ createdAt เป็น cursor

  const userId = Number(localStorage.getItem('id') || 0);

  // ---------- helpers ----------
  const mapIconType = (t?: string): NotificationType => {
    if (!t) return 'info';
    const lower = t.toLowerCase();
    if (['success', 'warning', 'info'].includes(lower)) return lower;
    // map คร่าว ๆ สำหรับชนิดที่กำหนดเอง
    if (['interview', 'verify'].includes(lower)) return lower as NotificationType;
    return 'info';
  };

  // api payload ที่คาดหวังจาก GET /notifications/:userID
  type ApiNotification = {
    id: number;
    ID?: number; 
    title?: string;
    message?: string;
    read?: boolean;
    created_at?: string;
    createdAt?: string; // กันหลายรูปแบบ
    type?: string;
    notifications_type?: { type_name?: string; key?: string };
    NotificationsType?: { TypeName?: string; Key?: string; type_name?: string; key?: string };
  };

  const mapFromApi = (n: ApiNotification): NotificationItem => {
      const rawId = (n as any).ID ?? n.id;              // 👈 รับทั้ง ID/id
  if (rawId == null) {
    console.warn('[NOTI] missing id in API row:', n);
  }
  const id = Number(rawId); 
    const createdISO = n.created_at || n.createdAt || new Date().toISOString();
    const typeFromNest =
      n.notifications_type?.type_name ||
      n.notifications_type?.key ||
      n.NotificationsType?.TypeName ||
      n.NotificationsType?.type_name ||
      n.NotificationsType?.Key ||
      n.type ||
      'info';

    return {
       id,
      title: n.title || 'แจ้งเตือน',
      description: n.message || '',
      time: dayjs(createdISO).fromNow(),
      read: !!n.read,
      type: mapIconType(typeFromNest),
      createdAt: createdISO,
    };
  };

const fetchNotifications = useCallback(async () => {
  if (!userId || loading) return;
  try {
    setLoading(true);
    const res = await api.get(`/notifications/${userId}`, {
      params: { limit: PAGE_SIZE }, // หน้าแรกยังไม่มี before
    });
    const rows = (res.data as ApiNotification[]).map(mapFromApi);
    setNotifications(rows);
    setHasMore(rows.length === PAGE_SIZE);
    setCursor(rows.length ? rows[rows.length - 1].createdAt! : null);

    const derived = rows.filter(n => !n.read).length;
    setServerUnreadCount(prev => (prev === null ? derived : prev));
  } catch (err) {
    console.error(err);
    message.error('โหลดการแจ้งเตือนล้มเหลว');
  } finally {
    setLoading(false);
  }
}, [userId]);

const fetchMore = useCallback(async () => {
  if (!userId || !hasMore || loading) return;
  try {
    setLoading(true);
    const res = await api.get(`/notifications/${userId}`, {
      params: { limit: PAGE_SIZE, before: cursor }, // ใช้ cursor (createdAt) ตัวสุดท้าย
    });
    const rows = (res.data as ApiNotification[]).map(mapFromApi);

    setNotifications(prev => {
      const merged = [...prev, ...rows];
      return merged.sort(
        (a, b) => dayjs(b.createdAt!).valueOf() - dayjs(a.createdAt!).valueOf()
      );
    });
    setHasMore(rows.length === PAGE_SIZE);
    setCursor(rows.length ? rows[rows.length - 1].createdAt! : cursor);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [userId, hasMore, loading, cursor]);


  // ---------- mark as read ----------
  const markAsRead = useCallback(async (id: number) => {
    try {
      // ถ้ามีฟังก์ชันใน services/https ให้ใช้แทน:
      // await MarkNotificationAsRead(id);
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      // count จะถูกอัปเดตจาก WS "notification.count" ตามหลัง
    } catch (err) {
      console.error(err);
      message.error('ทำเครื่องหมายว่าอ่านไม่สำเร็จ');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      await Promise.all(unreadIds.map(id => api.patch(`/notifications/${id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // WS จะส่ง count ใหม่มาเอง
    } catch (err) {
      console.error(err);
      message.error('ทำเครื่องหมายอ่านทั้งหมดไม่สำเร็จ');
    }
  }, [notifications]);

  // ---------- unread count ----------
  const derivedUnread = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const badgeCount = serverUnreadCount ?? derivedUnread;

  // ---------- icons ----------
  const getNotificationIcon = (type: NotificationType) => {
    const iconStyle: React.CSSProperties = { fontSize: 16, marginRight: 8 };
    switch (type) {
      case 'success':
        return <CheckOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'warning':
        return <BellOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      default:
        return <BellOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
    }
  };
const mapFromWs = (d: any): NotificationItem => {
  const rawId = d?.id ?? d?.ID;
  const id = Number(rawId);
  const createdISO = d?.createdAt || d?.created_at || new Date().toISOString();
  return {
    id,
    title: d?.title || 'แจ้งเตือน',
    description: d?.message || '',
    read: !!d?.read,
    type: mapIconType(d?.type || d?.Type || d?.notifications_type?.type_name),
    time: dayjs(createdISO).fromNow(),
    createdAt: createdISO,
  };
};

  // ---------- WebSocket ----------
  const connectWS = useCallback(() => {
    if (!userId) return;
    try {
      const ws = new WebSocket(`${WS_URL}?user_id=${userId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        // console.log('WS connected');
      };

ws.onmessage = (ev) => {
  try {
    const payload = JSON.parse(ev.data);
    const evt = payload.event || payload.type;
    const data = payload.data;

    switch (evt) {
      case 'notification.count': {
        const count = Number(data?.count ?? 0);
        setServerUnreadCount(Number.isFinite(count) ? count : 0);
        break;
      }

      case 'notification.created': {
        const item = mapFromWs(data);
        setNotifications((prev) => {
          // กันซ้ำ + จัดเรียงใหม่ โดยเอาอันใหม่ไว้บนสุด
          const exists = prev.some((p) => p.id === item.id);
          const next = exists
            ? prev.map((p) => (p.id === item.id ? item : p))
            : [item, ...prev];
          return next.sort(
            (a, b) => dayjs(b.createdAt!).valueOf() - dayjs(a.createdAt!).valueOf()
          );
        });
        // ไม่ต้องยุ่ง count ที่นี่ ปล่อยให้ event notification.count จัดการ
        break;
      }

      case 'notification.read': {
        const id = Number(data?.id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        break;
      }

      // ถ้ามี bootstrap ส่งมาเป็น array (optional)
      case 'notification.bootstrap': {
        const arr: NotificationItem[] = Array.isArray(data)
          ? data.map(mapFromWs).sort(
              (a, b) => dayjs(b.createdAt!).valueOf() - dayjs(a.createdAt!).valueOf()
            )
          : [];
        setNotifications(arr);
        break;
      }

      default:
        // ignore unknown
        break;
    }
  } catch (e) {
    console.error('WS parse error', e, ev.data);
  }
};


      ws.onclose = () => {
        // retry ด้วย backoff นิดหน่อย
        const attempt = ++reconnectAttempts.current;
        const delay = Math.min(15000, 500 * Math.pow(2, attempt));
        if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = window.setTimeout(connectWS, delay);
      };

      ws.onerror = () => {
        try { ws.close(); } catch {}
      };
    } catch (e) {
      console.error('WS connect error:', e);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    connectWS();
    return () => {
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connectWS]);

  // ---------- UI ----------
  const renderDropdown = () => (
    <div
      style={{
        width: 380,
        maxHeight: 500,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px 12px',
          background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong style={{ color: '#fff', fontSize: 16 }}>การแจ้งเตือน</Text>
          <Badge count={badgeCount} style={{ backgroundColor: '#fff', color: '#1890ff', fontSize: 12, fontWeight: 'bold' }} />
        </div>
        <Space>
          <Button
            type="link"
            size="small"
            style={{ color: '#fff', padding: 0, height: 'auto', fontSize: 12 }}
            onClick={markAllAsRead}
            disabled={(badgeCount ?? 0) === 0}
          >
            ทำเครื่องหมายอ่านทั้งหมด
          </Button>
        </Space>
      </div>

      {/* List */}
<div
  style={{ maxHeight: 400, overflowY: 'auto' }}
  onScroll={(e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      fetchMore();
    }
  }}
>
  {notifications.length > 0 ? (
    notifications.map((item, index) => (
      <div key={item.id}>
                      <div
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  backgroundColor: item.read ? '#fff' : '#f6ffed',
                  borderLeft: item.read ? 'none' : '4px solid #52c41a',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onClick={() => { markAsRead(item.id); }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = item.read ? '#fafafa' : '#f0f9ff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = item.read ? '#fff' : '#f6ffed'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  {getNotificationIcon(item.type)}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 14, color: '#262626', lineHeight: 1.4 }}>{item.title}</Text>
                      {!item.read && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1890ff', marginLeft: 8, marginTop: 4, flexShrink: 0 }} />}
                    </div>
                    <Text style={{ fontSize: 13, color: '#8c8c8c', display: 'block', marginBottom: 6, lineHeight: 1.4 }}>
                      {item.description}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#bfbfbf', fontWeight: 500 }}>
                      {dayjs(item.createdAt).fromNow()}
                    </Text>
                  </div>
                </div>
              </div>
        {index < notifications.length - 1 && (
          <Divider style={{ margin: 0, borderColor: '#f0f0f0' }} />
        )}
      </div>
    ))
  ) : (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Empty description="ไม่มีการแจ้งเตือน" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: 0 }} />
    </div>
  )}

  {/* แถบสถานะโหลด/หมด */}
  <div style={{ padding: 8, textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>
    {loading ? 'กำลังโหลด...' : !hasMore ? '' : null}
  </div>
</div>



    </div>
  );

  return (
    <Dropdown
      dropdownRender={renderDropdown}
      trigger={['click']}
      placement="bottomRight"
      arrow={{ pointAtCenter: true }}
    >
      <div
        style={{
          cursor: 'pointer',
          padding: 8,
          borderRadius: 6,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f5f5f5'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
      >
        <Badge count={badgeCount} size="small" offset={[-2, 2]}>
          <BellOutlined style={{ fontSize: 18, color: (badgeCount ?? 0) > 0 ? '#1890ff' : '#8c8c8c', transition: 'color 0.2s ease' }} />
        </Badge>
      </div>
    </Dropdown>
  );
};

export default Notification;
