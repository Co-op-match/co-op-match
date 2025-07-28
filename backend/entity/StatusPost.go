package entity

import (
	"gorm.io/gorm"
)

type StatusPost struct {
	gorm.Model
	StatusPost string `json:"status_post"`
	StatusPostTH string `json:"status_post_th"`

	IntershipPosts []IntershipPost `gorm:"foreignKey:StatusPostID"`
}