package entity

import (
	"gorm.io/gorm"
)

type Student struct {
	gorm.Model

	ApplicationDetails    []ApplicationDetails   `gorm:"foreignKey:StudentID"`
	InterviewAppointments []InterviewAppointment `gorm:"foreignKey:StudentID"`
	Reviews               []Review               `gorm:"foreignKey:StudentID"`
}
