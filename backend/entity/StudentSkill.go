package entity

import (
	"gorm.io/gorm"
)

type StudentSkill struct {
	gorm.Model
	SkillID   uint  `json:"skill_id"`
	StudentID uint  `json:"student_id"`
	Skill     Skill `gorm:"foreignKey:SkillID"`
	Student   Student `gorm:"foreignKey:StudentID"`
}
