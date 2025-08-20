package analysis

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"github.com/gin-gonic/gin"
)

type TimePoint struct {
	Label        string `json:"label"`
	Applications int64  `json:"applications"`
	Interviews   int64  `json:"interviews"`
	Approved     int64  `json:"approved"`
}

func GetAdminApplicationStats(c *gin.Context) {
	grain := c.DefaultQuery("grain", "month") // day|week|month|quarter|year
	year := c.Query("year")
	start := c.Query("start") // YYYY-MM-DD
	end := c.Query("end")     // YYYY-MM-DD

	db := config.DB()

	// เลือก label ตาม grain (SQLite)
	labelExpr := ""
	switch grain {
	case "year":
		labelExpr = "strftime('%Y', a.submit_at)"
	case "quarter":
		labelExpr = "strftime('%Y', a.submit_at) || '-Q' || ((cast(strftime('%m', a.submit_at) as integer)+2)/3)"
	case "week":
		labelExpr = "strftime('%Y', a.submit_at) || '-W' || strftime('%W', a.submit_at)"
	case "day":
		labelExpr = "strftime('%Y-%m-%d', a.submit_at)"
	default: // month
		labelExpr = "strftime('%Y-%m', a.submit_at)"
	}

	// เงื่อนไขเวลา
	where := "1=1"
	args := []any{}
	if year != "" {
		where += " AND strftime('%Y', a.submit_at) = ?"
		args = append(args, year)
	}
	if start != "" {
		where += " AND date(a.submit_at) >= date(?)"
		args = append(args, start)
	}
	if end != "" {
		where += " AND date(a.submit_at) <= date(?)"
		args = append(args, end)
	}

	var rows []TimePoint
	err := db.Raw(`
		WITH base AS (
		  SELECT
		    `+labelExpr+` AS label,
		    1 AS applications,
		    CASE WHEN ia.id IS NOT NULL THEN 1 ELSE 0 END AS interviews,
		    CASE WHEN a.status IN ('Approved','ผ่าน','ผ่านการคัดเลือก') THEN 1 ELSE 0 END AS approved
		  FROM applications a
		  JOIN intership_posts ip ON ip.id = a.intership_post_id
		  LEFT JOIN interview_appointments ia
		         ON ia.student_id = a.student_id
		        AND ia.company_id = ip.company_id
		  WHERE `+where+`
		)
		SELECT label,
		       SUM(applications) AS applications,
		       SUM(interviews)   AS interviews,
		       SUM(approved)     AS approved
		FROM base
		GROUP BY label
		ORDER BY label ASC
	`, args...).Scan(&rows).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}
	c.JSON(http.StatusOK, rows)
}