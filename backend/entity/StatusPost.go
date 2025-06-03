package entity

import (
	"gorm.io/gorm"
)

type StatusPost struct {
	gorm.Model
	StatusPost string `json:"status_post"`
}
