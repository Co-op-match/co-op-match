package analysis

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"co-op-match.com/co-op-match/config"
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

	// ====== Top Posts (ทุกเวลา) - 3 อันดับ ======
	var topRows []TopPost
	_ = db.Table("applications a").
		Select("a.intership_post_id AS post_id, p.post_name AS post_name, COUNT(*) AS applications").
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
		Where("p.company_id = ?", companyID).
		// Where("a.deleted_at IS NULL AND p.deleted_at IS NULL").
		Group("a.intership_post_id, p.post_name").
		Order("applications DESC, p.post_name ASC").
		Limit(3).
		Scan(&topRows).Error

	resp := struct {
		TotalApplications int64            `json:"totalApplications"`
		InterviewRate     float64          `json:"interviewRate"`
		OfferRate         float64          `json:"offerRate"`
		RejectRate        float64          `json:"rejectRate"`
		AvgReviewScore    *float64         `json:"avgReviewScore"`
		TopPost           *TopPost         `json:"topPost,omitempty"`  // อันดับ 1 (backward compat)
		TopPosts          []TopPost        `json:"topPosts,omitempty"` // Top 5
		StatusCounts      map[string]int64 `json:"statusCounts"`
	}{
		TotalApplications: total,
		InterviewRate:     safeDivide(interviewed, total),
		OfferRate:         safeDivide(offered, total),
		RejectRate:        safeDivide(rejected, total),
		AvgReviewScore:    avgReview,
		StatusCounts:      statusCounts,
	}

	// map Top 5 และตั้ง TopPost = อันดับ 1
	if len(topRows) > 0 {
		resp.TopPosts = topRows
		first := topRows[0]
		resp.TopPost = &first
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
			"topPosts":          resp.TopPosts,
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
	explicitRange := startStr != "" && endStr != ""

	if explicitRange {
		start, end, err = betweenStartEnd(startStr, endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date range"})
			return
		}
	} else {
		start, end = betweenDays(c.Query("days"))
	}

	// --- รวม "วันนี้" เสมอเมื่อใช้โหมด days ---
	if !explicitRange {
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		if end.Before(today) {
			end = today
		}
	}

	// --- normalize เป็น 00:00 ---
	start = time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, start.Location())
	end   = time.Date(end.Year(),   end.Month(),   end.Day(),   0, 0, 0, 0, end.Location())

	type TrendPoint struct {
		Date  string `json:"date"`
		Total int64  `json:"total"`
		Pass  int64  `json:"pass"`
		Fail  int64  `json:"fail"`
	}

	type row struct {
		Date  string
		Total int64
		Pass  int64
		Fail  int64
	}
	var rows []row

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

	byDate := make(map[string]row, len(rows))
	for _, r := range rows {
		byDate[r.Date] = r
	}

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


/*=================================== Status Application  ===================================*/
func CompanyStatusApplication(c *gin.Context) {
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

/*=================================== Lastest Application  ===================================*/
type LatestPendingApplicant struct {
	ApplicationID   uint       `json:"application_id"`
	Status          string     `json:"status"`
	SubmitAt        time.Time  `json:"submit_at"`
	CompanyNote     string     `json:"company_note"`
	PostID          uint       `json:"post_id"`
	PostName        string     `json:"post_name"`
	StudentID       uint       `json:"student_id"`
	StudentFullName string     `json:"student_full_name"`
	StudentPhone    string     `json:"student_phone,omitempty"`
	InterviewID     *uint      `json:"interview_id,omitempty"`
	InterviewAt     *time.Time `json:"interview_at,omitempty"`
	StudentImageURL *string    `json:"student_image_url,omitempty"`
}

// controller/analysis/company_latest_pending.go
func CompanyLatestPending(c *gin.Context) {
	db := config.DB()
	companyID, _ := strconv.Atoi(c.Param("companyId"))

	// รวมเฉพาะ "ยังไม่ยืนยันผล" (ก่อนตัดสินผ่าน/ไม่ผ่าน)
	// เลือกได้สองแนว: A) whitelist สถานะที่ต้องการ หรือ B) not-in สถานะจบแล้ว
	clean := func(s string) string { return strings.ReplaceAll(strings.TrimSpace(s), " ", "") }
	preDecision := []string{
		clean("กำลังพิจารณา"),
		clean("รอการนัดสัมภาษณ์"),
		clean("นัดสัมภาษณ์แล้ว"),
	}

	rows := make([]LatestPendingApplicant, 0)

	err := db.Table("applications a").
		Select(`
			a.id AS application_id,
			TRIM(a.status) AS status,
			a.submit_at,
			a.company_note,
			p.id AS post_id,
			p.post_name AS post_name,
			s.id AS student_id,
			(TRIM(s.first_name) || ' ' || TRIM(s.last_name)) AS student_full_name,
			s.phone_number AS student_phone,
			ia.id AS interview_id,
			ia.appointment_date AS interview_at,
			(SELECT pi.image_url
			FROM profile_images pi
			WHERE pi.user_id = s.user_id
				AND pi.deleted_at IS NULL
			ORDER BY pi.id DESC
			LIMIT 1) AS student_image_url  -- ✅ รูปล่าสุด
		`).
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
		Joins("JOIN students s ON s.id = a.student_id").
		Joins(`LEFT JOIN interview_appointments ia 
			ON ia.student_id = a.student_id AND ia.company_id = p.company_id`).
		Where("p.company_id = ?", companyID).
		Where(`REPLACE(TRIM(a.status),' ','') IN (?)`, preDecision).
		Where("a.deleted_at IS NULL").
		Group("a.id").
		Order("a.submit_at DESC, a.id DESC").
		Scan(&rows).Error


	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rows)
}