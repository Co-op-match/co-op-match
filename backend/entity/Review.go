package entity

import (
	"time"

	"gorm.io/gorm"
)

type Review struct {
	gorm.Model

	Rating    int16  `json:"rating" valid:"range(1|5)~Rating must be between 1 and 5"`
	Comment   string `json:"comment" valid:"required~Comment is required"`
	LikeCount int    `json:"like_count" gorm:"default:0"`

	StudentID uint    `valid:"required~StudentID is required"`
	Student   Student `gorm:"foreignKey:StudentID" valid:"-"`

	CompanyID uint    `valid:"required~CompanyID is required"`
	Company   Company `gorm:"foreignKey:CompanyID" valid:"-"`

	Tags []*Tag `gorm:"many2many:review_tags;" json:"tags"`
}
