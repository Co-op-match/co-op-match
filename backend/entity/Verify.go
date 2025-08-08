package entity

import (
	"time"

	"gorm.io/gorm"
)

type Verify struct {
	gorm.Model
	VerificationDocument string     `json:"verification_document"`
	Reason               string     `json:"reason"` // ใช้กรอกเหตุผลเมื่อสถานะเป็น "ปฏิเสธ"
	VerifiedAt           *time.Time `json:"verified_at"`
	
	StatusVerifyID       uint
	StatusVerify         StatusVerify `gorm:"foreignKey:StatusVerifyID"`

	UserID uint
	User   User `gorm:"foreignKey:UserID"`

	AdminID *uint  // nullable เพราะตอนอัปโหลดใหม่ ยังไม่มี admin
	Admin   *Admin `gorm:"foreignKey:AdminID"`
}
