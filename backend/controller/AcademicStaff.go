package controller

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetAllAcademicStaff(c *gin.Context) {
	var academicstaff []entity.AcademicStaff

	err := config.DB().
		Preload("User").
		Preload("Address").
		Preload("Admin").
		Preload("Gender").
		Preload("Contact").
		Find(&academicstaff).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch academic staff",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, academicstaff)
}

func GetAcademicStaffByID(c *gin.Context) {
	id := c.Param("id")
	var academicstaff entity.AcademicStaff

	if err := config.DB().
		Preload("User").
		Preload("Gender").
		Preload("Contact").
		Preload("University").
		Preload("Faculty").
		Preload("Program").
		Preload("Address").
		Preload("Address.Postcode").
		Preload("Address.Province").
		Preload("Address.SubDistrict").
		Preload("Address.District").
		First(&academicstaff, id).Error; err != nil {

		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "academic staff not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, academicstaff)
}

// --- helper: แปลง uint จาก form ---
func mustUint(c *gin.Context, key string) (uint, error) {
	val := c.PostForm(key)
	if val == "" {
		return 0, fmt.Errorf("missing %s", key)
	}
	u64, err := strconv.ParseUint(val, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid %s", key)
	}
	return uint(u64), nil
}

// --- helper: แปลงวันเกิด ---
func parseBirthday(s string) (time.Time, error) {
	// รองรับทั้ง "2006-01-02" และ RFC3339
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t, nil
	}
	return time.Parse(time.RFC3339, s)
}

// --- helper: คำนวณอายุจากวันเกิด ---
func calcAge(born time.Time) int {
	now := time.Now()
	age := now.Year() - born.Year()
	// ยังไม่ถึงวันเกิดปีนี้ให้ลบ 1
	if now.YearDay() < born.YearDay() {
		age--
	}
	return age
}

func GetAcademicStaffByUserId(c *gin.Context) {
	userID := c.Param("user_id")

	var academicstaff entity.AcademicStaff
	if err := config.DB().
		Preload("User").
		Preload("User.ProfileImage").
		Preload("Gender").
		Preload("Contact").
		Preload("University").
		Preload("Faculty").
		Preload("Program").
		Preload("Address").
		Preload("Address.Postcode").
		Preload("Address.Province").
		Preload("Address.SubDistrict").
		Preload("Address.District").Where("user_id = ?", userID).First(&academicstaff).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบอาจารย์ที่เชื่อมกับ user_id นี้"})
		return
	}
	c.JSON(http.StatusOK, academicstaff)
}

