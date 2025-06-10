package entity

import (
	"gorm.io/gorm"
)

type Skill struct {
	gorm.Model
	SkillName            string                 `json:"skill_name"`
	StudentSkill         []StudentSkill         `gorm:"foreignKey:SkillID"`
	CompanyRequiredSkill []CompanyRequiredSkill `gorm:"foreignKey:SkillID"`
}
