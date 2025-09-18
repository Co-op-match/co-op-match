package config

import (
	"encoding/csv"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var db *gorm.DB

func DB() *gorm.DB { return db }

func ConnectionDB() {
	database, err := gorm.Open(sqlite.Open("co-op-match.db?_busy_timeout=5000&cache=shared&_journal_mode=WAL"), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	sqlDB, _ := database.DB()
	// ปรับ PRAGMA เพื่อความเร็ว/ความปลอดภัยที่เหมาะกับ seed
	if _, err := sqlDB.Exec(`PRAGMA foreign_keys = ON;`); err != nil {
		log.Println("warn: set foreign_keys pragma:", err)
	}
	db = database
	fmt.Println("✅ connected database")
}

func SetupDatabase() {
	// Migrate เฉพาะ Entity ที่จำเป็น (ลบ Provinces ซ้ำ)
	if err := db.AutoMigrate(
		&entity.Role{},
		&entity.PasswordResetToken{},
		&entity.User{},
		&entity.Gender{},
		&entity.LikedPost{},
		&entity.Address{},
		&entity.Admin{},
		&entity.Student{},
		&entity.Education{},
		&entity.Skill{},
		&entity.StudentSkill{},
		&entity.Interest{},
		&entity.StudentInterest{},
		&entity.Company{},
		&entity.Contact{},
		&entity.StatusPost{},
		&entity.IntershipPost{},
		&entity.CompanyRequiredSkill{},
		&entity.Benefit{},
		&entity.WorkMode{},
		&entity.JobType{},
		&entity.Stipend{},
		&entity.WorkDay{},
		&entity.Application{},
		&entity.Article{},
		&entity.ApplicationDetails{},
		&entity.JobMatch{},
		&entity.Review{},
		&entity.AcademicStaff{},
		&entity.ChatRoom{},
		&entity.ChatMessage{},
		&entity.NotificationsType{},
		&entity.Notification{},
		&entity.ProfileImage{},
		&entity.InterviewAppointment{},
		&entity.University{},
		&entity.Program{},
		&entity.Faculty{},
		&entity.EducationLevel{},
		&entity.Verify{},
		&entity.Provinces{},
		&entity.District{},
		&entity.SubDistrict{},
		&entity.Postcode{},
		&entity.StatusVerify{},
		&entity.Tag{},
		&entity.ReviewLike{},
		&entity.LoginLog{},
		&entity.ReviewAnalysis{},
	); err != nil {
		log.Fatalf("auto-migrate error: %v", err)
	}

	createSeedData(db)

	// ✅ โหลด master จาก CSV (ทำให้ fail เป็น soft error — log แล้วไปต่อ)
	insertEducationFromCSV(db, "./config/data/university_2567.csv")
	ImportProvincesCSV(db, "./config/data/address/provinces.csv")
	ImportDistrictsCSV(db, "./config/data/address/districts.csv")
	ImportPostcodesCSV(db, "./config/data/address/postcode.csv")
	ImportSubDistrictsCSV(db, "./config/data/address/subdistricts.csv")
}

func createSeedData(db *gorm.DB) {
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("panic recovered in seed: %+v", r)
		}
	}()

	// ---------- Roles ----------
	roles := []entity.Role{
		{RoleName: "Admin", RoleNameTH: "แอดมิน"},
		{RoleName: "Company", RoleNameTH: "บริษัท"},
		{RoleName: "Student", RoleNameTH: "นักศึกษา"},
		{RoleName: "AcademicStaff", RoleNameTH: "อาจารย์"},
	}
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "role_name"}}, DoNothing: true}).Create(&roles)

	// ---------- Genders ----------
	genders := []entity.Gender{
		{Name: "Male", NameTH: "ชาย"},
		{Name: "Female", NameTH: "หญิง"},
	}
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "name"}}, DoNothing: true}).Create(&genders)

	// ---------- Users (แก้คอมเมนต์ค้าง และให้รันซ้ำได้) ----------
	hashedPassword, _ := HashPassword("123456")
	users := []entity.User{
		{Email: "a@example.com", Password: hashedPassword, RoleID: 1, IsActive: true},
		{Email: "c@example.com", Password: hashedPassword, RoleID: 2, IsActive: true},
		{Email: "jetsadaphon31852@gmail.com", Password: hashedPassword, RoleID: 3, IsActive: true},
		{Email: "tn@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},

		{Email: "a2@example.com", Password: hashedPassword, RoleID: 1, IsActive: true},

		{Email: "c2@example.com", Password: hashedPassword, RoleID: 2, IsActive: true},
		{Email: "c3@example.com", Password: hashedPassword, RoleID: 2, IsActive: true},
		{Email: "c4@example.com", Password: hashedPassword, RoleID: 2, IsActive: true},
		{Email: "c5@example.com", Password: hashedPassword, RoleID: 2, IsActive: true},

		{Email: "s2@example.com", Password: hashedPassword, RoleID: 3, IsActive: true},
		{Email: "s3@example.com", Password: hashedPassword, RoleID: 3, IsActive: true},
		{Email: "s4@example.com", Password: hashedPassword, RoleID: 3, IsActive: true},
		{Email: "b6526542@g.sut.ac.th", Password: hashedPassword, RoleID: 3, IsActive: true},

		{Email: "tn2@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
		{Email: "tn3@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
		{Email: "tn4@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
		{Email: "tn5@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
	}
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "email"}}, DoNothing: true}).Create(&users)

	// ---------- Profile Images ----------
	profileImages := []entity.ProfileImage{
		{ImageURL: "/uploads/admin-profile.png", UserID: 1},
		{ImageURL: "/uploads/admin-profile.png", UserID: 2},
	}
	for _, pi := range profileImages {
		tx.FirstOrCreate(&pi, entity.ProfileImage{UserID: pi.UserID})
	}

	// ---------- Job Types / Work Modes / Work Days / Stipends / Benefits ----------
	jobTypes := []entity.JobType{
		{JobType: "เทคโนโลยีสารสนเทศ/คอมพิวเตอร์"},
		{JobType: "บัญชี/การเงิน"},
		{JobType: "การตลาด/ธุรกิจ/การจัดการ"},
		{JobType: "นิเทศศาสตร์/ออกแบบ/กราฟิก"},
		{JobType: "วิศวกรรม"},
		{JobType: "ครุศาสตร์/การศึกษา"},
		{JobType: "ศิลปศาสตร์/ภาษา/แปล"},
		{JobType: "สาธารณสุข/พยาบาล/เภสัช"},
	}
	workModes := []entity.WorkMode{{WorkMode: "On-site"}, {WorkMode: "Remote"}, {WorkMode: "Hybrid"}}
	workDays := []entity.WorkDay{{WorkDay: "จันทร์ - ศุกร์"}, {WorkDay: "จันทร์ - เสาร์"}, {WorkDay: "บริษัทกำหนดเอง"}}
	stipends := []entity.Stipend{
		{Stipend: "ไม่กำหนด"}, {Stipend: "ตามความสามารถนักศึกษา"},
		{Stipend: "5,000 - 10,000 THB"}, {Stipend: "10,000 - 15,000 THB"}, {Stipend: "15,000+ THB"},
	}
	benefits := []entity.Benefit{{Benefit: "ค่าเดินทาง"}, {Benefit: "อาหาร"}, {Benefit: "ค่าล่วงเวลา"}, {Benefit: "ที่พัก"}}

	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "job_type"}}, DoNothing: true}).Create(&jobTypes)
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "work_mode"}}, DoNothing: true}).Create(&workModes)
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "work_day"}}, DoNothing: true}).Create(&workDays)
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "stipend"}}, DoNothing: true}).Create(&stipends)
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "benefit"}}, DoNothing: true}).Create(&benefits)

	// ---------- Status Posts ----------
	statusPosts := []entity.StatusPost{
		{StatusPost: "Open", StatusPostTH: "เปิดรับสมัคร"},
		{StatusPost: "Closed", StatusPostTH: "ปิดรับสมัคร"},
		{StatusPost: "Pending Approval", StatusPostTH: "รอตรวจสอบ"},
	}
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "status_post"}}, DoNothing: true}).Create(&statusPosts)

	// ---------- Skills / Interests ----------
	skills := []entity.Skill{
		{SkillName: "Python"}, {SkillName: "Java"}, {SkillName: "JavaScript"}, {SkillName: "SQL"}, {SkillName: "Data Analysis"},
	}
	interests := []entity.Interest{
		{InterestName: "Web Development"}, {InterestName: "Mobile Development"},
		{InterestName: "Data Science"}, {InterestName: "AI/ML"},
	}
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "skill_name"}}, DoNothing: true}).Create(&skills)
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "interest_name"}}, DoNothing: true}).Create(&interests)

	// ---------- Education Levels ----------
	educationLevels := []entity.EducationLevel{
		{Name: "ปริญญาตรี"}, {Name: "ปริญญาโท"}, {Name: "ปริญญาเอก"},
	}
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "name"}}, DoNothing: true}).Create(&educationLevels)

	// ---------- Notification Types ----------
	notificationTypes := []entity.NotificationsType{
		{Name: "interview", Label: "คุณมีนัดสัมภาษณ์กับบริษัท {{.company}} เวลา {{.time}}"},
		{Name: "match", Label: "คุณได้รับการแมทช์กับ {{.partner}}"},
		{Name: "chat", Label: "คุณได้รับข้อความใหม่จาก {{.sender}}"},
	}
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "name"}}, DoNothing: true}).Create(&notificationTypes)

	// ---------- Status Verify ----------
	statusVerifies := []entity.StatusVerify{
		{StatusVerify: "ยังไม่ได้ส่งคำขอ"},
		{StatusVerify: "รอรับรอง"},
		{StatusVerify: "รับรอง"},
		{StatusVerify: "ปฏิเสธ"},
	}
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "status_verify"}}, DoNothing: true}).Create(&statusVerifies)

	// ---------- Review Tags ----------
	tags := []entity.Tag{
		{Name: "บรรยากาศดี"}, {Name: "งานท้าทาย"}, {Name: "พี่ๆใจดี"}, {Name: "ได้ลงมือทำจริง"},
		{Name: "สนับสนุนดี"}, {Name: "เหมาะกับมือใหม่"}, {Name: "ได้เรียนรู้หลากหลาย"}, {Name: "ได้ทำโปรเจกต์จริง"},
	}
	tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "name"}}, DoNothing: true}).Create(&tags)

	// ---------- Admin (แก้บั๊ก: ต้อง FirstOrCreate เป็น Admin ไม่ใช่ AcademicStaff) ----------
	admins := []entity.Admin{
		{FirstName: "สมชาย", LastName: "แอดมิน", Birthday: time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC), UserID: 1},
		{FirstName: "อรพิน", LastName: "ดูแลระบบ", Birthday: time.Date(1985, 6, 15, 0, 0, 0, 0, time.UTC), UserID: 2},
	}
	for _, a := range admins {
		tx.Unscoped().FirstOrCreate(&a, entity.Admin{UserID: a.UserID})
	}

	// ---------- Ensure Verify exists for ALL users ----------
	var allUsers []entity.User
	if err := tx.Find(&allUsers).Error; err == nil {
		for _, u := range allUsers {
			v := entity.Verify{
				UserID:         u.ID,
				StatusVerifyID: 1, // "ยังไม่ได้ส่งคำขอ"
				Reason:         "",
			}
			tx.FirstOrCreate(&v, entity.Verify{UserID: u.ID})
		}
	} else {
		log.Println("warn: cannot enumerate users for verify:", err)
	}

	if err := tx.Commit().Error; err != nil {
		log.Fatalf("seed commit error: %v", err)
	}
}

