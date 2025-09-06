package entity

import (
	"time"

	"gorm.io/gorm"
)

type PasswordResetToken struct {
	gorm.Model
	UserID    uint
	User      User   `gorm:"foreignKey:UserID"`
	Token     string `gorm:"uniqueIndex"`
	ExpiresAt time.Time
	UsedAt    *time.Time
	RequestIP string
	UserAgent string
}
