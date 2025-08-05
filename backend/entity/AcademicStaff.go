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
	Faculty          	string 		`json:"faculty"`
	Department       	string 		`json:"department"`
	University       	string 		`json:"university"`

	UserID    uint  `json:"user_id"`
	User      User   `gorm:"foreignKey:UserID"`
	
	AddressID uint    `json:"address_id"`
	Address   Address `gorm:"foreignKey:AddressID"`
	
	AdminID   uint    `json:"admin_id"`
	Admin     Admin   `gorm:"foreignKey:AdminID"`
	
	GenderID  uint   `json:"gender_id"`
	Gender    Gender `gorm:"foreignKey:GenderID"`

	ContactID  uint   `json:"contact_id"`
	Contact    Contact `gorm:"foreignKey:ContactID"`

}