// Content-Type: multipart/form-data
func CreateAcademicStaff(c *gin.Context) {
	db := config.DB()

	// รับจากฟอร์ม
	academicPosition := c.PostForm("academic_position")
	firstName := c.PostForm("first_name")
	lastName := c.PostForm("last_name")
	birthdayStr := c.PostForm("birthday")
	ageStr := c.PostForm("age") // ไม่คำนวณ ใช้ค่าฟอร์มอย่างเดียว
		bday, err := parseBirthday(birthdayStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid birthday format (use YYYY-MM-DD or RFC3339)"})
			return
		}

// ถ้าต้องการเก็บเป็น date-only ให้เซ็ตเวลาเป็นเที่ยงคืนโซนไทย
loc, _ := time.LoadLocation("Asia/Bangkok")
bday = time.Date(bday.Year(), bday.Month(), bday.Day(), 0, 0, 0, 0, loc)

	// เช็คฟิลด์จำเป็น
	if academicPosition == "" || firstName == "" || lastName == "" || birthdayStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: academic_position, first_name, last_name, birthday"})
		return
	}



	// พาร์ส age จากฟอร์ม (ไม่คำนวณ)
	ageInt := 0
	if ageStr != "" {
		n, err := strconv.Atoi(ageStr)
		if err != nil || n < 0 || n > 120 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid age"})
			return
		}
		ageInt = n
	}

	// IDs
	userID, err := mustUint(c, "user_id"); if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	addressID, err := mustUint(c, "address_id"); if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	genderID, err := mustUint(c, "gender_id"); if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	contactID, err := mustUint(c, "contact_id"); if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	universityID, err := mustUint(c, "university_id"); if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	facultyID, err := mustUint(c, "faculty_id"); if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	programID, err := mustUint(c, "program_id"); if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }

	// ตรวจความมีอยู่ของ FK (ถ้าไม่มี constraint)
	if err := checkExists(db, &entity.User{}, userID, "user_id"); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	if err := checkExists(db, &entity.Address{}, addressID, "address_id"); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	if err := checkExists(db, &entity.Gender{}, genderID, "gender_id"); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	if err := checkExists(db, &entity.Contact{}, contactID, "contact_id"); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	if err := checkExists(db, &entity.University{}, universityID, "university_id"); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	if err := checkExists(db, &entity.Faculty{}, facultyID, "faculty_id"); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	if err := checkExists(db, &entity.Program{}, programID, "program_id"); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }

	var created entity.AcademicStaff
	err = db.Transaction(func(tx *gorm.DB) error {
		staff := entity.AcademicStaff{
			AcademicPosition: academicPosition,
			FirstName:        firstName,
			LastName:         lastName,

			// เก็บเป็น string (ถ้า entity เป็น string)
			Birthday: bday, 
			Age:      ageInt,

			UserID:       userID,
			AddressID:    addressID,
			GenderID:     genderID,
			ContactID:    contactID,
			UniversityID: universityID,
			FacultyID:    facultyID,
			ProgramID:    programID,
		}
		if err := tx.Create(&staff).Error; err != nil { return err }

		return tx.Preload("User").
			Preload("Address").
			Preload("Admin").
			Preload("Gender").
			Preload("Contact").
			Preload("University").
			Preload("Faculty").
			Preload("Program").
			First(&created, staff.ID).Error
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create academic staff", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Academic staff created successfully", "data": created})
}
// helper: เช็คความมีอยู่ของ record
func checkExists(db *gorm.DB, model interface{}, id uint, field string) error {
	if err := db.First(model, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("%s not found", field)
		}
		return err
	}
	return nil
}

func CreateSendVerifyAcademicStaffy(c *gin.Context) {
	var verify entity.Verify

	userID := c.Param("user_id")
	// รับค่าจากฟอร์ม
	statusVerifyID := c.PostForm("status_verify_id")
	reason := c.PostForm("reason")

	// แปลง string เป็น uint
	statusID, err := strconv.ParseUint(statusVerifyID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status_verify_id"})
		return
	}
	uid, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	file, err := c.FormFile("verification_document")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาอัปโหลดเอกสาร"})
		return
	}

	// ✅ เปลี่ยนชื่อไฟล์ใหม่ให้ปลอดภัย
	ext := filepath.Ext(file.Filename)
	newFileName := fmt.Sprintf("verify_%d_%d%s", uid, time.Now().Unix(), ext)
	filePath := filepath.Join("public/uploads/verifyDocument/AcademicStaff", newFileName)
	filePath = strings.ReplaceAll(filePath, "\\", "/")

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไฟล์ได้"})
		return
	}
	// สร้าง Verify record
	verify = entity.Verify{
		VerificationDocument: filePath,
		Reason:               reason,
		StatusVerifyID:       uint(statusID),
		UserID:               uint(uid),
		AdminID:              nil,
	}

	if err := config.DB().Create(&verify).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": verify})
}

