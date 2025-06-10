package entity

import (
	"gorm.io/gorm"
)

type Permission struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
	AdminID     uint   `json:"admin_id"`
	Admin       Admin  `gorm:"foreignKey:AdminID"`
	  
}