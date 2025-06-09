package entity

import (
	"time"

	"gorm.io/gorm"
)

type Student struct {
	gorm.Model
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	Birthday    time.Time `json:"birthday"`
	Nationality string    `json:"nationality"`
	Religion    string    `json:"religion"`
	PhoneNumber string    `json:"phone_number"`
	Height      float64   `json:"height"`
	Wight       float64   `json:"wight"`

	GenderID uint
	Gender   Gender `gorm:"foreignKey:GenderID"`

	UserID uint
	User   User `gorm:"foreignKey:UserID"`

	AddressID uint
	Address   Address `gorm:"foreignKey:AddressID"`

	AdminID uint
	Admin   Admin `gorm:"foreignKey:AdminID"`

	Educations            []Education            `gorm:"foreignKey:StudentID"`
	StudentSkills         []StudentSkill         `gorm:"foreignKey:StudentID"`
	StudentInterests      []StudentInterest      `gorm:"foreignKey:StudentID"`
	ApplicationDetails    []ApplicationDetail    `gorm:"foreignKey:StudentID"`
	InterviewAppointments []InterviewAppointment `gorm:"foreignKey:StudentID"`
	Reviews               []Review               `gorm:"foreignKey:StudentID"`
	JobMatches            []JobMatch             `gorm:"foreignKey:StudentID"`
}
