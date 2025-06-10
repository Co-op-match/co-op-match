package entity

import (
	"gorm.io/gorm"
)

type StudentInterest struct {
	gorm.Model
	InterestID uint     `json:"interest_id"`
	StudentID  uint     `json:"student_id"`
	Interest   Interest `gorm:"foreignKey:InterestID"`
	Student    Student  `gorm:"foreignKey:StudentID"`
}
