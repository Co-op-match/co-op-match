package entity

import (
	"gorm.io/gorm"
)

type ProfileImage struct {
	gorm.Model
	ImageURL string `json:"image_url"`

	UserID uint 
	User   User `gorm:"foreignKey:UserID"`
}
