// entity/activity.go
package entity

import (
	"gorm.io/gorm"
	"time"
)

type Activity struct {
	gorm.Model
	Action     string    `json:"action" gorm:"index"`      // เช่น "สมัครงาน", "อนุมัติโพสต์", "ยืนยันตัวตน"
	OccurredAt time.Time `json:"occurred_at" gorm:"index"` // เวลาเกิดเหตุ (แยกจาก CreatedAt เพื่อยืดหยุ่น)

	UserID   *uint  `json:"user_id" gorm:"index"`
	User     User   `gorm:"foreignKey:UserID"`
	UserName string `json:"user_name" gorm:"index"` // denormalize ไว้โชว์เร็ว
	Role     string `json:"role" gorm:"index"`      // "Student" | "Company" | "AcademicStaff" | "Admin"

	CompanyID *uint         `json:"company_id" gorm:"index"`
	Company   Company       `gorm:"foreignKey:CompanyID"`
	PostID    *uint         `json:"post_id" gorm:"index"`
	Post      IntershipPost `gorm:"foreignKey:PostID"`

	// เผื่ออยากเก็บรายละเอียดเพิ่ม (JSON)
	Metadata string `json:"metadata" gorm:"type:text"` // เก็บ JSON string เช่น {"ip":"...", "note":"..."}
}
