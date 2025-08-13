package analysis

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"github.com/gin-gonic/gin"
)

type TopJobRow struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

// GET /admin/analytics/top-jobs
func GetTopJobs(c *gin.Context) {
	db := config.DB()

	var rows []TopJobRow
	// นับจาก Application → IntershipPost → JobType
	// หมายเหตุ: ชื่อคอลัมน์ job_types.job_type ปรับตาม schema จริงของคุณ
	err := db.Table("applications AS a").
		Joins("JOIN intership_posts AS p ON p.id = a.intership_post_id").
		Joins("JOIN job_types AS jt ON jt.id = p.job_type_id").
		Select("jt.job_type AS name, COUNT(a.id) AS count").
		Group("jt.id, jt.job_type").
		Order("count DESC").
		Scan(&rows).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query top jobs", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rows)
}