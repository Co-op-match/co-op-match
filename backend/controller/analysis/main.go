package analysis
/* 

import (
	"net/http"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

type KPIResponse struct {
	TotalApplications     int64   `json:"total_applications"`
	MatchingSuccessRate   float64 `json:"matching_success_rate"`
	AvgCompanyReviewScore float64 `json:"avg_company_review_score"`
	ActiveUsers7d         int64   `json:"active_users_7d"`
	TotalCompanies        int64   `json:"total_companies"`
	TotalStudents         int64   `json:"total_students"`
}

// GET /analysis/kpis?days=30
func GetKPIs(c *gin.Context) {
	days := parseDays(c.Query("days"), 30)
	to := time.Now()
	from := to.AddDate(0, 0, -days)

	db := config.DB()

	var totalApps int64
	db.Model(&entity.Application{}).Where("submit_at BETWEEN ? AND ?", from, to).Count(&totalApps)

	// อัตราการจับคู่สำเร็จ: นิยามได้ 2 แบบ
	// (ก) จาก Application.Status == 'ผ่านการคัดเลือก'
	// (ข) จาก JobMatch สูงสุดของแต่ละ student ถูกยอมรับ (ถ้าคุณมี flag)
	// ที่นี่ใช้แบบ (ก) เป็นค่าเริ่มต้น
	var hired int64
	db.Model(&entity.Application{}).Where("status = ? AND submit_at BETWEEN ? AND ?", "ผ่านการคัดเลือก", from, to).Count(&hired)
	var successRate float64
	if totalApps > 0 {
		successRate = float64(hired) / float64(totalApps) * 100.0
	}

	// คะแนนรีวิวเฉลี่ยบริษัท
	type avgRes struct{ Avg float64 }
	var avg avgRes
	db.Model(&entity.Review{}).Select("AVG(rating) as avg").Scan(&avg)

	// Active users 7 วันล่าสุด (ถ้าคุณมีฟิลด์ IsLoggedIn/UpdatedAt ของ User)
	var activeUsers7d int64
	sevenDays := to.AddDate(0, 0, -7)
	db.Model(&entity.User{}).Where("updated_at >= ?", sevenDays).Count(&activeUsers7d)

	var totalCompanies int64
	db.Model(&entity.Company{}).Count(&totalCompanies)
	var totalStudents int64
	db.Model(&entity.Student{}).Count(&totalStudents)

	resp := KPIResponse{
		TotalApplications:     totalApps,
		MatchingSuccessRate:   round2(successRate),
		AvgCompanyReviewScore: round2(avg.Avg),
		ActiveUsers7d:         activeUsers7d,
		TotalCompanies:        totalCompanies,
		TotalStudents:         totalStudents,
	}
	c.JSON(http.StatusOK, resp)
}

// === TREND ===

type TrendPoint struct {
	Date  string `json:"date"`
	Value int64  `json:"value"`
}

type TrendSeries struct {
	Key    string       `json:"key"` // label ของสาขา/คณะ/มหาลัย
	Series []TrendPoint `json:"series"`
}

// GET /analysis/applications/trend?days=30&scope=program|faculty|university
// ค่า default: scope=program
func GetApplicationTrend(c *gin.Context) {
	days := parseDays(c.Query("days"), 30)
	scope := c.DefaultQuery("scope", "program")
	to := time.Now()
	from := to.AddDate(0, 0, -days)

	db := config.DB()

	// เตรียม base query: join Application -> Student -> Education -> Program/Faculty/University
	// สมมติ Education มี ProgramID, FacultyID, UniversityID
	type row struct {
		Day  time.Time
		Key  string
		Qty  int64
	}

	var rows []row
	keySelect := scopeKeySQL(scope) // คืน string SQL column + join ที่เหมาะสม

	err := db.
		Table("applications a").
		Select("DATE(a.submit_at) AS day, " + keySelect + " AS key, COUNT(*) AS qty").
		Joins("JOIN students s ON s.id = a.student_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins(scopeJoin(scope)).
		Where("a.submit_at BETWEEN ? AND ?", from, to).
		Group("DATE(a.submit_at), key").
		Order("DATE(a.submit_at) ASC").
		Scan(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query trend failed: " + err.Error()})
		return
	}

	// group rows -> map[key][]TrendPoint
	seriesMap := map[string][]TrendPoint{}
	for _, r := range rows {
		seriesMap[r.Key] = append(seriesMap[r.Key], TrendPoint{
			Date:  r.Day.Format("2006-01-02"),
			Value: r.Qty,
		})
	}
	var out []TrendSeries
	for k, v := range seriesMap {
		out = append(out, TrendSeries{Key: k, Series: v})
	}
	c.JSON(http.StatusOK, gin.H{"scope": scope, "series": out})
}

func scopeKeySQL(scope string) string {
	switch scope {
	case "faculty":
		return "f.name"
	case "university":
		return "u.name"
	default:
		return "p.name" // program
	}
}
func scopeJoin(scope string) string {
	switch scope {
	case "faculty":
		return "JOIN faculties f ON f.id = e.faculty_id"
	case "university":
		return "JOIN universities u ON u.id = e.university_id"
	default:
		return "JOIN programs p ON p.id = e.program_id"
	}
}

// === REVIEW SUMMARY ===

// GET /analysis/reviews/summary?days=90&group_by=company|university
type ReviewSummaryRow struct {
	Key         string  `json:"key"`
	Reviews     int64   `json:"reviews"`
	AvgRating   float64 `json:"avg_rating"`
	LastReview  string  `json:"last_review"`
}

func GetReviewSummary(c *gin.Context) {
	days := parseDays(c.Query("days"), 90)
	groupBy := c.DefaultQuery("group_by", "company")
	to := time.Now()
	from := to.AddDate(0, 0, -days)

	db := config.DB()

	var rows []ReviewSummaryRow
	switch groupBy {
	case "university":
		// สมมติ Review ผูกกับ Company และเราจะ map company->applications->students->educations->university
		err := db.Table("reviews r").
			Select("u.name as key, COUNT(*) as reviews, AVG(r.rating) as avg_rating, MAX(r.created_at) as last_review").
			Joins("JOIN companies c ON c.id = r.company_id").
			Joins("JOIN applications a ON a.intership_post_id IN (SELECT id FROM intership_posts WHERE company_id = c.id)").
			Joins("JOIN students s ON s.id = a.student_id").
			Joins("JOIN educations e ON e.student_id = s.id").
			Joins("JOIN universities u ON u.id = e.university_id").
			Where("r.created_at BETWEEN ? AND ?", from, to).
			Group("u.name").
			Order("avg_rating DESC").
			Scan(&rows).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	default: // company
		err := db.Table("reviews r").
			Select("c.company_name as key, COUNT(*) as reviews, AVG(r.rating) as avg_rating, MAX(r.created_at) as last_review").
			Joins("JOIN companies c ON c.id = r.company_id").
			Where("r.created_at BETWEEN ? AND ?", from, to).
			Group("c.company_name").
			Order("avg_rating DESC").
			Scan(&rows).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// ปัดทศนิยมเฉลี่ย
	for i := range rows {
		rows[i].AvgRating = round2(rows[i].AvgRating)
		rows[i].LastReview = safeTime(rows[i].LastReview)
	}
	c.JSON(http.StatusOK, gin.H{"group_by": groupBy, "rows": rows})
}

// === COMPANY REPORT ===

// GET /analysis/company/:id/report?days=90
func GetCompanyReport(c *gin.Context) {
	companyID := c.Param("id")
	days := parseDays(c.Query("days"), 90)
	to := time.Now()
	from := to.AddDate(0, 0, -days)

	db := config.DB()

	var company entity.Company
	if err := db.First(&company, companyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	var totalPosts int64
	db.Model(&entity.IntershipPost{}).Where("company_id = ? AND created_at BETWEEN ? AND ?", companyID, from, to).Count(&totalPosts)

	var totalApps int64
	db.Model(&entity.Application{}).
		Joins("JOIN intership_posts p ON p.id = applications.intership_post_id").
		Where("p.company_id = ? AND applications.submit_at BETWEEN ? AND ?", companyID, from, to).
		Count(&totalApps)

	var hired int64
	db.Model(&entity.Application{}).
		Joins("JOIN intership_posts p ON p.id = applications.intership_post_id").
		Where("p.company_id = ? AND applications.status = ? AND applications.submit_at BETWEEN ? AND ?", companyID, "ผ่านการคัดเลือก", from, to).
		Count(&hired)

	var rate float64
	if totalApps > 0 {
		rate = float64(hired) / float64(totalApps) * 100
	}

	type avgRes struct{ Avg float64 }
	var avg avgRes
	db.Table("reviews").
		Select("AVG(rating) as avg").
		Where("company_id = ? AND created_at BETWEEN ? AND ?", companyID, from, to).
		Scan(&avg)

	c.JSON(http.StatusOK, gin.H{
		"company":                 company.CompanyName,
		"from":                    from.Format("2006-01-02"),
		"to":                      to.Format("2006-01-02"),
		"total_posts":             totalPosts,
		"total_applications":      totalApps,
		"hired":                   hired,
		"matching_success_rate":   round2(rate),
		"avg_review_score":        round2(avg.Avg),
	})
}

// === UNIVERSITY REPORT ===

// GET /analysis/university/:id/report?days=90
func GetUniversityReport(c *gin.Context) {
	univID := c.Param("id")
	days := parseDays(c.Query("days"), 90)
	to := time.Now()
	from := to.AddDate(0, 0, -days)

	db := config.DB()

	// ชื่อมหาลัย
	type univ struct{ Name string }
	var u univ
	db.Table("universities").Select("name").Where("id = ?", univID).Scan(&u)
	if u.Name == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "university not found"})
		return
	}

	// นับ applications โดย students ของมหาลัยนั้น
	var totalApps int64
	db.Table("applications a").
		Joins("JOIN students s ON s.id = a.student_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Where("e.university_id = ? AND a.submit_at BETWEEN ? AND ?", univID, from, to).
		Count(&totalApps)

	var hired int64
	db.Table("applications a").
		Joins("JOIN students s ON s.id = a.student_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Where("e.university_id = ? AND a.status = ? AND a.submit_at BETWEEN ? AND ?", univID, "ผ่านการคัดเลือก", from, to).
		Count(&hired)

	var rate float64
	if totalApps > 0 {
		rate = float64(hired) / float64(totalApps) * 100
	}

	// ยอดสมัครแยกบริษัท Top 10
	type topRow struct {
		Company string
		Qty     int64
	}
	var top []topRow
	db.Table("applications a").
		Select("c.company_name as company, COUNT(*) as qty").
		Joins("JOIN intership_posts p ON p.id = a.intership_post_id").
		Joins("JOIN companies c ON c.id = p.company_id").
		Joins("JOIN students s ON s.id = a.student_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Where("e.university_id = ? AND a.submit_at BETWEEN ? AND ?", univID, from, to).
		Group("c.company_name").
		Order("qty DESC").
		Limit(10).
		Scan(&top)

	c.JSON(http.StatusOK, gin.H{
		"university":              u.Name,
		"from":                    from.Format("2006-01-02"),
		"to":                      to.Format("2006-01-02"),
		"total_applications":      totalApps,
		"hired":                   hired,
		"matching_success_rate":   round2(rate),
		"top_companies":           top,
	})
}

// ===== Helpers =====

func round2(f float64) float64 {
	return float64(int(f*100+0.5)) / 100.0
}
func parseDays(v string, def int) int {
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil || n <= 0 {
		return def
	}
	return n
}
func safeTime(s string) string { // เผื่อ DB driver คืนเป็น string time
	return s
} */