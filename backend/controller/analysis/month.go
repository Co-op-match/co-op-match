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

const monthlyTTL = time.Hour * 6 // อายุข้อมูล 6 ชม. (ปรับได้)

func GetMonthlyUsersByRole(c *gin.Context) {
	db := config.DB()

	// 1) เช็คว่าสแนปชอต 6 เดือนล่าสุดมีและยังไม่หมดอายุหรือไม่
	now := time.Now()
	y, m, _ := now.Date()
	needRebuild := false

	for i := 5; i >= 0; i-- {
		d := now.AddDate(0, -i, 0)
		yy, mm, _ := d.Date()

		var rec entity.MonthlyUserRoleStat
		err := db.Where("year = ? AND month = ?", yy, int(mm)).
			First(&rec).Error
		if err != nil || now.Sub(rec.SnapshotAt) > monthlyTTL {
			needRebuild = true
			break
		}
	}

	// 2) ถ้าต้องคำนวณใหม่ → สร้าง/อัปเดต (upsert) ทั้งช่วง
	if needRebuild {
		if err := rebuildMonthlyUsersByRole(db, y, int(m), 12 /*months*/); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 3) ดึงส่งออก
	var stats []entity.MonthlyUserRoleStat
	start := now.AddDate(0, -11, 0)
	db.Where("(year > ?) OR (year = ? AND month >= ?)", start.Year(), start.Year(), int(start.Month())).
		Where("(year < ?) OR (year = ? AND month <= ?)", y, y, int(m)).
		Order("year, month").
		Find(&stats)

	// map เป็น payload สำหรับกราฟ
	type point struct {
		Month         string `json:"month"` // YYYY-MM
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

func rebuildMonthlyUsersByRole(db *gorm.DB, year, month, months int) error {
	now := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	for i := months - 1; i >= 0; i-- {
		d := now.AddDate(0, -i, 0)
		y, m, _ := d.Date()

		// คิวรียอดจริงรายเดือนจากตาราง Student/Company/AcademicStaff/Admin
		var stu, com, aca, adm int64
		first := time.Date(y, m, 1, 0, 0, 0, 0, time.Local)
		last := first.AddDate(0, 1, 0) // exclusive

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
			SnapshotAt:    time.Now(),
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

/************************************** 2 **********************************************/
// โครงสร้างข้อมูลที่จะเก็บจำนวนผู้ใช้แต่ละประเภท (role) ตามช่วงเวลา
type UsersByRolePoint struct {
	Label         string `json:"label"`          // ชื่อ label เช่น เดือน, ไตรมาส, ปี
	Students      int64  `json:"students"`       // จำนวน Student
	Companies     int64  `json:"companies"`      // จำนวน Company
	AcademicStaff int64  `json:"academic_staff"` // จำนวน Academic Staff
	Admins        int64  `json:"admins"`         // จำนวน Admin
}

// Controller สำหรับดึงจำนวนผู้ใช้แต่ละ role ในรูปแบบ series
func GetUsersByRoleSeries(c *gin.Context) {
	// mode จะกำหนดรูปแบบการแสดงผล เช่น month, quarter, year (default = month)
	mode := c.DefaultQuery("mode", "month")
	// year คือปีที่ใช้กรองข้อมูล (ค่าดีฟอลต์ = ปีปัจจุบัน ค.ศ.)
	year := c.DefaultQuery("year", time.Now().Format("2006")) 
	db := config.DB()

	var rows []UsersByRolePoint // slice สำหรับเก็บผลลัพธ์

	switch mode {
	case "quarter": // กรณีดูราย "ไตรมาส"
		db.Raw(`
			-- สร้างตาราง q แทนไตรมาส (Q1-Q4)
			WITH q(qn,name) AS (SELECT 1,'Q1' UNION ALL SELECT 2,'Q2' UNION ALL SELECT 3,'Q3' UNION ALL SELECT 4,'Q4')
			SELECT name AS label,
				-- นับจำนวน student ที่สร้างในปีและไตรมาสตรงกับ qn
				(SELECT COUNT(*) FROM students s JOIN users u ON u.id=s.user_id 
				 WHERE strftime('%Y',u.created_at)=? AND ((CAST(strftime('%m',u.created_at) AS INTEGER)+2)/3)=qn) AS students,
				-- นับจำนวน company
				(SELECT COUNT(*) FROM companies c JOIN users u ON u.id=c.user_id 
				 WHERE strftime('%Y',u.created_at)=? AND ((CAST(strftime('%m',u.created_at) AS INTEGER)+2)/3)=qn) AS companies,
				-- นับจำนวน academic staff
				(SELECT COUNT(*) FROM academic_staffs a JOIN users u ON u.id=a.user_id 
				 WHERE strftime('%Y',u.created_at)=? AND ((CAST(strftime('%m',u.created_at) AS INTEGER)+2)/3)=qn) AS academic_staff,
				-- นับจำนวน admin
				(SELECT COUNT(*) FROM admins ad JOIN users u ON u.id=ad.user_id 
				 WHERE strftime('%Y',u.created_at)=? AND ((CAST(strftime('%m',u.created_at) AS INTEGER)+2)/3)=qn) AS admins
			FROM q
		`, year, year, year, year).Scan(&rows)

	case "year": // กรณีดูย้อนหลังหลายปี (5 ปีรวมปีปัจจุบัน)
		db.Raw(`
			-- สร้างตาราง ys แทนปีปัจจุบันและย้อนหลังไป 4 ปี
			WITH ys(y) AS (
				SELECT CAST(? AS INTEGER) UNION ALL SELECT CAST(? AS INTEGER)-1 UNION ALL
				SELECT CAST(? AS INTEGER)-2 UNION ALL SELECT CAST(? AS INTEGER)-3 UNION ALL
				SELECT CAST(? AS INTEGER)-4
			)
			SELECT CAST(y AS TEXT) AS label,
				-- นับ student ตามปี
				(SELECT COUNT(*) FROM students s JOIN users u ON u.id=s.user_id WHERE strftime('%Y',u.created_at)=CAST(y AS TEXT)) AS students,
				-- นับ company ตามปี
				(SELECT COUNT(*) FROM companies c JOIN users u ON u.id=c.user_id WHERE strftime('%Y',u.created_at)=CAST(y AS TEXT)) AS companies,
				-- นับ academic staff ตามปี
				(SELECT COUNT(*) FROM academic_staffs a JOIN users u ON u.id=a.user_id WHERE strftime('%Y',u.created_at)=CAST(y AS TEXT)) AS academic_staff,
				-- นับ admin ตามปี
				(SELECT COUNT(*) FROM admins ad JOIN users u ON u.id=ad.user_id WHERE strftime('%Y',u.created_at)=CAST(y AS TEXT)) AS admins
			FROM ys ORDER BY y
		`, year, year, year, year, year).Scan(&rows)

	default: // "month" กรณีดูรายเดือน (ค่า default)
		db.Raw(`
			-- สร้างตาราง m แทนเดือน (01-12 พร้อมชื่อย่อภาษาไทย)
			WITH m(mn,name) AS (
				SELECT '01','ม.ค.' UNION ALL SELECT '02','ก.พ.' UNION ALL SELECT '03','มี.ค.' UNION ALL SELECT '04','เม.ย.'
				UNION ALL SELECT '05','พ.ค.' UNION ALL SELECT '06','มิ.ย.' UNION ALL SELECT '07','ก.ค.' UNION ALL SELECT '08','ส.ค.'
				UNION ALL SELECT '09','ก.ย.' UNION ALL SELECT '10','ต.ค.' UNION ALL SELECT '11','พ.ย.' UNION ALL SELECT '12','ธ.ค.'
			)
			SELECT name AS label,
				-- นับ student ตามเดือน
				(SELECT COUNT(*) FROM students s JOIN users u ON u.id=s.user_id
				 WHERE strftime('%Y',u.created_at)=? AND strftime('%m',u.created_at)=mn) AS students,
				-- นับ company ตามเดือน
				(SELECT COUNT(*) FROM companies c JOIN users u ON u.id=c.user_id
				 WHERE strftime('%Y',u.created_at)=? AND strftime('%m',u.created_at)=mn) AS companies,
				-- นับ academic staff ตามเดือน
				(SELECT COUNT(*) FROM academic_staffs a JOIN users u ON u.id=a.user_id
				 WHERE strftime('%Y',u.created_at)=? AND strftime('%m',u.created_at)=mn) AS academic_staff,
				-- นับ admin ตามเดือน
				(SELECT COUNT(*) FROM admins ad JOIN users u ON u.id=ad.user_id
				 WHERE strftime('%Y',u.created_at)=? AND strftime('%m',u.created_at)=mn) AS admins
			FROM m
		`, year, year, year, year).Scan(&rows)
	}

	// ส่งผลลัพธ์ออกเป็น JSON กลับไปที่ client
	c.JSON(http.StatusOK, rows)
}