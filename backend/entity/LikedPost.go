package entity

import (
	"gorm.io/gorm"
)

type LikedPost struct {
	gorm.Model
	StudentID       uint          `json:"StudentID"`
	Student         Student       `gorm:"foreignKey:StudentID"`
	IntershipPostID uint          `json:"IntershipPostID"`
	IntershipPost   IntershipPost `gorm:"foreignKey:IntershipPostID"`
}
