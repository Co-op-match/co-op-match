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

	CompanyID uint    `json:"company_id"`
	Company   Company `gorm:"foreignKey:CompanyID"`

	AcademicStaffID uint          `json:"academic_staff_id"`
	AcademicStaff   AcademicStaff `gorm:"foreignKey:AcademicStaffID"`
}
