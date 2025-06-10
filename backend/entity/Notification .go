package entity

import (
	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model
	Title               string    `json:"title"`
	Message             string    `json:"message"`
	Read                bool      `json:"read"`
	UserID              uint      `json:"user_id"`
	NotificationsTypeID uint      `json:"notifications_type_id"`
	User                User      `gorm:"foreignKey:UserID"`
	NotificationsType   NotificationsType `gorm:"foreignKey:NotificationsTypeID"`
}