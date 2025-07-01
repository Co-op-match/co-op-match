package entity

import "gorm.io/gorm"

type Faculty struct {
	gorm.Model
	NameTH       string      `json:"name_th"`
	UniversityID uint        `json:"university_id"`
	University   University  `gorm:"foreignKey:UniversityID"`
	Programs     []Program   `gorm:"foreignKey:FacultyID"`
	Education    []Education `gorm:"foreignKey:FacultyID"`
}
