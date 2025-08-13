package analysis

import (
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAdminStatusSummaries(c *gin.Context) {
	var posts []entity.IntershipPost
	var verifications []entity.Verify
	/* var users []entity.User */

	db := config.DB()

	// 1. Summary status_post
	postCounts := map[string]int{}
	db.Model(&entity.IntershipPost{}).Select("status_post_id, count(*) as count").Group("status_post_id").Scan(&posts)
	for _, post := range posts {
		db.Preload("StatusPost").First(&post, post.StatusPostID)
		postCounts[post.StatusPost.StatusPostTH] += 1
	}

	// 2. Summary status_verify
	verifyCounts := map[string]int{}
	db.Model(&entity.Verify{}).Select("status_verify_id, count(*) as count").Group("status_verify_id").Scan(&verifications)
	for _, verify := range verifications {
		db.Preload("StatusVerify").First(&verify, verify.StatusVerifyID)
		verifyCounts[verify.StatusVerify.StatusVerify] += 1
	}

	// 3. Summary user roles
	var studentCount, companyCount, academicStaffCount, adminCount int64
	db.Model(&entity.Student{}).Count(&studentCount)
	db.Model(&entity.Company{}).Count(&companyCount)
	db.Model(&entity.AcademicStaff{}).Count(&academicStaffCount)
	db.Model(&entity.Admin{}).Count(&adminCount)

	c.JSON(http.StatusOK, gin.H{
		"status_posts":    postCounts,
		"status_verifies": verifyCounts,
		"user_roles": map[string]int64{
			"students":      studentCount,
			"companies":     companyCount,
			"academicStaff": academicStaffCount,
			"admins":        adminCount,
		},
	})
}

// controller/dashboard.go
func GetAdminDashboardOverview(c *gin.Context) {
	var (
		totalUsers        int64
		totalStudents     int64
		totalCompanies    int64
		totalStaff        int64
		totalAdmins       int64
		totalApps         int64
		totalInterviews   int64
		totalPendingPosts int64
		totalRecentLogins int64
	)

	db := config.DB()

	db.Model(&entity.User{}).Count(&totalUsers)
	db.Model(&entity.Student{}).Count(&totalStudents)
	db.Model(&entity.Company{}).Count(&totalCompanies)
	db.Model(&entity.AcademicStaff{}).Count(&totalStaff)
	db.Model(&entity.Admin{}).Count(&totalAdmins)
	db.Model(&entity.Application{}).Count(&totalApps)
	db.Model(&entity.InterviewAppointment{}).Count(&totalInterviews)

	// Pending posts
	db.Model(&entity.IntershipPost{}).
		Joins("JOIN status_posts ON intership_posts.status_post_id = status_posts.id").
		Where("status_posts.status_post = ?", "Pending").
		Count(&totalPendingPosts)

	// Recent logins
	db.Model(&entity.LoginLog{}).
		Where("login_at >= ?", time.Now().Add(-24*time.Hour)).
		Count(&totalRecentLogins)

	// นับ Verify แยกตาม StatusVerify
	type VerifyCount struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	var verifyCounts []VerifyCount
	db.Model(&entity.Verify{}).
		Select("status_verifies.status_verify AS status, COUNT(*) AS count").
		Joins("JOIN status_verifies ON verifies.status_verify_id = status_verifies.id").
		Group("status_verifies.status_verify").
		Scan(&verifyCounts)

	c.JSON(http.StatusOK, gin.H{
		"total_users":     totalUsers,
		"students":        totalStudents,
		"companies":       totalCompanies,
		"academic_staff":  totalStaff,
		"admins":          totalAdmins,
		"applications":    totalApps,
		"interviews":      totalInterviews,
		"pending_posts":   totalPendingPosts,
		"verify_statuses": verifyCounts,
		"recent_logins":   totalRecentLogins,
	})
}

type MonthlyApplicationStats struct {
	Month        string `json:"month"`
	Applications int    `json:"applications"`
	Interviews   int    `json:"interviews"`
	Approved     int    `json:"approved"`
}

func GetAdminMonthlyApplicationStats(c *gin.Context) {
	year := c.DefaultQuery("year", time.Now().Format("2006")) // ค.ศ.
	var stats []MonthlyApplicationStats
	db := config.DB()

	db.Raw(`
        SELECT 
            strftime('%m', submit_at) AS month,
            COUNT(*) AS applications,
            SUM(CASE WHEN status = 'นัดสัมภาษณ์แล้ว' THEN 1 ELSE 0 END) AS interviews,
            SUM(CASE WHEN status = 'ผ่านการคัดเลือก' THEN 1 ELSE 0 END) AS approved
        FROM applications
        WHERE strftime('%Y', submit_at) = ?
        GROUP BY month
        ORDER BY month
    `, year).Scan(&stats)

	for i := range stats {
		stats[i].Month = convertMonthToThai(stats[i].Month)
	}
	c.JSON(http.StatusOK, stats)
}

type ActivityLog struct {
	UserName string `json:"user"`
	Role     string `json:"type"`
	Action   string `json:"action"`
	Time     string `json:"time"`
	Company  string `json:"company,omitempty"`
	Post     string `json:"post,omitempty"`
}

func GetAdminRecentActivities(c *gin.Context) {
	var logs []ActivityLog

	db := config.DB()
	db.Raw(`
		SELECT u.email AS user, r.role_name AS type, 'สมัครงาน' AS action, 
			strftime('%Y-%m-%d %H:%M', a.submit_at) AS time,
			co.company_name AS company, ip.post_name AS post
		FROM applications a
		JOIN students s ON s.id = a.student_id
		JOIN users u ON u.id = s.user_id
		JOIN roles r ON r.id = u.role_id
		JOIN intership_posts ip ON ip.id = a.intership_post_id
		JOIN companies co ON co.id = ip.company_id
		ORDER BY a.submit_at DESC
		LIMIT 10
	`).Scan(&logs)

	c.JSON(http.StatusOK, logs)
}

type PendingPost struct {
	Company   string `json:"company"`
	Position  string `json:"position"`
	Submitted string `json:"submitted"`
	Status    string `json:"status"`
}

func GetAdminPendingPosts(c *gin.Context) {
	var posts []PendingPost

	db := config.DB()
	db.Raw(`
		SELECT c.company_name AS company,
			ip.post_name AS position,
			strftime('%Y-%m-%d', ip.created_at) AS submitted,
			sp.status_post_th AS status
		FROM intership_posts ip
		JOIN companies c ON c.id = ip.company_id
		JOIN status_posts sp ON sp.id = ip.status_post_id
		WHERE sp.status_post = 'Pending Approval'
		ORDER BY ip.created_at DESC
	`).Scan(&posts)

	c.JSON(http.StatusOK, posts)
}

func convertMonthToThai(month string) string {
	switch month {
	case "01":
		return "ม.ค."
	case "02":
		return "ก.พ."
	case "03":
		return "มี.ค."
	case "04":
		return "เม.ย."
	case "05":
		return "พ.ค."
	case "06":
		return "มิ.ย."
	case "07":
		return "ก.ค."
	case "08":
		return "ส.ค."
	case "09":
		return "ก.ย."
	case "10":
		return "ต.ค."
	case "11":
		return "พ.ย."
	case "12":
		return "ธ.ค."
	default:
		return "ไม่ทราบ"
	}
}
