package entity

import (
	"time"

	"gorm.io/gorm"
)

type Review struct {
	gorm.Model
	Rating    int16     `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`

	StudentID uint
	Student   Student `gorm:"foreignKey:StudentID"`

	CompanyID uint
	Company   Company `gorm:"foreignKey:CompanyID"`
}
