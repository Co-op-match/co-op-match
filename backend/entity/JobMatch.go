package entity

import (
	"gorm.io/gorm"
)

type JobMatch struct {
	gorm.Model
	Score           float64 `json:"score"`
	Reasons         string  `json:"reasons"`

	StudentID       uint          `json:"student_id"`
	Student         Student       `gorm:"foreignKey:StudentID"`
	
	InternshipPostID uint          `json:"internship_post_id"`
	InternshipPost   IntershipPost `gorm:"foreignKey:InternshipPostID"`
}