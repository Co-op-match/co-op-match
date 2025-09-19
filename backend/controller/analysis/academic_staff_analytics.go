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
	"gorm.io/gorm/clause"
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

	c.JSON(http.StatusOK, AcademicOverviewResponse{
		UniversityID:         universityID,
		Students:             int(studentsCount),
		ApplicationsByStatus: appsByStatus,
		TopCompanies:         topCompanies,
		NeverApplied:         int(neverApplied),
		InterviewsUpcoming:   int(interviewsUpcoming),
	})
}

// GET /analysis/academic/user/:userId/trend
// Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD  หรือ  ?days=7|30|90
func GetAcademicTrend(c *gin.Context) {
	db := config.DB()

	// 1) หาโปรไฟล์อาจารย์จาก userId -> เพื่อจำกัดที่มหาวิทยาลัยเดียวกัน
	staff, ok := getAcademicByUserID(c, db)
	if !ok {
		return
	}
	universityID := staff.UniversityID

	// 2) แปลงช่วงวันที่
	startStr := c.Query("start")
	endStr := c.Query("end")

	var start, end time.Time
	var err error
	explicitRange := startStr != "" && endStr != ""

	if explicitRange {
		start, end, err = betweenStartEnd(startStr, endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date range"})
			return
		}
	} else {
		start, end = betweenDays(c.Query("days"))
	}

	// --- บังคับให้รวม "วันนี้" เสมอเมื่อไม่ได้กำหนดช่วงเอง (โหมด days) ---
	if !explicitRange {
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		if end.Before(today) {
			end = today
		}
	}

	// --- ทำให้ start/end เป็น 00:00 ของวันนั้นเสมอ ---
	start = time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, start.Location())
	end = time.Date(end.Year(), end.Month(), end.Day(), 0, 0, 0, 0, end.Location())

	// 3) โครงสร้างผลลัพธ์
	type TrendPoint struct {
		Date        string `json:"date"`
		Total       int64  `json:"total"`
		Pass        int64  `json:"pass"`
		Review      int64  `json:"review"`
		Interviewed int64  `json:"interviewed"`
		Waiting     int64  `json:"waiting_schedule"`
		Fail        int64  `json:"fail"`
	}

	// 4) เงื่อนไขนับสถานะ
	passCond := `CASE WHEN REPLACE(TRIM(a.status),' ','') = 'ผ่าน' THEN 1 ELSE 0 END`
	reviewCond := `CASE WHEN REPLACE(TRIM(a.status),' ','') = 'กำลังพิจารณา' THEN 1 ELSE 0 END`
	interviewedCond := `CASE WHEN REPLACE(TRIM(a.status),' ','') = 'นัดสัมภาษณ์แล้ว' THEN 1 ELSE 0 END`
	waitingCond := `CASE WHEN REPLACE(TRIM(a.status),' ','') = 'รอการนัดสัมภาษณ์' THEN 1 ELSE 0 END`
	failCond := `
		CASE
		  WHEN REPLACE(TRIM(a.status),' ','') = 'ไม่ผ่าน'
		    OR INSTR(REPLACE(TRIM(a.status),' ',''),'ไม่ผ่าน') > 0
		    OR REPLACE(TRIM(a.status),' ','') = 'ไม่ได้รับเลือก'
		    OR INSTR(REPLACE(TRIM(a.status),' ',''),'ไม่ได้รับเลือก') > 0
		  THEN 1 ELSE 0
		END
	`

	type row struct {
		Date        string
		Total       int64
		Pass        int64
		Review      int64
		Interviewed int64
		Waiting     int64
		Fail        int64
	}
	var rows []row

	// เลือก Education ล่าสุดของแต่ละ student เพื่ออ้างอิง university ให้ถูกต้อง
	latestEdu := db.Table("educations").
		Select("student_id, MAX(created_at) as max_created_at").
		Group("student_id")

	if err := db.Table("applications a").
		Select(`
			DATE(a.submit_at) AS date,
			COUNT(*) AS total,
			SUM(`+passCond+`) AS pass,
			SUM(`+reviewCond+`) AS review,
			SUM(`+interviewedCond+`) AS interviewed,
			SUM(`+waitingCond+`) AS waiting,
			SUM(`+failCond+`) AS fail
		`).
		Joins("JOIN students s ON s.id = a.student_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN (?) le ON le.student_id = e.student_id AND le.max_created_at = e.created_at", latestEdu).
		Where("e.university_id = ?", universityID).
		Where("a.submit_at BETWEEN ? AND ?", start, end.Add(24*time.Hour-1)).
		Group("DATE(a.submit_at)").
		Order("DATE(a.submit_at)").
		Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 5) เติมวันที่ให้ครบช่วง
	byDate := make(map[string]row, len(rows))
	for _, r := range rows {
		byDate[r.Date] = r
	}

	points := make([]TrendPoint, 0, int(end.Sub(start).Hours()/24)+1)
	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		day := d.Format("2006-01-02")
		if r, ok := byDate[day]; ok {
			points = append(points, TrendPoint{
				Date:        day,
				Total:       r.Total,
				Pass:        r.Pass,
				Review:      r.Review,
				Interviewed: r.Interviewed,
				Waiting:     r.Waiting,
				Fail:        r.Fail,
			})
		} else {
			points = append(points, TrendPoint{
				Date:        day,
				Total:       0,
				Pass:        0,
				Review:      0,
				Interviewed: 0,
				Waiting:     0,
				Fail:        0,
			})
		}
	}

	// 6) บันทึก/อัปเดตลง HistoryApplicationStatus (upsert แบบ bulk)
	loc := start.Location()
	records := make([]entity.HistoryApplicationStatus, 0, len(points))
	for _, p := range points {
		dt, _ := time.ParseInLocation("2006-01-02", p.Date, loc)
		records = append(records, entity.HistoryApplicationStatus{
			Date:         dt,
			UniversityID: universityID,
			Total:        p.Total,
			Pass:         p.Pass,
			Review:       p.Review,
			Interviewed:  p.Interviewed,
			Waiting:      p.Waiting,
			Fail:         p.Fail,
		})
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		return tx.Clauses(clause.OnConflict{
			Columns: []clause.Column{
				{Name: "date"},
				{Name: "university_id"},
			},
			DoUpdates: clause.AssignmentColumns([]string{
				"total", "pass", "review", "interviewed", "waiting", "fail", "updated_at",
			}),
		}).Create(&records).Error
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save history failed: " + err.Error()})
		return
	}

	// 7) ส่งผลลัพธ์ trend กลับตามเดิม
	c.JSON(http.StatusOK, points)
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
			us.email,
			s.phone_number,
			COALESCE(e.grade, '') 			AS grade,
			COALESCE(genders.name_th, '')	AS gender,
			COALESCE(p.name_th, '')      	AS program_name,
			COALESCE(f.name_th, '')      	AS faculty_name,
			COALESCE(u.name_th, '')      	AS university_name,
			(
			SELECT COUNT(*)
			FROM applications a
			WHERE a.student_id = s.id
			) AS applications_total
		`).
		Joins("LEFT JOIN genders ON genders.id = s.gender_id").
		Joins("JOIN educations e ON e.student_id = s.id").
		Joins("JOIN users us ON us.id = s.user_id").
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
		PhoneNumber       string
		Grade             float64
		Gender            string
		Email             string
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
			PhoneNumber:       r.PhoneNumber,
			Grade:             r.Grade,
			Gender:            r.Gender,
			Email:             r.Email,
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
