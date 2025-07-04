package entity

import (
	"time"

	"gorm.io/gorm"
)

type IntershipPost struct {
	gorm.Model
	PostName        string    `json:"post_name"`
	PostDescription string    `json:"post_description"`
	Qualifications  string    `json:"qualifications"`
	Quantity        int32     `json:"quantity"`
	MinGpa          string    `json:"min_gpa"`
	CreatedAt       time.Time `json:"created_at"`

	CompanyID uint
	Company   Company `gorm:"foreignKey:CompanyID"`

	JobTypeID uint
	JobType   JobType `gorm:"foreignKey:JobTypeID"`

	StipendID uint
	Stipend   Stipend `gorm:"foreignKey:StipendID"`

	WorkDayID uint
	WorkDay   WorkDay `gorm:"foreignKey:WorkDayID"`

	WorkModeID uint
	WorkMode   WorkMode `gorm:"foreignKey:WorkModeID"`

	StatusPostID uint
	StatusPost   StatusPost `gorm:"foreignKey:StatusPostID"`

	AdminID uint
	Admin   Admin `gorm:"foreignKey:AdminID"`

	//BenefitID uint
	//Benefit   Benefit `gorm:"foreignKey:BenefitID"`

	Benefits []Benefit `gorm:"many2many:intership_post_benefits;" json:"Benefits"`

	Applications []Application `gorm:"foreignKey:IntershipPostID"` // one-to-many

}
