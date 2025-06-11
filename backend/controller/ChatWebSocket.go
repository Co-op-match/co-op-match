package controller

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"co-op-match.com/co-op-match/hub"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

var H = hub.NewHub()

func InitChatHub() {
	go H.Run()
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func ChatWebSocket(c *gin.Context) {
	roomIDStr := c.Query("room_id")
	userIDStr := c.Query("user_id")
	roomID, _ := strconv.Atoi(roomIDStr)
	userID, _ := strconv.Atoi(userIDStr)

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &hub.Client{
		ID:     uint(userID),
		RoomID: uint(roomID),
		Conn:   conn,
		Send:   make(chan []byte),
	}
	H.Register <- client

	go readMessages(client)
	go writeMessages(client)
}

func readMessages(client *hub.Client) {
	defer func() {
		H.Unregister <- client
		client.Conn.Close()
	}()

	for {
		_, msgBytes, err := client.Conn.ReadMessage()
		if err != nil {
			break
		}

		// แปลงข้อความ JSON เพื่อเก็บใน DB
		var payload struct {
			Message string `json:"message"`
		}
		if err := json.Unmarshal(msgBytes, &payload); err == nil {
			config.DB().Create(&entity.ChatMessage{
				Message:    payload.Message,
				Read:       false,
				ChatRoomID: client.RoomID,
				UserID:     client.ID,
			})
		}

		// ส่งข้อความให้ client ทุกคนในห้องเดียวกัน
		H.Broadcast <- hub.MessagePayload{
			Message: msgBytes,
			RoomID:  client.RoomID,
		}
	}
}

func writeMessages(client *hub.Client) {
	defer client.Conn.Close()
	for msg := range client.Send {
		err := client.Conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			return
		}
	}
}

// สร้างห้องแชทระหว่าง user1 กับ user2
func CreateChatRoom(c *gin.Context) {
	var input struct {
		User1ID uint `json:"user1_id"`
		User2ID uint `json:"user2_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var existingRoom entity.ChatRoom
	err := config.DB().Where(
		"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		input.User1ID, input.User2ID, input.User2ID, input.User1ID,
	).First(&existingRoom).Error

	if err == nil {
		// ห้องมีอยู่แล้ว
		c.JSON(http.StatusConflict, gin.H{
			"error":   "Chat room already exists",
			"room_id": existingRoom.ID,
		})
		return
	}

	// ❗ ไม่ log ถ้าเจอว่าเป็นกรณีไม่พบ record (ไม่ถือว่า error จริง)
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		// เป็น error จริงอื่น ๆ เช่น database ล่ม
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// ไม่เจอห้อง = สร้างใหม่
	newRoom := entity.ChatRoom{
		User1ID: input.User1ID,
		User2ID: input.User2ID,
	}

	if err := config.DB().Create(&newRoom).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create chat room"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Chat room created",
		"room_id": newRoom.ID,
	})
}
