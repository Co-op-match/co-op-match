package entity

import (
	"time"

	"gorm.io/gorm"
)

type ArticleType string

const (
	ArticleTypeNews   ArticleType = "news"
	ArticleTypeCareer ArticleType = "career"
)

type Article struct {
	gorm.Model
	Title       string      `json:"title" binding:"required"`
	Subtitle    string      `json:"subtitle"`
	Body        string      `json:"body"`     // เนื้อหาแบบยาว (ใช้สำหรับ career เป็นหลัก)
	Category    string      `json:"category"` // เช่น 'ประกาศ', 'กิจกรรม', 'การสัมภาษณ์'
	Type        ArticleType `json:"type" binding:"required,oneof=news career"`
	PublishedAt *time.Time  `json:"published_at"`
	IsPublished *bool       `json:"is_published" form:"is_published"`
}
