package analysis

import (
	"fmt"
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const monthlyTTL = 6 * time.Hour

func GetMonthlyUsersByRole(c *gin.Context) {
	db := config.DB()

	now := time.Now()
	y, m, _ := now.Date()
	needRebuild := false

	// force refresh
	if c.Query("force") == "1" {
		needRebuild = true
	} else {
		// 1) ตรวจเดือนปัจจุบัน: มี snapshot ไหม / หมดอายุหรือยัง
		var cur entity.MonthlyUserRoleStat
		if err := db.Where("year = ? AND month = ?", y, int(m)).First(&cur).Error; err != nil {
			needRebuild = true
		} else if now.Sub(cur.SnapshotAt) > monthlyTTL {
			needRebuild = true
		} else {
			// 2) ✅ เทียบ "ยอดจริงของเดือนปัจจุบัน" กับ snapshot — ถ้าไม่เท่ากัน ให้ rebuild
			live := mustCountMonthlyByRole(db, y, int(m)) // ใช้เกณฑ์ created ภายในเดือน (เหมือนใน rebuild)
			if live.Students != cur.Students ||
				live.Companies != cur.Companies ||
				live.AcademicStaff != cur.AcademicStaff ||
				live.Admins != cur.Admins {
				needRebuild = true
			}
		}

		// 3) (ทางเลือก) ตรวจย้อนหลัง 12 เดือน ว่าขาด/หมดอายุไหม
		if !needRebuild {
			for i := 11; i >= 0; i-- {
				d := now.AddDate(0, -i, 0)
				yy, mm, _ := d.Date()
				var rec entity.MonthlyUserRoleStat
				err := db.Where("year = ? AND month = ?", yy, int(mm)).First(&rec).Error
				if err != nil || now.Sub(rec.SnapshotAt) > monthlyTTL {
					needRebuild = true
					break
				}
			}
		}
	}

	if needRebuild {
		if err := rebuildMonthlyUsersByRole(db, y, int(m), 12); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// ดึงข้อมูล 12 เดือนล่าสุด
	var stats []entity.MonthlyUserRoleStat
	start := now.AddDate(0, -11, 0)
	db.Where("(year > ?) OR (year = ? AND month >= ?)", start.Year(), start.Year(), int(start.Month())).
		Where("(year < ?) OR (year = ? AND month <= ?)", y, y, int(m)).
		Order("year, month").
		Find(&stats)

	type point struct {
		Month         string `json:"month"`
		Students      int    `json:"students"`
		Companies     int    `json:"companies"`
		AcademicStaff int    `json:"academic_staff"`
		Admins        int    `json:"admins"`
	}
	resp := make([]point, 0, len(stats))
	for _, s := range stats {
		resp = append(resp, point{
			Month:         fmt.Sprintf("%04d-%02d", s.Year, s.Month),
			Students:      s.Students,
			Companies:     s.Companies,
			AcademicStaff: s.AcademicStaff,
			Admins:        s.Admins,
		})
	}
	c.JSON(http.StatusOK, resp)
}

// นับยอด "ที่ถูกสร้างภายในเดือน" (เกณฑ์เดียวกับ rebuild) เพื่อใช้เทียบกับ snapshot ปัจจุบัน
type monthlyCount struct{ Students, Companies, AcademicStaff, Admins int }

func mustCountMonthlyByRole(db *gorm.DB, year int, month int) monthlyCount {
	first := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	last := first.AddDate(0, 1, 0) // exclusive

	var stu, com, aca, adm int64
	db.Model(&entity.Student{}).Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", first, last).Count(&stu)
	db.Model(&entity.Company{}).Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", first, last).Count(&com)
	db.Model(&entity.AcademicStaff{}).Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", first, last).Count(&aca)
	db.Model(&entity.Admin{}).Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", first, last).Count(&adm)

	return monthlyCount{
		Students:      int(stu),
		Companies:     int(com),
		AcademicStaff: int(aca),
		Admins:        int(adm),
	}
}

func rebuildMonthlyUsersByRole(db *gorm.DB, year, month, months int) error {
	now := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	for i := months - 1; i >= 0; i-- {
		d := now.AddDate(0, -i, 0)
		y, m, _ := d.Date()

		// created ในเดือนนั้น (เหมือนเดิม)
		first := time.Date(y, m, 1, 0, 0, 0, 0, time.Local)
		last := first.AddDate(0, 1, 0)

		var stu, com, aca, adm int64
		db.Model(&entity.Student{}).Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", first, last).Count(&stu)
		db.Model(&entity.Company{}).Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", first, last).Count(&com)
		db.Model(&entity.AcademicStaff{}).Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", first, last).Count(&aca)
		db.Model(&entity.Admin{}).Where("deleted_at IS NULL AND created_at >= ? AND created_at < ?", first, last).Count(&adm)

		rec := entity.MonthlyUserRoleStat{
			Year:          y,
			Month:         int(m),
			Students:      int(stu),
			Companies:     int(com),
			AcademicStaff: int(aca),
			Admins:        int(adm),
			Cumulative:    false,
			SnapshotAt:    time.Now(), // แนะนำให้ใช้ UTC ถ้าจะเทียบข้ามโซนเวลา: time.Now().UTC()
		}

		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "year"}, {Name: "month"}},
			DoUpdates: clause.AssignmentColumns([]string{"students", "companies", "academic_staff", "admins", "cumulative", "snapshot_at", "updated_at"}),
		}).Create(&rec).Error; err != nil {
			return err
		}
	}
	return nil
}