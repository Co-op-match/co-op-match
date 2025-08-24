// entity/matching_snapshot.go
package entity

import (
	"time"
	"gorm.io/gorm"
)

type MatchingDailySnapshot struct {
	gorm.Model
	SnapshotDate time.Time `json:"snapshot_date" gorm:"index"`
	Total        int64     `json:"total"`
	Matched      int64     `json:"matched"`
	SuccessRate  float64   `json:"success_rate"`
}