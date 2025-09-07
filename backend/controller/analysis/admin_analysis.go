package analysis

import (
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"github.com/gin-gonic/gin"
)

// GET /analysis/admin/trend
// Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD  หรือ  ?days=7|30|90
func GetTrendForAdmin(c *gin.Context) {
	db := config.DB()

	// 1) แปลงช่วงวันที่
	startStr := c.Query("start")
	endStr := c.Query("end")

	var start, end time.Time
	var err error
	if startStr != "" && endStr != "" {
		start, end, err = betweenStartEnd(startStr, endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date range"})
			return
		}
	} else {
		start, end = betweenDays(c.Query("days"))
	}

	// 2) โครงสร้างผลลัพธ์
	type TrendPoint struct {
		Date        string `json:"date"`
		Total       int64  `json:"total"`
		Pass        int64  `json:"pass"`             // ผ่าน
		Review      int64  `json:"review"`           // กำลังพิจารณา
		Interviewed int64  `json:"interviewed"`      // นัดสัมภาษณ์แล้ว
		Waiting     int64  `json:"waiting_schedule"` // รอการนัดสัมภาษณ์
		Fail        int64  `json:"fail"`             // ไม่ผ่าน + ไม่ได้รับเลือก
	}

	// 3) เงื่อนไขนับสถานะ (normalize: ตัดช่องว่าง)
	passCond := `CASE WHEN REPLACE(TRIM(a.status),' ','') = 'ผ่าน' THEN 1 ELSE 0 END`
	reviewCond := `CASE WHEN REPLACE(TRIM(a.status),' ','') = 'กำลังพิจารณา' THEN 1 ELSE 0 END`
	interviewedCond := `CASE WHEN REPLACE(TRIM(a.status),' ','') = 'นัดสัมภาษณ์แล้ว' THEN 1 ELSE 0 END`
	waitingCond := `CASE WHEN REPLACE(TRIM(a.status),' ','') = 'รอการนัดสัมภาษณ์' THEN 1 ELSE 0 END`
	failCond := `
		CASE
		  WHEN REPLACE(TRIM(a.status),' ','') = 'ไม่ผ่าน'
		    OR INSTR(REPLACE(TRIM(a.status),' ',''),'ไม่ผ่าน') > 0
		    OR REPLACE(TRIM(a.status),' ','') = 'ไม่ได้รับเลือก'
		    OR INSTR(REPLACE(TRIM(a.status),' ',''),'ไม่ได้รับเลือก') > 0
		  THEN 1 ELSE 0
		END
	`

	// 4) ดึงข้อมูลรวมทั้งระบบ (ไม่จำกัดมหาวิทยาลัย)
	type row struct {
		Date        string
		Total       int64
		Pass        int64
		Review      int64
		Interviewed int64
		Waiting     int64
		Fail        int64
	}
	var rows []row

	// หมายเหตุ:
	// - ใช้ DATE(a.submit_at) เพื่อ group รายวัน (SQLite/MySQL compatible)
	// - ใช้ระยะเวลาถึง end + 23:59:59 (end.Add(24h - 1ns))
	if err := db.Table("applications a").
		Select(`
			DATE(a.submit_at) AS date,
			COUNT(*) AS total,
			SUM(`+passCond+`) AS pass,
			SUM(`+reviewCond+`) AS review,
			SUM(`+interviewedCond+`) AS interviewed,
			SUM(`+waitingCond+`) AS waiting,
			SUM(`+failCond+`) AS fail
		`).
		Where("a.submit_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1)).
		Group("DATE(a.submit_at)").
		Order("DATE(a.submit_at)").
		Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 5) เติมวันที่ให้ครบช่วง
	byDate := make(map[string]row, len(rows))
	for _, r := range rows {
		byDate[r.Date] = r
	}

	points := make([]TrendPoint, 0, int(end.Sub(start).Hours()/24)+1)
	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		day := d.Format("2006-01-02")
		if r, ok := byDate[day]; ok {
			points = append(points, TrendPoint{
				Date:        day,
				Total:       r.Total,
				Pass:        r.Pass,
				Review:      r.Review,
				Interviewed: r.Interviewed,
				Waiting:     r.Waiting,
				Fail:        r.Fail,
			})
		} else {
			points = append(points, TrendPoint{
				Date:  day,
				Total: 0, Pass: 0, Review: 0, Interviewed: 0, Waiting: 0, Fail: 0,
			})
		}
	}

	c.JSON(http.StatusOK, points)
}
