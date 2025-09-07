package analysis

import (
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

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
		Where("status_posts.status_post = ?", "Pending Approval").
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

/*
func GetAdminStatusSummaries(c *gin.Context) {
	var posts []entity.IntershipPost
	var verifications []entity.Verify
	// var users []entity.User

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

************************************* 2 *********************************************

// โครงสร้างข้อมูลที่จะเก็บจำนวนผู้ใช้แต่ละประเภท (role) ตามช่วงเวลา
type UsersByRolePoint struct {
	Label         string `json:"label"`          // ชื่อ label เช่น เดือน, ไตรมาส, ปี
	Students      int64  `json:"students"`       // จำนวน Student
	Companies     int64  `json:"companies"`      // จำนวน Company
	AcademicStaff int64  `json:"academic_staff"` // จำนวน Academic Staff
	Admins        int64  `json:"admins"`         // จำนวน Admin
}

// Controller สำหรับดึงจำนวนผู้ใช้แต่ละ role ในรูปแบบ series


func GetUsersByRoleSeries(c *gin.Context) {
	// mode จะกำหนดรูปแบบการแสดงผล เช่น month, quarter, year (default = month)
	mode := c.DefaultQuery("mode", "month")
	// year คือปีที่ใช้กรองข้อมูล (ค่าดีฟอลต์ = ปีปัจจุบัน ค.ศ.)
	year := c.DefaultQuery("year", time.Now().Format("2006"))
	db := config.DB()

	var rows []UsersByRolePoint // slice สำหรับเก็บผลลัพธ์

	switch mode {
	case "quarter": // กรณีดูราย "ไตรมาส"
		db.Raw(`
			-- สร้างตาราง q แทนไตรมาส (Q1-Q4)
			WITH q(qn,name) AS (SELECT 1,'Q1' UNION ALL SELECT 2,'Q2' UNION ALL SELECT 3,'Q3' UNION ALL SELECT 4,'Q4')
			SELECT name AS label,
				-- นับจำนวน student ที่สร้างในปีและไตรมาสตรงกับ qn
				(SELECT COUNT(*) FROM students s JOIN users u ON u.id=s.user_id
				 WHERE strftime('%Y',u.created_at)=? AND ((CAST(strftime('%m',u.created_at) AS INTEGER)+2)/3)=qn) AS students,
				-- นับจำนวน company
				(SELECT COUNT(*) FROM companies c JOIN users u ON u.id=c.user_id
				 WHERE strftime('%Y',u.created_at)=? AND ((CAST(strftime('%m',u.created_at) AS INTEGER)+2)/3)=qn) AS companies,
				-- นับจำนวน academic staff
				(SELECT COUNT(*) FROM academic_staffs a JOIN users u ON u.id=a.user_id
				 WHERE strftime('%Y',u.created_at)=? AND ((CAST(strftime('%m',u.created_at) AS INTEGER)+2)/3)=qn) AS academic_staff,
				-- นับจำนวน admin
				(SELECT COUNT(*) FROM admins ad JOIN users u ON u.id=ad.user_id
				 WHERE strftime('%Y',u.created_at)=? AND ((CAST(strftime('%m',u.created_at) AS INTEGER)+2)/3)=qn) AS admins
			FROM q
		`, year, year, year, year).Scan(&rows)

	case "year": // กรณีดูย้อนหลังหลายปี (5 ปีรวมปีปัจจุบัน)
		db.Raw(`
			-- สร้างตาราง ys แทนปีปัจจุบันและย้อนหลังไป 4 ปี
			WITH ys(y) AS (
				SELECT CAST(? AS INTEGER) UNION ALL SELECT CAST(? AS INTEGER)-1 UNION ALL
				SELECT CAST(? AS INTEGER)-2 UNION ALL SELECT CAST(? AS INTEGER)-3 UNION ALL
				SELECT CAST(? AS INTEGER)-4
			)
			SELECT CAST(y AS TEXT) AS label,
				-- นับ student ตามปี
				(SELECT COUNT(*) FROM students s JOIN users u ON u.id=s.user_id WHERE strftime('%Y',u.created_at)=CAST(y AS TEXT)) AS students,
				-- นับ company ตามปี
				(SELECT COUNT(*) FROM companies c JOIN users u ON u.id=c.user_id WHERE strftime('%Y',u.created_at)=CAST(y AS TEXT)) AS companies,
				-- นับ academic staff ตามปี
				(SELECT COUNT(*) FROM academic_staffs a JOIN users u ON u.id=a.user_id WHERE strftime('%Y',u.created_at)=CAST(y AS TEXT)) AS academic_staff,
				-- นับ admin ตามปี
				(SELECT COUNT(*) FROM admins ad JOIN users u ON u.id=ad.user_id WHERE strftime('%Y',u.created_at)=CAST(y AS TEXT)) AS admins
			FROM ys ORDER BY y
		`, year, year, year, year, year).Scan(&rows)

	default: // "month" กรณีดูรายเดือน (ค่า default)
		db.Raw(`
			-- สร้างตาราง m แทนเดือน (01-12 พร้อมชื่อย่อภาษาไทย)
			WITH m(mn,name) AS (
				SELECT '01','ม.ค.' UNION ALL SELECT '02','ก.พ.' UNION ALL SELECT '03','มี.ค.' UNION ALL SELECT '04','เม.ย.'
				UNION ALL SELECT '05','พ.ค.' UNION ALL SELECT '06','มิ.ย.' UNION ALL SELECT '07','ก.ค.' UNION ALL SELECT '08','ส.ค.'
				UNION ALL SELECT '09','ก.ย.' UNION ALL SELECT '10','ต.ค.' UNION ALL SELECT '11','พ.ย.' UNION ALL SELECT '12','ธ.ค.'
			)
			SELECT name AS label,
				-- นับ student ตามเดือน
				(SELECT COUNT(*) FROM students s JOIN users u ON u.id=s.user_id
				 WHERE strftime('%Y',u.created_at)=? AND strftime('%m',u.created_at)=mn) AS students,
				-- นับ company ตามเดือน
				(SELECT COUNT(*) FROM companies c JOIN users u ON u.id=c.user_id
				 WHERE strftime('%Y',u.created_at)=? AND strftime('%m',u.created_at)=mn) AS companies,
				-- นับ academic staff ตามเดือน
				(SELECT COUNT(*) FROM academic_staffs a JOIN users u ON u.id=a.user_id
				 WHERE strftime('%Y',u.created_at)=? AND strftime('%m',u.created_at)=mn) AS academic_staff,
				-- นับ admin ตามเดือน
				(SELECT COUNT(*) FROM admins ad JOIN users u ON u.id=ad.user_id
				 WHERE strftime('%Y',u.created_at)=? AND strftime('%m',u.created_at)=mn) AS admins
			FROM m
		`, year, year, year, year).Scan(&rows)
	}

	// ส่งผลลัพธ์ออกเป็น JSON กลับไปที่ client
	c.JSON(http.StatusOK, rows)
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
	
*/
