package analysis

import (
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

	// ใช้ builder ใหม่ทุกครั้ง กัน state ติด
	base := func() *gorm.DB {
		return db.Table("applications a").
			Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
			Where("p.company_id = ?", companyID)
	}

	// รวมทั้งหมด (ทุกเวลา)
	var total int64
	if err := base().Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ========== Interviewed (ทุกเวลา) ==========
	// เคยถูกนัด/สัมภาษณ์: มีนัด หรือ สถานะ 'นัดสัมภาษณ์แล้ว' | 'ผ่าน' | 'ไม่ผ่าน'
	var interviewed int64
	if err := base().
		Joins(`LEFT JOIN interview_appointments ia 
			   ON ia.student_id = a.student_id AND ia.company_id = p.company_id`).
		Where(`
			ia.id IS NOT NULL
			OR REPLACE(TRIM(a.status),' ','') IN ('นัดสัมภาษณ์แล้ว','ผ่าน','ไม่ผ่าน')
		`).
		// ไม่ให้นับ 'ไม่ได้รับเลือก'
		Where(`REPLACE(TRIM(a.status),' ','') <> 'ไม่ได้รับเลือก'`).
		Distinct("a.id").
		Count(&interviewed).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ========== Offered / Rejected (ทุกเวลา) ==========
	var offered int64
	_ = base().
		Where(`REPLACE(TRIM(a.status),' ','') = 'ผ่าน'`).
		Count(&offered).Error

	var rejected int64
	_ = base().
		Where(`
			REPLACE(TRIM(a.status),' ','') = 'ไม่ผ่าน'
			OR TRIM(a.status) LIKE '%ไม่ได้รับเลือก%'
		`).
		Count(&rejected).Error

	// ========== Status distribution (ทุกเวลา) ==========
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

	// คะแนนรีวิวเฉลี่ย (ทุกเวลา)
	var avgReview *float64
	_ = db.Table("reviews").
		Select("AVG(rating)").
		Where("company_id = ?", companyID).
		Scan(&avgReview).Error

	// โพสต์ที่มีใบสมัครมากสุด (ทุกเวลา)
	var top struct {
		PostID       uint
		PostName     string
		Applications int64
	}
	_ = db.Table("applications a").
		Select("a.intership_post_id AS post_id, p.post_name AS post_name, COUNT(*) AS applications").
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
		Where("p.company_id = ?", companyID).
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
	}{
		TotalApplications: total,
		InterviewRate:     safeDivide(interviewed, total),
		OfferRate:         safeDivide(offered, total),
		RejectRate:        safeDivide(rejected, total),
		AvgReviewScore:    avgReview,
		StatusCounts:      statusCounts,
	}
	if top.PostID != 0 {
		resp.TopPost = &TopPost{top.PostID, top.PostName, top.Applications}
	}

	// debug (ดึงล่าสุด 200 แถว ไม่กรองวัน)
	if c.Query("debug") == "1" {
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
			Select(`a.id, TRIM(a.status) AS status, a.submit_at, a.company_note, a.intership_post_id, p.post_name, a.student_id`).
			Order("a.submit_at DESC").
			Limit(200).
			Scan(&apps).Error

		c.JSON(http.StatusOK, gin.H{
			"totalApplications": resp.TotalApplications,
			"interviewRate":     resp.InterviewRate,
			"offerRate":         resp.OfferRate,
			"rejectRate":        resp.RejectRate,
			"avgReviewScore":    resp.AvgReviewScore,
			"topPost":           resp.TopPost,
			"statusCounts":      resp.StatusCounts,
			"applications":      apps,
		})
		return
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

	// โครงสร้างผลลัพธ์ใหม่
	type TrendPoint struct {
		Date string `json:"date"`
		Total int64 `json:"total"` // รวมทั้งวัน (ผู้สมัครทั้งหมด)
		Pass  int64 `json:"pass"`  // ผ่าน
		Fail  int64 `json:"fail"`  // ไม่ผ่าน + ไม่ได้รับเลือก
	}

	// 1) ดึงสรุปรายวันด้วย conditional aggregation
	type row struct {
		Date  string
		Total int64
		Pass  int64
		Fail  int64
	}
	var rows []row

	// เงื่อนไข normalize: รวม "ไม่ผ่าน" และ "ไม่ได้รับเลือก" เป็น Fail
	passCond := `CASE WHEN REPLACE(TRIM(a.status),' ','') = 'ผ่าน' THEN 1 ELSE 0 END`
	failCond := `
		CASE
		  WHEN REPLACE(TRIM(a.status),' ','') = 'ไม่ผ่าน'
		    OR INSTR(REPLACE(TRIM(a.status),' ',''),'ไม่ผ่าน') > 0
		    OR REPLACE(TRIM(a.status),' ','') = 'ไม่ได้รับเลือก'
		    OR INSTR(REPLACE(TRIM(a.status),' ',''),'ไม่ได้รับเลือก') > 0
		  THEN 1 ELSE 0
		END
	`

	if err := db.Table("applications a").
		Select(`
			DATE(a.submit_at) AS date,
			COUNT(*) AS total,
			SUM(`+passCond+`) AS pass,
			SUM(`+failCond+`) AS fail
		`).
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
		Where("p.company_id = ?", companyId).
		Where("a.submit_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1)).
		Group("DATE(a.submit_at)").
		Order("DATE(a.submit_at)").
		Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 2) เติมวันที่ให้ครบช่วง + map เป็นผลลัพธ์สุดท้าย
	byDate := make(map[string]row, len(rows))
	for _, r := range rows { byDate[r.Date] = r }

	points := make([]TrendPoint, 0, int(end.Sub(start).Hours()/24)+1)
	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		day := d.Format("2006-01-02")
		if r, ok := byDate[day]; ok {
			points = append(points, TrendPoint{
				Date:  day,
				Total: r.Total,
				Pass:  r.Pass,
				Fail:  r.Fail,
			})
		} else {
			points = append(points, TrendPoint{
				Date:  day,
				Total: 0,
				Pass:  0,
				Fail:  0,
			})
		}
	}

	c.JSON(http.StatusOK, points)
}

