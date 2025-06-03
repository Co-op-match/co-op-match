package entity

import (
	"gorm.io/gorm"
)

type Role struct {
	gorm.Model
	RoleName string `gorm:"unique;not null"`
	Users    []User `gorm:"foreignKey:RoleID"`
}
