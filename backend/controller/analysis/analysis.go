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

// helper
func db() *gorm.DB { return config.DB() }

// -------------------- 1) KPIs --------------------
func GetKPIs(c *gin.Context) {
	// 1) Total Applications
	var totalApps int64
	db().Model(&entity.Application{}).Count(&totalApps)

	// 2) Matching Success Rate
	// ปรับให้ตรงกับสถานะจริงในระบบคุณ (เช่น "ผ่านการคัดเลือก", "Selected", "OfferAccepted")
	successStatuses := []string{"ผ่านการคัดเลือก", "Selected", "OfferAccepted", "Hired"}
	var successCount int64
	db().Model(&entity.Application{}).
		Where("status IN ?", successStatuses).
		Count(&successCount)

	matchingRate := 0.0
	if totalApps > 0 {
		matchingRate = float64(successCount) / float64(totalApps)
	}

	// 3) Avg Company Review Score (สมมติ entity.Review มี field Rating (int/float))
	var avgScore float64
	db().Model(&entity.Review{}).Select("COALESCE(AVG(rating),0)").Scan(&avgScore)

	// 4) Active Users 7d (fallback: ผู้ใช้ที่ updated_at ภายใน 7 วัน + is_logged_in = true)
	// ถ้ามีตาราง LoginEvent ควรเปลี่ยนมา query จากตารางนั้นแทน
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	var activeUsers int64
	db().Model(&entity.User{}).
		Where("is_logged_in = ? AND updated_at >= ?", true, sevenDaysAgo).
		Count(&activeUsers)

	c.JSON(http.StatusOK, entity.AnalysisKPIs{
		TotalApplications:     totalApps,
		MatchingSuccessRate:   matchingRate,
		AvgCompanyReviewScore: avgScore,
		ActiveUsers7d:         activeUsers,
	})
}

// -------------------- 2) Application Trend (last N days) --------------------
func GetApplicationTrend(c *gin.Context) {
	daysStr := c.DefaultQuery("days", "30")
	days, err := strconv.Atoi(daysStr)
	if err != nil || days <= 0 || days > 365 {
		days = 30
	}

	end := time.Now()
	start := end.AddDate(0, 0, -days+1) // รวมวันนี้เป็น day #1

	// ใน GetApplicationTrend
	type row struct {
		DateStr string `gorm:"column:date_str"`
		Count   int64  `gorm:"column:count"`
	}

	var rows []row
	db().Model(&entity.Application{}).
		Select(`DATE(submit_at) AS date_str, COUNT(*) as count`).
		Where("submit_at BETWEEN ? AND ?", start, end).
		Group("DATE(submit_at)").
		Order("DATE(submit_at) ASC").
		Scan(&rows)

	dateMap := map[string]int64{}
	for _, r := range rows {
		dateMap[r.DateStr] = r.Count
	}

	series := make([]entity.TimeSeriesPoint, 0, days) // ใช้ DTO ใหม่
	for d := 0; d < days; d++ {
		day := start.AddDate(0, 0, d)
		key := day.Format("2006-01-02")
		series = append(series, entity.TimeSeriesPoint{
			Date:  day,
			Value: dateMap[key],
		})
	}

	c.JSON(http.StatusOK, entity.ApplicationTrendResponse{Series: series})

}

// -------------------- 2b) Applications by Program (ช่วงเวลา + Top N) --------------------
func GetApplicationsByProgram(c *gin.Context) {
	// ?start=2025-07-01&end=2025-08-21&top=10
	startStr := c.Query("start")
	endStr := c.Query("end")
	topStr := c.DefaultQuery("top", "10")

	top, _ := strconv.Atoi(topStr)
	if top <= 0 || top > 50 {
		top = 10
	}

	var start, end time.Time
	var err error
	if startStr == "" || endStr == "" {
		// default 30 วันล่าสุด
		end = time.Now()
		start = end.AddDate(0, 0, -30)
	} else {
		start, err = time.Parse("2006-01-02", startStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start date"})
			return
		}
		end, err = time.Parse("2006-01-02", endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end date"})
			return
		}
		end = end.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
	}
	type row struct {
		ProgramID   uint
		ProgramName string
		Count       int64
	}

	var results []row

	latestEduJoin := `
LEFT JOIN educations e
  ON e.id = (
    SELECT ee.id FROM educations ee
    WHERE ee.student_id = s.id AND ee.deleted_at IS NULL
    ORDER BY ee.created_at DESC, ee.id DESC
    LIMIT 1
  )
`

	tx := db().Table("applications AS a").
		Select(`
    COALESCE(p.id, 0) AS program_id,
    COALESCE(p.name_th, 'ไม่ระบุสาขา') AS program_name,
    COUNT(*) AS count`).
		Joins("JOIN students s ON a.student_id = s.id").
		Joins(latestEduJoin).
		Joins("LEFT JOIN programs p ON p.id = e.program_id").
		Where("a.submit_at BETWEEN ? AND ?", start, end).
		Group("COALESCE(p.id, 0), COALESCE(p.name_th, 'ไม่ระบุสาขา')").
		Order("count DESC").
		Limit(top)

	if err := tx.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := entity.ApplicationByProgramResponse{
		Start: start, End: end, TopN: top,
		Results: make([]entity.ProgramStat, 0, len(results)),
	}
	for _, r := range results {
		resp.Results = append(resp.Results, entity.ProgramStat{
			ProgramID:   r.ProgramID,
			ProgramName: r.ProgramName,
			Count:       r.Count,
		})
	}
	c.JSON(http.StatusOK, resp)

}

// -------------------- 3) Company Review Report --------------------
func GetCompanyReviewReport(c *gin.Context) {
	// optional filter by company_id
	companyIDStr := c.Query("company_id")
	var companyFilter interface{} = nil
	if companyIDStr != "" {
		if id, err := strconv.Atoi(companyIDStr); err == nil && id > 0 {
			companyFilter = uint(id)
		}
	}

	// overall average
	var overallAvg float64
	q := db().Model(&entity.Review{})
	if companyFilter != nil {
		q = q.Where("company_id = ?", companyFilter)
	}
	q.Select("COALESCE(AVG(rating),0)").Scan(&overallAvg)

	// distribution 1..5 stars
	dist := make([]entity.ReviewDistributionBin, 0, 5)
	for s := 1; s <= 5; s++ {
		var cnt int64
		qq := db().Model(&entity.Review{}).Where("rating = ?", s)
		if companyFilter != nil {
			qq = qq.Where("company_id = ?", companyFilter)
		}
		qq.Count(&cnt)
		dist = append(dist, entity.ReviewDistributionBin{Stars: s, Count: cnt})
	}

	// top companies by avg rating (เฉพาะกรณีไม่ filter company)
	topRows := []entity.CompanyRatingRow{}
	if companyFilter == nil {
		db().Table("reviews r").
			Select(`
				c.id AS company_id,
				c.company_name AS company_name,
				AVG(r.rating) AS avg_rating,
				COUNT(*) AS reviews`).
			Joins("JOIN companies c ON c.id = r.company_id").
			Group("c.id, c.company_name").
			Having("COUNT(*) >= ?", 3). // กัน noise
			Order("avg_rating DESC, reviews DESC").
			Limit(10).
			Scan(&topRows)
	}

	c.JSON(http.StatusOK, entity.CompanyReviewReport{
		OverallAverage: overallAvg,
		Distribution:   dist,
		TopCompanies:   topRows,
	})
}
