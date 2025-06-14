package entity

import (
	"time"

	"gorm.io/gorm"
)

type Admin struct {
	gorm.Model
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Birthday  time.Time `json:"birthday"`

	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID"`

	Permission    []Permission    `gorm:"foreignKey:AdminID"`
	IntershipPost []IntershipPost `gorm:"foreignKey:AdminID"`
	Company       []Company       `gorm:"foreignKey:AdminID"`
	AcademicStaff []AcademicStaff `gorm:"foreignKey:AdminID"`
	Student       []Student       `gorm:"foreignKey:AdminID"`
}