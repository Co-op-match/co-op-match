package entity

import (
	"time"

	"gorm.io/gorm"
)

type LoginLog struct {
	gorm.Model
	LoginAt  time.Time  `json:"login_at"`
	LogoutAt *time.Time `json:"logout_at"`

	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID"`
}