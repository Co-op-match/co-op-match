package entity

import (
	"gorm.io/gorm"
)

type Status struct {
	gorm.Model
	Status string `json:"status"`

	Verifies		[]Verify			`gorm:"foreignKey:StatusID"`
	IntershipPosts	[]IntershipPost		`gorm:"foreignKey:StatusID"`
}
