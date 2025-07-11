package entity

import (
	"gorm.io/gorm"
)

type Benefit struct {
	gorm.Model
	Benefit string `json:"benefit"`

	IntershipPosts []IntershipPost `gorm:"foreignKey:BenefitID"` // One-to-Many
}
