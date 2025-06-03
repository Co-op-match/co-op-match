package entity

import (
	"gorm.io/gorm"
)

type Company struct {
	gorm.Model

	IntershipPosts        []IntershipPost        `gorm:"foreignKey:CompanyID"` // one-to-many
	InterviewAppointments []InterviewAppointment `gorm:"foreignKey:CompanyID"` // one-to-many
	Reviews               []Review               `gorm:"foreignKey:CompanyID"`
}
