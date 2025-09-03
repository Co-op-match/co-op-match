// src/pages/AdvancedChatInterface.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Search, ArrowLeft, Bot, Layout } from 'lucide-react';
import './Chat.css';
import {
  createChatSession,
  createWsByToken,
  getMessagesByToken,
  markReadByToken,
  GetChatRoomsByUserId,
} from '../services/https';
import { useNavigate, useParams } from 'react-router-dom';
import {
  saveChatToken,
  loadChatToken,
  readRidFromToken,
} from '../utils/chatToken';
import CoopMatchHeader from '../pages/Component/Coop_MatchHeader';
import { Content } from 'antd/es/layout/layout';

interface Message {
  id?: number;
  text: string;
  sender: 'user' | 'bot';
  createdAt?: string;
  type: 'text' | 'image' | 'file' | 'audio';
}

interface ChatContact {
  id: number;
  other_user_id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatarUrl?: string;
}

// ---------- helpers ----------
const normalizeUrl = (raw?: string | null) => {
  if (!raw) return '';
  const s = String(raw).trim();
  if (!s) return '';
  return s.startsWith('http') ? s : `http://localhost:8000${s}`;
};

const AdvancedChatInterface: React.FC = () => {
  // ---------- mapping helpers ----------
  const toUiMessage = (m: any, meId: number): Message => ({
    id: m.ID ?? m.id,
    text: m.Message ?? m.message ?? m.text ?? '',
    sender: (m.UserID ?? m.user_id) === meId ? 'user' : 'bot',
    createdAt: m.CreatedAt ?? m.created_at ?? m.createdAt ?? m.timestamp,
    type: 'text',
  });

  const toUiContact = (room: any): ChatContact => {
    const fallbackAvatar =
      room?.avatar_url ??
      room?.company?.logo ??
      room?.Company?.logo ??
      room?.student?.User?.ProfileImage?.[0]?.image_url ??
      room?.Student?.User?.ProfileImage?.[0]?.image_url ??
      '';
    return {
      id: room.id,
      other_user_id: room.other_user_id,
      name: room.name,
      lastMessage: room.last_message ?? '',
      timestamp: room.last_message_time ?? '',
      unread: room.unread_count ?? 0,
      avatarUrl: fallbackAvatar,
    };
  };

  // ---------- state ----------
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);

  const [newMessage, setNewMessage] = useState('');
  const [showContactList, setShowContactList] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { sid } = useParams<{ sid?: string }>(); // token ใน path: /chat/session/:sid
  const isLobbyRoute = !sid; // /chat = true, /chat/session/:sid = false

  const meId = Number(localStorage.getItem('id')) || 0;

  // โทเคนที่ใช้งาน + ห้องปัจจุบัน (null = lobby)
  const [chatToken, setChatToken] = useState<string | null>(sid ?? null);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  // ref เพื่อกัน stale closure บน WS
  const currentRoomRef = useRef<number | null>(null);
  useEffect(() => { currentRoomRef.current = activeRoomId; }, [activeRoomId]);

  // ---------- utils ----------
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const formatTime = (createdAt?: string) => {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fmtShortTime = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (activeRoomId != null) {
      setSelectedContact(contacts.find(c => c.id === activeRoomId) ?? null);
    } else {
      setSelectedContact(null);
    }
  }, [contacts, activeRoomId]);

  // เรียงห้องตามเวลาล่าสุด
  const sortByTime = (a: ChatContact, b: ChatContact) =>
    (b.timestamp ? +new Date(b.timestamp) : 0) -
    (a.timestamp ? +new Date(a.timestamp) : 0);

  // helper: อัปเดต contacts แล้ว sort ทุกครั้ง
  const updateContacts = (updater: (prev: ChatContact[]) => ChatContact[]) => {
    setContacts(prev => {
      const next = updater(prev);
      return [...next].sort(sortByTime);
    });
  };

  // ---------- throttle helper ----------
  function throttle<T extends (...args:any[]) => void>(fn:T, wait:number) {
    let last = 0, timer: any;
    return (...args:any[]) => {
      const now = Date.now();
      const remain = wait - (now - last);
      if (remain <= 0) { last = now; fn(...args); }
      else {
        clearTimeout(timer);
        timer = setTimeout(() => { last = Date.now(); fn(...args); }, remain);
      }
    };
  }

  // ---------- outbox ----------
  const outbox = useRef<string[]>([]);
  const flushOutbox = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (activeRoomId == null) return; // lobby ไม่ส่งข้อความ
    while (outbox.current.length) {
      const text = outbox.current.shift()!;
      wsRef.current.send(JSON.stringify({
        event: 'message',
        message: text,
        type: 'text',
      }));
    }
  }, [activeRoomId]);

  useEffect(() => {
    const id = setInterval(flushOutbox, 150);
    return () => clearInterval(id);
  }, [flushOutbox]);

  // ---------- read receipts ----------
  const lastReadSentRef = useRef<{ roomId: number | null; upToId: number | null }>({ roomId: null, upToId: null });

  const sendReadReceiptRaw = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const roomId = currentRoomRef.current;
    if (roomId == null) return;

    const lastOtherId = [...messages]
      .filter(m => m.sender !== 'user' && m.id != null)
      .map(m => m.id as number)
      .sort((a, b) => b - a)[0] ?? 0;

    if (lastReadSentRef.current.roomId === roomId &&
        lastReadSentRef.current.upToId === lastOtherId) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      event: 'read',
      up_to_id: lastOtherId,
    }));
    lastReadSentRef.current = { roomId, upToId: lastOtherId };
  }, [messages]);

  const sendReadReceipt = useMemo(() => throttle(sendReadReceiptRaw, 250), [sendReadReceiptRaw]);

  // ---------- sync activeRoomId จาก token ----------
  useEffect(() => {
    if (!chatToken) { setActiveRoomId(null); return; }
    if (isLobbyRoute) { setActiveRoomId(null); return; }  // ← บังคับว่างเมื่อ /chat
    const rid = readRidFromToken(chatToken);
    setActiveRoomId(rid && rid > 0 ? rid : null);
  }, [chatToken, isLobbyRoute]);

  // ---------- Bootstrap token + WebSocket ----------
  useEffect(() => {
    if (!meId) return;

    const ensureToken = async (): Promise<string | null> => {
      if (!isLobbyRoute && sid) {
        setChatToken(sid);
        saveChatToken(sid);
        return sid;
      }

      // อยู่ /chat: ใช้ lobby เท่านั้น
      // ถ้าของเดิมเป็น rid>0 ให้ทิ้ง แล้ว mint lobby ใหม่
      const saved = loadChatToken();
      const savedRid = saved ? readRidFromToken(saved) : null;
      if (saved && savedRid === 0) {
        setChatToken(saved);
        return saved;
      }

      const { token } = await createChatSession(0); // rid=0
      setChatToken(token);
      saveChatToken(token);
      return token;
    };

    let ws: WebSocket | null = null;

    (async () => {
      const token = await ensureToken();
      if (!token) return;

      // ปิด WS เก่าก่อนเปิดใหม่
      if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }

      ws = createWsByToken(token);
      wsRef.current = ws;

      ws.onopen = () => {
        flushOutbox?.();
        const ridNow = currentRoomRef.current; // null เมื่อ /chat
        if (ridNow && ridNow > 0) {
          markReadByToken(token, ridNow).catch(() => {});
        }
      };

      ws.onmessage = async (event) => {
        if (wsRef.current !== ws) return;

        let raw = '';
        if (typeof event.data === 'string') raw = event.data;
        else if (event.data instanceof ArrayBuffer) raw = new TextDecoder().decode(event.data);
        else if (event.data instanceof Blob) raw = await event.data.text();
        else return;

        for (const chunk of raw.split('\n')) {
          const line = chunk.trim();
          if (!line) continue;
          let data: any; try { data = JSON.parse(line); } catch { continue; }

          if (data.event === 'room_meta') {
            const ts = String(data.timestamp ?? data.created_at ?? '');
            const lastMsg = String(data.last_message ?? '');
            const unreadCount = Number(data.unread ?? data.count ?? NaN);

            updateContacts(prev => prev.map(c => {
              if (c.id !== data.room_id) return c;
              return {
                ...c,
                lastMessage: lastMsg || c.lastMessage,
                timestamp: ts || c.timestamp,
                unread: Number.isFinite(unreadCount) ? unreadCount : c.unread,
              };
            }));
            continue;
          }

          if (data.event === 'unread') {
            const next = Number(data.count ?? data.unread) || 0;
            updateContacts(prev => prev.map(c =>
              c.id === data.room_id ? { ...c, unread: next } : c
            ));
            continue;
          }

          if (data.event === 'message') {
            const ridNow = currentRoomRef.current;
            const msgRoom = Number(data.chat_room_id);
            const fromMe = !!data.user_id && Number(data.user_id) === meId;

            if (ridNow && msgRoom === ridNow) {
              // อัพเดตหน้าห้องปัจจุบัน
              setMessages(prev => {
                if (fromMe) {
                  for (let i = prev.length - 1; i >= 0; i--) {
                    const m = prev[i];
                    if (m.sender === 'user' && !m.id && m.text === data.message) {
                      const clone = [...prev];
                      clone[i] = { id: data.id, text: data.message, sender: 'user', createdAt: data.created_at, type: data.type };
                      return clone;
                    }
                  }
                }
                return [...prev, { id: data.id, text: data.message, sender: fromMe ? 'user' : 'bot', createdAt: data.created_at, type: data.type }];
              });

              // อัปเดต meta รายชื่อห้อง
              updateContacts(prev => prev.map(c =>
                c.id === ridNow
                  ? { ...c, lastMessage: data.message, timestamp: data.created_at, ...(fromMe ? {} : { unread: 0 }) }
                  : c
              ));

              requestAnimationFrame(() => scrollToBottom());
              if (!fromMe) markReadByToken(token, ridNow).catch(()=>{});
            } else {
              // ห้องอื่น -> อัพเดตแล้ว SORT ให้เด้งขึ้นบน
              updateContacts(prev => prev.map(c =>
                c.id === msgRoom
                  ? { ...c, lastMessage: data.message, timestamp: data.created_at, unread: fromMe ? c.unread : c.unread + 1 }
                  : c
              ));
            }
          }
        }
      };

      ws.onclose = () => { if (wsRef.current === ws) wsRef.current = null; };
    })();

    // cleanup เมื่อ unmount
    return () => {
      if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
    };
  }, [meId, sid, flushOutbox, scrollToBottom]);

  // ---------- โหลดข้อความเมื่อเข้าห้องจริง ----------
  useEffect(() => {
    const load = async () => {
      if (!chatToken) return;
      const rid = readRidFromToken(chatToken);
      if (!rid || rid <= 0) { setMessages([]); return; }

      const data = await getMessagesByToken(chatToken, rid);
      setMessages(Array.isArray(data) ? data.map((m:any)=>toUiMessage(m, meId)) : []);
      await markReadByToken(chatToken, rid).catch(()=>{});
      updateContacts(prev => prev.map(c => c.id === rid ? { ...c, unread: 0 } : c));
      requestAnimationFrame(() => scrollToBottom());
    };
    load();
  }, [chatToken, meId, scrollToBottom]);

  // ---------- ส่ง read เมื่อสลับห้อง/มีข้อความใหม่/โฟกัสแท็บ ----------
  useEffect(() => {
    if (activeRoomId == null) return;
    sendReadReceipt();
  }, [activeRoomId, sendReadReceipt]);

  useEffect(() => {
    if (activeRoomId == null) return;
    sendReadReceipt();
  }, [messages.length, activeRoomId, sendReadReceipt]);

  useEffect(() => {
    const onFocus = () => sendReadReceipt();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [sendReadReceipt]);

  // ---------- Scroll bottom ----------
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ---------- โหลดรายการห้อง + sync selectedContact ----------
  useEffect(() => {
    const fetchRooms = async () => {
      if (!meId) return;
      const res = await GetChatRoomsByUserId(meId);
      if (Array.isArray(res)) {
        const items = res.map(toUiContact).sort(sortByTime);
        setContacts(items);

        if (!isLobbyRoute) {
          const rid = activeRoomId ?? readRidFromToken(chatToken ?? '') ?? null;
          setSelectedContact(rid ? (items.find(c => c.id === rid) || null) : null);
        } else {
          setSelectedContact(null); // อยู่ /chat ให้ว่างเสมอ
        }
      }
    };
    fetchRooms();
  }, [meId, chatToken, activeRoomId, isLobbyRoute]);

  // ---------- actions ----------
  const bumpContactOnMessage = (roomId: number, text: string, ts?: string, fromMe?: boolean) => {
    updateContacts(prev => prev.map(c => c.id !== roomId ? c : ({
      ...c,
      lastMessage: text,
      timestamp: ts ?? c.timestamp,
      unread: (fromMe || selectedContact?.id === roomId) ? c.unread : c.unread + 1,
    })));
  };

  const handleSendMessage = (text?: string) => {
    if (activeRoomId == null) return; // lobby ห้ามส่ง
    const messageText = (text ?? newMessage).trim();
    if (!messageText) return;

    setMessages(prev => [...prev, {
      text: messageText,
      sender: 'user',
      createdAt: new Date().toISOString(),
      type: 'text',
    }]);

    bumpContactOnMessage(activeRoomId, messageText, new Date().toISOString(), true);
    setNewMessage('');

    outbox.current.push(messageText);
    flushOutbox();
  };

  const handleContactClick = async (contact: ChatContact) => {
    setSelectedContact(contact);
    setMessages([]);
    if (window.innerWidth < 768) setShowContactList(false);

    try {
      const { token } = await createChatSession(contact.id);
      setChatToken(token);
      saveChatToken(token);
      setActiveRoomId(readRidFromToken(token) ?? contact.id);
      // ตอนนี้ค่อยเปลี่ยน URL ให้เป็นแบบเจาะห้อง
      navigate(`/chat/session/${token}`, { replace: true });
    } catch {}
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ---------- render ----------
  return (
    <>
       <CoopMatchHeader  />
       <div style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
    <div className="chat-container light-mode">

      {/* Sidebar */}
      <div className={`sidebar ${showContactList ? 'visible' : 'hidden'} light-mode`}>
        <div className="sidebar-header light-mode">
          <div className="sidebar-title">💬 แชท</div>
          <div className="search-container">
            <Search className="search-icon" size={16}/>
            <input onChange={() => {}} placeholder="ค้นหาการสนทนา..." className="search-input"/>
          </div>
        </div>

        <div className="contact-list">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => handleContactClick(contact)}
              className={`contact-item light-mode ${selectedContact?.id === contact.id ? 'selected' : ''}`}
            >
              <div className="contact-info">
                <div className="contact-avatar">
                  {normalizeUrl(contact.avatarUrl) ? (
                    <img src={normalizeUrl(contact.avatarUrl)} alt={contact.name} className="avatar" />
                  ) : (
                    <div className="avatar">
                      {contact?.name?.split(' ')[0]?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="contact-details">
                  <div className="contact-header">
                    <h3 className="contact-name light-mode">{contact.name}</h3>
                    <span className="contact-time">{fmtShortTime(contact.timestamp)}</span>
                  </div>
                  <div className="contact-message-row">
                    <p className="contact-message light-mode">{contact.lastMessage}</p>
                    {contact.unread > 0 && <div className="unread-badge">{contact.unread}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="chat-main">
        {activeRoomId == null ? (
          <div className="empty-state light-mode">
            <div className="empty-inner">
              <div className="empty-icon">💬</div>
              <h3>เลือกห้องแชททางซ้าย</h3>
              <p>คลิกรายชื่อเพื่อเริ่มสนทนา</p>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-header light-mode">
              <div className="chat-header-info">
                <button
                  onClick={() => setShowContactList(!showContactList)}
                  className="back-btn light-mode"
                >
                  <ArrowLeft size={20}/>
                </button>
                <div className="chat-avatar">
                  {normalizeUrl(selectedContact?.avatarUrl) ? (
                    <img
                      src={normalizeUrl(selectedContact?.avatarUrl)}
                      alt={selectedContact?.name || "avatar"}
                      className="avatar"
                    />
                  ) : (
                    <div className="avatar">
                      {selectedContact?.name?.split(' ')[0]?.charAt(0) ?? '?'}
                    </div>
                  )}
                </div>
                <div className="chat-contact-info">
                  <h3 className="light-mode">
                    {selectedContact?.name ?? 'เลือกห้องแชท'}
                  </h3>
                </div>
              </div>
            </div>

            <div className="messages-area light-mode">
              {messages.map((m, idx) => (
                <div key={m.id ?? `tmp-${idx}`} className={`message-group ${m.sender}`}>
                  <div className={`message-container ${m.sender}`}>
                    {m.sender === 'bot' && (
                      <div className={`message-avatar ${m.sender}`}>
                        {normalizeUrl(selectedContact?.avatarUrl) ? (
                          <img
                            src={normalizeUrl(selectedContact?.avatarUrl)}
                            alt={selectedContact?.name || 'user'}
                            className="avatar"
                          />
                        ) : (
                          <Bot size={16}/>
                        )}
                      </div>
                    )}

                    <div className="message-wrapper">
                      <div className={`message-bubble ${m.sender}`}>
                        <p className="message-content">{m.text}</p>
                        <div className="message-footer">
                          <p className={`message-time ${m.sender}`}>
                            {formatTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef}/>
            </div>

            {/* Input Area */}
            <div className="input-area light-mode">
              <div className="input-container">
                <div className="input-btn-wrapper" />
                <div className="input-wrapper">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="พิมพ์ข้อความ... ✨"
                    className="message-input light-mode"
                  />
                </div>
                <button onClick={() => handleSendMessage()} className="input-btn send-btn">
                  <Send size={20}/>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
    </>
  );
};

export default AdvancedChatInterface;
