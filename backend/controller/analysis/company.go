package analysis

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"github.com/gin-gonic/gin"
)

type PopularCompanyRow struct {
	Company    string `json:"company"`
	Openings   int64  `json:"openings"`
	Applicants int64  `json:"applicants"`
	Interviews int64  `json:"interviews"`
	Accepted   int64  `json:"accepted"`
	Completed  int64  `json:"completed"`
}

// กำหนด mapping ชื่อสถานะตามระบบของคุณ
var interviewStatuses = []string{"นัดสัมภาษณ์แล้ว", "InterviewScheduled"}
var acceptedStatuses  = []string{"ผ่านการคัดเลือก", "รับฝึกงาน", "Accepted"}
var completedStatuses = []string{"ฝึกงานเสร็จ", "Completed"}

// GET /admin/analytics/popular-companies
func GetPopularCompanies(c *gin.Context) {

	db := config.DB()

	// ใช้ LEFT JOIN เพื่อให้บริษัทที่ยังไม่มีโพสต์/ใบสมัครก็ติดมาด้วย (ตัวเลขเป็น 0)
	// นับ openings = จำนวนโพสต์ (จะนับทั้งหมดหรือเฉพาะที่เปิดอยู่ก็ได้ ถ้าเฉพาะที่เปิด: WHERE/CASE จาก StatusPost)
	// Applicants = COUNT(a.id)
	// เงื่อนไขสถานะอื่น ๆ ใช้ SUM(CASE WHEN ... THEN 1 ELSE 0 END)
	q := db.Table("companies AS c").
		Select(`
			c.company_name AS company,
			COUNT(DISTINCT p.id) AS openings,
			COUNT(a.id) AS applicants,
			SUM(CASE WHEN a.status IN ? THEN 1 ELSE 0 END) AS interviews,
			SUM(CASE WHEN a.status IN ? THEN 1 ELSE 0 END) AS accepted,
			SUM(CASE WHEN a.status IN ? THEN 1 ELSE 0 END) AS completed
		`, interviewStatuses, acceptedStatuses, completedStatuses).
		Joins("LEFT JOIN intership_posts AS p ON p.company_id = c.id").
		Joins("LEFT JOIN applications AS a ON a.intership_post_id = p.id").
		Group("c.id, c.company_name").
		Order("applicants DESC, openings DESC")

	var rows []PopularCompanyRow
	if err := q.Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query popular companies", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rows)
}