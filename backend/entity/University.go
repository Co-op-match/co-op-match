package entity

import "gorm.io/gorm"

type University struct {
	gorm.Model
	NameTH  string `json:"name_th"`

	Faculties []Faculty   `gorm:"foreignKey:UniversityID"`
	Education []Education `gorm:"foreignKey:UniversityID"`
}
