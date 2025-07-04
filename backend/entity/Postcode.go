package entity

import (
	"gorm.io/gorm"
)

type Postcode struct {
	gorm.Model
	Postcode string `json:"post_code"`
	SubDistricts   []SubDistrict  `gorm:"foreignKey:PostcodeID"`
}
