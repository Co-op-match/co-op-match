package entity

import (
	"time"

	"gorm.io/gorm"
)

type IntershipPost struct {
	gorm.Model `valid:"-"`

	PostName        string  `json:"post_name" valid:"required~Post name is required"`
	PostDescription string  `json:"post_description" valid:"required~Description is required"`
	Quantity        int32   `json:"quantity" valid:"required~Quantity is required", "quantity,min=1"`
	MinGpa          float32 `json:"min_gpa" valid:"required~GPA is required"`

	CreatedAt time.Time `json:"created_at" valid:"-"`

	LocationDetail string `json:"location_detail" valid:"required~Location is required"`
	Subdistrict    string `json:"subdistrict" valid:"required~Subdistrict is required"`
	District       string `json:"district" valid:"required~District is required"`
	Province       string `json:"province" valid:"required~Province is required"`

	CompanyID uint    `json:"company_id" valid:"required~CompanyID is required"`
	Company   Company `gorm:"foreignKey:CompanyID" valid:"-"`

	JobTypeID uint    `json:"job_type_id" valid:"required~JobTypeID is required"`
	JobType   JobType `gorm:"foreignKey:JobTypeID" valid:"-"`

	StipendID uint    `json:"stipend_id" valid:"required~StipendID is required"`
	Stipend   Stipend `gorm:"foreignKey:StipendID" valid:"-"`

	WorkDayID uint    `json:"work_day_id" valid:"required~WorkDayID is required"`
	WorkDay   WorkDay `gorm:"foreignKey:WorkDayID" valid:"-"`

	WorkModeID uint     `json:"work_mode_id" valid:"required~WorkModeID is required"`
	WorkMode   WorkMode `gorm:"foreignKey:WorkModeID" valid:"-"`

	StatusPostID uint       `json:"status_post_id" valid:"required~StatusPostID is required"`
	StatusPost   StatusPost `gorm:"foreignKey:StatusPostID" valid:"-"`

	AdminID uint  `json:"admin_id" valid:"required~AdminID is required"`
	Admin   Admin `gorm:"foreignKey:AdminID" valid:"-"`

	Benefits              []Benefit              `gorm:"many2many:intership_post_benefits;" json:"benefits" valid:"-"`
	Applications          []Application          `gorm:"foreignKey:IntershipPostID" valid:"-"`
	CompanyRequiredSkills []CompanyRequiredSkill `gorm:"foreignKey:IntershipPostID" json:"company_required_skills" valid:"-"`
}
