package entity

import (
	"gorm.io/gorm"
)

type ReviewLike struct {
	gorm.Model
	ReviewID uint   `gorm:"uniqueIndex:idx_student_review" json:"review_id"`
	Review   Review `gorm:"foreignKey:ReviewID"`

	StudentID uint    `gorm:"uniqueIndex:idx_student_review" json:"student_id"`
	Student   Student `gorm:"foreignKey:StudentID"`
}
