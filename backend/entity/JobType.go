package entity

import (
	"gorm.io/gorm"
)

type JobType struct {
	gorm.Model

	JobType string `json:"job_type"`
}
