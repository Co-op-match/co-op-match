package entity

import (
	"gorm.io/gorm"
)

type Benefit struct {
	gorm.Model
	Benefit string `json:"benefit"`
}
