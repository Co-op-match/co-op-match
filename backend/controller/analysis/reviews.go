// analysis/reviews.go
package analysis

import (
	"net/http"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/config"
	"github.com/gin-gonic/gin"
)

// GET /analysis/reviews/summary?days=30[&company_id=123]
func GetCompanyReviewSummary(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	start := time.Now().AddDate(0, 0, -days)
	companyID := c.Query("company_id")
	db := config.DB()

	where := "r.created_at >= ?"
	args := []any{start}
	if companyID != "" {
		where += " AND r.company_id = ?"
		args = append(args, companyID)
	}

	// 1) ค่าเฉลี่ย + นับรวม
	var overall struct {
		Avg   float64
		Count int64
	}
	db.Raw(`
	  SELECT COALESCE(AVG(r.rating),0) AS avg, COUNT(*) AS count
	  FROM reviews r
	  WHERE `+where, args...).
		Scan(&overall)

	// 2) แจกแจงคะแนน 1..5
	type DistRow struct {
		Rating int   `json:"rating"`
		Count  int64 `json:"count"`
	}
	var dist []DistRow
	db.Raw(`
	  SELECT CAST(r.rating AS INT) AS rating, COUNT(*) AS count
	  FROM reviews r
	  WHERE `+where+`
	  GROUP BY CAST(r.rating AS INT)
	  ORDER BY rating
	`, args...).Scan(&dist)

	// 3) Top Companies
	type TopCompany struct {
		CompanyID   uint    `json:"company_id"`
		CompanyName string  `json:"company_name"`
		AvgRating   float64 `json:"avg_rating"`
		Reviews     int64   `json:"reviews"`
	}
	var topByAvg []TopCompany
	db.Raw(`
	  SELECT c.id AS company_id, c.company_name, COALESCE(AVG(r.rating),0) AS avg_rating, COUNT(r.id) AS reviews
	  FROM companies c
	  JOIN reviews r ON r.company_id = c.id
	  WHERE r.created_at >= ?
	  GROUP BY c.id, c.company_name
	  HAVING reviews >= 1
	  ORDER BY avg_rating DESC, reviews DESC
	  LIMIT 10
	`, start).Scan(&topByAvg)

	var topByCount []TopCompany
	db.Raw(`
	  SELECT c.id AS company_id, c.company_name, COALESCE(AVG(r.rating),0) AS avg_rating, COUNT(r.id) AS reviews
	  FROM companies c
	  JOIN reviews r ON r.company_id = c.id
	  WHERE r.created_at >= ?
	  GROUP BY c.id, c.company_name
	  HAVING reviews >= 1
	  ORDER BY reviews DESC, avg_rating DESC
	  LIMIT 10
	`, start).Scan(&topByCount)

	c.JSON(http.StatusOK, gin.H{
		"avg_rating": overall.Avg,
		"total_reviews": overall.Count,
		"distribution":  dist,       // [{rating:1..5,count:N}]
		"top_avg":       topByAvg,   // อันดับตามคะแนนเฉลี่ย
		"top_count":     topByCount, // อันดับตามจำนวนรีวิว
	})
}

func GetCompanyReviewReport(c *gin.Context) {
	db := config.DB()

	// params
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days <= 0 {
		days = 30
	}
	start := time.Now().AddDate(0, 0, -days)

	companyID := c.Query("company_id")
	where := "r.deleted_at IS NULL AND r.created_at >= ?"
	args := []any{start}
	if companyID != "" {
		where += " AND r.company_id = ?"
		args = append(args, companyID)
	}

	// 1) overall average
	var overall struct {
		Avg float64
	}
	// NOTE: ปรับชื่อตาราง/คอลัมน์ r.rating, r.company_id, r.created_at ให้ตรง schema จริง
	db.Raw(`
		SELECT COALESCE(AVG(r.rating), 0) AS avg
		FROM reviews r
		WHERE `+where, args...).
		Scan(&overall)

	// 2) distribution 1..5 ดาว (ให้มี 5 bin เสมอ ถึงแม้บางดาวจะเป็น 0)
	type Dist struct {
		Stars int   `json:"stars"`
		Count int64 `json:"count"`
	}
	var dist []Dist
	db.Raw(`
		WITH stars(s) AS (SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5),
		cnt AS (
			SELECT CAST(r.rating AS INT) AS stars, COUNT(*) AS cnt
			FROM reviews r
			WHERE `+where+`
			GROUP BY CAST(r.rating AS INT)
		)
		SELECT s.s AS stars, COALESCE(cnt.cnt, 0) AS count
		FROM stars s
		LEFT JOIN cnt ON cnt.stars = s.s
		ORDER BY s.s
	`, args...).Scan(&dist)

	// 3) top companies (จัดอันดับตาม avg_rating แล้วตาม reviews)
	type TopCompany struct {
		CompanyID   uint    `json:"company_id"`
		CompanyName string  `json:"company_name"`
		AvgRating   float64 `json:"avg_rating"`
		Reviews     int64   `json:"reviews"`
	}
	var top []TopCompany
	db.Raw(`
		SELECT c.id AS company_id,
		       c.company_name,
		       COALESCE(AVG(r.rating),0) AS avg_rating,
		       COUNT(r.id) AS reviews
		FROM companies c
		JOIN reviews r ON r.company_id = c.id
		WHERE r.deleted_at IS NULL AND r.created_at >= ?
		GROUP BY c.id, c.company_name
		HAVING COUNT(r.id) >= 1
		ORDER BY avg_rating DESC, reviews DESC
		LIMIT 10
	`, start).Scan(&top)

	c.JSON(http.StatusOK, gin.H{
		"overall_average": overall.Avg,
		"distribution":    dist,
		"top_companies":   top,
	})
}