/*=================================== Pipeline (funnel by status)  ===================================*/
func CompanyPipeline(c *gin.Context) {
	db := config.DB()
	companyId, _ := strconv.Atoi(c.Param("companyId"))

	statuses := []string{
		"กำลังพิจารณา", "รอการนัดสัมภาษณ์", "นัดสัมภาษณ์แล้ว",
		"ผ่าน", "ไม่ผ่าน", "ไม่ได้รับเลือก",
	}

	buckets := make([]PipelineBucket, 0, len(statuses)+1)

	var total int64
	db.Table("applications a").
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
		Where("p.company_id = ?", companyId).
		Count(&total)
	buckets = append(buckets, PipelineBucket{Name: "สมัครทั้งหมด", Value: total})

	for _, s := range statuses {
		var n int64
		db.Table("applications a").
			Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
			Where("p.company_id = ?", companyId).
			Where(`REPLACE(TRIM(a.status),' ','') = ?`, strings.ReplaceAll(strings.TrimSpace(s), " ", "")).
			Count(&n)
		buckets = append(buckets, PipelineBucket{Name: s, Value: n})
	}

	c.JSON(http.StatusOK, buckets)
}

/*=================================== Posts Performance (table)  ===================================*/
func CompanyPostsPerformance(c *gin.Context) {
	db := config.DB()
	companyId, _ := strconv.Atoi(c.Param("companyId"))

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

	rows := make([]PostPerformanceRow, 0, len(posts))

	for _, p := range posts {
		row := PostPerformanceRow{
			PostID:   p.ID,
			PostName: p.PostName,
			WorkMode: p.WorkMode,
			MinGPA:   p.MinGPA,
		}

		// ฐานใบสมัครของโพสต์นี้ (ทุกเวลา)
		base := db.Table("applications a").
			Where("a.intership_post_id = ?", p.ID)

		// จำนวนสมัครทั้งหมด
		base.Count(&row.Applications)

		// จำนวน "ผ่าน"
		base.Session(&gorm.Session{}).
			Where(`REPLACE(TRIM(a.status),' ','') = 'ผ่าน'`).
			Count(&row.Passed)

		// จำนวน "สัมภาษณ์แล้ว" (เคยมีนัดหรืออยู่ในสถานะที่ชี้ว่ามีการสัมภาษณ์/สรุปผล)
		db.Table("applications a").
			Joins("JOIN intership_posts ip ON ip.id = a.intership_post_id").
			Joins("LEFT JOIN interview_appointments ia ON ia.student_id = a.student_id AND ia.company_id = ip.company_id").
			Where("a.intership_post_id = ?", p.ID).
			Where(`
				REPLACE(TRIM(a.status),' ','') IN ('นัดสัมภาษณ์แล้ว','ผ่าน','ไม่ผ่าน')
				OR ia.id IS NOT NULL
			`).
			Distinct("a.id").
			Count(&row.Interviewed)

		// เวลาเฉลี่ย สมัคร → สรุปผล (วัน) — ทุกเวลา
		type d struct{ Days *float64 }
		var dd d
		db.Raw(`
			SELECT AVG(JULIANDAY(a.updated_at) - JULIANDAY(a.submit_at)) AS days
			FROM applications a
			WHERE a.intership_post_id = ?
			  AND REPLACE(TRIM(a.status),' ','') IN ('ผ่าน','ไม่ผ่าน','ไม่ได้รับเลือก')
			  AND a.updated_at IS NOT NULL
		`, p.ID).Scan(&dd)
		if dd.Days != nil {
			row.AvgTimeToDecisionDays = *dd.Days
		}

		// Avg GPA ของ "ผู้ที่ผ่าน" (ใช้การศึกษาล่าสุด)
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
			  AND REPLACE(TRIM(a.status),' ','') = 'ผ่าน'
		`, p.ID).Scan(&gg)
		row.AvgGPA = gg.Avg

		// Min GPA ของผู้ที่ผ่าน (ถ้าอยากโชว์ "ต่ำสุดของผู้ที่ผ่าน")
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
			  AND REPLACE(TRIM(a.status),' ','') = 'ผ่าน'
		`, p.ID).Scan(&gminRow)
		if gminRow.Min != nil {
			row.MinGPA = gminRow.Min
		}

		rows = append(rows, row)
	}

	c.JSON(http.StatusOK, rows)
}

