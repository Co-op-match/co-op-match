package entity

import (
	"gorm.io/gorm"
)

type LikedPost struct {
	gorm.Model
	StudentID       uint          `json:"StudentID"`
	IntershipPostID uint          `json:"IntershipPostID"`
	Student         Student       `gorm:"foreignKey:StudentID"`
	IntershipPost   IntershipPost `gorm:"foreignKey:IntershipPostID"`
}