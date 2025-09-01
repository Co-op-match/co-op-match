package entity

import (
	"time"

	"gorm.io/gorm"
)

type InterviewAppointment struct {
	gorm.Model
	AppointmentDate time.Time `json:"appointment_date"`
	Mode            string    `json:"mode"`
	Details         string    `json:"details"`

	CompanyID uint
	Company   Company `gorm:"foreignKey:CompanyID"`

	StudentID uint
	Student   Student `gorm:"foreignKey:StudentID"`
	// ✅ เพิ่ม status (เช่น "รอดำเนินการ" | "ผ่าน" | "ไม่ผ่าน")
	Status string `json:"status" gorm:"column:status;size:50"`
}
