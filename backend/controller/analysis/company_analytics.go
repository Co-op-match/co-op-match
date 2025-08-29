package analysis

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

/*=================================== Overview  ===================================*/
func CompanyOverview(c *gin.Context) {
	db := config.DB()
	companyID, _ := strconv.Atoi(c.Param("companyId"))

	// หน้าต่างเวลาแบบ [start, nextDay) เคลียร์กว่า
	startUTC, endUTC := betweenDays(c.Query("days"))
	nextEnd := endUTC.Add(24 * time.Hour) // exclusive

	// builder ใหม่ทุกครั้ง
	base := func() *gorm.DB {
		return db.Table("applications a").
			Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
			Where("p.company_id = ?", companyID).
			Where("a.created_at >= ? AND a.created_at < ?", startUTC, nextEnd)
	}

	// ==== รายการ application (ดึงเสมอ) ====
	type AppRow struct {
		ID              uint      `json:"id"`
		Status          string    `json:"status"`
		SubmitAt        time.Time `json:"submit_at"`
		CompanyNote     string    `json:"company_note"`
		IntershipPostID uint      `json:"intership_post_id"`
		PostName        string    `json:"post_name"`
		StudentID       uint      `json:"student_id"`
	}
	var apps []AppRow
	_ = base().
		Select(`
            a.id,
            TRIM(a.status) AS status,
            a.created_at AS submit_at,
            a.company_note,
            a.intership_post_id,
            p.post_name,
            a.student_id
        `).
		Order("a.created_at DESC").
		Limit(200).
		Scan(&apps).Error

	// รวมทั้งหมด
	var total int64
	if err := base().Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Interviewed
	var interviewed int64
	if err := base().
		Joins("LEFT JOIN interview_appointments ia ON ia.student_id = a.student_id AND ia.company_id = p.company_id").
		Where(`
            (ia.id IS NOT NULL AND ia.created_at >= ? AND ia.created_at < ?)
            OR REPLACE(TRIM(a.status),' ','') IN ('นัดสัมภาษณ์แล้ว','ผ่าน','ไม่ผ่าน')
        `, startUTC, nextEnd).
		Distinct("a.id").
		Count(&interviewed).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Offered/Rejected
	var offered int64
	_ = base().Where(`REPLACE(TRIM(a.status),' ','') = 'ผ่าน'`).Count(&offered).Error

	var rejected int64
	_ = base().
		Where(`
            REPLACE(TRIM(a.status),' ','') = 'ไม่ผ่าน'
            OR TRIM(a.status) LIKE '%ไม่ได้รับเลือก%'
        `).
		Count(&rejected).Error

	// Status distribution
	type statusRow struct {
		Status string
		Count  int64
	}
	var rawDist []statusRow
	_ = base().
		Select(`REPLACE(TRIM(a.status),' ','') AS status, COUNT(*) AS count`).
		Group(`REPLACE(TRIM(a.status),' ','')`).
		Scan(&rawDist).Error

	canon := func(s string) string {
		switch {
		case s == "รอการนัดสัมภาษณ์":
			return "รอการนัดสัมภาษณ์"
		case s == "กำลังพิจารณา":
			return "กำลังพิจารณา"
		case s == "ไม่ได้รับเลือก" || strings.Contains(s, "ไม่ได้รับเลือก"):
			return "ไม่ได้รับเลือก"
		case s == "ผ่าน":
			return "ผ่าน"
		case s == "นัดสัมภาษณ์แล้ว":
			return "นัดสัมภาษณ์แล้ว"
		case s == "ไม่ผ่าน" || strings.Contains(s, "ไม่ผ่าน"):
			return "ไม่ผ่าน"
		default:
			return "อื่นๆ"
		}
	}

	statusCounts := map[string]int64{
		"รอการนัดสัมภาษณ์": 0,
		"กำลังพิจารณา":     0,
		"ไม่ได้รับเลือก":   0,
		"ผ่าน": 0,
		"นัดสัมภาษณ์แล้ว": 0,
		"ไม่ผ่าน":         0,
		"อื่นๆ":           0,
	}
	for _, r := range rawDist {
		statusCounts[canon(r.Status)] += r.Count
	}

	// Avg review
	var avgReview *float64
	_ = db.Table("reviews").
		Select("AVG(rating)").
		Where("company_id = ?", companyID).
		Scan(&avgReview).Error

	// Top post
	var top struct {
		PostID       uint
		PostName     string
		Applications int64
	}
	_ = db.Table("applications a").
		Select("a.intership_post_id AS post_id, p.post_name AS post_name, COUNT(*) AS applications").
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
		Where("p.company_id = ?", companyID).
		Where("a.created_at >= ? AND a.created_at < ?", startUTC, nextEnd).
		Group("a.intership_post_id, p.post_name").
		Order("applications DESC").
		Limit(1).
		Scan(&top).Error

	type TopPost struct {
		PostID       uint   `json:"postId"`
		PostName     string `json:"postName"`
		Applications int64  `json:"applications"`
	}
	resp := struct {
		TotalApplications int64            `json:"totalApplications"`
		InterviewRate     float64          `json:"interviewRate"`
		OfferRate         float64          `json:"offerRate"`
		RejectRate        float64          `json:"rejectRate"`
		AvgReviewScore    *float64         `json:"avgReviewScore"`
		TopPost           *TopPost         `json:"topPost,omitempty"`
		StatusCounts      map[string]int64 `json:"statusCounts"`
		Applications      []AppRow         `json:"applications"`
	}{
		TotalApplications: total,
		InterviewRate:     safeDivide(interviewed, total),
		OfferRate:         safeDivide(offered, total),
		RejectRate:        safeDivide(rejected, total),
		AvgReviewScore:    avgReview,
		StatusCounts:      statusCounts,
		Applications:      apps,
	}
	if top.PostID != 0 {
		resp.TopPost = &TopPost{top.PostID, top.PostName, top.Applications}
	}

	c.JSON(http.StatusOK, resp)
}

