package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"co-op-match.com/co-op-match/hub"
	"co-op-match.com/co-op-match/services"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

var H = hub.NewHub()

type JwtWrapper struct {
	SecretKey       string
	Issuer          string
	ExpirationHours int64
}

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
	fmt.Println("❌ room:", roomIDStr)

	// ✅ ดึง JWT จาก Cookie
	tokenStr, err := c.Cookie("auth_token")
	if err != nil {
		fmt.Println("❌ Cookie not found:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: missing token"})
		return
	}

	fmt.Println("✅ Token from cookie:", tokenStr)
	// ✅ ตรวจสอบความถูกต้องของ Token
	jwtWrapper := services.JwtWrapper{
		SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}
	_, err = jwtWrapper.ValidateToken(tokenStr)

	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: invalid token"})
		return
	}

	// ✅ อัปเกรด WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	// ✅ สร้าง Client
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
			fmt.Println("❌ WebSocket read error:", err)
			break
		}
		fmt.Println("📩 Received:", string(msgBytes))

		var payload struct {
			Message string `json:"message"`
		}
		if err := json.Unmarshal(msgBytes, &payload); err != nil {
			fmt.Println("❌ JSON parse error:", err)
			continue
		}

		// 🐞 Debug payload
		fmt.Printf("📦 Saving Message: %s | UserID=%d | RoomID=%d\n", payload.Message, client.ID, client.RoomID)

		// ✅ บันทึกลง DB
		err = config.DB().Create(&entity.ChatMessage{
			Message:    payload.Message,
			Read:       false,
			ChatRoomID: client.RoomID,
			UserID:     client.ID,
		}).Error
		if err != nil {
			fmt.Println("❌ DB Save error:", err)
		} else {
			fmt.Println("✅ Message saved")
		}

		// 📡 ส่งต่อให้ทุกคนในห้อง
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
func GetMessagesByChatRoomID(c *gin.Context) {
	roomIDStr := c.Param("room_id")
	roomID, err := strconv.Atoi(roomIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room_id"})
		return
	}

	var messages []entity.ChatMessage
	if err := config.DB().
		Preload("User").
		Where("chat_room_id = ?", roomID).
		Order("created_at ASC").
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot fetch messages"})
		return
	}

	c.JSON(http.StatusOK, messages)
}
func MarkMessagesAsRead(c *gin.Context) {
	roomID, _ := strconv.Atoi(c.Param("room_id"))
	userID, _ := strconv.Atoi(c.Query("user_id"))

	if err := config.DB().Model(&entity.ChatMessage{}).
		Where("chat_room_id = ? AND user_id != ? AND read = false", roomID, userID).
		Update("read", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot update read status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Marked as read"})
}
func GetChatRoomsByUserID(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	var rooms []entity.ChatRoom
	if err := config.DB().
		Preload("User1").Preload("User2").
		Where("user1_id = ? OR user2_id = ?", userID, userID).
		Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot fetch chat rooms"})
		return
	}

	c.JSON(http.StatusOK, rooms)
}
