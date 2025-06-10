package entity

import (

	"gorm.io/gorm"
)

type AcademicStaff struct {
	gorm.Model
	AcademicPosition string `json:"academic_position"`
	Age             int    `json:"age"`
	Faculty         string `json:"faculty"`
	Department      string `json:"department"`
	University      string `json:"university"`
	Verify          bool   `json:"verify"`

	UserID    uint  `json:"user_id"`
	User      User   `gorm:"foreignKey:UserID"`
	
	AddressID uint    `json:"address_id"`
	Address   Address `gorm:"foreignKey:AddressID"`
	
	AdminID   uint    `json:"admin_id"`
	Admin     Admin   `gorm:"foreignKey:AdminID"`
	
	GenderID  uint   `json:"gender_id"`
	Gender    Gender `gorm:"foreignKey:GenderID"`

	Contacts []Contact `gorm:"foreignKey:AcademicStaffID"`
}
