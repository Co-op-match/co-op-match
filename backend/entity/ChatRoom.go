package entity

import (
	"gorm.io/gorm"
)

type ChatRoom struct {
	gorm.Model
	User1ID uint `json:"user1_id"`
	User2ID uint `json:"user2_id"`
	User1 User `gorm:"foreignKey:User1ID;references:ID"` // ชี้ไปที่ User.ID
	User2 User `gorm:"foreignKey:User2ID;references:ID"` // ชี้ไปที่ User.ID เช่นกัน

	Messages []ChatMessage `gorm:"foreignKey:ChatRoomID"`
}
