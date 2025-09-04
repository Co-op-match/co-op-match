package analysis

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// helper: ดึง AcademicStaff จาก user_id
func getAcademicByUserID(c *gin.Context, db *gorm.DB) (entity.AcademicStaff, bool) {
	var staff entity.AcademicStaff

	// ดึงค่า userId จากพารามิเตอร์ใน URL (/user/:userId)
	userIdStr := c.Param("userId")
	userID, err := strconv.ParseUint(userIdStr, 10, 64)
	if err != nil || userID == 0 {
		// ถ้า userId ไม่ถูกต้อง → return error 400
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid userId"})
		return staff, false
	}

	// ค้นหา AcademicStaff ที่มี user_id ตรงกับ userId -> preload("University") โหลดข้อมูลมหาวิทยาลัยมาด้วย
	// ถ้ามีหลายโปรไฟล์อาจารย์ต่อ user (ไม่น่าใช่) ใช้ First ไปก่อน
	if err := db.Where("user_id = ?", userID).
		Preload("University").
		First(&staff).Error; err != nil {

		if err == gorm.ErrRecordNotFound {
			// ถ้าไม่เจอ → error 404
			c.JSON(http.StatusNotFound, gin.H{"error": "academic staff profile not found for this user"})
		} else {
			// error อื่น ๆ → error 500
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return staff, false
	}
	return staff, true
}

// GET /analysis/academic/user/:userId/dashboard/overview
func GetAcademicOverview(c *gin.Context) {
	db := config.DB()
	staff, ok := getAcademicByUserID(c, db)
	if !ok {
		return
	}

	universityID := staff.UniversityID

	// ===== 1) นับจำนวนนักศึกษาในมหาวิทยาลัยเดียวกัน =====
	// group ตาม student_id ในตาราง education โดยยึดตามวันที่ล่าสุด MAX(created_at)
	latestEdu := db.Table("educations").
		Select("student_id, MAX(created_at) as max_created_at").
		Group("student_id")

	//
	var studentsCount int64
	db.Table("students as s").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
		Where("e.university_id = ?", universityID).
		Distinct("s.id").
		Count(&studentsCount)

	// ===== 2) นับ Applications ตามสถานะ =====
	statuses := []string{"รอการนัดสัมภาษณ์", "กำลังพิจารณา", "ไม่ได้รับเลือก", "ผ่าน", "นัดสัมภาษณ์แล้ว", "ไม่ผ่าน"}

	var appsByStatus []KV
	for _, st := range statuses {
		var cnt int64
		db.Table("applications a").
			Joins("JOIN students s ON s.id = a.student_id").
			Joins("JOIN educations e ON e.student_id = s.id").
			Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
			Where("e.university_id = ? AND a.status = ?", universityID, st).
			Count(&cnt)
		appsByStatus = append(appsByStatus, KV{Key: st, Count: int(cnt)})
	}

	// ===== 3) นัดสัมภาษณ์ในอนาคต =====
	var interviewsUpcoming int64
	db.Table("interview_appointments ia").
		Joins("JOIN students s ON s.id = ia.student_id").
		Joins("JOIN applications a ON a.student_id = s.id").
		Joins("JOIN intership_posts ip ON ip.id = a.intership_post_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
		Where("e.university_id = ? AND ia.appointment_date >= ? AND a.status = ?", universityID, time.Now(), "รอการนัดสัมภาษณ์").
		Where("ip.company_id = ia.company_id").
		Distinct("ia.id").
		Count(&interviewsUpcoming)

	// ===== 4) Top บริษัทที่นักศึกษาสมัครเยอะสุด 5 อันดับ =====
	var topCompanies []TopCompany
	db.Table("applications a").
		Joins("JOIN students s ON s.id = a.student_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
		Joins("JOIN intership_posts ip ON ip.id = a.intership_post_id").
		Joins("JOIN companies c ON c.id = ip.company_id").
		Where("e.university_id = ?", universityID).
		Select("c.id AS company_id, c.company_name, COUNT(*) AS count").
		Group("c.id, c.company_name").
		Order("count DESC").Limit(5).Scan(&topCompanies)

	// ===== 5) นักศึกษาที่ยัง “ไม่เคยสมัคร” =====
	var neverApplied int64
	db.Table("students s").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
		Where("e.university_id = ? AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.student_id = s.id)", universityID).
		Count(&neverApplied)

		// ===== 6) แนวโน้มการสมัครรายสัปดาห์/รายเดือน/รายเทอม =====
		// ========== แนวโน้มรายสัปดาห์ ==========
	var appsPerWeek []KVTime
	db.Table("applications a").
		Joins("JOIN students s ON s.id = a.student_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
		Where("e.university_id = ?", universityID).
		Select(`
		strftime('%Y-%W', a.created_at) AS period,
		COUNT(*) AS count
	`).
		Group("period").
		Order("period").
		Scan(&appsPerWeek)

	// ========== แนวโน้มรายเดือน ==========
	var appsPerMonth []KVTime
	db.Table("applications a").
		Joins("JOIN students s ON s.id = a.student_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
		Where("e.university_id = ?", universityID).
		Select(`
		strftime('%Y-%m', a.created_at) AS period,
		COUNT(*) AS count
	`).
		Group("period").
		Order("period").
		Scan(&appsPerMonth)

	// ========== แนวโน้มรายเทอม (กำหนดช่วงเทอม) ==========
	// สมมติ: ส.ค.–ธ.ค. = เทอม 1, ม.ค.–พ.ค. = เทอม 2, มิ.ย.–ก.ค. = ช่วงฤดูร้อน S
	var appsPerSemester []KVTime
	db.Table("applications a").
		Joins("JOIN students s ON s.id = a.student_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
		Where("e.university_id = ?", universityID).
		Select(`
		CASE
		  WHEN CAST(strftime('%m', a.created_at) AS INTEGER) BETWEEN 8 AND 12
		    THEN strftime('%Y', a.created_at) || '-1'
		  WHEN CAST(strftime('%m', a.created_at) AS INTEGER) BETWEEN 1 AND 5
		    THEN strftime('%Y', a.created_at) || '-2'
		  ELSE strftime('%Y', a.created_at) || '-S'
		END AS period,
		COUNT(*) AS count
	`).
		Group("period").
		Order("period").
		Scan(&appsPerSemester)

	// กัน null ใน response: ถ้าไม่มีผลลัพธ์ให้เป็น [] แทน
	if appsPerWeek == nil {
		appsPerWeek = []KVTime{}
	}
	if appsPerMonth == nil {
		appsPerMonth = []KVTime{}
	}
	if appsPerSemester == nil {
		appsPerSemester = []KVTime{}
	}

	c.JSON(http.StatusOK, AcademicOverviewResponse{
		UniversityID:         universityID,
		Students:             int(studentsCount),
		ApplicationsByStatus: appsByStatus,
		TopCompanies:         topCompanies,
		NeverApplied:         int(neverApplied),
		InterviewsUpcoming:   int(interviewsUpcoming),

		AppsPerWeek:     appsPerWeek,
		AppsPerMonth:    appsPerMonth,
		AppsPerSemester: appsPerSemester,
	})
}

// GET /analysis/academic/user/:userId/students?page=&page_size=&q=
func ListAcademicStudents(c *gin.Context) {
	db := config.DB()
	staff, ok := getAcademicByUserID(c, db)
	if !ok {
		return
	}
	universityID := staff.UniversityID

	page, size := 1, 10
	if v := c.Query("page"); v != "" {
		fmt.Sscanf(v, "%d", &page)
	}
	if v := c.Query("page_size"); v != "" {
		fmt.Sscanf(v, "%d", &size)
	}
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 10
	}
	q := c.Query("q")

	// ===== 1) เลือก Education ล่าสุดของแต่ละ student =====
	latestEdu := db.Table("educations").
		Select("student_id, MAX(created_at) as max_created_at").
		Group("student_id")

	base := db.Table("students s").
		Select(`
			s.id,
			s.first_name,
			s.last_name,
			s.age,
			COALESCE(genders.name_th, '') AS gender,
			COALESCE(p.name_th, '')      AS program_name,
			COALESCE(f.name_th, '')      AS faculty_name,
			COALESCE(u.name_th, '')      AS university_name,
			(
			SELECT COUNT(*)
			FROM applications a
			WHERE a.student_id = s.id
			) AS applications_total
		`).
		Joins("LEFT JOIN genders ON genders.id = s.gender_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
		Joins("LEFT JOIN programs p ON p.id = e.program_id").
		Joins("LEFT JOIN faculties f ON f.id = e.faculty_id").
		Joins("LEFT JOIN universities u ON u.id = e.university_id").
		Where("e.university_id = ?", universityID)

	if q != "" {
		like := "%" + q + "%"
		base = base.Where("s.first_name LIKE ? OR s.last_name LIKE ?", like, like)
	}

	var total int64
	base.Count(&total)

	var rows []struct {
		ID                uint
		FirstName         string
		LastName          string
		Age               uint
		Gender            string
		ProgramName       string
		FacultyName       string
		UniversityName    string
		ApplicationsTotal int
	}

	if err := base.Order("s.id DESC").Offset((page - 1) * size).Limit(size).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	items := make([]AcademicStudentItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, AcademicStudentItem{
			ID:                r.ID,
			FirstName:         r.FirstName,
			LastName:          r.LastName,
			Age:               r.Age,
			Gender:            r.Gender,
			ProgramName:       r.ProgramName,
			FacultyName:       r.FacultyName,
			UniversityName:    r.UniversityName,
			ApplicationsTotal: r.ApplicationsTotal,
		})
	}

	c.JSON(http.StatusOK, ListAcademicStudentsResponse{
		UniversityID: universityID,
		Total:        total,
		Page:         page,
		PageSize:     size,
		Items:        items,
	})
}

// GET /analysis/academic/user/:userId/applications?status=&page=&page_size=&q=
// GET /analysis/academic/user/:userId/applications?status=&page=&page_size=&q=
func ListAcademicApplications(c *gin.Context) {
	db := config.DB()
	staff, ok := getAcademicByUserID(c, db)
	if !ok {
		return
	}
	uniID := staff.UniversityID

	page, size := 1, 10
	if v := c.Query("page"); v != "" {
		fmt.Sscanf(v, "%d", &page)
	}
	if v := c.Query("page_size"); v != "" {
		fmt.Sscanf(v, "%d", &size)
	}
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 10
	}

	status := c.Query("status")
	q := c.Query("q")

	latestEdu := db.Table("educations").
		Select("student_id, MAX(created_at) as max_created_at").
		Group("student_id")

	base := db.Table("applications a").
		Select(`
			a.id,
			a.status,
			a.submit_at,
			a.updated_at,
			a.resume_url,
			a.transcript_url,
			a.company_note,
			c.company_name,
			ip.post_name,
			s.id AS student_id,
			CONCAT(s.first_name, ' ', s.last_name) AS student_full_name
		`).
		Joins("JOIN students s ON s.id = a.student_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
		Joins("JOIN intership_posts ip ON ip.id = a.intership_post_id").
		Joins("JOIN companies c ON c.id = ip.company_id").
		Where("e.university_id = ?", uniID)

	if status != "" {
		base = base.Where("a.status = ?", status)
	}
	if q != "" {
		like := "%" + q + "%"
		base = base.Where(
			"s.first_name LIKE ? OR s.last_name LIKE ? OR c.company_name LIKE ? OR ip.post_name LIKE ?",
			like, like, like, like,
		)
	}

	var total int64
	base.Count(&total)

	var rows []struct {
		ID              uint
		Status          string
		SubmitAt        time.Time
		UpdatedAt       time.Time
		ResumeUrl       string
		TranscriptUrl   string
		CompanyNote     string
		CompanyName     string
		PostName        string
		StudentID       uint
		StudentFullName string
	}

	if err := base.
		Order("a.submit_at DESC").
		Offset((page - 1) * size).
		Limit(size).
		Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	items := make([]AcademicApplicationItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, AcademicApplicationItem{
			ID:              r.ID,
			Status:          r.Status,
			SubmitAt:        r.SubmitAt.Format(time.RFC3339),
			UpdatedAt:       r.UpdatedAt.Format(time.RFC3339),
			ResumeUrl:       r.ResumeUrl,
			TranscriptUrl:   r.TranscriptUrl,
			CompanyNote:     r.CompanyNote,
			CompanyName:     r.CompanyName,
			PostName:        r.PostName,
			StudentID:       r.StudentID,
			StudentFullName: r.StudentFullName,
		})
	}

	c.JSON(http.StatusOK, ListAcademicApplicationsResponse{
		UniversityID: uniID,
		Total:        total,
		Page:         page,
		PageSize:     size,
		Items:        items,
	})
}
