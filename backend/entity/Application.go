package entity

import (
	"time"

	"gorm.io/gorm"
)

type Application struct {
	gorm.Model
	Status        string `json:"status"`
	ResumeUrl     string `json:"resume_url"`
	TranscriptUrl string
	SubmitAt      time.Time `json:"submit_at"`
	CompanyNote   string    `json:"company_note"`

	IntershipPostID uint          // FK to Intership_post
	IntershipPost   IntershipPost `gorm:"foreignKey:IntershipPostID"`

	ApplicationDetails []ApplicationDetails `gorm:"foreignKey:ApplicationID"` // one-to-many
}
