package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"co-op-match.com/co-op-match/hub"
	"co-op-match.com/co-op-match/services"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

var H = hub.NewHub()

type WSIn struct {
	Event   string `json:"event"`    // "message" | "read"
	Message string `json:"message"`  // เฉพาะ event=message
	Type    string `json:"type"`     // "text" ...
	UpToID  uint   `json:"up_to_id"` // เฉพาะ event=read
}

type WSOut struct {
	Event      string `json:"event"`
	ID         uint   `json:"id,omitempty"`
	Message    string `json:"message,omitempty"`
	Type       string `json:"type,omitempty"`
	UserID     uint   `json:"user_id"`
	ChatRoomID uint   `json:"chat_room_id"`
	CreatedAt  string `json:"created_at"`
	UpToID     uint   `json:"up_to_id,omitempty"`
}

func InitChatHub() { go H.Run() }

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func isMember(userID, roomID uint) bool {
	if roomID == 0 {
		return true
	}
	var r entity.ChatRoom
	if err := config.DB().First(&r, roomID).Error; err != nil {
		return false
	}
	return r.User1ID == userID || r.User2ID == userID
}

func getBearer(c *gin.Context) string {
	ah := c.GetHeader("Authorization")
	const p = "Bearer "
	if len(ah) > len(p) && strings.HasPrefix(ah, p) {
		return strings.TrimSpace(ah[len(p):])
	}
	return ""
}

// ---------- 1) สร้าง Chat Session Token ----------

type chatSessionReq struct {
	RoomID uint `json:"room_id"`
}

func CreateChatSession(c *gin.Context) {
	fmt.Println("🔍 CreateChatSession called")

	// ดึง user หลักจาก cookie JWT หรือ Authorization header
	var tokenStr string
	var err error

	// ลองดึงจาก cookie ก่อน
	tokenStr, err = c.Cookie("auth_token")
	fmt.Printf("🍪 Cookie auth_token: %v (error: %v)\n", tokenStr != "", err)

	if err != nil {
		// ถ้าไม่มี cookie ลองดึงจาก Authorization header
		bearerToken := getBearer(c)
		fmt.Printf("🔑 Authorization header token: %v\n", bearerToken != "")
		if bearerToken == "" {
			fmt.Println("❌ No auth token found in cookie or header")
			fmt.Printf("📋 Request headers: %+v\n", c.Request.Header)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: missing token"})
			return
		}
		tokenStr = bearerToken
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-only"
	}
	jwtWrapper := services.JwtWrapper{
		SecretKey:       secret, // <— ใช้ตัวเดียวกัน
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}
	claims, err := jwtWrapper.ValidateToken(tokenStr)
	if err != nil {
		fmt.Printf("❌ JWT validation failed: %v\n", err)
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: invalid token"})
		return
	}
	userID64, _ := strconv.ParseUint(claims.Subject, 10, 64)
	userID := uint(userID64)
	fmt.Printf("✅ JWT validated successfully. UserID: %d\n", userID)

	var req chatSessionReq
	_ = c.ShouldBindJSON(&req)
	fmt.Printf("📝 CreateChatSession request - room: %d, user: %d\n", req.RoomID, userID)

	// ตรวจสิทธิ์ในห้อง (ยกเว้น lobby = 0)
	memberCheck := isMember(userID, req.RoomID)
	fmt.Printf("👥 isMember check - userID: %d, roomID: %d, result: %v\n", userID, req.RoomID, memberCheck)

	if !memberCheck {
		fmt.Printf("❌ Access denied: User %d is not a member of room %d\n", userID, req.RoomID)
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "not a member"})
		return
	}

	fmt.Printf("✅ Access granted: User %d creating chat session for room %d\n", userID, req.RoomID)

	chatTok := services.ChatToken{Secret: "chat-secret", TTL: 2 * time.Hour}
	tok, err := chatTok.Mint(userID, req.RoomID)
	if err != nil {
		c.JSON(500, gin.H{"error": "cannot mint chat token"})
		return
	}
	c.JSON(200, gin.H{"token": tok})
}

