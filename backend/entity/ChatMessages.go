package entity

import (
	"gorm.io/gorm"
)

type ChatMessage struct {
	gorm.Model
	Message    string    `json:"message"`
	Read       bool      `json:"read"`
	ChatRoomID uint      `json:"chat_room_id"`
	UserID     uint      `json:"user_id"`
	ChatRoom   ChatRoom  `gorm:"foreignKey:ChatRoomID" `
	User       User      `gorm:"foreignKey:UserID"`
}