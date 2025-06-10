package entity

import (
	"gorm.io/gorm"
)

type NotificationsType struct {
	gorm.Model
	Name  string `json:"name"`
	Label string `json:"label"`
}