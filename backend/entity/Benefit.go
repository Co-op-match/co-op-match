package entity

import (
	"gorm.io/gorm"
)

type Benefit struct {
	gorm.Model
	Benefit     string `json:"benefit"`
	BenefitName string `json:"benefit_name"`

	IntershipPosts []IntershipPost `gorm:"foreignKey:BenefitID"` // One-to-Many
}
