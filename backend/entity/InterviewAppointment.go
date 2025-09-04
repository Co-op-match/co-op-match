// entity/interview_appointment.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type InterviewAppointment struct {
	gorm.Model
	AppointmentDate time.Time `json:"appointment_date" valid:"required~AppointmentDate is required"`
	Mode            string    `json:"mode" valid:"required~Mode is required,in(online|onsite|hybrid)~Mode must be one of online|onsite|hybrid"`
	Details         string    `json:"details" valid:"required~Details is required,stringlength(5|2000)~Details must be 5-2000 characters"`

	CompanyID uint    `valid:"required~CompanyID is required"`
	Company   Company `gorm:"foreignKey:CompanyID" valid:"-"`

	StudentID uint
	Student   Student `gorm:"foreignKey:StudentID"`
	// ✅ เพิ่ม status (เช่น "รอดำเนินการ" | "ผ่าน" | "ไม่ผ่าน")
	Status string `json:"status" gorm:"column:status;size:50"`
}
