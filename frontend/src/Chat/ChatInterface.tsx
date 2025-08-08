import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Paperclip, Smile, MoreVertical, Phone, Video, Search, ArrowLeft,
  User, Bot, Image, File, Mic, Camera, Check, CheckCheck, Settings, Bell, Moon, Sun, Reply, Copy
} from 'lucide-react';
import './Chat.css';
import { CreateWebSocketConnection, GetChatRoomsByUserId, GetMessagesByRoomId, MarkMessagesAsRead } from '../services/https';
import { useParams } from 'react-router-dom';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  createdAt?: string;             // เวลาแท้จาก backend
  type: 'text' | 'image' | 'file' | 'audio';
  status?: 'sent' | 'delivered' | 'read';
  replyTo?: number;
  attachment?: {
    type: string;
    url: string;
    name?: string;
    size?: number;
  };
}

interface ChatContact {
  id: number;            // room id
  name: string;          // ชื่ออีกฝั่ง
  lastMessage: string;
  timestamp: string;     // เวลา last message
  unread: number;
  online: boolean;
  avatar?: string;
  typing?: boolean;
  lastSeen?: string;
}

const AdvancedChatInterface: React.FC = () => {
  // ---------- helpers: map data จาก backend -> UI ----------
const toUiMessage = (m: any, meId: number): Message => ({
  id: m.ID ?? m.id,                              // gorm.Model.ID
  text: m.Message ?? m.message ?? '',            // ChatMessage.Message
  sender: m.UserID === meId ? 'user' : 'bot',    // ChatMessage.UserID
  createdAt: m.CreatedAt ?? m.createdAt,         // gorm.Model.CreatedAt (string timestamp)
  type: 'text',
  status: m.Read ? 'read' : 'delivered',         // ChatMessage.Read
});

const toUiContact = (room: any, meId: number): ChatContact => {
  const other = room.User1?.ID === meId ? room.User2 : room.User1; // ดูอีกฝั่ง
  return {
    id: room.ID ?? room.id,
    name: other?.Email ?? `Room #${room.ID ?? room.id}`, // ใช้ Email ถ้ายังไม่มีชื่อ
    lastMessage: room.last_message ?? room.Messages?.[room.Messages.length - 1]?.Message ?? '',
    timestamp: room.last_message_time ??
               room.Messages?.[room.Messages.length - 1]?.CreatedAt ?? '',
    unread: room.unread_count ?? 0,              // ถ้า backend ยังไม่ส่งค่า ก็ 0 ไปก่อน
    online: !!other?.IsLoggedIn,                 // User.IsLoggedIn → แสดงจุดเขียว
  };
};

  // ---------- state ----------
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);

  const [newMessage, setNewMessage] = useState('');
  const [showContactList, setShowContactList] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { roomId, userId } = useParams<{ roomId: string; userId: string }>();
  const parsedRoomId = Number(roomId);
  const parsedUserId = Number(userId);
  const meId = Number(localStorage.getItem('id'));

  // simple emoji list (ยังมีใน UI)
  const emojis = [
    '😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂',
    '😉','😌','😍','🥰','😘','😗','👍','👎','❤️','🎉','🚀','✨','🔥','💯'
  ];

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

  const getStatusIcon = (status?: Message['status']) => {
    switch (status) {
      case 'sent': return <Check className="status-icon status-sent" />;
      case 'delivered': return <CheckCheck className="status-icon status-delivered" />;
      case 'read': return <CheckCheck className="status-icon status-read" />;
      default: return null;
    }
  };

  // ---------- effects ----------
  // Connect WS
  useEffect(() => {
    if (!parsedRoomId || !parsedUserId) return;

    const ws = CreateWebSocketConnection(parsedRoomId, parsedUserId);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // ให้ backend ส่งฟอร์แมตคล้าย GetMessagesByRoomId จะดีที่สุด
      setMessages((prev) => [...prev, toUiMessage(data, meId)]);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [parsedRoomId, parsedUserId, meId]);

  // Load messages (จริง) เมื่อเปลี่ยนห้อง
  useEffect(() => {
    const fetchMessages = async () => {
      if (!parsedRoomId) return;
      const data = await GetMessagesByRoomId(parsedRoomId);
      if (Array.isArray(data)) {
        setMessages(data.map((m: any) => toUiMessage(m, meId)));
      } else {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [parsedRoomId, meId]);

  // Mark as read
  useEffect(() => {
    if (messages.length && parsedRoomId && parsedUserId) {
      MarkMessagesAsRead(parsedRoomId, parsedUserId);
    }
  }, [messages, parsedRoomId, parsedUserId]);

  // Load contact list (จริง)
  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!meId) return;
      const res = await GetChatRoomsByUserId(meId);
      if (Array.isArray(res)) {
        const items = res.map((r: any) => toUiContact(r, meId));
        setContacts(items);
        if (!selectedContact && items.length) setSelectedContact(items[0]);
      }
    };
    fetchChatRooms();
  }, [meId, selectedContact]);

  // Scroll bottom เมื่อมีข้อความใหม่
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // (optional) typing simulation ถ้าอยากคงไว้
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedContact?.typing) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedContact]);

  // ---------- actions ----------
  const handleSendMessage = async (text?: string, type: Message['type'] = 'text') => {
    const messageText = text || newMessage.trim();
    if (!messageText && type === 'text') return;

    // optimistic
    const tempId = Date.now();
    const optimistic: Message = {
      id: tempId,
      text: messageText,
      sender: 'user',
      createdAt: new Date().toISOString(),
      type,
      status: 'sent',
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');
    setShowEmojiPicker(false);

    // ส่งจริงผ่าน WS (backend ควร broadcast กลับ)
    if (type === 'text' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        message: messageText,   // field backend
        room_id: parsedRoomId,
        user_id: meId,          // field backend
        type: 'text',
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileMessage: Message = {
      id: Date.now(),
      text: `📎 ${file.name}`,
      sender: 'user',
      createdAt: new Date().toISOString(),
      type: 'file',
      status: 'sent',
      attachment: {
        type: file.type,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      }
    };
    setMessages(prev => [...prev, fileMessage]);
    setShowAttachmentMenu(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageMessage: Message = {
      id: Date.now(),
      text: `🖼️ ส่งรูปภาพ`,
      sender: 'user',
      createdAt: new Date().toISOString(),
      type: 'image',
      status: 'sent',
      attachment: {
        type: file.type,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      }
    };
    setMessages(prev => [...prev, imageMessage]);
    setShowAttachmentMenu(false);
  };

  const toggleRecording = () => {
    setIsRecording(v => !v);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        handleSendMessage('🎤 ข้อความเสียง 0:05', 'audio');
      }, 3000);
    }
  };

  // ---------- derived ----------
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---------- render ----------
  return (
    <div className={`chat-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Sidebar */}
      <div className={`sidebar ${showContactList ? 'visible' : 'hidden'} ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className={`sidebar-header ${darkMode ? 'dark-mode' : 'light-mode'}`}>
          <div className="sidebar-title">💬 แชท AI Pro</div>
          <div className="sidebar-controls">
            <button onClick={() => setDarkMode(!darkMode)} className="sidebar-btn">
              {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <button className="sidebar-btn"><Settings size={20}/></button>
            <button className="sidebar-btn"><Bell size={20}/></button>
          </div>

          <div className="search-container">
            <Search className="search-icon" size={16}/>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาการสนทนา..."
              className="search-input"
            />
          </div>
        </div>

        <div className="contact-list">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => {
                setSelectedContact(contact);
                if (window.innerWidth < 768) setShowContactList(false);
              }}
              className={`contact-item ${darkMode ? 'dark-mode' : 'light-mode'} ${selectedContact?.id === contact.id ? 'selected' : ''}`}
            >
              <div className="contact-info">
                <div className="contact-avatar">
                  <div className="avatar">{contact.name.split(' ')[0].charAt(0)}</div>
                  {contact.online && <div className="online-indicator"></div>}
                </div>

                <div className="contact-details">
                  <div className="contact-header">
                    <h3 className={`contact-name ${darkMode ? 'dark-mode' : 'light-mode'}`}>{contact.name}</h3>
                    <span className="contact-time">{contact.timestamp}</span>
                  </div>
                  <div className="contact-message-row">
                    <p className={`contact-message ${darkMode ? 'dark-mode' : 'light-mode'}`}>
                      {contact.typing ? (
                        <span className="typing-indicator"><span className="typing-dot">●</span><span>กำลังพิมพ์...</span></span>
                      ) : contact.lastMessage}
                    </p>
                    {contact.unread > 0 && <div className="unread-badge">{contact.unread}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Chat Header */}
        <div className={`chat-header ${darkMode ? 'dark-mode' : 'light-mode'}`}>
          <div className="chat-header-info">
            <button onClick={() => setShowContactList(!showContactList)} className={`back-btn ${darkMode ? 'dark-mode' : 'light-mode'}`}>
              <ArrowLeft size={20}/>
            </button>

            <div className="chat-avatar">
              <div className="avatar">{selectedContact?.name?.split(' ')[0].charAt(0) ?? '?'}</div>
              {selectedContact?.online && <div className="online-indicator"></div>}
            </div>

            <div className="chat-contact-info">
              <h3 className={darkMode ? 'dark-mode' : 'light-mode'}>{selectedContact?.name ?? 'เลือกห้องแชท'}</h3>
              <p className={`chat-status ${darkMode ? 'dark-mode' : 'light-mode'} ${selectedContact?.typing ? 'typing' : ''}`}>
                {selectedContact?.typing ? (
                  <span className="typing-indicator"><span className="typing-dot">●</span>กำลังพิมพ์...</span>
                ) : selectedContact?.online ? 'ออนไลน์' : (selectedContact?.lastSeen || 'ออฟไลน์')}
              </p>
            </div>
          </div>

          <div className="chat-actions">
            <button className={`action-btn ${darkMode ? 'dark-mode' : 'light-mode'}`}><Search size={20}/></button>
            <button className={`action-btn ${darkMode ? 'dark-mode' : 'light-mode'}`}><Phone size={20}/></button>
            <button className={`action-btn ${darkMode ? 'dark-mode' : 'light-mode'}`}><Video size={20}/></button>
            <button className={`action-btn ${darkMode ? 'dark-mode' : 'light-mode'}`}><MoreVertical size={20}/></button>
          </div>
        </div>

        {/* Messages */}
        <div className={`messages-area ${darkMode ? 'dark-mode' : 'light-mode'}`}>
          {messages.map((message) => (
            <div key={message.id} className={`message-group ${message.sender}`}>
              <div className={`message-container ${message.sender}`}>
                <div className={`message-avatar ${message.sender}`}>
                  {message.sender === 'user' ? <User size={16}/> : <Bot size={16}/>}
                </div>

                <div className="message-wrapper">
                  <div className={`message-bubble ${message.sender} ${message.sender === 'bot' ? (darkMode ? 'dark-mode' : 'light-mode') : ''}`}>
                    {message.type === 'image' && message.attachment ? (
                      <div className="image-attachment">
                        <img src={message.attachment.url} alt="Shared image"/>
                      </div>
                    ) : message.type === 'file' && message.attachment ? (
                      <div className="file-attachment">
                        <File size={32}/>
                        <div className="file-info">
                          <div className="file-name">{message.attachment.name}</div>
                          <div className="file-size">{message.attachment.size ? `${(message.attachment.size / 1024).toFixed(1)} KB` : ''}</div>
                        </div>
                      </div>
                    ) : null}

                    <p className="message-content">{message.text}</p>
                    <div className="message-footer">
                      <p className={`message-time ${message.sender} ${message.sender === 'bot' ? (darkMode ? 'dark-mode' : 'light-mode') : ''}`}>
                        {formatTime(message.createdAt)}
                      </p>
                      {message.sender === 'user' && <div className="message-status">{getStatusIcon(message.status)}</div>}
                    </div>

                    <div className="message-actions">
                      <button className={`message-action-btn ${darkMode ? 'dark-mode' : 'light-mode'}`}><Reply size={12}/></button>
                      <button className={`message-action-btn ${darkMode ? 'dark-mode' : 'light-mode'}`}><Copy size={12}/></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="typing-container">
              <div className="typing-message">
                <div className="message-avatar bot"><Bot size={16}/></div>
                <div className={`typing-bubble ${darkMode ? 'dark-mode' : 'light-mode'}`}>
                  <div className="typing-dots">
                    <div className={`typing-dot ${darkMode ? 'dark-mode' : 'light-mode'}`}></div>
                    <div className={`typing-dot ${darkMode ? 'dark-mode' : 'light-mode'}`}></div>
                    <div className={`typing-dot ${darkMode ? 'dark-mode' : 'light-mode'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef}/>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className={`emoji-picker ${darkMode ? 'dark-mode' : 'light-mode'}`}>
            <div className="emoji-grid">
              {emojis.map((e, i) => (
                <button key={i} onClick={() => handleEmojiSelect(e)} className={`emoji-btn ${darkMode ? 'dark-mode' : 'light-mode'}`} title={e}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attachment Menu */}
        {showAttachmentMenu && (
          <div className={`attachment-menu ${darkMode ? 'dark-mode' : 'light-mode'}`}>
            <button onClick={() => imageInputRef.current?.click()} className={`attachment-btn ${darkMode ? 'dark-mode' : 'light-mode'}`}>
              <Image size={20} style={{ color: '#10b981' }}/>
              <span className={darkMode ? 'dark-mode' : 'light-mode'}>รูปภาพ</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className={`attachment-btn ${darkMode ? 'dark-mode' : 'light-mode'}`}>
              <File size={20} style={{ color: '#3b82f6' }}/>
              <span className={darkMode ? 'dark-mode' : 'light-mode'}>เอกสาร</span>
            </button>
            <button onClick={() => {}} className={`attachment-btn ${darkMode ? 'dark-mode' : 'light-mode'}`}>
              <Camera size={20} style={{ color: '#8b5cf6' }}/>
              <span className={darkMode ? 'dark-mode' : 'light-mode'}>กรอง</span>
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className={`input-area ${darkMode ? 'dark-mode' : 'light-mode'}`}>
          <div className="input-container">
            <div className="input-btn-wrapper">
              <button onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className={`input-btn attachment-btn-input ${darkMode ? 'dark-mode' : 'light-mode'}`}>
                <Paperclip size={20} />
              </button>
            </div>

            <div className="input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="พิมพ์ข้อความ... ✨"
                className={`message-input ${darkMode ? 'dark-mode' : 'light-mode'}`}
              />
            </div>

            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`input-btn emoji-btn-input ${darkMode ? 'dark-mode' : 'light-mode'}`}>
              <Smile size={20}/>
            </button>

            {newMessage.trim() ? (
              <button onClick={() => handleSendMessage()} className="input-btn send-btn">
                <Send size={20}/>
              </button>
            ) : (
              <button onClick={toggleRecording} className={`input-btn voice-btn ${isRecording ? 'recording' : ''}`}>
                <Mic size={20}/>
              </button>
            )}
          </div>

          {isRecording && (
            <div className="recording-indicator">
              <div className="recording-dot"></div>
              <span className="recording-text">🎤 กำลังบันทึกเสียง... กดเพื่อหยุด</span>
              <div className="recording-dot"></div>
            </div>
          )}
        </div>

        {/* Hidden inputs */}
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.zip,.rar" onChange={handleFileUpload} className="hidden"/>
        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
      </div>

      {(showEmojiPicker || showAttachmentMenu) && (
        <div className="popup-overlay" onClick={() => { setShowEmojiPicker(false); setShowAttachmentMenu(false); }}/>
      )}
    </div>
  );
};

export default AdvancedChatInterface;
