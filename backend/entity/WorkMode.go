package entity

import (
	"gorm.io/gorm"
)

type WorkMode struct {
	gorm.Model
	WorkMode string `json:"work_mode"`
}
