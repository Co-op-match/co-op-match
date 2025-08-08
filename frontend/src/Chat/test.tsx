import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Search, ArrowLeft, User, Bot, Settings, Star } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { CreateWebSocketConnection, GetMessagesByRoomId } from '../services/https';
import './Chat.css';


interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
  status?: 'sent' | 'delivered' | 'read'; 
}

interface ChatContact {
  id: number; // ใช้เป็น ChatRoomID
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  avatar?: string;
}

const ChatInterface: React.FC = () => {
  const userID = 1; // ✅ เปลี่ยนเป็น user จริง (จาก localStorage หรือ auth)
  const [contacts] = useState<ChatContact[]>([
    { id: 1, name: "AI Assistant", lastMessage: "ได้เลยครับ...", timestamp: "3 นาที", unread: 0, online: true },
    { id: 2, name: "ฝ่ายขาย", lastMessage: "ขอบคุณครับ", timestamp: "1 ชั่วโมง", unread: 2, online: true },
    { id: 3, name: "ฝ่ายสนับสนุน", lastMessage: "รอสักครู่", timestamp: "เมื่อวาน", unread: 0, online: false }
  ]);
const { roomId, userId } = useParams<{ roomId: string; userId: string }>();
const parsedRoomId = Number(roomId);
const parsedUserId = Number(userId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState<ChatContact>(contacts[0]);
  const [showContactList, setShowContactList] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ⬇️ โหลดข้อความเก่าจาก REST API
 useEffect(() => {
  if (!selectedContact) return;
  GetMessagesByRoomId(selectedContact.id).then((data) => {
    const loaded = data.map((m: any) => ({
      id: m.ID,
      text: m.message,
      sender: m.user_id === userID ? 'user' : 'bot',
      timestamp: new Date(m.created_at),
    }));
    setMessages(loaded);
  });
}, [selectedContact]);


// ⬇️ เชื่อมต่อ WebSocket
useEffect(() => {
  if (!selectedContact) return;
  const ws = CreateWebSocketConnection(selectedContact.id, userID);
  wsRef.current = ws;

  ws.onopen = () => console.log('✅ WebSocket connected');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: data.message,
        sender: data.user_id === userID ? 'user' : 'bot',
        timestamp: new Date(),
      },
    ]);
  };
  ws.onclose = () => console.log('❌ WebSocket disconnected');
  return () => ws.close();
}, [selectedContact]);

  // ⬇️ ส่งข้อความ
