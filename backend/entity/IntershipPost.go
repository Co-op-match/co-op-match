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
	MinGpa          float32   `json:"min_gpa"`
	CreatedAt       time.Time `json:"created_at"`
	LocationDetail  string    `json:"location_detail"` // รายละเอียดที่ตั้ง
	Subdistrict     string    `json:"subdistrict"`     // แขวง/ตำบล
	District        string    `json:"district"`        // เขต/อำเภอ
	Province        string    `json:"province"`        // จังหวัด

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

	AdminID   uint
	Admin     Admin   `gorm:"foreignKey:AdminID"`
	BenefitID uint    `json:"benefit_id"`
	Benefit   Benefit `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`

	Applications []Application `gorm:"foreignKey:IntershipPostID"` // one-to-many

}