func UpdateAcademicStaff(c *gin.Context) {
	userID := c.Param("id")

	// 1) หา record จาก user_id
	var staff entity.AcademicStaff
	if err := config.DB().
		Where("user_id = ?", userID).
		First(&staff).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Academic staff not found with this user_id"})
		return
	}

	// 2) รับอินพุต JSON
	var input entity.AcademicStaff
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updateData := map[string]interface{}{}

	// 3) อัปเดตเฉพาะฟิลด์ที่เปลี่ยนจริง
	if v := strings.TrimSpace(input.AcademicPosition); v != "" && v != staff.AcademicPosition {
		updateData["academic_position"] = v
	}
	if v := strings.TrimSpace(input.FirstName); v != "" && v != staff.FirstName {
		updateData["first_name"] = v
	}
	if v := strings.TrimSpace(input.LastName); v != "" && v != staff.LastName {
		updateData["last_name"] = v
	}

	// วันเกิด + อายุ
	if !input.Birthday.IsZero() && !input.Birthday.Equal(staff.Birthday) {
		updateData["birthday"] = input.Birthday
		// ถ้าไม่ได้ส่งอายุมา จะคำนวณให้จากวันเกิด
		if input.Age == 0 {
			if age := calcAge(input.Birthday); age != staff.Age {
				updateData["age"] = age
			}
		}
	}
	// กรณีส่งอายุมาโดยตรง
	if input.Age != 0 && input.Age != staff.Age {
		updateData["age"] = input.Age
	}

	// FK ต่าง ๆ (ถ้าส่งมาและต่างจากเดิม)
	if input.UniversityID != 0 && input.UniversityID != staff.UniversityID {
		updateData["university_id"] = input.UniversityID
	}
	if input.FacultyID != 0 && input.FacultyID != staff.FacultyID {
		updateData["faculty_id"] = input.FacultyID
	}
	if input.ProgramID != 0 && input.ProgramID != staff.ProgramID {
		updateData["program_id"] = input.ProgramID
	}
	if input.AddressID != 0 && input.AddressID != staff.AddressID {
		updateData["address_id"] = input.AddressID
	}
	if input.AdminID != 0 && input.AdminID != staff.AdminID {
		updateData["admin_id"] = input.AdminID
	}
	if input.GenderID != 0 && input.GenderID != staff.GenderID {
		updateData["gender_id"] = input.GenderID
	}
	if input.ContactID != 0 && input.ContactID != staff.ContactID {
		updateData["contact_id"] = input.ContactID
	}

	// (โดยทั่วไปไม่ให้เปลี่ยน user_id ผ่าน endpoint นี้ จึงไม่รองรับ input.UserID)

	// 4) ถ้าไม่มีอะไรเปลี่ยน
	if len(updateData) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "ไม่มีข้อมูลที่เปลี่ยนแปลง"})
		return
	}

	// 5) อัปเดต
	if err := config.DB().Model(&staff).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update academic staff"})
		return
	}

	// 6) โหลดข้อมูลล่าสุด (พร้อม preload associations ถ้าต้องการ)
	if err := config.DB().
		Preload("User").
		Preload("Address").
		Preload("Admin").
		Preload("Gender").
		Preload("Contact").
		Preload("University").
		Preload("Faculty").
		Preload("Program").
		First(&staff, staff.ID).Error; err != nil {
		// preload ไม่สำคัญถึงขั้น fail ทั้งหมด ส่งข้อมูลหลักกลับไปก่อน
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Academic staff updated successfully",
		"data":    staff,
	})
}
type CurrentInternshipDTO struct {
	CompanyName  string     `json:"company_name"`
	Position     string     `json:"position"`
	ProvinceName string     `json:"province_name"`
	Status       string     `json:"status"`
}

type StudentForAdvisorDTO struct {
	ID          uint                  `json:"id"`
	FirstName   string                `json:"first_name"`
	LastName    string                `json:"last_name"`
	ProgramName string                `json:"program_name,omitempty"`
	FacultyName string                `json:"faculty_name,omitempty"`
	Year        *int                  `json:"year,omitempty"`
	GPA         *float64              `json:"gpa,omitempty"`
	AvatarURL   string                `json:"avatar_url,omitempty"`
	CurrentInt  *CurrentInternshipDTO `json:"current_internship,omitempty"`
}

type CompanySummaryItemDTO struct {
	CompanyID    uint                    `json:"company_id"`
	CompanyName  string                  `json:"company_name"`
	LogoURL      string                  `json:"logo_url,omitempty"`
	StudentCount int                     `json:"student_count"`
	Students     []StudentForAdvisorDTO  `json:"students"`
}

// ====== Handler: รายชื่อนักศึกษาที่ดูแล ======

