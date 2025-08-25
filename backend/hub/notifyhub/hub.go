// notifyhub/hub.go
package notifyhub

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var startOnce sync.Once

func Start() {
	startOnce.Do(func() {
		go H.Run()
	})
}

type Event struct {
	Event string      `json:"event"` // "notification.created" | "notification.read" | "notification.count"
	Data  interface{} `json:"data"`
}

type Client struct {
	UserID uint
	Conn   *websocket.Conn
	Send   chan []byte
	Hub    *Hub
}

type Hub struct {
	mu         sync.RWMutex
	register   chan *Client
	unregister chan *Client
	clients    map[uint]map[*Client]bool // userID -> set of clients (ทุกแท็บ/หน้า)
}

func NewHub() *Hub {
	return &Hub{
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[uint]map[*Client]bool),
	}
}

var H = NewHub()

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			if h.clients[c.UserID] == nil {
				h.clients[c.UserID] = make(map[*Client]bool)
			}
			h.clients[c.UserID][c] = true
			h.mu.Unlock()

		case c := <-h.unregister:
			h.mu.Lock()
			if m, ok := h.clients[c.UserID]; ok {
				if _, ok2 := m[c]; ok2 {
					delete(m, c)
					close(c.Send)
				}
				if len(m) == 0 {
					delete(h.clients, c.UserID)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) Register(c *Client)   { h.register <- c }
func (h *Hub) Unregister(c *Client) { h.unregister <- c }

// Writer (ping กัน timeout)
func (c *Client) WritePump() {
	ticker := time.NewTicker(25 * time.Second)
	defer func() {
		ticker.Stop()
		_ = c.Conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.Send:
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.Conn.WriteMessage(websocket.PingMessage, nil)
		}
	}
}

// ---- emit helpers (ทำ snapshot กัน data race) ----
func (h *Hub) emitToUser(userID uint, evt Event) {
	b, _ := json.Marshal(evt)

	h.mu.RLock()
	var conns []*Client
	if m := h.clients[userID]; m != nil {
		conns = make([]*Client, 0, len(m))
		for c := range m {
			conns = append(conns, c)
		}
	}
	h.mu.RUnlock()
	log.Printf("[WS] emit uid=%d event=%s conns=%d hub=%p", userID, evt.Event, len(conns), h)

	for _, c := range conns {
		select {
		case c.Send <- b:
		default:
			// ถ้าช่องตัน ให้ตัดการเชื่อมต่อแท็บนี้ออก
			go func(cc *Client) {
				h.Unregister(cc)
				_ = cc.Conn.Close()
			}(c)
		}
	}
}

func (h *Hub) EmitToUser(userID uint, event string, payload interface{}) {
	h.emitToUser(userID, Event{Event: event, Data: payload})
}

func (h *Hub) NotifyCreated(userID, notiID uint, title, message, typ string, createdAt time.Time, read bool) {
	h.EmitToUser(userID, "notification.created", map[string]interface{}{
		"id":         notiID,
		"title":      title,
		"message":    message,
		"type":       typ, // "info" | "success" | "warning" | custom
		"read":       read,
		"created_at": createdAt.Format(time.RFC3339),
	})
}

func (h *Hub) NotifyRead(userID, notiID uint) {
	h.EmitToUser(userID, "notification.read", map[string]interface{}{
		"id": notiID,
	})
}

func (h *Hub) NotifyCount(userID uint, count int) {
	h.EmitToUser(userID, "notification.count", map[string]interface{}{
		"count": count,
	})
}
func (h *Hub) Stats() map[uint]int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	out := make(map[uint]int)
	for uid, set := range h.clients {
		out[uid] = len(set)
	}
	return out
}
