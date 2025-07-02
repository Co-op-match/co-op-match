package entity

import "gorm.io/gorm"

type EducationLevel struct {
	gorm.Model
	Name       string      `json:"name"`
	Educations []Education `gorm:"foreignKey:EducationLevelID"`
}
