package entity

import (
	"gorm.io/gorm"
)

type Tag struct {
	gorm.Model
	Name    string    `json:"name" valid:"required~Tag name is required"`
	Reviews []*Review `gorm:"many2many:review_tags;" json:"reviews"`
}
