package entity

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type JobMatch struct {
	gorm.Model
	Score   float64 `json:"score"`
	Reasons string  `json:"reasons"`

	StudentID uint    `json:"student_id"`
	Student   Student `gorm:"foreignKey:StudentID"`

	InternshipPostID uint          `json:"internship_post_id"`
	InternshipPost   IntershipPost `gorm:"foreignKey:InternshipPostID"`

	MatchedAt time.Time `json:"matched_at"`
	Ranking   int       `json:"ranking"`
	// ✅ เพิ่ม field ที่จำเป็นสำหรับ frontend
	GPA             float64 `json:"gpa"`
	MinGPA          float64 `json:"min_gpa"`
	GpaMatched      bool    `json:"gpa_matched"`
	InterestMatched bool    `json:"interest_matched"`
	LocationMatched bool    `json:"location_matched"`
	MatchedSkills   int     `json:"matched_skills"`
	TotalRequired   int     `json:"total_required"`
	ConfidenceLevel string  `json:"confidence_level"`

	SkillGap         datatypes.JSON `json:"skill_gap"`        // []string
	RecommendReasons datatypes.JSON `json:"recommend_reason"` // []string
	WeakPoints       datatypes.JSON `json:"weak_points"`      // []string
}
