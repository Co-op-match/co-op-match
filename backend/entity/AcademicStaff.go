package entity

import (
	"time"

	"gorm.io/gorm"
)

type AcademicStaff struct {
	gorm.Model
	AcademicPosition 	string 		`json:"academic_position"`
	FirstName 			string    	`json:"first_name"`
	LastName  			string    	`json:"last_name"`
	Birthday  			time.Time 	`json:"birthday"`
	Age              	int    		`json:"age"`
	UniversityID     uint       `json:"university_id"`
	University       University `gorm:"foreignKey:UniversityID"`

	FacultyID        uint     `json:"faculty_id"`
	Faculty          Faculty  `gorm:"foreignKey:FacultyID"`

	ProgramID        uint     `json:"program_id"`
	Program          Program  `gorm:"foreignKey:ProgramID"`

	UserID    uint  `json:"user_id"`
	User      User   `gorm:"foreignKey:UserID"`
	
	AddressID uint    `json:"address_id"`
	Address   Address `gorm:"foreignKey:AddressID"`
	
	GenderID  uint   `json:"gender_id"`
	Gender    Gender `gorm:"foreignKey:GenderID"`

	ContactID  uint   `json:"contact_id"`
	Contact    Contact `gorm:"foreignKey:ContactID"`

}