const handleSendMessage = async (text?: string, type: Message['type'] = 'text') => {
  const messageText = text || newMessage.trim();
  if (!messageText && type === 'text') return;

  const userMessage: Message = {
    id: Date.now(),
    text: messageText,
    sender: 'user',
    timestamp: new Date(),
    type,
    status: 'sent'
  };

  // แสดงใน UI ทันที
  setMessages(prev => [...prev, userMessage]);
  setNewMessage('');
  setShowEmojiPicker(false);

  // ✅ ส่งไปทาง WebSocket ถ้าเป็นข้อความ text
  if (type === 'text' && wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(
      JSON.stringify({
        text: messageText,
        room_id: parsedRoomId,
        sender_id: userId1,
        type: 'text',
      })
    );
  }

  // อัปเดตสถานะส่ง/อ่าน (mock)
  setTimeout(() => {
    setMessages(prev => prev.map(msg => 
      msg.id === userMessage.id ? { ...msg, status: 'delivered' } : msg
    ));
  }, 1000);

  setTimeout(() => {
    setMessages(prev => prev.map(msg => 
      msg.id === userMessage.id ? { ...msg, status: 'read' } : msg
    ));
  }, 2000);
};

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const getContactAvatar = (contact: ChatContact) => {
    if (contact.name === 'AI Assistant') return <Bot className="avatar-icon" />;
    if (contact.name.includes('ฝ่าย')) return <Settings className="avatar-icon" />;
    if (contact.name.includes('บริษัท')) return <Star className="avatar-icon" />;
    return contact.name.charAt(0);
  };

  const getAvatarClass = (contact: ChatContact) => {
    if (contact.name === 'AI Assistant') return 'avatar-ai';
    if (contact.name.includes('ฝ่าย')) return 'avatar-department';
    if (contact.name.includes('บริษัท')) return 'avatar-company';
    return 'avatar-default';
  };


 return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className={`sidebar ${showContactList ? 'sidebar-show' : 'sidebar-hide'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="header-overlay"></div>
          <div className="header-content">
            <div className="header-top">
              <h2 className="header-title">
                💬 แชท
              </h2>
              <div className="header-actions">
                <button className="action-btn">
                  <Settings className="action-icon" />
                </button>
                <button className="action-btn">
                  <MoreVertical className="action-icon" />
                </button>
              </div>
            </div>
            
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="ค้นหาการสนทนา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Contact List */}
        <div className="contact-list">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => {
                setSelectedContact(contact);
                if (window.innerWidth < 768) setShowContactList(false);
              }}
              className={`contact-item ${selectedContact.id === contact.id ? 'contact-active' : ''}`}
            >
              <div className="contact-content">
                <div className="contact-avatar-container">
                  <div className={`contact-avatar ${getAvatarClass(contact)}`}>
                    {getContactAvatar(contact)}
                  </div>
                  {contact.online && <div className="online-indicator" />}
                </div>
                
                <div className="contact-info">
                  <div className="contact-header">
                    <h3 className="contact-name">{contact.name}</h3>
                    <span className="contact-time">{contact.timestamp}</span>
                  </div>
                  <p className="contact-message">{contact.lastMessage}</p>
                  {contact.online && <span className="online-status">• ออนไลน์</span>}
                </div>
                
                {contact.unread > 0 && (
                  <div className="unread-badge">{contact.unread}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <button 
              onClick={() => setShowContactList(!showContactList)} 
              className="mobile-menu-btn"
            >
              <ArrowLeft className="menu-icon" />
            </button>
            
            <div className="chat-avatar-container">
              <div className={`chat-avatar ${getAvatarClass(selectedContact)}`}>
                {getContactAvatar(selectedContact)}
              </div>
              {selectedContact.online && <div className="chat-online-indicator" />}
            </div>
            
            <div className="chat-info">
              <h3 className="chat-name">{selectedContact.name}</h3>
              <p className="chat-status">
                {selectedContact.online ? (
                  <>
                    <div className="status-dot"></div>
                    ออนไลน์
                  </>
                ) : (
                  'ออฟไลน์'
                )}
              </p>
            </div>
          </div>
          
          <div className="chat-header-actions">
            <button className="header-action-btn">
              <Phone className="header-action-icon" />
            </button>
            <button className="header-action-btn">
              <Video className="header-action-icon" />
            </button>
            <button className="header-action-btn">
              <MoreVertical className="header-action-icon" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message-wrapper ${message.sender === 'user' ? 'message-user' : 'message-bot'}`}>
              <div className="message-group">
                <div className={`message-avatar ${message.sender === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                  {message.sender === 'user' ? <User className="message-avatar-icon" /> : <Bot className="message-avatar-icon" />}
                </div>
                
                <div className={`message-bubble ${message.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                  <p className="message-text">{message.text}</p>
                  <p className="message-time">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message-wrapper message-bot typing-indicator">
              <div className="message-group">
                <div className="message-avatar bot-avatar">
                  <Bot className="message-avatar-icon" />
                </div>
                <div className="message-bubble bubble-bot typing-bubble">
                  <div className="typing-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
            <button className="input-action-btn">
              <Paperclip className="input-action-icon" />
            </button>
            
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="พิมพ์ข้อความ..."
              className="message-input"
            />
            
            <button className="input-action-btn">
              <Smile className="input-action-icon emoji-btn" />
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="send-btn"
            >
              <Send className="send-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