func GetAdviseeStudents(c *gin.Context) {
	db := config.DB()
	userIDStr := c.Param("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid userId"})
		return
	}

	// 1) หา AcademicStaff จาก user_id
	var staff entity.AcademicStaff
	if err := db.Preload("University").Where("user_id = ?", userID).First(&staff).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{"students": []StudentForAdvisorDTO{}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if staff.ProgramID == 0 {
		// ถ้า staff ยังไม่ผูก Program ก็คืนว่างๆ ไปก่อน
		c.JSON(http.StatusOK, gin.H{"students": []StudentForAdvisorDTO{}})
		return
	}

	// 2) ดึง student_id ที่อยู่ในโปรแกรมเดียวกับ staff
	var eduRows []entity.Education
	if err := db.Select("DISTINCT student_id").
		Where("university_id = ?", staff.UniversityID).
		Find(&eduRows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(eduRows) == 0 {
		c.JSON(http.StatusOK, gin.H{"students": []StudentForAdvisorDTO{}})
		return
	}
	ids := make([]uint, 0, len(eduRows))
	seen := map[uint]bool{}
	for _, e := range eduRows {
		if !seen[e.StudentID] {
			seen[e.StudentID] = true
			ids = append(ids, e.StudentID)
		}
	}

	// 3) ดึง Student ชุดนั้น
	var students []entity.Student
	if err := db.
		Preload("User").
		Preload("User.ProfileImage").
		Where("id IN ?", ids).
		Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 4) สร้าง DTO
	out := make([]StudentForAdvisorDTO, 0, len(students))
	for _, s := range students {
		// 4.1) การศึกษาล่าสุด (สำหรับปี/เกรด/โปรแกรม/คณะ)
		var latestEdu entity.Education
		_ = db.
			Preload("Program").
			Preload("Faculty").
			Where("student_id = ?", s.ID).
			Order("year DESC, id DESC").
			First(&latestEdu).Error

		// 4.2) ใบสมัครล่าสุด (ใช้เป็น current internship)
		var latestApp entity.Application
		_ = db.
			Preload("IntershipPost").
			Preload("IntershipPost.Company").
			Where("student_id = ?", s.ID).
			Order("updated_at DESC, id DESC").
			First(&latestApp).Error

		// Map ค่าต่างๆ
		var yearPtr *int
		if latestEdu.ID != 0 {
			y := latestEdu.Year
			yearPtr = &y
		}
		var gpaPtr *float64
		if latestEdu.ID != 0 {
			g := latestEdu.Grade
			gpaPtr = &g
		}

		dto := StudentForAdvisorDTO{
			ID:          s.ID,
			FirstName:   s.FirstName,
			LastName:    s.LastName,
			ProgramName: "", // เผื่อไม่มีข้อมูล
			FacultyName: "",
			Year:        yearPtr,
			GPA:         gpaPtr,
			AvatarURL:   s.User.ProfileImage[0].ImageURL, // TODO: ใส่รูปจาก s.User.ProfileImage[0].image_url ถ้ามี
		}
		if latestEdu.ID != 0 && latestEdu.Program.ID != 0 {
			// TODO: ถ้า Program มีฟิลด์ชื่ออื่น เช่น NameTH ให้เปลี่ยน
			// dto.ProgramName = latestEdu.Program.Name
			dto.ProgramName = latestEdu.Program.NameTH
		}
		if latestEdu.ID != 0 && latestEdu.Faculty.ID != 0 {
			// TODO: เปลี่ยนฟิลด์ให้ตรง schema
			// dto.FacultyName = latestEdu.Faculty.Name
			dto.FacultyName = latestEdu.Faculty.NameTH
		}

		// current_internship
		if latestApp.ID != 0 && latestApp.IntershipPost.ID != 0 {
			companyName := ""
			logoURL := ""
			if latestApp.IntershipPost.Company.ID != 0 {
				// TODO: เปลี่ยน CompanyName / LogoURL ตาม schema จริง
				companyName = latestApp.IntershipPost.Company.CompanyName
				logoURL = latestApp.IntershipPost.Company.Logo
				_ = logoURL
			}
			position := latestApp.IntershipPost.PostName
			province := latestApp.IntershipPost.Province

			dto.CurrentInt = &CurrentInternshipDTO{
				CompanyName:  companyName,
				Position:     position,
				ProvinceName: province,
				Status:       latestApp.Status,
			}
		}

		out = append(out, dto)
	}

	c.JSON(http.StatusOK, gin.H{"students": out})
}


