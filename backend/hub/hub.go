package hub

import (
	"encoding/json" // ✅ ต้องเพิ่ม
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	UserID uint
	RoomID uint
	Conn   *websocket.Conn
	Send   chan []byte // ใช้ buffered ป้องกัน block
}

func NewClient(userID, roomID uint, conn *websocket.Conn) *Client {
	return &Client{
		UserID: userID,
		RoomID: roomID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}
}

type Hub struct {
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan MessagePayload
	Clients    map[uint]map[*Client]bool // map[RoomID] -> set of clients
}

type MessagePayload struct {
	Message []byte
	RoomID  uint
}

func NewHub() *Hub {
	return &Hub{
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan MessagePayload),
		Clients:    make(map[uint]map[*Client]bool),
	}
}

// นับจำนวนการเชื่อมต่อของแต่ละ user (presence)
var userConnections = map[uint]int{}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			if h.Clients[client.RoomID] == nil {
				h.Clients[client.RoomID] = make(map[*Client]bool)
			}
			h.Clients[client.RoomID][client] = true

			userConnections[client.UserID]++
			if userConnections[client.UserID] == 1 {
				// เพิ่งออนไลน์
				h.broadcastPresence(client.UserID, true) // ✅ ใช้เมธอด
			}

		case client := <-h.Unregister:
			if clients, ok := h.Clients[client.RoomID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.Send)
				}
				if len(clients) == 0 {
					delete(h.Clients, client.RoomID)
				}
			}

			userConnections[client.UserID]--
			if userConnections[client.UserID] <= 0 {
				delete(userConnections, client.UserID)
				// เพิ่งออฟไลน์
				h.broadcastPresence(client.UserID, false) // ✅ ใช้เมธอด
			}

		case msg := <-h.Broadcast:
			if clients, ok := h.Clients[msg.RoomID]; ok {
				for client := range clients {
					select {
					case client.Send <- msg.Message:
					default:
						close(client.Send)
						delete(clients, client)
					}
				}
				if len(clients) == 0 {
					delete(h.Clients, msg.RoomID)
				}
			}
		}
	}
}

// --- helpers ---

// presence: แจ้งทุก client ว่าผู้ใช้ userID ออนไลน์/ออฟไลน์
func (h *Hub) broadcastPresence(userID uint, online bool) {
	payload := map[string]interface{}{
		"event":   "presence",
		"user_id": userID,
		"online":  online,
	}
	data, _ := json.Marshal(payload)

	// ส่งให้ทุกห้อง ทุก client
	for _, clients := range h.Clients {
		for client := range clients {
			select {
			case client.Send <- data:
			default:
				close(client.Send)
				delete(clients, client)
			}
		}
	}
}

func (h *Hub) BroadcastUnread(roomID, targetUserID uint, count int) {
  payload := map[string]interface{}{
    "event":   "unread",
    "room_id": roomID,
    "user_id": targetUserID,
    "count":   count,
  }
  data, _ := json.Marshal(payload)

  // ส่งให้ทุกคอนเนกชันของ user นี้ (ทั้งที่อยู่ในห้อง roomID และใน lobby/ห้องอื่น)
  for _, clients := range h.Clients {
    for c := range clients {
      if c.UserID == targetUserID {
        select {
        case c.Send <- data:
        default:
          close(c.Send); delete(clients, c)
        }
      }
    }
  }
}

func (h *Hub) BroadcastRoomMeta(roomID, targetUserID uint, lastMessage string, ts time.Time, unread int) {
    payload := map[string]interface{}{
        "event":        "room_meta",
        "room_id":      roomID,
        "user_id":      targetUserID,
        "last_message": lastMessage,
        "timestamp":    ts.Format(time.RFC3339),
        "unread":       unread,
    }
    data, _ := json.Marshal(payload)

    for _, clients := range h.Clients {
        for client := range clients {
            if client.UserID == targetUserID {
                select {
                case client.Send <- data:
                default:
                    close(client.Send)
                    delete(clients, client)
                }
            }
        }
    }
}

func (h *Hub) sendToUserInRoom(roomID uint, userID uint, data []byte) {
	if clients, ok := h.Clients[roomID]; ok {
		for cl := range clients {
			if cl.UserID == userID {
				select {
				case cl.Send <- data:
				default:
					close(cl.Send)
					delete(clients, cl)
				}
			}
		}
	}
}

// hub/hub.go
// func (h *Hub) BroadcastRoomMeta(targetUserID, roomID uint, lastMessage string, ts time.Time, unread int) {
// 	payload := map[string]interface{}{
// 		"event":        "room_meta",
// 		"room_id":      roomID,
// 		"user_id":      targetUserID,
// 		"last_message": lastMessage,
// 		"timestamp":    ts.Format(time.RFC3339),
// 		"unread":       unread,
// 	}
// 	data, _ := json.Marshal(payload)

// 	// ⬇️ ส่งให้ "ทุก connection" ของ user นี้ ไม่ว่าอยู่ห้องไหน
// 	for _, clients := range h.Clients {
// 		for client := range clients {
// 			if client.UserID == targetUserID {
// 				select {
// 				case client.Send <- data:
// 				default:
// 					close(client.Send)
// 					delete(clients, client)
// 				}
// 			}
// 		}
// 	}
// }
