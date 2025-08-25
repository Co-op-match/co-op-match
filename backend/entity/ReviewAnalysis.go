// entity/review_analysis.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type ReviewAnalysis struct {
	gorm.Model
	ReviewID       uint      `gorm:"uniqueIndex;not null" json:"review_id"`
	Review         Review    `gorm:"foreignKey:ReviewID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Sentiment      string    `json:"sentiment" gorm:"type:varchar(16);index"`
	SentimentScore float64   `json:"sentiment_score"`                        
	ToxicityScore  float64   `json:"toxicity_score"`                        
	AspectsJSON    string    `json:"aspects_json" gorm:"type:text"`           
	AnalyzedAt     time.Time `json:"analyzed_at" gorm:"index"`
}
