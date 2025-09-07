package entity

/* 
type Permission struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
	AdminID     uint   `json:"admin_id"`
	Admin       Admin  `gorm:"foreignKey:AdminID"`
}

type RolePermission struct {
	gorm.Model
	PermissionID uint       `json:"permission_id"`
	RoleID       uint       `json:"role_id"`
	Permission   Permission `gorm:"foreignKey:PermissionID"`
	Role         Role       `gorm:"foreignKey:RoleID"`
} 
*/