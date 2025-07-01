package entity

import "gorm.io/gorm"

type Program struct {
	gorm.Model
	NameTH   string `json:"name_th"`
	FacultyID uint  `json:"faculty_id"`

	Faculty Faculty `gorm:"foreignKey:FacultyID"`
	Education            []Education            `gorm:"foreignKey:ProgramID"`
}