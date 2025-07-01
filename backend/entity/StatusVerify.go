package entity

import (
	"gorm.io/gorm"
)

type StatusVerify struct {
	gorm.Model
	StatusVerify string `json:"status_verify"`

	Verifies		[]Verify			`gorm:"foreignKey:StatusID"`
}