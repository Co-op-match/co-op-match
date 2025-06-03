package entity

import (
	"time"

	"gorm.io/gorm"
)

type Application struct {
	gorm.Model
	Status    string    `json:"status"`
	ResumeUrl string    `json:"resume_url"`
	SubmitAt  time.Time `json:"submit_at"`

	IntershipPostID uint          // FK to Intership_post
	IntershipPost   IntershipPost `gorm:"foreignKey:IntershipPostID"`

	ApplicationDetails []ApplicationDetails `gorm:"foreignKey:ApplicationID"` // one-to-many
}
