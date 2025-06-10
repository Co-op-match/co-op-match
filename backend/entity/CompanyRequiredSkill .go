package entity

import (
	"gorm.io/gorm"
)

type CompanyRequiredSkill struct {
	gorm.Model
	SkillID          uint          `json:"skill_id"`
	IntershipPostID uint          `json:"intership_post_id"`
	Skill            Skill         `gorm:"foreignKey:SkillID"`
	IntershipPost   IntershipPost `gorm:"foreignKey:IntershipPostID"`
}