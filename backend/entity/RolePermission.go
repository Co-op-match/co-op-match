package entity

import (
	"gorm.io/gorm"
)

type RolePermission struct {
	gorm.Model
	PermissionID uint       `json:"permission_id"`
	RoleID       uint       `json:"role_id"`
	Permission   Permission `gorm:"foreignKey:PermissionID"`
	Role         Role       `gorm:"foreignKey:RoleID"`
}