/*=================================== Trend (daily count)  ===================================*/
func CompanyTrend(c *gin.Context) {
	db := config.DB()
	companyId, _ := strconv.Atoi(c.Param("companyId"))
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

	var points []TrendPoint
	// ใช้ DATE(created_at) แล้ว GROUP BY
	db.Table("applications a").
		Select("DATE(a.created_at) as date, COUNT(*) as value").
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
		Where("p.company_id = ?", companyId).
		Where("a.created_at >= ? AND a.created_at <= ?", start, end.Add(24*time.Hour-1)).
		Group("DATE(a.created_at)").
		Order("DATE(a.created_at)").Scan(&points)

	c.JSON(http.StatusOK, points)
}

/*=================================== Pipeline (funnel by status)  ===================================*/
func CompanyPipeline(c *gin.Context) {
	db := config.DB()
	companyId, _ := strconv.Atoi(c.Param("companyId"))
	start, end := betweenDays(c.Query("days"))

	type pair struct {
		Name  string
		Value int64
	}
	result := []pair{}

	statuses := []string{
		"กำลังพิจารณา",
		"รอการนัดสัมภาษณ์",
		"นัดสัมภาษณ์แล้ว",
		"ผ่าน",
		"ไม่ผ่าน",
		"ไม่ได้รับเลือก",
	}

	// รวมทั้งหมด
	var total int64
	db.Table("applications a").
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
		Where("p.company_id = ?", companyId).
		Where("a.created_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1)).
		Count(&total)

	result = append(result, pair{"สมัครทั้งหมด", total})

	for _, s := range statuses {
		var n int64
		db.Table("applications a").
			Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
			Where("p.company_id = ?", companyId).
			Where("a.created_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1)).
			Where("a.status = ?", s).Count(&n)
		result = append(result, pair{s, n})
	}

	out := []PipelineBucket{}
	for _, r := range result {
		out = append(out, PipelineBucket{Name: r.Name, Value: r.Value})
	}
	c.JSON(http.StatusOK, out)
}

/*=================================== Posts Performance (table)  ===================================*/
func CompanyPostsPerformance(c *gin.Context) {
	db := config.DB()
	companyId, _ := strconv.Atoi(c.Param("companyId"))
	start, end := betweenDays(c.Query("days"))

	// ดึงโพสต์ทั้งหมดของบริษัท + โหมดทำงาน + เกณฑ์ MinGPA (จากโพสต์)
	type postRow struct {
		ID       uint
		PostName string
		WorkMode string
		MinGPA   *float64
	}
	var posts []postRow
	db.Table("intership_posts p").
		Select("p.id, p.post_name, wm.work_mode, p.min_gpa").
		Joins("LEFT JOIN work_modes wm ON wm.id = p.work_mode_id").
		Where("p.company_id = ?", companyId).
		Scan(&posts)

	// NOTE: ใช้ type เดิมของโปรเจกต์คุณแทน PostPerformanceRow ถ้าชื่ออยู่ในแพ็กเกจอื่น
	rows := make([]PostPerformanceRow, 0, len(posts))

	for _, p := range posts {
		row := PostPerformanceRow{
			PostID:   p.ID,
			PostName: p.PostName,
			WorkMode: p.WorkMode,
			MinGPA:   p.MinGPA, // ถ้าอยากให้ "ต่ำสุด" เป็น Min ของคนที่ผ่าน จะไป overwrite ด้านล่าง
		}

		// ฐานข้อมูลใบสมัครของโพสต์นี้ในช่วงเวลา
		base := db.Table("applications a").
			Where("a.intership_post_id = ?", p.ID).
			Where("a.created_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1))

		// จำนวนสมัครทั้งหมด
		base.Count(&row.Applications)

		// จำนวน "ผ่าน"
		base.Session(&gorm.Session{}).
			Where(`REPLACE(TRIM(a.status),' ','') = 'ผ่าน'`).
			Count(&row.Passed)

		// จำนวน "นัดสัมภาษณ์"
		// นับเป็น interviewed ถ้า
		// - สถานะเป็น 'นัดสัมภาษณ์แล้ว' หรือผลสิ้นสุด ('ผ่าน','ไม่ผ่าน') หรือ
		// - มีรายการ interview_appointments จริงในช่วงเวลา
		db.Table("applications a").
			Joins("JOIN intership_posts ip ON ip.id = a.intership_post_id").
			Joins("LEFT JOIN interview_appointments ia ON ia.student_id = a.student_id AND ia.company_id = ip.company_id").
			Where("a.intership_post_id = ?", p.ID).
			Where("a.created_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1)).
			Where(`
                REPLACE(TRIM(a.status),' ','') IN ('นัดสัมภาษณ์แล้ว','ผ่าน','ไม่ผ่าน')
                OR (ia.id IS NOT NULL AND ia.created_at BETWEEN ? AND ?)
            `, start, end.Add(24*time.Hour-1)).
			Distinct("a.id").
			Count(&row.Interviewed)

		// เวลาเฉลี่ย สมัคร→สรุปผล (เฉพาะสถานะจบ)
		type d struct{ Days *float64 }
		var dd d
		db.Raw(`
            SELECT AVG(JULIANDAY(a.updated_at) - JULIANDAY(a.created_at)) AS days
            FROM applications a
            WHERE a.intership_post_id = ? 
              AND a.created_at BETWEEN ? AND ?
              AND REPLACE(TRIM(a.status),' ','') IN ('ผ่าน','ไม่ผ่าน','ไม่ได้รับเลือก')
              AND a.updated_at IS NOT NULL
        `, p.ID, start, end.Add(24*time.Hour-1)).Scan(&dd)
		if dd.Days != nil {
			row.AvgTimeToDecisionDays = *dd.Days
		}

		// Avg GPA ของ "ผู้ที่ผ่าน" (ใช้เกรดล่าสุดต่อหัวจากตาราง educations)
		// ⚠️ ตารางต้องชื่อ "educations" และมีคอลัมน์ student_id/year/grade
		type g struct{ Avg *float64 }
		var gg g
		db.Raw(`
            SELECT AVG(e.grade) AS avg
            FROM applications a
            JOIN students s ON s.id = a.student_id
            LEFT JOIN (
                SELECT e1.*
                FROM educations e1
                JOIN (
                    SELECT student_id, MAX(year) AS max_year
                    FROM educations
                    GROUP BY student_id
                ) m ON m.student_id = e1.student_id AND m.max_year = e1.year
            ) e ON e.student_id = s.id
            WHERE a.intership_post_id = ?
              AND a.created_at BETWEEN ? AND ?
              AND REPLACE(TRIM(a.status),' ','') = 'ผ่าน'
        `, p.ID, start, end.Add(24*time.Hour-1)).Scan(&gg)
		row.AvgGPA = gg.Avg

		// ถ้าอยากให้ "ต่ำสุด" ในคอลัมน์ GPA เป็น "ขั้นต่ำของคนที่ผ่าน" ด้วย:
		// มิฉะนั้นคงค่า MinGPA (เกณฑ์ของโพสต์) ตามเดิม
		type gmin struct{ Min *float64 }
		var gminRow gmin
		db.Raw(`
            SELECT MIN(e.grade) AS min
            FROM applications a
            JOIN students s ON s.id = a.student_id
            LEFT JOIN (
                SELECT e1.*
                FROM educations e1
                JOIN (
                    SELECT student_id, MAX(year) AS max_year
                    FROM educations
                    GROUP BY student_id
                ) m ON m.student_id = e1.student_id AND m.max_year = e1.year
            ) e ON e.student_id = s.id
            WHERE a.intership_post_id = ?
              AND a.created_at BETWEEN ? AND ?
              AND REPLACE(TRIM(a.status),' ','') = 'ผ่าน'
        `, p.ID, start, end.Add(24*time.Hour-1)).Scan(&gminRow)
		if gminRow.Min != nil {
			row.MinGPA = gminRow.Min
		}

		// ✅ ใช้งาน row แล้วจริง ๆ (แก้ unused write)
		rows = append(rows, row)
	}

	c.JSON(http.StatusOK, rows)
}

/*=================================== Interview Stats  ===================================*/
func CompanyInterviewStats(c *gin.Context) {
	db := config.DB()
	companyId, _ := strconv.Atoi(c.Param("companyId"))
	start, end := betweenDays(c.Query("days"))

	// 1) นัดสัมภาษณ์ทั้งหมดในช่วงเวลา
	var scheduled int64
	db.Model(&entity.InterviewAppointment{}).
		Where("company_id = ?", companyId).
		Where("created_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1)).
		Count(&scheduled)

	// 2) no_show: ใบสมัครสถานะ "ไม่ผ่าน" + company_note บ่งชี้ "ไม่มา"
	//    อิงนัดสัมภาษณ์ในช่วงเวลาเดียวกัน
	keywords := []string{
		"%ไม่มา%", "%ไม่ได้มา%", "%ไม่มาร่วม%", "%ไม่เข้าร่วม%", "%ไม่มาสัมภาษณ์%",
		"%no show%", "%no-show%", "%no_show%", "%noshow%",
		"%เบี้ยว%", "%ติดต่อไม่ได้%",
	}

	// ใช้ LOWER(COALESCE(...)) เพื่อกัน NULL และเคสอินพุตภาษาอังกฤษ
	// (ภาษาไทยไม่สน case อยู่แล้ว)
	base := db.Table("interview_appointments ia").
		Joins("JOIN applications a ON a.student_id = ia.student_id").
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id AND p.company_id = ia.company_id").
		Where("ia.company_id = ?", companyId).
		Where("ia.created_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1)).
		Where("a.status = ?", "ไม่ผ่าน")

	noteCond := db.Where("LOWER(COALESCE(a.company_note,'')) LIKE ?", strings.ToLower(keywords[0]))
	for i := 1; i < len(keywords); i++ {
		noteCond = noteCond.Or("LOWER(COALESCE(a.company_note,'')) LIKE ?", strings.ToLower(keywords[i]))
	}

	var noShow int64
	base.Where(noteCond).Count(&noShow)

	// 3) แยกตามโหมด (optional) — นับจำนวนสัมภาษณ์ตาม mode (ไม่ได้ระบุ no_show ต่อ mode ตอนนี้)
	type M struct {
		Mode  string
		Count int64
	}
	var modes []M
	db.Table("interview_appointments ia").
		Select("ia.mode as mode, COUNT(*) as count").
		Where("ia.company_id = ?", companyId).
		Where("ia.created_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1)).
		Group("ia.mode").Scan(&modes)

	resp := InterviewStatsResponse{
		Scheduled: scheduled,
		NoShow:    noShow, // ✅ ส่งจำนวน no_show จริงตามเงื่อนไขที่ต้องการ
	}
	for _, m := range modes {
		resp.Mode = append(resp.Mode, struct {
			Mode     string   `json:"mode"`
			Count    int64    `json:"count"`
			PassRate *float64 `json:"pass_rate,omitempty"`
		}{Mode: m.Mode, Count: m.Count})
	}

	var matchRows int64
	db.Table("interview_appointments ia").
		Joins("JOIN applications a ON a.student_id = ia.student_id").
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id AND p.company_id = ia.company_id").
		Where("ia.company_id = ?", companyId).
		Where("ia.created_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1)).
		Count(&matchRows)
	fmt.Println("rows for AVG join:", matchRows)

	// 4) Avg สมัคร→นัด
	// JULIANDAY() ของ SQLite → หาระยะเวลาเป็นวัน
	type R struct{ Days *float64 }
	var toSchedule R
	db.Raw(`
        SELECT AVG(JULIANDAY(ia.created_at) - JULIANDAY(a.created_at)) AS days
        FROM interview_appointments ia
        JOIN applications a ON a.student_id = ia.student_id
        JOIN intership_posts p ON p.id = a.intership_post_id
        WHERE ia.company_id = ?
          AND p.company_id = ia.company_id
          AND ia.created_at BETWEEN ? AND ?
    `, companyId, start, end.Add(24*time.Hour-1)).Scan(&toSchedule)
	resp.AvgDaysSubmitToSchedule = toSchedule.Days

	// 5) Avg นัด→สรุปผล (เฉพาะเคสมีการตัดสิน)
	var schedToDecision R
	db.Raw(`
        SELECT AVG(JULIANDAY(a.updated_at) - JULIANDAY(ia.created_at)) AS days
        FROM interview_appointments ia
        JOIN applications a ON a.student_id = ia.student_id
        JOIN intership_posts p ON p.id = a.intership_post_id
        WHERE ia.company_id = ?
          AND p.company_id = ia.company_id
          AND ia.created_at BETWEEN ? AND ?
          AND a.status IN ('ผ่าน','ไม่ผ่าน','ไม่ได้รับเลือก')
          AND a.updated_at IS NOT NULL
    `, companyId, start, end.Add(24*time.Hour-1)).Scan(&schedToDecision)
	resp.AvgDaysScheduleToDecision = schedToDecision.Days

	c.JSON(http.StatusOK, resp)
}
