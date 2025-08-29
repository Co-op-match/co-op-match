// entity/intership_post.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type IntershipPost struct {
	gorm.Model
	PostName        string    `json:"post_name" valid:"required~PostName is required,stringlength(3|100)~PostName must be 3-100 characters"`
	PostDescription string    `json:"post_description" valid:"required~PostDescription is required,stringlength(10|5000)~PostDescription must be 10-5000 characters"`
	Quantity        int32     `json:"quantity" valid:"int,range(1|1000)~Quantity must be between 1 and 1000"`
	MinGpa          float32   `json:"min_gpa" valid:"float,range(0|4)~MinGpa must be between 0.00 and 4.00"`
	CreatedAt       time.Time `json:"created_at"` // ปล่อยให้ gorm จัดการเวลา
	LocationDetail  string    `json:"location_detail" valid:"required~LocationDetail is required"`
	Subdistrict     string    `json:"subdistrict" valid:"required~Subdistrict is required"`
	District        string    `json:"district" valid:"required~District is required"`
	Province        string    `json:"province" valid:"required~Province is required"`

	CompanyID uint    `valid:"required~CompanyID is required"`
	Company   Company `gorm:"foreignKey:CompanyID" valid:"-"`

	JobTypeID uint    `valid:"required~JobTypeID is required"`
	JobType   JobType `gorm:"foreignKey:JobTypeID" valid:"-"`

	StipendID uint    `valid:"required~StipendID is required"`
	Stipend   Stipend `gorm:"foreignKey:StipendID" valid:"-"`

	WorkDayID uint    `valid:"required~WorkDayID is required"`
	WorkDay   WorkDay `gorm:"foreignKey:WorkDayID" valid:"-"`

	WorkModeID uint     `valid:"required~WorkModeID is required"`
	WorkMode   WorkMode `gorm:"foreignKey:WorkModeID" valid:"-"`

	StatusPostID uint       `valid:"required~StatusPostID is required"`
	StatusPost   StatusPost `gorm:"foreignKey:StatusPostID" valid:"-"`

	AdminID uint  `valid:"required~AdminID is required"`
	Admin   Admin `gorm:"foreignKey:AdminID" valid:"-"`

	Benefits []Benefit `gorm:"many2many:intership_post_benefits;" json:"benefits" valid:"-"`

	Applications []Application `gorm:"foreignKey:IntershipPostID" valid:"-"`

	CompanyRequiredSkills []CompanyRequiredSkill `gorm:"foreignKey:IntershipPostID" json:"company_required_skills" valid:"-"`
}
