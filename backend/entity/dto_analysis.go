package entity

import (
	"time"

	"gorm.io/gorm"
)

// DTO หรือ Data Transfer Object คือ อ็อบเจกต์สำหรับขนส่งข้อมูล
// ระหว่างเลเยอร์ของระบบ เช่น
// Controller → Service → Repository → Database หรือระหว่าง
// Backend ↔ Frontend (API JSON Response)

/* type TrendResponse struct {
	Series []TimeSeriesPoint `json:"series" gorm:"-"`
} */

// เก็บเหตุการณ์การล็อกอิน เพื่อนำมาวิเคราะห์ Active Users / Fail %
type LoginEvent struct {
	gorm.Model
	IsSuccess bool       `json:"is_success" gorm:"index"` // เปลี่ยนชื่อให้ชัด
	IP        string     `json:"ip"`
	UserAgent string     `json:"user_agent"`
	LoggedAt  time.Time  `json:"logged_at" gorm:"index"`
	LogoutAt  *time.Time `json:"logout_at" gorm:"index"`  // อัปเดตตอน logout
	SessionID string     `json:"session_id" gorm:"index"` // ผูก session

	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID"`
}

type KPIResponse struct {
	TotalApplications     int64   `json:"total_applications"       gorm:"-"`
	MatchingSuccessRate   float64 `json:"matching_success_rate"     gorm:"-"`
	AvgCompanyReviewScore float64 `json:"avg_company_review_score"  gorm:"-"`
	ActiveUsers7d         int64   `json:"active_users_7d"           gorm:"-"`
}

type LabeledValue struct {
	Label string  `json:"label" gorm:"-"`
	Value float64 `json:"value" gorm:"-"`
}

type GroupBarResponse struct {
	Items []LabeledValue `json:"items" gorm:"-"`
}
