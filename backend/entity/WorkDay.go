package entity

import (
	"gorm.io/gorm"
)

type WorkDay struct {
	gorm.Model
	WorkDay string `json:"work_day"`
}
