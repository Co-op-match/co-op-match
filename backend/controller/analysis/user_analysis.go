package analysis

import (
	"net/http"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// DTO ที่ส่งให้ FE
type monthlyUsersPoint struct {
	Month         string `json:"month"`          // "YYYY-MM" ของเดือนนั้น
	Students      int    `json:"students"`
	Companies     int    `json:"companies"`
	AcademicStaff int    `json:"academic_staff"`
	Admins        int    `json:"admins"`
}

// GET /analysis/monthly-users-by-role?months=12
func GetMonthlyUsersByRole(c *gin.Context) {
	db := config.DB()

	// จำนวนเดือนย้อนหลัง (default = 12)
	months := 12
	if s := c.Query("months"); s != "" {
		if v, err := strconv.Atoi(s); err == nil && v > 0 && v <= 60 {
			months = v
		}
	}

	now := time.Now() // ถ้าระบบคุณใช้ Asia/Bangkok อยู่แล้วก็ OK
	// anchor ให้เป็นวันแรกของเดือนปัจจุบัน (เที่ยงคืน)
	anchor := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	points := make([]monthlyUsersPoint, 0, months)

	// วนย้อนหลังจากเก่าสุด -> ปัจจุบัน
	for i := months - 1; i >= 0; i-- {
		start := anchor.AddDate(0, -i, 0)
		end := start.AddDate(0, 1, 0) // exclusive

		// นับแต่ละ role ภายในช่วงเดือน
		stu, com, aca, adm := countByRoleInRange(db, start, end)

		points = append(points, monthlyUsersPoint{
			Month:         start.Format("2006-01"),
			Students:      stu,
			Companies:     com,
			AcademicStaff: aca,
			Admins:        adm,
		})
	}

	c.JSON(http.StatusOK, points)
}

// ช่วยนับ role ต่าง ๆ ภายในช่วงเวลาแบบรวมเงื่อนไข soft delete
func countByRoleInRange(db *gorm.DB, start, end time.Time) (students, companies, academicStaff, admins int) {
	var stu, com, aca, adm int64

	db.Model(&entity.Student{}).
		Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", start, end).
		Count(&stu)

	db.Model(&entity.Company{}).
		Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", start, end).
		Count(&com)

	db.Model(&entity.AcademicStaff{}).
		Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", start, end).
		Count(&aca)

	db.Model(&entity.Admin{}).
		Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", start, end).
		Count(&adm)

	return int(stu), int(com), int(aca), int(adm)
}