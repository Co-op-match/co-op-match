package entity

import (
	"gorm.io/gorm"
)

type Interest struct {
	gorm.Model
	InterestName    string            `json:"interest_name"`
	StudentInterest []StudentInterest `gorm:"foreignKey:InterestID"`
}