// แทนทั้งฟังก์ชัน ChatWebSocket เดิม
func ChatWebSocket(c *gin.Context) {
	// รับ chat token จาก query
	tokenStr := c.Query("token")
	if tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
		return
	}

	// parse chat token
	chatTok := services.ChatToken{Secret: "chat-secret", TTL: 2 * time.Hour}
	claims, err := chatTok.Parse(tokenStr)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	// user จาก sub, room จาก rid
	userID64, _ := strconv.ParseUint(claims.Subject, 10, 64)
	userID := uint(userID64)
	roomID := claims.Rid
	// ยืนยันสิทธิ์ในห้อง (roomID=0 คือ lobby)
	if ridStr := c.Query("rid"); ridStr != "" {
		if qRid, err := strconv.ParseUint(ridStr, 10, 64); err == nil && uint(qRid) != roomID {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "rid mismatch; use token rid"})
			return
		}
	}

	if !isMember(userID, roomID) {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "not allowed"})
		return
	}

	// อัปเกรดเป็น WS
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	conn.SetReadLimit(1 << 20)
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	client := hub.NewClient(userID, roomID, conn)
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

		var in WSIn
		if err := json.Unmarshal(msgBytes, &in); err != nil {
			fmt.Println("❌ JSON parse error:", err)
			continue
		}

		switch in.Event {
		case "message":
			// ตรวจสอบข้อความว่าง
			if strings.TrimSpace(in.Message) == "" {
				fmt.Println("⚠️  Empty message ignored from user:", client.UserID)
				continue
			}

			rec := entity.ChatMessage{
				Message:    strings.TrimSpace(in.Message), // ล้างช่องว่าง
				Read:       false,
				ChatRoomID: client.RoomID,
				UserID:     client.UserID,
			}
			if err := config.DB().Create(&rec).Error; err != nil {
				fmt.Println("❌ DB Save error:", err)
				continue
			}

			// broadcast message ในห้อง (คงไว้)
			out := WSOut{
				Event:      "message",
				ID:         rec.ID,
				Message:    rec.Message,
				Type:       in.Type,
				UserID:     rec.UserID,
				ChatRoomID: rec.ChatRoomID,
				CreatedAt:  rec.CreatedAt.Format(time.RFC3339),
			}
			payload, _ := json.Marshal(out)
			H.Broadcast <- hub.MessagePayload{RoomID: client.RoomID, Message: payload}

			// หาอีกฝั่ง + นับ unread ของอีกฝั่ง
			var room entity.ChatRoom
			if err := config.DB().First(&room, client.RoomID).Error; err == nil {
				var other uint
				if room.User1ID == client.UserID {
					other = room.User2ID
				} else {
					other = room.User1ID
				}

				var unreadOther int64
				_ = config.DB().Model(&entity.ChatMessage{}).
					Where("chat_room_id = ? AND user_id <> ? AND read = false", client.RoomID, other).
					Count(&unreadOther).Error

				// ✅ แจ้งอีกฝั่ง (ลิสต์ห้อง และ/หรือแท็บที่เปิดห้อง)
				H.BroadcastUnread(client.RoomID, other, int(unreadOther))
				// ✅ แจ้งอีกฝั่ง (target = other)
				H.BroadcastRoomMeta(client.RoomID, other, rec.Message, rec.CreatedAt, int(unreadOther))

				// ✅ อัปเดตฝั่งผู้ส่ง (target = client.UserID, unread = 0)
				H.BroadcastRoomMeta(client.RoomID, client.UserID, rec.Message, rec.CreatedAt, 0)
			}

		case "read":
			q := config.DB().Model(&entity.ChatMessage{}).
				Where("chat_room_id = ? AND user_id <> ? AND read = false", client.RoomID, client.UserID)
			if in.UpToID != 0 {
				q = q.Where("id <= ?", in.UpToID)
			}
			if err := q.Update("read", true).Error; err != nil {
				fmt.Println("❌ DB update read error:", err)
				continue
			}

			// read receipt เดิม
			out := WSOut{
				Event:      "read",
				UserID:     client.UserID,
				ChatRoomID: client.RoomID,
				UpToID:     in.UpToID,
				CreatedAt:  time.Now().Format(time.RFC3339),
			}
			payload, _ := json.Marshal(out)
			H.Broadcast <- hub.MessagePayload{RoomID: client.RoomID, Message: payload}

			// ==== ⬇️ เพิ่มส่วนนี้: ยิง room_meta ให้ "ผู้อ่าน" → unread = 0 ====
			var last entity.ChatMessage
			_ = config.DB().
				Where("chat_room_id = ?", client.RoomID).
				Order("created_at DESC").
				First(&last).Error
			// ----- ภายใต้ case "read": หลังดึง last สำเร็จ -----
			H.BroadcastRoomMeta(client.RoomID, client.UserID, last.Message, last.CreatedAt, 0)

		}
	}
}

