package entity

import (
	"time"

	"gorm.io/gorm"
)

type InterviewAppointment struct {
	gorm.Model
	AppointmentDate time.Time `json:"appointment_date"`
	Status          string    `json:"status"`
	Mode            string    `json:"mode"`
	Details         string    `json:"details"`

	CompanyID uint    
	Company   Company `gorm:"foreignKey:CompanyID"`

	StudentID uint
	Student   Student `gorm:"foreignKey:StudentID"`
}