/*=================================== Interview Stats  ===================================*/
func CompanyInterviewStats(c *gin.Context) {
	db := config.DB()
	companyId, _ := strconv.Atoi(c.Param("companyId"))

	// 1) นัดสัมภาษณ์ทั้งหมด (ทุกเวลา)
	var scheduled int64
	db.Model(&entity.InterviewAppointment{}).
		Where("company_id = ?", companyId).
		Count(&scheduled)

	// 2) no_show: ใบสมัครสถานะ "ไม่ผ่าน" + company_note มีคำบ่งชี้ "ไม่มา" (ทุกเวลา)
	keywords := []string{
		"%ไม่มา%", "%ไม่ได้มา%", "%ไม่มาร่วม%", "%ไม่เข้าร่วม%", "%ไม่มาสัมภาษณ์%",
		"%no show%", "%no-show%", "%no_show%", "%noshow%",
		"%เบี้ยว%", "%ติดต่อไม่ได้%",
	}
	base := db.Table("interview_appointments ia").
		Joins("JOIN applications a ON a.student_id = ia.student_id").
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id AND p.company_id = ia.company_id").
		Where("ia.company_id = ?", companyId).
		Where(`REPLACE(TRIM(a.status),' ','') = 'ไม่ผ่าน'`)

	noteCond := db.Where("LOWER(COALESCE(a.company_note,'')) LIKE ?", strings.ToLower(keywords[0]))
	for i := 1; i < len(keywords); i++ {
		noteCond = noteCond.Or("LOWER(COALESCE(a.company_note,'')) LIKE ?", strings.ToLower(keywords[i]))
	}

	var noShow int64
	base.Where(noteCond).
		Distinct("a.id").
		Count(&noShow)

	// 3) แยกตามโหมดสัมภาษณ์ (ทุกเวลา)
	type M struct {
		Mode  string
		Count int64
	}
	var modes []M
	db.Table("interview_appointments ia").
		Select("ia.mode as mode, COUNT(*) as count").
		Where("ia.company_id = ?", companyId).
		Group("ia.mode").Scan(&modes)

	resp := InterviewStatsResponse{
		Scheduled: scheduled,
		NoShow:    noShow,
	}
	for _, m := range modes {
		resp.Mode = append(resp.Mode, struct {
			Mode     string   `json:"mode"`
			Count    int64    `json:"count"`
			PassRate *float64 `json:"pass_rate,omitempty"`
		}{Mode: m.Mode, Count: m.Count})
	}

	// 4) Avg สมัคร → นัด (วัน) — ทุกเวลา
	type R struct{ Days *float64 }
	var toSchedule R
	db.Raw(`
		SELECT AVG(ABS(JULIANDAY(ia.appointment_date) - JULIANDAY(a.submit_at))) AS days
		FROM interview_appointments ia
		JOIN applications a ON a.student_id = ia.student_id
		JOIN intership_posts p ON p.id = a.intership_post_id
		WHERE ia.company_id = ?
		  AND p.company_id = ia.company_id
	`, companyId).Scan(&toSchedule)
	resp.AvgDaysSubmitToSchedule = toSchedule.Days

	// 5) Avg นัด → สรุปผล (วัน) — ทุกเวลา
	var schedToDecision R
	db.Raw(`
		SELECT AVG(JULIANDAY(a.updated_at) - JULIANDAY(ia.appointment_date)) AS days
		FROM interview_appointments ia
		JOIN applications a ON a.student_id = ia.student_id
		JOIN intership_posts p ON p.id = a.intership_post_id
		WHERE ia.company_id = ?
		  AND p.company_id = ia.company_id
		  AND REPLACE(TRIM(a.status),' ','') IN ('ผ่าน','ไม่ผ่าน','ไม่ได้รับเลือก')
		  AND a.updated_at IS NOT NULL
	`, companyId).Scan(&schedToDecision)
	resp.AvgDaysScheduleToDecision = schedToDecision.Days

	c.JSON(http.StatusOK, resp)
}
