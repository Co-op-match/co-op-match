package entity

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email           string `gorm:"unique;not null"`
	Password        string `gorm:"not null"`
	ConfirmPassword string `gorm:"-"`
	RoleID          uint
	Role            Role
	Approved        bool
}
