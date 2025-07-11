package entity

import (
	"gorm.io/gorm"
)

type Contact struct {
	gorm.Model
	PhoneNumber string `json:"phone_number"`
	Website     string `json:"website"`
	Email       string `json:"email"`
	Line        string `json:"line"`
	Facebook    string `json:"facebook"`

	AcademicStaff []AcademicStaff `gorm:"foreignKey:ContactID"`
	Company       []Company       `gorm:"foreignKey:ContactID"`
}
