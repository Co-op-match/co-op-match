package entity

import (
	"gorm.io/gorm"
)

type Company struct {
	gorm.Model
	CompanyName string `json:"company_name"`
	Logo        string `json:"logo"`
	Verify      bool   `json:"verify"`

	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID"`

	AddressID uint    `json:"address_id"`
	Address   Address `gorm:"foreignKey:AddressID"`

	AdminID uint  `json:"admin_id"`
	Admin   Admin `gorm:"foreignKey:AdminID"`

	Contact               []Contact              `gorm:"foreignKey:CompanyID"`
	IntershipPosts        []IntershipPost        `gorm:"foreignKey:CompanyID"` // one-to-many
	InterviewAppointments []InterviewAppointment `gorm:"foreignKey:CompanyID"` // one-to-many
	Reviews               []Review               `gorm:"foreignKey:CompanyID"`
}