func GetAdviseeCompanySummary(c *gin.Context) {
	db := config.DB()
	userIDStr := c.Param("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid userId"})
		return
	}

	// ดึงนักศึกษาตาม ProgramID ของ staff (เหมือนฟังก์ชันบน)
	var staff entity.AcademicStaff
	if err := db.Preload("University").Where("user_id = ?", userID).First(&staff).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{"companies": []CompanySummaryItemDTO{}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if staff.ProgramID == 0 {
		c.JSON(http.StatusOK, gin.H{"companies": []CompanySummaryItemDTO{}})
		return
	}

	var eduRows []entity.Education
	if err := db.Select("DISTINCT student_id").
		Where("university_id = ?", staff.ProgramID).
		Find(&eduRows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(eduRows) == 0 {
		c.JSON(http.StatusOK, gin.H{"companies": []CompanySummaryItemDTO{}})
		return
	}
	ids := make([]uint, 0, len(eduRows))
	seen := map[uint]bool{}
	for _, e := range eduRows {
		if !seen[e.StudentID] {
			seen[e.StudentID] = true
			ids = append(ids, e.StudentID)
		}
	}

	// ดึงใบสมัครล่าสุดของแต่ละ student เพื่อหา "current internship"
	type pair struct {
		Student entity.Student
		App     entity.Application
	}
	rows := make([]pair, 0, len(ids))

	for _, sid := range ids {
		var s entity.Student
		if err := db.Preload("User").Preload("User.ProfileImage").First(&s, sid).Error; err != nil {
			continue
		}

		var app entity.Application
		_ = db.
			Preload("IntershipPost").
			Preload("IntershipPost.Company").
			Where("student_id = ?", s.ID).
			Order("updated_at DESC, id DESC").
			First(&app).Error

		// ถ้าไม่มี application เลย ข้าม (ไม่ได้ไปฝึก)
		if app.ID == 0 || app.IntershipPost.ID == 0 || app.IntershipPost.Company.ID == 0 {
			continue
		}

		rows = append(rows, pair{Student: s, App: app})
	}

	// Group by CompanyID
	type key struct {
		CompanyID uint
	}
	group := map[key]*CompanySummaryItemDTO{}

	for _, r := range rows {
		comp := r.App.IntershipPost.Company
		k := key{CompanyID: comp.ID}
		if _, ok := group[k]; !ok {
			item := &CompanySummaryItemDTO{
				CompanyID:   comp.ID,
				CompanyName: comp.CompanyName, // TODO: ปรับชื่อฟิลด์ถ้าไม่ตรง
				LogoURL:     comp.Logo,     // TODO: ปรับชื่อฟิลด์ถ้าไม่ตรง
				Students:    []StudentForAdvisorDTO{},
			}
			group[k] = item
		}

		// การศึกษาล่าสุด (สำหรับแสดงป้ายตำแหน่งใน expandedRow)
		var latestEdu entity.Education
		_ = db.Preload("Program").
			Where("student_id = ?", r.Student.ID).
			Order("year DESC, id DESC").
			First(&latestEdu).Error

		studentDTO := StudentForAdvisorDTO{
			ID:        r.Student.ID,
			FirstName: r.Student.FirstName,
			LastName:  r.Student.LastName,
			AvatarURL: r.Student.User.ProfileImage[0].ImageURL, // TODO: ใส่รูปจาก s.User.ProfileImage ถ้ามี
		}
		if latestEdu.ID != 0 && latestEdu.Program.ID != 0 {
			// TODO: ปรับชื่อฟิลด์
			// studentDTO.ProgramName = latestEdu.Program.Name
			studentDTO.ProgramName = latestEdu.Program.NameTH
		}

		studentDTO.CurrentInt = &CurrentInternshipDTO{
			CompanyName:  comp.CompanyName,
			Position:     r.App.IntershipPost.PostName,
			ProvinceName: r.App.IntershipPost.Province,
			Status:       r.App.Status,
		}

		group[k].Students = append(group[k].Students, studentDTO)
	}

	// สร้าง slice และเติม StudentCount
	out := make([]CompanySummaryItemDTO, 0, len(group))
	for _, v := range group {
		v.StudentCount = len(v.Students)
		out = append(out, *v)
	}

	c.JSON(http.StatusOK, gin.H{"companies": out})
}