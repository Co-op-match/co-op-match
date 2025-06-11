// hub/hub.go
package hub

import "github.com/gorilla/websocket"

type Client struct {
	ID     uint
	RoomID uint
	Conn   *websocket.Conn
	Send   chan []byte
}

type Hub struct {
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan MessagePayload
	Clients    map[uint]map[*Client]bool // map[RoomID][]Clients
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

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			if h.Clients[client.RoomID] == nil {
				h.Clients[client.RoomID] = make(map[*Client]bool)
			}
			h.Clients[client.RoomID][client] = true

		case client := <-h.Unregister:
			if clients, ok := h.Clients[client.RoomID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.Send)
				}
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
			}
		}
	}
}
