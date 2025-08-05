package entity

import (
	"gorm.io/gorm"
)

type Review struct {
	gorm.Model
	Rating  int16  `json:"rating"`
	Comment string `json:"comment"`

	StudentID uint
	Student   Student `gorm:"foreignKey:StudentID"`

	CompanyID uint
	Company   Company `gorm:"foreignKey:CompanyID"`
}
