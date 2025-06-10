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
	Weight      float64   `json:"weight"`

	GenderID uint   `json:"gender_id"`
	Gender   Gender `gorm:"foreignKey:GenderID" `

	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID"`

	AddressID uint    `json:"address_id"`
	Address   Address `gorm:"foreignKey:AddressID"`

	AdminID uint  `json:"admin_id"`
	Admin   Admin `gorm:"foreignKey:AdminID"`

	Education            []Education            `gorm:"foreignKey:StudentID"`
	StudentSkill         []StudentSkill         `gorm:"foreignKey:StudentID"`
	StudentInterest      []StudentInterest      `gorm:"foreignKey:StudentID"`
	ApplicationDetails   []ApplicationDetails   `gorm:"foreignKey:StudentID"`
	InterviewAppointment []InterviewAppointment `gorm:"foreignKey:StudentID"`
	Reviews              []Review               `gorm:"foreignKey:StudentID"`
	JobMatches           []JobMatch             `gorm:"foreignKey:StudentID"`
}