func writeMessages(client *hub.Client) {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case msg, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				_ = client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			if _, err := w.Write(msg); err != nil {
				w.Close()
				return
			}

			// batch ของค้างใน channel
			n := len(client.Send)
			for i := 0; i < n; i++ {
				_, _ = w.Write([]byte("\n"))
				more := <-client.Send
				if _, err := w.Write(more); err != nil {
					w.Close()
					return
				}
			}
			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ---------- HTTP ----------

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
	fmt.Printf("🔍 GetMessagesByChatRoomID called for room: %s\n", roomIDStr)

	roomID64, err := strconv.ParseUint(roomIDStr, 10, 64)
	if err != nil {
		fmt.Printf("❌ Invalid room_id: %s\n", roomIDStr)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room_id"})
		return
	}
	roomID := uint(roomID64)

	// ลองใช้ chat token ก่อน ถ้าไม่ได้ใช้ JWT token
	bearerToken := getBearer(c)
	fmt.Printf("🔑 Bearer token received: %v\n", bearerToken != "")

	if bearerToken == "" {
		fmt.Printf("❌ No authorization header found. Headers: %+v\n", c.Request.Header)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
		return
	}

	var userID uint

	// ลองเป็น chat token ก่อน
	chatTok := services.ChatToken{Secret: "chat-secret", TTL: 2 * time.Hour}
	claims, err := chatTok.Parse(bearerToken)
	if err != nil {
		// ถ้าไม่ใช่ chat token ลองเป็น JWT token
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "dev-secret-only"
		}
		jwtWrapper := services.JwtWrapper{
			SecretKey:       secret,
			Issuer:          "AuthService",
			ExpirationHours: 24,
		}
		jwtClaims, jwtErr := jwtWrapper.ValidateToken(bearerToken)
		if jwtErr != nil {
			fmt.Printf("❌ Neither chat token nor JWT token valid: chat=%v, jwt=%v\n", err, jwtErr)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		userID64, _ := strconv.ParseUint(jwtClaims.Subject, 10, 64)
		userID = uint(userID64)
	} else {
		userID64, _ := strconv.ParseUint(claims.Subject, 10, 64)
		userID = uint(userID64)
	}

	if !isMember(userID, roomID) {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "not allowed"})
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
	roomID64, _ := strconv.ParseUint(c.Param("room_id"), 10, 64)
	roomID := uint(roomID64)

	// รองรับทั้ง chat token และ JWT token
	bearerToken := getBearer(c)
	if bearerToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
		return
	}

	var userID uint

	// ลองเป็น chat token ก่อน
	chatTok := services.ChatToken{Secret: "chat-secret", TTL: 2 * time.Hour}
	claims, err := chatTok.Parse(bearerToken)
	if err != nil {
		// ถ้าไม่ใช่ chat token ลองเป็น JWT token
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "dev-secret-only"
		}
		jwtWrapper := services.JwtWrapper{
			SecretKey:       secret,
			Issuer:          "AuthService",
			ExpirationHours: 24,
		}
		jwtClaims, jwtErr := jwtWrapper.ValidateToken(bearerToken)
		if jwtErr != nil {
			fmt.Printf("❌ Neither chat token nor JWT token valid: chat=%v, jwt=%v\n", err, jwtErr)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		userID64, _ := strconv.ParseUint(jwtClaims.Subject, 10, 64)
		userID = uint(userID64)
	} else {
		userID64, _ := strconv.ParseUint(claims.Subject, 10, 64)
		userID = uint(userID64)
	}

	if !isMember(userID, roomID) {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "not allowed"})
		return
	}

	if err := config.DB().Model(&entity.ChatMessage{}).
		Where("chat_room_id = ? AND user_id != ? AND read = false", roomID, userID).
		Update("read", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot update read status"})
		return
	}

	// push unread=0 + room_meta
	H.BroadcastUnread(roomID, userID, 0)

	var last entity.ChatMessage
	_ = config.DB().Where("chat_room_id = ?", roomID).
		Order("created_at DESC").
		First(&last).Error
	if last.ID != 0 {
		H.BroadcastRoomMeta(userID, roomID, last.Message, last.CreatedAt, 0)
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
	// เพิ่ม preload ของ AcademicStaff พร้อมจัดการ error
	if err := config.DB().
		Preload("User1").Preload("User1.Company").Preload("User1.Student").Preload("User1.ProfileImage").Preload("User1.AcademicStaff").
		Preload("User2").Preload("User2.Company").Preload("User2.Student").Preload("User2.ProfileImage").Preload("User2.AcademicStaff").
		Where("user1_id = ? OR user2_id = ?", userID, userID).
		Find(&rooms).Error; err != nil {
		fmt.Printf("❌ Database error when fetching chat rooms for user %d: %v\n", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot fetch chat rooms"})
		return
	}
	type RoomDTO struct {
		ID              uint       `json:"id"`
		User1ID         uint       `json:"user1_id"`
		User2ID         uint       `json:"user2_id"`
		Name            string     `json:"name"`
		Online          bool       `json:"online"`
		LastMessage     string     `json:"last_message"`
		LastMessageTime *time.Time `json:"last_message_time,omitempty"`
		UnreadCount     int64      `json:"unread_count"`
		AvatarURL       string     `json:"avatar_url"` // ✅ เพิ่มฟิลด์รูป
	}

	out := make([]RoomDTO, 0, len(rooms))

	for _, r := range rooms {
		// ป้องกันข้อมูล User ที่เป็น nil
		if r.User1.ID == 0 || r.User2.ID == 0 {
			fmt.Printf("⚠️  Skipping room %d: incomplete user data\n", r.ID)
			continue
		}

		other := r.User1
		if r.User1ID == uint(userID) {
			other = r.User2
		}

		// ---------- ชื่อ ----------
		name := strings.TrimSpace(other.Email)

		// 1) บริษัทมาก่อน
		if len(other.Company) > 0 && strings.TrimSpace(other.Company[0].CompanyName) != "" {
			name = strings.TrimSpace(other.Company[0].CompanyName)

			// 2) อาจารย์: ปรับให้แสดงชื่อเสถียรมากขึ้น
		} else if len(other.AcademicStaff) > 0 {
			st := other.AcademicStaff[0]

			// ตรวจสอบว่าข้อมูล AcademicStaff ไม่เป็น zero value
			if st.ID == 0 {
				fmt.Printf("⚠️  AcademicStaff data incomplete for user %d\n", other.ID)
			} else {
				// ล้างช่องว่างและตรวจสอบค่าว่าง
				pos := strings.TrimSpace(st.AcademicPosition)
				fn := strings.TrimSpace(st.FirstName)
				ln := strings.TrimSpace(st.LastName)

				// สร้างชื่อเต็ม (ชื่อ + นามสกุล)
				fullName := strings.TrimSpace(fn + " " + ln)

				// ถ้ามีตำแหน่งและชื่อ ให้แสดงแบบ "ตำแหน่ง ชื่อ นามสกุล"
				if pos != "" && fullName != "" {
					name = strings.TrimSpace(pos + " " + fullName)
				} else if fullName != "" {
					// ถ้าไม่มีตำแหน่งแต่มีชื่อ ให้แสดงแค่ชื่อ
					name = fullName
				} else if pos != "" {
					// ถ้ามีแค่ตำแหน่งไม่มีชื่อ (กรณีพิเศษ)
					name = pos
				}
			}

			// 3) นักศึกษา
		} else if len(other.Student) > 0 {
			fn := strings.TrimSpace(other.Student[0].FirstName)
			ln := strings.TrimSpace(other.Student[0].LastName)
			if full := strings.TrimSpace(fn + " " + ln); full != "" {
				name = full
			}
		}

		// สำรองสุดท้าย
		if name == "" {
			name = fmt.Sprintf("User #%d", other.ID)
		}

		// ---------- last message / unread ----------
		var last entity.ChatMessage
		_ = config.DB().
			Where("chat_room_id = ?", r.ID).
			Order("created_at DESC").
			First(&last).Error

		var unread int64
		_ = config.DB().Model(&entity.ChatMessage{}).
			Where("chat_room_id = ? AND user_id != ? AND read = false", r.ID, userID).
			Count(&unread).Error

		// ---------- avatar ----------
		avatarURL := ""
		// 1) company logo มาก่อน (ถ้ามี)
		if len(other.Company) > 0 {
			// ปรับชื่อฟิลด์ให้ตรงกับ model ของคุณ เช่น Logo / LogoPath / Image
			if other.Company[0].Logo != "" {
				avatarURL = other.Company[0].Logo
			}
		}
		// 2) ถ้าไม่มีโลโก้ ใช้รูปโปรไฟล์ของ User
		if avatarURL == "" && len(other.ProfileImage) > 0 {
			// ฟิลด์ใน JSON ตัวอย่างชื่อ image_url
			if other.ProfileImage[0].ImageURL != "" {
				avatarURL = other.ProfileImage[0].ImageURL
			}
		}

		// ถ้าเก็บเป็น path ไม่ใช่ URL เต็ม จะต่อ base เองฝั่ง UI ก็ได้
		// หรือจะบังคับต่อที่นี่:
		// if avatarURL != "" && !strings.HasPrefix(avatarURL, "http") {
		//     avatarURL = "http://localhost:8000" + avatarURL
		// }

		dto := RoomDTO{
			ID:          r.ID,
			User1ID:     r.User1ID,
			User2ID:     r.User2ID,
			Name:        name,
			Online:      other.IsLoggedIn,
			LastMessage: last.Message,
			UnreadCount: unread,
			AvatarURL:   avatarURL, // ✅ ใส่ค่า
		}
		if !last.CreatedAt.IsZero() {
			t := last.CreatedAt
			dto.LastMessageTime = &t
		}

		out = append(out, dto)
	}

	c.JSON(http.StatusOK, out)
}
