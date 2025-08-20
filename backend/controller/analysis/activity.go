package analysis

import (
	"net/http"
	"time"
	"strconv"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func LogActivity(a entity.Activity) error {
	if a.OccurredAt.IsZero() {
		a.OccurredAt = time.Now()
	}
	return config.DB().Create(&a).Error
}
/* 
_ = services.LogActivity(entity.Activity{
	Action:   "สมัครงาน",
	UserID:   &studentUserID,
	UserName: studentEmail,
	Role:     "Student",
	CompanyID: &companyID,
	PostID:   &postID,
	Metadata: `{"application_id": 123}`,
})
*/

type ActivityDTO struct {
	ID       uint   `json:"id"`
	User     string `json:"user"`
	Type     string `json:"type"`
	Action   string `json:"action"`
	Time     string `json:"time"`
	Company  string `json:"company,omitempty"`
	Post     string `json:"post,omitempty"`
	Document string `json:"document,omitempty"`
}

func GetAdminRecentActivities(c *gin.Context) {
	limit := c.DefaultQuery("limit", "10")
	offset := c.DefaultQuery("offset", "0")
	start := c.Query("start")
	end := c.Query("end")

	db := config.DB()
	q := db.Table("activities a").
		Select(`
			a.id,
			a.user_name AS user,
			a.role AS type,
			a.action,
			strftime('%Y-%m-%d %H:%M', a.occurred_at) AS time,
			co.company_name AS company,
			ip.post_name AS post
		`).
		Joins("LEFT JOIN companies co ON co.id = a.company_id").
		Joins("LEFT JOIN intership_posts ip ON ip.id = a.post_id").
		Order("a.occurred_at DESC")

	if start != "" {
		q = q.Where("date(a.occurred_at) >= date(?)", start)
	}
	if end != "" {
		q = q.Where("date(a.occurred_at) <= date(?)", end)
	}
	var rows []ActivityDTO
	limitInt, err1 := strconv.Atoi(limit)
	offsetInt, err2 := strconv.Atoi(offset)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit or offset"})
		return
	}
	if err := q.Limit(limitInt).Offset(offsetInt).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch activities"})
		return
	}
	c.JSON(http.StatusOK, rows)
}

type ActivityPoint struct {
	Label string `json:"label"`
	Count int64  `json:"count"`
}

func GetAdminActivityStats(c *gin.Context) {
	grain := c.DefaultQuery("grain", "month")
	start := c.Query("start")
	end := c.Query("end")

	labelExpr := ""
	switch grain {
	case "year":
		labelExpr = "strftime('%Y', a.occurred_at)"
	case "quarter":
		labelExpr = "strftime('%Y', a.occurred_at) || '-Q' || ( (cast(strftime('%m', a.occurred_at) as integer)+2)/3 )"
	case "week":
		labelExpr = "strftime('%Y', a.occurred_at) || '-W' || strftime('%W', a.occurred_at)"
	case "day":
		labelExpr = "strftime('%Y-%m-%d', a.occurred_at)"
	default:
		labelExpr = "strftime('%Y-%m', a.occurred_at)"
	}

	db := config.DB()
	q := db.Table("activities a").Select(labelExpr+" AS label, COUNT(*) AS count")

	if start != "" {
		q = q.Where("date(a.occurred_at) >= date(?)", start)
	}
	if end != "" {
		q = q.Where("date(a.occurred_at) <= date(?)", end)
	}

	q = q.Group("label").Order("label ASC")

	var rows []ActivityPoint
	if err := q.Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch activity stats"})
		return
	}
	c.JSON(http.StatusOK, rows)
}