// ====================== CSV LOADERS ======================

type RawEducationData struct {
	University string
	Faculty    string
	Program    string
	Level      string
}

func insertEducationFromCSV(db *gorm.DB, filePath string) {
	records, header, err := readCSVWithHeader(filePath)
	if err != nil {
		log.Println("❌ Education CSV:", err)
		return
	}
	if len(records) == 0 {
		log.Println("⚠️ Education CSV ไม่มีข้อมูล")
		return
	}

	col := mapCols(header)
	required := []string{"UNIV_NAME_TH", "FAC_NAME", "PROGRAM_NAME", "LEV_NAME_ENG"}
	if err := ensureCols(col, required...); err != nil {
		log.Println("❌ Education CSV:", err)
		return
	}

	// กรองเฉพาะ ป.ตรี/โท/เอก
	validLevels := map[string]bool{"ป.ตรี": true, "ป.โท": true, "ป.เอก": true}

	var raw []RawEducationData
	for _, row := range records {
		level := safe(row, col["LEV_NAME_ENG"])
		if !validLevels[level] {
			continue
		}
		raw = append(raw, RawEducationData{
			University: safe(row, col["UNIV_NAME_TH"]),
			Faculty:    safe(row, col["FAC_NAME"]),
			Program:    safe(row, col["PROGRAM_NAME"]),
			Level:      level,
		})
	}
	if len(raw) == 0 {
		log.Println("⚠️ Education CSV: ไม่พบระดับที่ต้องการ")
		return
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	univMap := map[string]uint{}
	facultyMap := map[string]uint{}

	for _, item := range raw {
		// University
		if _, ok := univMap[item.University]; !ok {
			u := entity.University{NameTH: item.University}
			tx.FirstOrCreate(&u, entity.University{NameTH: item.University})
			univMap[item.University] = u.ID
		}
		// Faculty
		key := item.University + "|" + item.Faculty
		if _, ok := facultyMap[key]; !ok {
			f := entity.Faculty{NameTH: item.Faculty, UniversityID: univMap[item.University]}
			tx.FirstOrCreate(&f, entity.Faculty{NameTH: item.Faculty, UniversityID: univMap[item.University]})
			facultyMap[key] = f.ID
		}
		// Program
		p := entity.Program{NameTH: item.Program, FacultyID: facultyMap[key]}
		tx.FirstOrCreate(&p, entity.Program{NameTH: item.Program, FacultyID: facultyMap[key]})
	}

	if err := tx.Commit().Error; err != nil {
		log.Println("❌ commit education csv:", err)
		return
	}
	log.Printf("✅ นำเข้าข้อมูล ป.ตรี/โท/เอก: %d แถว\n", len(raw))
}

func ImportProvincesCSV(db *gorm.DB, filePath string) {
	records, header, err := readCSVWithHeader(filePath)
	if err != nil {
		log.Println("❌ Provinces CSV:", err)
		return
	}
	col := mapCols(header)
	need := []string{"id", "name_th", "name_en"}
	if err := ensureCols(col, need...); err != nil {
		log.Println("❌ Provinces header:", err)
		return
	}

	for _, row := range records {
		p := entity.Provinces{
			NameTH: safe(row, col["name_th"]),
			NameEN: safe(row, col["name_en"]),
		}
		if p.NameTH == "" {
			continue
		}
		db.Where("name_th = ?", p.NameTH).FirstOrCreate(&p)
	}
	log.Println("✅ Provinces imported")
}

func ImportDistrictsCSV(db *gorm.DB, filePath string) {
	records, header, err := readCSVWithHeader(filePath)
	if err != nil {
		log.Println("❌ Districts CSV:", err)
		return
	}
	col := mapCols(header)
	need := []string{"id", "province_id", "name_th", "name_en"}
	if err := ensureCols(col, need...); err != nil {
		log.Println("❌ Districts header:", err)
		return
	}

	for _, row := range records {
		pid, _ := strconv.Atoi(safe(row, col["province_id"]))
		d := entity.District{
			NameTH:     safe(row, col["name_th"]),
			NameEN:     safe(row, col["name_en"]),
			ProvinceID: uint(pid),
		}
		if d.NameTH == "" || d.ProvinceID == 0 {
			continue
		}
		db.FirstOrCreate(&d, entity.District{NameTH: d.NameTH, ProvinceID: d.ProvinceID})
	}
	log.Println("✅ Districts imported")
}

func ImportPostcodesCSV(db *gorm.DB, filePath string) {
	records, header, err := readCSVWithHeader(filePath)
	if err != nil {
		log.Println("❌ Postcodes CSV:", err)
		return
	}
	col := mapCols(header)
	need := []string{"id", "postcode"}
	if err := ensureCols(col, need...); err != nil {
		log.Println("❌ Postcodes header:", err)
		return
	}

	for _, row := range records {
		pc := entity.Postcode{Postcode: safe(row, col["postcode"])}
		if pc.Postcode == "" {
			continue
		}
		db.FirstOrCreate(&pc, entity.Postcode{Postcode: pc.Postcode})
	}
	log.Println("✅ Postcodes imported")
}

func ImportSubDistrictsCSV(db *gorm.DB, filePath string) {
	records, header, err := readCSVWithHeader(filePath)
	if err != nil {
		log.Println("❌ Subdistricts CSV:", err)
		return
	}
	col := mapCols(header)
	need := []string{"id", "district_id", "name_th", "name_en", "postcode_id"}
	if err := ensureCols(col, need...); err != nil {
		log.Println("❌ Subdistricts header:", err)
		return
	}

	for _, row := range records {
		did, _ := strconv.Atoi(safe(row, col["district_id"]))
		pcid, _ := strconv.Atoi(safe(row, col["postcode_id"]))
		sd := entity.SubDistrict{
			NameTH:     safe(row, col["name_th"]),
			NameEN:     safe(row, col["name_en"]),
			DistrictID: uint(did),
			PostcodeID: uint(pcid),
		}
		if sd.NameTH == "" || sd.DistrictID == 0 {
			continue
		}
		db.FirstOrCreate(&sd, entity.SubDistrict{NameTH: sd.NameTH, DistrictID: sd.DistrictID})
	}
	log.Println("✅ SubDistricts imported")
}

// ====================== CSV HELPERS ======================

func readCSVWithHeader(path string) (records [][]string, header []string, err error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, nil, fmt.Errorf("open: %w", err)
	}
	defer f.Close()
	r := csv.NewReader(f)
	r.FieldsPerRecord = -1

	all, err := r.ReadAll()
	if err != nil {
		return nil, nil, fmt.Errorf("read: %w", err)
	}
	if len(all) < 1 {
		return nil, nil, errors.New("empty csv")
	}
	header = all[0]
	records = all[1:]
	return records, header, nil
}

func mapCols(header []string) map[string]int {
	m := map[string]int{}
	for i, h := range header {
		m[h] = i
	}
	return m
}
func ensureCols(m map[string]int, cols ...string) error {
	for _, c := range cols {
		if _, ok := m[c]; !ok {
			return fmt.Errorf("missing column: %s", c)
		}
	}
	return nil
}
func safe(row []string, idx int) string {
	if idx < 0 || idx >= len(row) {
		return ""
	}
	return row[idx]
}
