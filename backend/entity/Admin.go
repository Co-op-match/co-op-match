package entity

import (
	"time"

	"gorm.io/gorm"
)

type Admin struct {
	gorm.Model
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Birthday  time.Time `json:"birthday"`

	UserID uint
	User   User `gorm:"foreignKey:UserID"`

	Permission     []Permission     `gorm:"foreignKey:AdminID"`
	InternshipPost []InternshipPost `gorm:"foreignKey:AdminID"`
	Company        []Company        `gorm:"foreignKey:AdminID"`
	AcademicStaff  []AcademicStaff  `gorm:"foreignKey:AdminID"`
	Student        []Student        `gorm:"foreignKey:AdminID"`
}
