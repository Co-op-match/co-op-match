package entity

import (
	"gorm.io/gorm"
)

type Benefit struct {
	gorm.Model
	Benefit string `json:"benefit"`

	IntershipPosts []IntershipPost `gorm:"many2many:intership_post_benefits;joinForeignKey:BenefitID;joinReferences:IntershipPostID"`
}
