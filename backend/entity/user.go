package entity

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email           string `gorm:"unique;not null"`
	Password        string `gorm:"not null"`
	IsActive        bool   `json:"is_active"`
	ConfirmPassword string `gorm:"-"`
	RoleID          uint
	Role            Role
	Approved        bool

	Student       []Student       `gorm:"foreignKey:UserID"`
	AcademicStaff []AcademicStaff `gorm:"foreignKey:UserID"`
	Company       []Company       `gorm:"foreignKey:UserID"`
	Admin         []Admin         `gorm:"foreignKey:UserID"`
	ProfileImage  []ProfileImage  `gorm:"foreignKey:UserID"`
}
