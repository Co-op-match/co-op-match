package entity

import (
	"gorm.io/gorm"
)

type Gender struct {
	gorm.Model
	Name string `json:"name"`
	NameTH string `json:"name_th"`

	Student       []Student       `gorm:"foreignKey:GenderID"`
	AcademicStaff []AcademicStaff `gorm:"foreignKey:GenderID"`
}
