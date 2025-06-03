package entity

import (
	"gorm.io/gorm"
)

type ApplicationDetails struct {
	gorm.Model

	StudentID uint    // FK to Student
	Student   Student `gorm:"foreignKey:StudentID"`

	ApplicationID uint        // FK to Application
	Application   Application `gorm:"foreignKey:ApplicationID"`
}
