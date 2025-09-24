package entity

import (
	"time"

	"gorm.io/gorm"
)

type HistoryApplicationStatus struct {
	gorm.Model
	// เก็บเป็น date-only (ไม่มีเวลา) เพื่อความชัดเจนในการ unique
	Date         time.Time `gorm:"type:date;index:idx_uni_date,unique" json:"date"`
	UniversityID uint      `gorm:"index:idx_uni_date,unique" json:"university_id"`

	Total       int64 `json:"total"`
	Pass        int64 `json:"pass"`        // ผ่าน
	Review      int64 `json:"review"`      // กำลังพิจารณา
	Interviewed int64 `json:"interviewed"` // นัดสัมภาษณ์แล้ว
	Waiting     int64 `json:"waiting"`     // รอการนัดสัมภาษณ์
	Fail        int64 `json:"fail"`        // ไม่ผ่าน, ไม่ได้รับเลือก
}
