package entity

import (
	"gorm.io/gorm"
)

type Stipend struct {
	gorm.Model
	Stipend string `json:"stipend"`
}
