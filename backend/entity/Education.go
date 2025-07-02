package entity

import "gorm.io/gorm"

type Education struct {
	gorm.Model
	
	Year             int       `json:"year"`
	Grade            float64   `json:"grade"`
	
	UniversityID     uint       `json:"university_id"`
	University       University `gorm:"foreignKey:UniversityID"`

	FacultyID        uint     `json:"faculty_id"`
	Faculty          Faculty  `gorm:"foreignKey:FacultyID"`

	ProgramID        uint     `json:"program_id"`
	Program          Program  `gorm:"foreignKey:ProgramID"`

	StudentID        uint     `json:"student_id"`
	Student          Student  `gorm:"foreignKey:StudentID"`

	EducationLevelID uint           `json:"education_level_id"`
	EducationLevel   EducationLevel `gorm:"foreignKey:EducationLevelID"`
}
