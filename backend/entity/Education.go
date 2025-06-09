package entity

import (

	"gorm.io/gorm"
)

type Education struct {
	gorm.Model
	University     string  `json:"university"`
	Faculty        string  `json:"faculty"`
	Major          int     `json:"major"`
	Year           int     `json:"year"`
	EducationLevel string  `json:"education_level"`
	Grade          float64 `json:"grade"`

	StudentID uint
	Student   Student `gorm:"foreignKey:StudentID"`
}
