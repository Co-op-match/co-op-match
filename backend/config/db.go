package config

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB { return db }

func ConnectionDB() {
	database, err := gorm.Open(sqlite.Open("co-op-match.db?cache=shared"), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	fmt.Println("connected database")
	db = database
}

func SetupDatabase() {
	// ✅ กันปัญหา SQLite: ADD COLUMN NOT NULL (สำหรับกรณี Article มี AdminID ภายหลัง)
	if err := preAddArticleAdminID(db); err != nil {
		log.Fatalf("pre-migration (articles.admin_id) failed: %v", err)
	}

	// Migrate เฉพาะ Entity ที่ระบุ (ลบ Provinces ซ้ำ)
	db.AutoMigrate(
		&entity.Role{},
		&entity.PasswordResetToken{},
		&entity.User{},
		&entity.Gender{},
		&entity.Provinces{},
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
		&entity.District{},
		&entity.SubDistrict{},
		&entity.Postcode{},
		&entity.StatusVerify{},
		&entity.Tag{},
		&entity.ReviewLike{},
		&entity.LoginLog{},
		&entity.ReviewAnalysis{},
	)

	createSeedData(db)

	// โหลด master จาก CSV
	insertEducationFromCSV(db, "./config/data/university_2567.csv")
	ImportProvincesCSV(db, "./config/data/address/provinces.csv")
	ImportDistrictsCSV(db, "./config/data/address/districts.csv")
	ImportPostcodesCSV(db, "./config/data/address/postcode.csv")
	ImportSubDistrictsCSV(db, "./config/data/address/subdistricts.csv")
}

// ---------- PRE-MIGRATION: articles.admin_id ----------
func preAddArticleAdminID(db *gorm.DB) error {
	// ถ้ายังไม่มีตาราง articles ให้ AutoMigrate จัดการเอง
	if !db.Migrator().HasTable(&entity.Article{}) {
		return nil
	}
	// ถ้ามีคอลัมน์แล้ว ข้าม
	if db.Migrator().HasColumn(&entity.Article{}, "admin_id") {
		return nil
	}
	// เพิ่มคอลัมน์ด้วย DEFAULT (ห้าม NOT NULL ตรงนี้)
	if err := db.Exec(`ALTER TABLE articles ADD COLUMN admin_id INTEGER DEFAULT 1`).Error; err != nil {
		return err
	}
	// อัปเดตค่าที่เป็น NULL ให้ไม่เป็น NULL
	if err := db.Exec(`UPDATE articles SET admin_id = 1 WHERE admin_id IS NULL`).Error; err != nil {
		return err
	}
	return nil
}

func createSeedData(db *gorm.DB) {
	// สร้าง Role
	roles := []entity.Role{
		{RoleName: "Admin", RoleNameTH: "แอดมิน"},
		{RoleName: "Company", RoleNameTH: "บริษัท"},
		{RoleName: "Student", RoleNameTH: "นักเรียน"},
		{RoleName: "AcademicStaff", RoleNameTH: "อาจารย์"},
	}
	for _, role := range roles {
		db.FirstOrCreate(&role, entity.Role{RoleName: role.RoleName})
	}

	// สร้าง Gender
	genders := []entity.Gender{
		{Name: "Male", NameTH: "ชาย"},
		{Name: "Female", NameTH: "หญิง"},
	}
	for _, gender := range genders {
		db.FirstOrCreate(&gender, entity.Gender{Name: gender.Name})
	}

	// Seed Contact Information
	contacts := []entity.Contact{
		{PhoneNumber: "02-123-4567", Email: "contact@university.ac.th", Website: "https://www.university.ac.th", Line: "@university", Facebook: "UniversityPage"},
		{PhoneNumber: "02-234-5678", Email: "info@alphatech.co.th", Website: "https://www.alphatech.co.th", Line: "@alphatech", Facebook: "AlphaTechPage"},
		{PhoneNumber: "02-345-6789", Email: "hr@betasolutions.co.th", Website: "https://www.betasolutions.co.th", Line: "@betasol", Facebook: "BetaSolutionsPage"},
		{PhoneNumber: "02-456-7890", Email: "contact@gamma.co.th", Website: "https://www.gamma.co.th", Line: "@gamma", Facebook: "GammaInnovationsPage"},
		{PhoneNumber: "02-567-8901", Email: "info@deltasoftware.co.th", Website: "https://www.deltasoftware.co.th", Line: "@delta", Facebook: "DeltaSoftwarePage"},
		{PhoneNumber: "02-678-9012", Email: "contact@epsilon.co.th", Website: "https://www.epsilon.co.th", Line: "@epsilon", Facebook: "EpsilonSystemsPage"},
	}
	for _, contact := range contacts {
		db.FirstOrCreate(&contact, entity.Contact{Email: contact.Email})
	}

	// ผู้ใช้ (User)
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
	for _, u := range users {
		db.Unscoped().FirstOrCreate(&u, entity.User{Email: u.Email})
	}

	// Seed Profile Images
	profileImages := []entity.ProfileImage{
		{ImageURL: "/uploads/admin-profile.png", UserID: 1},
		{ImageURL: "/uploads/admin-profile.png", UserID: 2},
		{ImageURL: "/uploads/admin-profile.png", UserID: 6},
		{ImageURL: "/uploads/admin-profile.png", UserID: 10},
		{ImageURL: "/uploads/admin-profile.png", UserID: 11},
		{ImageURL: "/uploads/admin-profile.png", UserID: 12},
		{ImageURL: "/uploads/admin-profile.png", UserID: 13},
		{ImageURL: "/uploads/admin-profile.png", UserID: 4},
		{ImageURL: "/uploads/admin-profile.png", UserID: 14},
		{ImageURL: "/uploads/admin-profile.png", UserID: 15},
		{ImageURL: "/uploads/admin-profile.png", UserID: 16},
		{ImageURL: "/uploads/admin-profile.png", UserID: 17},
		{ImageURL: "/uploads/admin-profile.png", UserID: 18},
	}
	for _, pi := range profileImages {
		db.FirstOrCreate(&pi, entity.ProfileImage{UserID: pi.UserID})
	}
	seedStudents(db)
	// Seed Job Types
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
	for _, jt := range jobTypes {
		db.FirstOrCreate(&jt, entity.JobType{JobType: jt.JobType})
	}

	// Seed Work Modes
	workModes := []entity.WorkMode{
		{WorkMode: "On-site"},
		{WorkMode: "Remote"},
		{WorkMode: "Hybrid"},
	}
	for _, wm := range workModes {
		db.FirstOrCreate(&wm, entity.WorkMode{WorkMode: wm.WorkMode})
	}

	// Seed Work Days
	workDays := []entity.WorkDay{
		{WorkDay: "จันทร์ - ศุกร์"},
		{WorkDay: "จันทร์ - เสาร์"},
		{WorkDay: "บริษัทกำหนดเอง"},
	}
	for _, wd := range workDays {
		db.FirstOrCreate(&wd, entity.WorkDay{WorkDay: wd.WorkDay})
	}

	// Seed Stipends
	stipends := []entity.Stipend{
		{Stipend: "ไม่กำหนด"},
		{Stipend: "ตามความสามารถนักศึกษา"},
		{Stipend: "5,000 - 10,000 THB"},
		{Stipend: "10,000 - 15,000 THB"},
		{Stipend: "15,000+ THB"},
	}
	for _, sp := range stipends {
		db.FirstOrCreate(&sp, entity.Stipend{Stipend: sp.Stipend})
	}

	// สิทธิประโยชน์ (Benefit)
	benefits := []entity.Benefit{
		{Benefit: "ค่าเดินทาง"},
		{Benefit: "อาหาร"},
		{Benefit: "ค่าล่วงเวลา"},
		{Benefit: "ที่พัก"},
	}
	for _, b := range benefits {
		db.FirstOrCreate(&b, entity.Benefit{Benefit: b.Benefit})
	}

	// Seed Status Posts
	statusPosts := []entity.StatusPost{
		{StatusPost: "Open", StatusPostTH: "เปิดรับสมัคร"},
		{StatusPost: "Closed", StatusPostTH: "ปิดรับสมัคร"},
		{StatusPost: "Pending Approval", StatusPostTH: "รอตรวจสอบ"},
	}
	for _, s := range statusPosts {
		db.FirstOrCreate(&s, entity.StatusPost{StatusPost: s.StatusPost})
	}

	// ---------- แอดมิน (Admin) — แก้ให้ FirstOrCreate กับ Admin ----------
	admins := []entity.Admin{
		{FirstName: "สมชาย", LastName: "แอดมิน", Birthday: time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC), UserID: 1},
		{FirstName: "อรพิน", LastName: "ดูแลระบบ", Birthday: time.Date(1985, 6, 15, 0, 0, 0, 0, time.UTC), UserID: 2},
	}
	for _, admin := range admins {
		db.Unscoped().FirstOrCreate(&admin, entity.Admin{UserID: admin.UserID})
	}
	addresses := []entity.Address{
		{HouseNumber: "123", Village: "หมู่บ้าน ABC", Street: "ถนนหลัก", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "456", Village: "หมู่บ้าน XYZ", Street: "ถนนรอง", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "789", Village: "หมู่บ้าน QWE", Street: "ถนนใหญ่", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "101", Village: "หมู่บ้าน ASD", Street: "ถนนซอย", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "256", Village: "หมู่บ้าน EFG", Street: "ถนนหลัก", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "452", Village: "หมู่บ้าน FRT", Street: "ถนนรอง", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "198", Village: "หมู่บ้าน GLR", Street: "ถนนใหญ่", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "257", Village: "หมู่บ้าน HTE", Street: "ถนนหลัก", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "258", Village: "หมู่บ้าน ITY", Street: "ถนนรอง", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "147", Village: "หมู่บ้าน JFT", Street: "ถนนหลัก", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "369", Village: "หมู่บ้าน KNM", Street: "ถนนซอย", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "987", Village: "หมู่บ้าน LPD", Street: "ถนนรอง", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "654", Village: "หมู่บ้าน MNO", Street: "ถนนซอย", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "321", Village: "หมู่บ้าน NRE", Street: "ถนนหลัก", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
		{HouseNumber: "159", Village: "หมู่บ้าน OWN", Street: "ถนนใหญ่", SubStreet: "ซอยรอง", SubDistrictID: 1, DistrictID: 1, ProvinceID: 1, PostcodeID: 1},
	}
	for _, addr := range addresses {
		db.FirstOrCreate(&addr, entity.Address{
			HouseNumber:   addr.HouseNumber,
			Village:       addr.Village,
			Street:        addr.Street,
			SubStreet:     addr.SubStreet,
			SubDistrictID: addr.SubDistrictID,
			DistrictID:    addr.DistrictID,
			ProvinceID:    addr.ProvinceID,
			PostcodeID:    addr.PostcodeID,
		})
	}
	staffs := []entity.AcademicStaff{
		{
			AcademicPosition: "อาจารย์", Age: 40,
			FirstName: "สมชาย", LastName: "วิศวกร",
			Birthday: time.Date(1985, 1, 15, 0, 0, 0, 0, time.UTC),
			UserID:   4, AddressID: 1, GenderID: 1,
			UniversityID: 1, FacultyID: 1, ProgramID: 1, ContactID: 1,
		},
		{
			AcademicPosition: "อาจารย์", Age: 38,
			FirstName: "สุรีย์", LastName: "เคมี",
			Birthday: time.Date(1987, 3, 10, 0, 0, 0, 0, time.UTC),
			UserID:   14, AddressID: 2, GenderID: 2,
			UniversityID: 1, FacultyID: 1, ProgramID: 1, ContactID: 1,
		},
		{
			AcademicPosition: "ผู้ช่วยศาสตราจารย์", Age: 45,
			FirstName: "สมพงษ์", LastName: "การตลาด",
			Birthday: time.Date(1980, 6, 5, 0, 0, 0, 0, time.UTC),
			UserID:   15, AddressID: 3, GenderID: 1,
			UniversityID: 1, FacultyID: 1, ProgramID: 1, ContactID: 1,
		},
		{
			AcademicPosition: "รองศาสตราจารย์", Age: 50,
			FirstName: "อรทัย", LastName: "ภาษา",
			Birthday: time.Date(1975, 11, 22, 0, 0, 0, 0, time.UTC),
			UserID:   16, AddressID: 4, GenderID: 2,
			UniversityID: 1, FacultyID: 1, ProgramID: 1, ContactID: 1,
		},
		{
			AcademicPosition: "อาจารย์", Age: 35,
			FirstName: "ธนพล", LastName: "นิติ",
			Birthday: time.Date(1990, 9, 30, 0, 0, 0, 0, time.UTC),
			UserID:   17, AddressID: 5, GenderID: 1,
			UniversityID: 1, FacultyID: 1, ProgramID: 1, ContactID: 1,
		},
	}

	for _, s := range staffs {
		// ถ้ามีอยู่แล้วตาม UserID ก็ไม่สร้างซ้ำ
		db.Unscoped().
			Where(entity.AcademicStaff{UserID: s.UserID}).
			Assign(s). // ถ้าอยากอัปเดตค่าอื่นด้วยให้ใส่ Assign
			FirstOrCreate(&entity.AcademicStaff{})
	}
	eds := []entity.Education{
		{UniversityID: 1, FacultyID: 1, ProgramID: 1, Year: 3, EducationLevelID: 1, Grade: 3.5, StudentID: 1},
		{UniversityID: 1, FacultyID: 1, ProgramID: 1, Year: 3, EducationLevelID: 1, Grade: 3.2, StudentID: 2},
		{UniversityID: 1, FacultyID: 1, ProgramID: 1, Year: 2, EducationLevelID: 1, Grade: 3.6, StudentID: 3},
		{UniversityID: 1, FacultyID: 1, ProgramID: 1, Year: 2, EducationLevelID: 1, Grade: 3.4, StudentID: 4},
		{UniversityID: 1, FacultyID: 1, ProgramID: 1, Year: 4, EducationLevelID: 1, Grade: 3.3, StudentID: 5},
	}
	for _, e := range eds {
		db.FirstOrCreate(&e, entity.Education{
			StudentID: e.StudentID,
			ProgramID: e.ProgramID,
			Year:      e.Year,
		})
	}
	companies := []entity.Company{
		{CompanyName: "Alpha Tech Co., Ltd.", Logo: "/uploads/companyLogo/a.png", AddressID: 2, ContactID: 1, UserID: 2},
		{CompanyName: "Beta Solutions Co., Ltd.", Logo: "/uploads/companyLogo/b.png", AddressID: 2, ContactID: 1, UserID: 6},
		{CompanyName: "Camma Innovations Co., Ltd.", Logo: "/uploads/companyLogo/c.png", AddressID: 2, ContactID: 1, UserID: 7},
		{CompanyName: "Delta Software Co., Ltd.", Logo: "/uploads/companyLogo/d.png", AddressID: 2, ContactID: 1, UserID: 8},
		{CompanyName: "Epsilon Systems Co., Ltd.", Logo: "/uploads/companyLogo/e.png", AddressID: 2, ContactID: 1, UserID: 9},
	}
	for _, c := range companies {
		// งด AddressID เพื่อกันพังถ้าไม่มี address seed
		db.Unscoped().FirstOrCreate(&c, entity.Company{UserID: c.UserID})
	}

	intershipPosts := []entity.IntershipPost{
		{
			PostName:        "Software Development Intern",
			PostDescription: "Join our team as a software development intern",
			Quantity:        2,
			MinGpa:          2.0,
			CreatedAt:       time.Now(),
			CompanyID:       1,
			StatusPostID:    1,
			AdminID:         1,
			WorkModeID:      1,
			WorkDayID:       1,
			StipendID:       2,
			JobTypeID:       1,
		},
		{
			PostName:        "Data Science Intern",
			PostDescription: "Opportunity to work with real-world datasets",
			Quantity:        1,
			MinGpa:          2.2,
			CreatedAt:       time.Now(),
			CompanyID:       2,
			StatusPostID:    1,
			AdminID:         1,
			WorkModeID:      2,
			WorkDayID:       2,
			StipendID:       3,
			JobTypeID:       4,
		},
		{
			PostName:        "AI/ML Intern",
			PostDescription: "Explore artificial intelligence projects",
			Quantity:        1,
			MinGpa:          2.5,
			CreatedAt:       time.Now(),
			CompanyID:       3,
			StatusPostID:    1,
			AdminID:         1,
			WorkModeID:      1,
			WorkDayID:       3,
			StipendID:       2,
			JobTypeID:       4,
		},
		{
			PostName:        "Frontend Developer Intern",
			PostDescription: "Build beautiful UIs with React",
			Quantity:        1,
			MinGpa:          2.8,
			CreatedAt:       time.Now(),
			CompanyID:       4,
			StatusPostID:    1,
			AdminID:         1,
			WorkModeID:      1,
			WorkDayID:       1,
			StipendID:       2,
			JobTypeID:       1,
		},
		{
			PostName:        "Frontend Developer Intern",
			PostDescription: "พัฒนา UI ด้วย React และ Ant Design",
			Quantity:        2,
			MinGpa:          2.5,
			CreatedAt:       time.Now().AddDate(0, -2, 0),
			LocationDetail:  "ตึก 1 ชั้น 2",
			Subdistrict:     "ปทุมวัน",
			District:        "ปทุมวัน",
			Province:        "กรุงเทพมหานคร",
			CompanyID:       5,
			JobTypeID:       1,
			StipendID:       1,
			WorkDayID:       1,
			WorkModeID:      1,
			StatusPostID:    1,
			AdminID:         1,
		},
		{
			PostName:        "Backend Developer Intern",
			PostDescription: "พัฒนา API ด้วย Go และ GORM",
			Quantity:        1,
			MinGpa:          2.3,
			CreatedAt:       time.Now().AddDate(0, -2, -3),
			LocationDetail:  "อาคารซอฟต์แวร์ ชั้น 4",
			Subdistrict:     "ลาดยาว",
			District:        "จตุจักร",
			Province:        "กรุงเทพมหานคร",
			CompanyID:       1,
			JobTypeID:       2,
			StipendID:       2,
			WorkDayID:       2,
			WorkModeID:      2,
			StatusPostID:    1,
			AdminID:         1,
		},
		{
			PostName:        "Data Analyst Intern",
			PostDescription: "วิเคราะห์ข้อมูลด้วย Python และ SQL",
			Quantity:        1,
			MinGpa:          2.7,
			CreatedAt:       time.Now().AddDate(0, -1, -10),
			LocationDetail:  "ศูนย์วิจัยข้อมูล",
			Subdistrict:     "คลองหนึ่ง",
			District:        "คลองหลวง",
			Province:        "ปทุมธานี",
			CompanyID:       2,
			JobTypeID:       3,
			StipendID:       2,
			WorkDayID:       1,
			WorkModeID:      3,
			StatusPostID:    1,
			AdminID:         1,
		},
		{
			PostName:        "UX/UI Designer Intern",
			PostDescription: "ออกแบบหน้าจอและปรับปรุงประสบการณ์ผู้ใช้",
			Quantity:        1,
			MinGpa:          2.2,
			CreatedAt:       time.Now().AddDate(0, -1, -5),
			LocationDetail:  "ฝ่าย UX ชั้น 3",
			Subdistrict:     "ห้วยขวาง",
			District:        "ห้วยขวาง",
			Province:        "กรุงเทพมหานคร",
			CompanyID:       3,
			JobTypeID:       4,
			StipendID:       1,
			WorkDayID:       2,
			WorkModeID:      2,
			StatusPostID:    1,
			AdminID:         1,
		},
		{
			PostName:        "QA Tester Intern",
			PostDescription: "ทดสอบระบบและเขียน test case",
			Quantity:        1,
			MinGpa:          2.0,
			CreatedAt:       time.Now().AddDate(0, -1, 0),
			LocationDetail:  "ฝ่าย QA ชั้น 2",
			Subdistrict:     "บางซื่อ",
			District:        "บางซื่อ",
			Province:        "กรุงเทพมหานคร",
			CompanyID:       4,
			JobTypeID:       5,
			StipendID:       3,
			WorkDayID:       3,
			WorkModeID:      1,
			StatusPostID:    1,
			AdminID:         1,
		},
		{
			PostName:        "DevOps Intern",
			PostDescription: "ช่วยดูแลระบบ CI/CD และการ deploy",
			Quantity:        1,
			MinGpa:          2.4,
			CreatedAt:       time.Now().AddDate(0, 0, -10),
			LocationDetail:  "ชั้น 5 ห้อง server",
			Subdistrict:     "พระโขนง",
			District:        "คลองเตย",
			Province:        "กรุงเทพมหานคร",
			CompanyID:       5,
			JobTypeID:       6,
			StipendID:       2,
			WorkDayID:       2,
			WorkModeID:      3,
			StatusPostID:    1,
			AdminID:         1,
		},
		{
			PostName:        "System Analyst Intern",
			PostDescription: "วิเคราะห์ระบบและจัดทำเอกสาร",
			Quantity:        1,
			MinGpa:          2.6,
			CreatedAt:       time.Now().AddDate(0, 0, -3),
			LocationDetail:  "ห้องประชุมชั้น 6",
			Subdistrict:     "ดินแดง",
			District:        "ดินแดง",
			Province:        "กรุงเทพมหานคร",
			CompanyID:       1,
			JobTypeID:       7,
			StipendID:       3,
			WorkDayID:       1,
			WorkModeID:      2,
			StatusPostID:    1,
			AdminID:         1,
		},
	}
	// ✅ สร้าง post และผูก benefits แยกต่างหาก
	for i := range intershipPosts {
		db.Create(&intershipPosts[i])

		// เลือก benefit ตาม post index
		var benefitIDs []uint
		switch i {
		case 0:
			benefitIDs = []uint{1} // Software Dev Intern
		case 1:
			benefitIDs = []uint{3} // Data Science Intern
		case 2:
			benefitIDs = []uint{2} // AI/ML Intern
		case 3:
			benefitIDs = []uint{1, 4} // Frontend Intern
		default:
			benefitIDs = []uint{}
		}

		// ค้นหา benefit จริงจาก DB แล้วเชื่อมกับโพสต์
		var bs []entity.Benefit
		if len(benefitIDs) > 0 {
			db.Where("id IN ?", benefitIDs).Find(&bs)
			db.Model(&intershipPosts[i]).Association("Benefits").Replace(bs)
		}
	}

	// ---------- (เลิกคอมเมน) Map post → skills ----------
	skillMap := map[int][]uint{
		0: {1, 2}, // Software Dev → Python, Java
		1: {1, 5}, // Data Science → Python, Data Analysis
		2: {1, 5}, // AI/ML → Python, Data Analysis
		3: {3, 4}, // Frontend → JavaScript, SQL
	}
	for postIdx, skillIDs := range skillMap {
		if postIdx < len(intershipPosts) {
			postID := intershipPosts[postIdx].ID
			for _, skillID := range skillIDs {
				reqSkill := entity.CompanyRequiredSkill{
					SkillID:         skillID,
					IntershipPostID: postID,
				}
				db.FirstOrCreate(&reqSkill, reqSkill)
			}
		}
	}

	// Seed Skills
	if err := EnsureSkills(db, []string{
		// ---------- Soft skills & Office ----------
		"Communication", "Teamwork", "Problem Solving", "Critical Thinking",
		"Time Management", "Leadership", "Presentation", "Negotiation",
		"Project Management", "English", "Thai",
		"MS Excel", "PowerPoint", "Excel (Advanced)", "PowerPoint (Advanced)", "Google Sheets",

		// ---------- Programming Languages ----------
		"Python", "Java", "JavaScript", "TypeScript", "Go", "C#", "C++",
		"PHP", "Kotlin", "Swift", "Rust", "Dart", "R",

		// ---------- Frontend ----------
		"HTML", "CSS", "SASS", "Tailwind CSS",
		"React", "Next.js", "Vue.js", "Nuxt", "Angular",

		// ---------- Backend / APIs ----------
		"Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI",
		"Spring Boot", "Laravel", ".NET", "GraphQL", "gRPC",

		// ---------- Mobile ----------
		"Flutter", "React Native", "SwiftUI", "Android",

		// ---------- Data / AI / BI ----------
		"SQL", "NoSQL", "Pandas", "NumPy", "scikit-learn",
		"TensorFlow", "PyTorch", "Power BI", "Tableau", "Excel Pivot",
		"Google Data Studio",

		// ---------- Databases / Search / Cache / MQ ----------
		"PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis",
		"Elasticsearch", "RabbitMQ", "Kafka",

		// ---------- DevOps / Cloud / Infra ----------
		"Git", "CI/CD", "Docker", "Kubernetes", "Linux", "Bash", "Nginx",
		"AWS", "GCP", "Azure",

		// ---------- QA / Testing ----------
		"Jest", "Vitest", "Cypress", "Playwright", "Selenium",

		// ---------- Design ----------
		"Figma", "UI/UX", "Adobe Photoshop", "Adobe Illustrator",
		"Adobe Premiere Pro", "After Effects", "Photography", "Video Editing",

		// ---------- Business / Finance / Accounting ----------
		"Accounting", "Bookkeeping", "Financial Analysis", "Financial Modeling", "Budgeting",
		"Auditing", "Taxation", "IFRS", "Thai GAAP", "Cost Accounting",
		"SAP FI", "SAP CO", "QuickBooks", "Xero",

		// ---------- Marketing / Sales / CS ----------
		"Digital Marketing", "Content Marketing", "Social Media Management",
		"SEO", "SEM", "Google Ads", "Facebook Ads", "LINE OA", "Copywriting",
		"CRM", "Email Marketing", "Marketing Analytics", "GA4",
		"B2B Sales", "B2C Sales", "Salesforce", "HubSpot",
		"Customer Success", "Customer Service",

		// ---------- HR / People Ops ----------
		"Recruitment", "Talent Acquisition", "Interviewing", "Onboarding",
		"Payroll", "Compensation & Benefits", "Performance Management", "L&D",
		"Labor Law", "HRIS", "Workday", "SAP SuccessFactors",

		// ---------- Supply Chain / Logistics / Procurement ----------
		"Procurement", "Sourcing", "Supplier Management", "Contract Management",
		"Inventory Management", "Demand Planning", "MRP", "ERP",
		"SAP MM", "SAP SD", "Logistics", "Warehouse Management", "WMS", "TMS",
		"Import/Export", "Incoterms", "Customs Clearance",

		// ---------- Manufacturing / Engineering / QA / HSE ----------
		"Production Planning", "Manufacturing", "Lean", "Six Sigma", "Kaizen", "5S", "OEE",
		"CAD", "AutoCAD", "SolidWorks", "PLC", "Maintenance", "TPM",
		"Quality Assurance", "Quality Control", "SPC", "Root Cause Analysis", "FMEA",
		"ISO 9001", "ISO 14001", "GMP", "HACCP", "HSE", "OSHA",

		// ---------- Construction / Architecture / Real Estate ----------
		"BIM", "Revit", "Cost Estimation", "Quantity Surveying",
		"Site Management", "Scheduling", "Primavera P6", "MS Project",
		"Property Management", "Valuation",

		// ---------- Science / Biotech / Food / Environment ----------
		"Laboratory Skills", "Microscopy", "PCR", "ELISA", "Cell Culture",
		"HPLC", "GC", "Spectrophotometry", "GLP", "GMP (Lab)",
		"Food Safety", "Microbiology", "Chemistry",
		"Environmental Impact Assessment", "ESG", "Sustainability", "Carbon Accounting", "GIS",

		// ---------- Healthcare / Pharmacy ----------
		"Patient Care", "Triage", "Medical Records",
		"Pharmacy Dispensing", "Medication Counseling",

		// ---------- Hospitality / Tourism ----------
		"Front Office", "Housekeeping", "Food & Beverage", "Barista",
		"Reservation Management", "Event Planning", "Tour Operations",

		// ---------- Education ----------
		"Curriculum Design", "Instructional Design", "Classroom Management", "Assessment", "Tutoring",

		// ---------- Legal / Compliance ----------
		"Legal Research", "Contract Drafting", "Compliance", "KYC", "AML",
		"Data Privacy", "GDPR",

		// ---------- Tools / PM ----------
		"Notion", "Jira", "Confluence", "Trello", "Asana",
	}); err != nil {
		log.Println("seed skills:", err)
	}
	// ===== Seed Interests (ครอบคลุมหลายสายงาน) =====
	_ = EnsureInterests(db, []string{
		// IT / Software / Data
		"Web Development", "Frontend Development", "Backend Development", "Full-Stack Development",
		"Mobile Development", "DevOps", "Cloud Computing", "Cybersecurity",
		"Data Science", "Machine Learning", "Artificial Intelligence", "Data Engineering",
		"Business Intelligence", "Data Analytics", "Product Management", "QA/Testing",
		"UI/UX Design", "Game Development", "AR/VR", "Embedded Systems", "IoT",

		// Engineering / Manufacturing / Quality / HSE
		"Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
		"Chemical Engineering", "Mechatronics/Robotics", "Automation",
		"Manufacturing", "Process Improvement", "Lean", "Six Sigma", "Quality Assurance",
		"HSE", "Sustainability/ESG",

		// Business / Finance / Strategy
		"Accounting", "Corporate Finance", "Investment", "Financial Modeling",
		"Audit", "Tax", "Entrepreneurship", "Startup", "Business Strategy",
		"Management Consulting", "Operations Management", "Project Management",

		// Marketing / Sales / Customer
		"Digital Marketing", "Content Marketing", "Social Media", "SEO/SEM",
		"Brand Management", "Growth Marketing", "E-commerce", "CRM",
		"Sales (B2B)", "Sales (B2C)", "Customer Success", "Customer Service",

		// HR / People Ops
		"Talent Acquisition", "Learning & Development", "HR Analytics",
		"Organizational Development", "Compensation & Benefits",

		// Supply Chain / Logistics / Procurement
		"Supply Chain", "Procurement", "Sourcing", "Logistics", "Warehouse",
		"Import/Export",

		// Construction / Real Estate / Architecture
		"Architecture", "Construction Management", "Quantity Surveying", "Real Estate",

		// Science / Bio / Food / Environment
		"Biotechnology", "Food Science", "Chemistry", "Environmental Science", "GIS",

		// Healthcare / Public Health / Pharma
		"Nursing", "Pharmacy", "Public Health", "Medical Informatics",

		// Education / Training
		"Teaching", "Instructional Design", "EdTech",

		// Creative / Media / Design
		"Graphic Design", "Motion Design", "Photography", "Videography", "Copywriting",

		// Legal / Compliance / Privacy
		"Corporate Law", "Contract", "Compliance", "Data Privacy",

		// Hospitality / Tourism / Events
		"Hotel Management", "Event Management", "Travel & Tourism",

		// Government / Policy / Social Impact
		"Public Policy", "Public Administration", "Nonprofit/NGO", "Community Development",

		// Languages / Communication
		"English Communication", "Chinese", "Japanese",
	})

	// Seed Educational Background (ระดับ)
	EducationLevels := []entity.EducationLevel{
		{Name: "ปริญญาตรี"},
		{Name: "ปริญญาโท"},
		{Name: "ปริญญาเอก"},
	}
	for _, el := range EducationLevels {
		db.FirstOrCreate(&el, entity.EducationLevel{Name: el.Name})
	}

	// Seed Notification Types
	notificationTypes := []entity.NotificationsType{
		{Name: "interview", Label: "คุณมีนัดสัมภาษณ์กับบริษัท {{.company}} เวลา {{.time}}"},
		{Name: "match", Label: "คุณได้รับการแมทช์กับ {{.partner}}"},
		{Name: "chat", Label: "คุณได้รับข้อความใหม่จาก {{.sender}}"},
	}
	for _, nt := range notificationTypes {
		db.FirstOrCreate(&nt, entity.NotificationsType{Name: nt.Name})
	}

	// Seed Status Verifies
	StatusVerifies := []entity.StatusVerify{
		{StatusVerify: "ยังไม่ได้ส่งคำขอ"},
		{StatusVerify: "รอรับรอง"},
		{StatusVerify: "รับรอง"},
		{StatusVerify: "ปฏิเสธ"},
	}
	for _, sv := range StatusVerifies {
		db.FirstOrCreate(&sv, entity.StatusVerify{StatusVerify: sv.StatusVerify})
	}

	// Helper function สำหรับ pointer
	toPtr := func(id uint) *uint { return &id }

	// Seed Verify records สำหรับบริษัทและอาจารย์ให้มีสถานะ "รับรอง"
	verifyTime := time.Now()
	verifies := []entity.Verify{
		// บริษัทที่ได้รับการรับรอง (UserID 2, 6, 7, 8, 9 เป็นบริษัท)
		{
			VerificationDocument: "/uploads/verify/company_alpha_doc.pdf",
			Reason:               "",
			VerifiedAt:           &verifyTime,
			StatusVerifyID:       3,              // "รับรอง"
			UserID:               2,              // Alpha Tech Co., Ltd.
			AdminID:              toPtr(uint(1)), // Admin ที่อนุมัติ
		},
		{
			VerificationDocument: "/uploads/verify/company_beta_doc.pdf",
			Reason:               "",
			VerifiedAt:           &verifyTime,
			StatusVerifyID:       3, // "รับรอง"
			UserID:               6, // Beta Solutions Co., Ltd.
			AdminID:              toPtr(uint(1)),
		},
		{
			VerificationDocument: "/uploads/verify/company_gamma_doc.pdf",
			Reason:               "",
			VerifiedAt:           &verifyTime,
			StatusVerifyID:       3, // "รับรอง"
			UserID:               7, // Gamma Innovations Co., Ltd.
			AdminID:              toPtr(uint(2)),
		},
		{
			VerificationDocument: "/uploads/verify/company_delta_doc.pdf",
			Reason:               "",
			VerifiedAt:           &verifyTime,
			StatusVerifyID:       3, // "รับรอง"
			UserID:               8, // Delta Software Co., Ltd.
			AdminID:              toPtr(uint(1)),
		},
		{
			VerificationDocument: "/uploads/verify/company_epsilon_doc.pdf",
			Reason:               "",
			VerifiedAt:           &verifyTime,
			StatusVerifyID:       3, // "รับรอง"
			UserID:               9, // Epsilon Systems Co., Ltd.
			AdminID:              toPtr(uint(2)),
		},

		// อาจารย์ที่ได้รับการรับรอง (UserID 4, 14, 15, 16, 17 เป็นอาจารย์)
		{
			VerificationDocument: "/uploads/verify/academic_somchai_doc.pdf",
			Reason:               "",
			VerifiedAt:           &verifyTime,
			StatusVerifyID:       3, // "รับรอง"
			UserID:               4, // อ.สมชาย วิศวกร
			AdminID:              toPtr(uint(1)),
		},
		{
			VerificationDocument: "/uploads/verify/academic_suree_doc.pdf",
			Reason:               "",
			VerifiedAt:           &verifyTime,
			StatusVerifyID:       3,  // "รับรอง"
			UserID:               14, // อ.สุรีย์ เคมี
			AdminID:              toPtr(uint(2)),
		},
		{
			VerificationDocument: "/uploads/verify/academic_sompong_doc.pdf",
			Reason:               "",
			VerifiedAt:           &verifyTime,
			StatusVerifyID:       3,  // "รับรอง"
			UserID:               15, // ผศ.สมพงษ์ การตลาด
			AdminID:              toPtr(uint(1)),
		},
		{
			VerificationDocument: "/uploads/verify/academic_orathai_doc.pdf",
			Reason:               "",
			VerifiedAt:           &verifyTime,
			StatusVerifyID:       3,  // "รับรอง"
			UserID:               16, // รศ.อรทัย ภาษา
			AdminID:              toPtr(uint(2)),
		},
		{
			VerificationDocument: "/uploads/verify/academic_thanpon_doc.pdf",
			Reason:               "",
			VerifiedAt:           &verifyTime,
			StatusVerifyID:       3,  // "รับรอง"
			UserID:               17, // อ.ธนพล นิติ
			AdminID:              toPtr(uint(1)),
		},
	}

	for _, v := range verifies {
		db.FirstOrCreate(&v, entity.Verify{UserID: v.UserID})
	}

	// Seed Articles
	publishedTrue := true
	now := time.Now()
	articles := []entity.Article{
		{
			Title:       "เตรียมตัวสำหรับการฝึกงาน",
			Subtitle:    "คู่มือการเตรียมตัวสำหรับนักศึกษาที่กำลังจะไปฝึกงาน",
			Body:        "การฝึกงานเป็นประสบการณ์สำคัญที่จะช่วยให้นักศึกษาได้เรียนรู้งานจริง พัฒนาทักษะที่จำเป็น และสร้างเครือข่ายในวงการอาชีพ การเตรียมตัวที่ดีจะช่วยให้การฝึกงานเป็นไปอย่างราบรื่นและได้ผลดี",
			Category:    "การเตรียมตัว",
			Type:        "career",
			PublishedAt: &now,
			IsPublished: &publishedTrue,
			AdminID:     1,
		},
		{
			Title:       "Tips การสัมภาษณ์งาน",
			Subtitle:    "เทคนิคการสัมภาษณ์งานที่จะทำให้คุณประสบความสำเร็จ",
			Body:        "การสัมภาษณ์งานเป็นขั้นตอนสำคัญในการหางาน การเตรียมตัวอย่างดีจะช่วยเพิ่มโอกาสในการได้งาน ควรศึกษาข้อมูลบริษัท เตรียมคำตอบสำหรับคำถามพื้นฐาน และแต่งกายให้เหมาะสม",
			Category:    "การสัมภาษณ์",
			Type:        "career",
			PublishedAt: &now,
			IsPublished: &publishedTrue,
			AdminID:     1,
		},
		{
			Title:       "แนวโน้มตลาดงาน IT ปี 2025",
			Subtitle:    "ภาพรวมและแนวโน้มของตลาดงานเทคโนโลยีในปีนี้",
			Body:        "ตลาดงาน IT ในปี 2025 มีการเติบโตอย่างต่อเนื่อง โดยเฉพาะด้าน AI และ Data Science มีความต้องการ Developer ที่มีทักษะด้าน Machine Learning, Cloud Computing และ Cybersecurity เพิ่มขึ้นอย่างมาก",
			Category:    "ข่าวสาร",
			Type:        "news",
			PublishedAt: &now,
			IsPublished: &publishedTrue,
			AdminID:     2,
		},
		{
			Title:       "ทักษะที่นายจ้างต้องการ",
			Subtitle:    "รวมทักษะที่บริษัทชั้นนำมองหาในตัวพนักงานใหม่",
			Body:        "ทักษะที่นายจ้างต้องการไม่ได้มีแค่ Hard Skills เท่านั้น แต่ยังรวมถึง Soft Skills ด้วย เช่น การสื่อสาร การทำงานเป็นทีม การแก้ปัญหา และการเรียนรู้ใหม่ๆ อย่างต่อเนื่อง",
			Category:    "ทักษะ",
			Type:        "career",
			PublishedAt: &now,
			IsPublished: &publishedTrue,
			AdminID:     2,
		},
	}
	for _, article := range articles {
		db.FirstOrCreate(&article, entity.Article{Title: article.Title})
	}

	// Seed Applications
	applications := []entity.Application{
		{
			Status:          "ผ่าน",
			ResumeUrl:       "/uploads/resumes/student1_resume.pdf",
			TranscriptUrl:   "/uploads/transcripts/student1_transcript.pdf",
			SubmitAt:        time.Now().AddDate(0, 0, -5),
			CompanyNote:     "",
			IntershipPostID: 1, // Software Development Intern
			StudentID:       1,
		},
		{
			Status:          "ไม่ผ่าน",
			ResumeUrl:       "/uploads/resumes/student2_resume.pdf",
			TranscriptUrl:   "/uploads/transcripts/student2_transcript.pdf",
			SubmitAt:        time.Now().AddDate(0, 0, -10),
			CompanyNote:     "ไม่ตรงตามคุณสมบัติที่ต้องการ",
			IntershipPostID: 2, // Data Science Intern
			StudentID:       2,
		},
		{
			Status:          "นัดสัมภาษณ์แล้ว",
			ResumeUrl:       "/uploads/resumes/student3_resume.pdf",
			TranscriptUrl:   "/uploads/transcripts/student3_transcript.pdf",
			SubmitAt:        time.Now().AddDate(0, 0, -15),
			CompanyNote:     "รอสัมภาษณ์",
			IntershipPostID: 3, // AI/ML Intern
			StudentID:       3,
		},
		{
			Status:          "ผ่าน",
			ResumeUrl:       "/uploads/resumes/student4_resume.pdf",
			TranscriptUrl:   "/uploads/transcripts/student4_transcript.pdf",
			SubmitAt:        time.Now().AddDate(0, 0, -3),
			CompanyNote:     "",
			IntershipPostID: 4, // Frontend Developer Intern
			StudentID:       4,
		},
		{
			Status:          "นัดสัมภาษณ์แล้ว",
			ResumeUrl:       "/uploads/resumes/student5_resume.pdf",
			TranscriptUrl:   "/uploads/transcripts/student5_transcript.pdf",
			SubmitAt:        time.Now().AddDate(0, 0, -8),
			CompanyNote:     "รอสัมภาษณ์",
			IntershipPostID: 1, // Software Development Intern (student 5 also applied)
			StudentID:       5,
		},
	}
	for i, app := range applications {
		db.Create(&app)

		// Create corresponding ApplicationDetails
		appDetail := entity.ApplicationDetails{
			StudentID:     app.StudentID,
			ApplicationID: app.ID,
		}
		db.FirstOrCreate(&appDetail, entity.ApplicationDetails{
			StudentID:     app.StudentID,
			ApplicationID: app.ID,
		})

		// Update applications slice with the created ID for later reference
		applications[i] = app
	}

	// Seed StudentSkill relationships
	studentSkills := []entity.StudentSkill{
		// Student 1 (เจษฎาภรณ์) - Software Development skills
		{StudentID: 1, SkillID: 1},  // Communication
		{StudentID: 1, SkillID: 17}, // Python
		{StudentID: 1, SkillID: 18}, // Java
		{StudentID: 1, SkillID: 19}, // JavaScript
		{StudentID: 1, SkillID: 25}, // HTML
		{StudentID: 1, SkillID: 26}, // CSS
		{StudentID: 1, SkillID: 29}, // React
		{StudentID: 1, SkillID: 67}, // Git

		// Student 2 (วิชญ์) - Data Science skills
		{StudentID: 2, SkillID: 1},  // Communication
		{StudentID: 2, SkillID: 17}, // Python
		{StudentID: 2, SkillID: 41}, // SQL
		{StudentID: 2, SkillID: 43}, // Pandas
		{StudentID: 2, SkillID: 44}, // NumPy
		{StudentID: 2, SkillID: 47}, // TensorFlow
		{StudentID: 2, SkillID: 49}, // Power BI
		{StudentID: 2, SkillID: 67}, // Git

		// Student 3 (อรพิน) - UI/UX Design skills
		{StudentID: 3, SkillID: 1},  // Communication
		{StudentID: 3, SkillID: 19}, // JavaScript
		{StudentID: 3, SkillID: 25}, // HTML
		{StudentID: 3, SkillID: 26}, // CSS
		{StudentID: 3, SkillID: 29}, // React
		{StudentID: 3, SkillID: 61}, // Figma
		{StudentID: 3, SkillID: 62}, // UI/UX
		{StudentID: 3, SkillID: 63}, // Adobe Photoshop

		// Student 4 (พิมพ์ใจ) - Frontend Development skills
		{StudentID: 4, SkillID: 1},  // Communication
		{StudentID: 4, SkillID: 19}, // JavaScript
		{StudentID: 4, SkillID: 20}, // TypeScript
		{StudentID: 4, SkillID: 25}, // HTML
		{StudentID: 4, SkillID: 26}, // CSS
		{StudentID: 4, SkillID: 29}, // React
		{StudentID: 4, SkillID: 30}, // Next.js
		{StudentID: 4, SkillID: 67}, // Git

		// Student 5 (สุริยา) - Full-Stack Development skills
		{StudentID: 5, SkillID: 1},  // Communication
		{StudentID: 5, SkillID: 17}, // Python
		{StudentID: 5, SkillID: 19}, // JavaScript
		{StudentID: 5, SkillID: 25}, // HTML
		{StudentID: 5, SkillID: 26}, // CSS
		{StudentID: 5, SkillID: 29}, // React
		{StudentID: 5, SkillID: 34}, // Node.js
		{StudentID: 5, SkillID: 41}, // SQL
		{StudentID: 5, SkillID: 67}, // Git
	}
	for _, ss := range studentSkills {
		db.FirstOrCreate(&ss, entity.StudentSkill{StudentID: ss.StudentID, SkillID: ss.SkillID})
	}

	// Seed StudentInterest relationships
	studentInterests := []entity.StudentInterest{
		// Student 1 (เจษฎาภรณ์) - Interested in Web Development
		{StudentID: 1, InterestID: 1}, // Web Development
		{StudentID: 1, InterestID: 2}, // Frontend Development
		{StudentID: 1, InterestID: 4}, // Full-Stack Development

		// Student 2 (วิชญ์) - Interested in Data Science
		{StudentID: 2, InterestID: 9},  // Data Science
		{StudentID: 2, InterestID: 10}, // Machine Learning
		{StudentID: 2, InterestID: 11}, // Artificial Intelligence
		{StudentID: 2, InterestID: 13}, // Business Intelligence

		// Student 3 (อรพิน) - Interested in UI/UX Design
		{StudentID: 3, InterestID: 17}, // UI/UX Design
		{StudentID: 3, InterestID: 2},  // Frontend Development
		{StudentID: 3, InterestID: 57}, // Graphic Design

		// Student 4 (พิมพ์ใจ) - Interested in Frontend Development
		{StudentID: 4, InterestID: 2},  // Frontend Development
		{StudentID: 4, InterestID: 1},  // Web Development
		{StudentID: 4, InterestID: 17}, // UI/UX Design

		// Student 5 (สุริยา) - Interested in Full-Stack Development
		{StudentID: 5, InterestID: 4}, // Full-Stack Development
		{StudentID: 5, InterestID: 1}, // Web Development
		{StudentID: 5, InterestID: 3}, // Backend Development
	}
	for _, si := range studentInterests {
		db.FirstOrCreate(&si, entity.StudentInterest{StudentID: si.StudentID, InterestID: si.InterestID})
	}

	// Seed InterviewAppointment data
	interviewAppointments := []entity.InterviewAppointment{
		{
			AppointmentDate: time.Date(2024, 3, 15, 10, 0, 0, 0, time.Local),
			Mode:            "online",
			Details:         "สัมภาษณ์ออนไลน์ผ่าน Microsoft Teams สำหรับตำแหน่ง Software Developer ระยะเวลา 45 นาที กรุณาเตรียมตัวอย่างโปรเจ็กต์และพร้อมตอบคำถามเกี่ยวกับประสบการณ์ทางเทคนิค",
			CompanyID:       1, // TechCorp
			StudentID:       1, // เจษฎาภรณ์
			Status:          "รอดำเนินการ",
		},
		{
			AppointmentDate: time.Date(2024, 3, 20, 14, 0, 0, 0, time.Local),
			Mode:            "onsite",
			Details:         "สัมภาษณ์ที่สำนักงาน ชั้น 15 อาคาร ABC ตำแหน่ง Data Scientist ใช้เวลาประมาณ 60 นาที พร้อมทำแบบทดสอบ Technical Test เกี่ยวกับ Python และ Machine Learning",
			CompanyID:       2, // DataFlow Analytics
			StudentID:       2, // วิชญ์
			Status:          "ผ่าน",
		},
		{
			AppointmentDate: time.Date(2024, 3, 25, 11, 30, 0, 0, time.Local),
			Mode:            "hybrid",
			Details:         "สัmภาษณ์แบบผสม เริ่มออนไลน์ 30 นาทีแรก จากนั้นเข้าพบที่สำนักงาน สำหรับตำแหน่ง UX/UI Designer นำผลงาน Portfolio มาโชว์และเตรียมตัวอย่างการแก้ปัญหา Design Challenge",
			CompanyID:       3, // CreativeStudio
			StudentID:       3, // อรพิน
			Status:          "รอดำเนินการ",
		},
		{
			AppointmentDate: time.Date(2024, 3, 18, 9, 0, 0, 0, time.Local),
			Mode:            "online",
			Details:         "สัมภาษณ์ออนไลน์ตำแหน่ง Frontend Developer ผ่าน Zoom ระยะเวลา 50 นาที รวมถึงการ Live Coding และการอธิบายเกี่ยวกับ React และ JavaScript frameworks",
			CompanyID:       1, // TechCorp
			StudentID:       4, // พิมพ์ใจ
			Status:          "ไม่ผ่าน",
		},
		{
			AppointmentDate: time.Date(2024, 3, 22, 13, 30, 0, 0, time.Local),
			Mode:            "onsite",
			Details:         "สัมภาษณ์ที่สำนักงานสำหรับตำแหน่ง Full-Stack Developer ใช้เวลา 90 นาที แบ่งเป็น 3 ส่วน: สัมภาษณ์ทั่วไป Technical Interview และ System Design รวมถึงการทำ Coding Challenge",
			CompanyID:       4, // GlobalTech Solutions
			StudentID:       5, // สุริยา
			Status:          "ผ่าน",
		},
		{
			AppointmentDate: time.Date(2024, 3, 28, 15, 0, 0, 0, time.Local),
			Mode:            "online",
			Details:         "สัมภาษณ์รอบ 2 สำหรับตำแหน่ง Senior Developer เน้นการพูดคุยเกี่ยวกับประสบการณ์การทำงานเป็นทีม การใช้ Agile methodology และแนวทางการแก้ปัญหาที่ซับซ้อน",
			CompanyID:       5, // InnovateNow
			StudentID:       1, // เจษฎาภรณ์
			Status:          "รอดำเนินการ",
		},
	}
	for i, apt := range interviewAppointments {
		var existingApt entity.InterviewAppointment
		db.FirstOrCreate(&existingApt, entity.InterviewAppointment{
			CompanyID: apt.CompanyID,
			StudentID: apt.StudentID,
		}, apt)
		interviewAppointments[i] = existingApt
	}

	// Seed Review data
	reviews := []entity.Review{
		{
			Rating:    5,
			Comment:   "บริษัทดีมาก สภาพแวดล้อมการทำงานยอดเยียม เพื่อนร่วมงานใจดี พี่ๆ ให้ความรู้เยอะมาก ได้เรียนรู้เทคโนโลยีใหม่ๆ และได้ประสบการณ์การทำงานจริงที่มีคุณค่า แนะนำเลยครับ",
			StudentID: 1, // เจษฎาภรณ์
			CompanyID: 1, // TechCorp
			Like:      15,
		},
		{
			Rating:    4,
			Comment:   "เป็นบริษัทที่ดีสำหรับการเรียนรู้ด้าน Data Science โปรเจ็กต์ที่ได้ทำท้าทายและน่าสนใจ เครื่องมือที่ใช้ทันสมัย แต่ workload ค่อนข้างเยอะหน่อยในช่วงเดดไลน์ โดยรวมแล้วประสบการณ์ดี",
			StudentID: 2, // วิชญ์
			CompanyID: 2, // DataFlow Analytics
			Like:      8,
		},
		{
			Rating:    5,
			Comment:   "บริษัทที่เปิดโอกาสให้นักศึกษาได้แสดงความคิดสร้างสรรค์อย่างเต็มที่ ได้ทำงานกับ designer ระดับโปรและเรียนรู้เครื่องมือใหม่ๆ เยอะมาก ทีม Creative มีความอบอุ่นและช่วยเหลือกันดี",
			StudentID: 3, // อรพิน
			CompanyID: 3, // CreativeStudio
			Like:      12,
		},
		{
			Rating:    3,
			Comment:   "บริษัทมีชื่อเสียงและโปรเจ็กต์ใหญ่ๆ แต่การจัดการนักศึกษาฝึกงานยังไม่ค่อยดี บางทีไม่มีงานให้ทำหรือต้องรอนาน ระบบการฝึกอบรมก็ไม่ชัดเจนมากนัก",
			StudentID: 4, // พิมพ์ใจ
			CompanyID: 4, // GlobalTech Solutions
			Like:      3,
		},
		{
			Rating:    4,
			Comment:   "บริษัทสตาร์ทอัพที่มีการเปลี่ยนแปลงเร็ว ได้เรียนรู้หลายอย่างในเวลาสั้น ได้ทำงานใกล้ชิดกับผู้บริหาร เรียนรู้การทำ business จริงๆ แต่ hours การทำงานค่อนข้างยืดหยุ่นเกินไป",
			StudentID: 5, // สุริยา
			CompanyID: 5, // InnovateNow
			Like:      7,
		},
		{
			Rating:    5,
			Comment:   "กลับมาฝึงงานรอบ 2 ได้ทำโปรเจ็กต์ที่ใหญ่ขึ้นและมีส่วนร่วมในการตัดสินใจเทคนิคด้วย ทีมพัฒนาให้การสนับสนุนดีมาก มีการ code review และ mentoring ที่มีประโยชน์",
			StudentID: 1, // เจษฎาภรณ์
			CompanyID: 1, // TechCorp (รีวิวรอบ 2)
			Like:      20,
		},
	}
	for i, review := range reviews {
		var existingReview entity.Review
		db.FirstOrCreate(&existingReview, entity.Review{
			StudentID: review.StudentID,
			CompanyID: review.CompanyID,
		}, review)
		reviews[i] = existingReview
	}

	// Seed ReviewLike data
	reviewLikes := []entity.ReviewLike{
		// Student 2 likes Student 1's TechCorp review
		{ReviewID: 1, StudentID: 2},
		{ReviewID: 1, StudentID: 3},
		{ReviewID: 1, StudentID: 4},
		{ReviewID: 1, StudentID: 5},

		// Student 1 likes Student 2's DataFlow review
		{ReviewID: 2, StudentID: 1},
		{ReviewID: 2, StudentID: 3},

		// Multiple students like CreativeStudio review
		{ReviewID: 3, StudentID: 1},
		{ReviewID: 3, StudentID: 2},
		{ReviewID: 3, StudentID: 4},

		// Only few likes for the negative GlobalTech review
		{ReviewID: 4, StudentID: 2},

		// InnovateNow review gets some likes
		{ReviewID: 5, StudentID: 1},
		{ReviewID: 5, StudentID: 3},

		// The second TechCorp review gets many likes
		{ReviewID: 6, StudentID: 2},
		{ReviewID: 6, StudentID: 3},
		{ReviewID: 6, StudentID: 4},
		{ReviewID: 6, StudentID: 5},
	}
	for _, rl := range reviewLikes {
		db.FirstOrCreate(&rl, entity.ReviewLike{ReviewID: rl.ReviewID, StudentID: rl.StudentID})
	}
}

// ====================== CSV LOADERS ======================

type RawEducationData struct {
	University string
	Faculty    string
	Program    string
}

func insertEducationFromCSV(db *gorm.DB, filePath string) {
	file, err := os.Open(filePath)
	if err != nil {
		log.Println("❌ Failed to open CSV file:", err)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1
	records, err := reader.ReadAll()
	if err != nil {
		log.Println("❌ Failed to read CSV:", err)
		return
	}

	if len(records) < 1 {
		log.Println("⚠️ CSV ไม่มีข้อมูล")
		return
	}

	// Header mapping
	header := records[0]
	colMap := make(map[string]int)
	for i, h := range header {
		colMap[h] = i
	}

	requiredCols := []string{"UNIV_NAME_TH", "FAC_NAME", "PROGRAM_NAME", "LEV_NAME_ENG"}
	for _, col := range requiredCols {
		if _, ok := colMap[col]; !ok {
			log.Fatalf("❌ Missing required column: %s", col)
		}
	}

	// ✅ กรองเฉพาะระดับการศึกษาที่ต้องการ
	validLevels := map[string]bool{
		"ป.ตรี": true,
		"ป.โท":  true,
		"ป.เอก": true,
	}

	var rawData []RawEducationData
	for _, row := range records[1:] {
		level := row[colMap["LEV_NAME_ENG"]]
		if !validLevels[level] {
			continue
		}

		rawData = append(rawData, RawEducationData{
			University: row[colMap["UNIV_NAME_TH"]],
			Faculty:    row[colMap["FAC_NAME"]],
			Program:    row[colMap["PROGRAM_NAME"]],
		})
	}

	// Seed Tags สำหรับรีวิว (ไว้ตรงนี้ก็โอเค จะ idempotent)
	tags := []entity.Tag{
		{Name: "บรรยากาศดี"},
		{Name: "งานท้าทาย"},
		{Name: "พี่ๆใจดี"},
		{Name: "ได้ลงมือทำจริง"},
		{Name: "สนับสนุนดี"},
		{Name: "เหมาะกับมือใหม่"},
		{Name: "ได้เรียนรู้หลากหลาย"},
		{Name: "ได้ทำโปรเจกต์จริง"},
	}
	for _, tag := range tags {
		db.FirstOrCreate(&tag, entity.Tag{Name: tag.Name})
	}

	// Cache for IDs
	univMap := make(map[string]uint)
	facultyMap := make(map[string]uint)

	for _, item := range rawData {
		// 🔹 University
		univID, ok := univMap[item.University]
		if !ok {
			univ := entity.University{NameTH: item.University}
			db.FirstOrCreate(&univ, entity.University{NameTH: item.University})
			univID = univ.ID
			univMap[item.University] = univID
		}

		// 🔹 Faculty
		facultyKey := item.University + "|" + item.Faculty
		facultyID, ok := facultyMap[facultyKey]
		if !ok {
			fac := entity.Faculty{NameTH: item.Faculty, UniversityID: univID}
			db.FirstOrCreate(&fac, entity.Faculty{NameTH: item.Faculty, UniversityID: univID})
			facultyID = fac.ID
			facultyMap[facultyKey] = facultyID
		}

		// 🔹 Program
		prog := entity.Program{NameTH: item.Program, FacultyID: facultyID}
		db.FirstOrCreate(&prog, entity.Program{NameTH: item.Program, FacultyID: facultyID})
	}

	log.Printf("✅ นำเข้าข้อมูลเฉพาะ ป.ตรี/โท/เอก เรียบร้อย: %d รายการ\n", len(rawData))
}

// ---------- UTIL: เพิ่มความสนใจ (Interests) แบบ idempotent ----------
func EnsureInterests(db *gorm.DB, names []string) error {
	for _, n := range names {
		if n == "" {
			continue
		}
		it := entity.Interest{InterestName: n}
		if err := db.FirstOrCreate(&it, entity.Interest{InterestName: n}).Error; err != nil {
			return err
		}
	}
	return nil
}

// ---------- UTIL: เพิ่มสกิลแบบ idempotent ----------
func EnsureSkills(db *gorm.DB, names []string) error {
	for _, n := range names {
		if n == "" {
			continue
		}
		s := entity.Skill{SkillName: n}
		if err := db.FirstOrCreate(&s, entity.Skill{SkillName: n}).Error; err != nil {
			return err
		}
	}
	return nil
}

func ImportProvincesCSV(db *gorm.DB, filePath string) {
	file, err := os.Open(filePath)
	if err != nil {
		log.Fatalf("❌ Open file error: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatalf("❌ Read CSV error: %v", err)
	}

	if len(records) <= 1 {
		log.Println("⚠️ No data found")
		return
	}

	for i, row := range records {
		if i == 0 {
			log.Printf("🔍 Header: %+v", row)
			continue
		}
		if len(row) < 3 {
			log.Printf("⚠️ Skipped row %d: %+v (too few columns)", i, row)
			continue
		}

		province := entity.Provinces{
			NameTH: row[1],
			NameEN: row[2],
		}
		db.Where("name_th = ?", province.NameTH).FirstOrCreate(&province)
	}
	log.Println("✅ Provinces imported")
}

func ImportDistrictsCSV(db *gorm.DB, filePath string) {
	file, _ := os.Open(filePath)
	defer file.Close()
	reader := csv.NewReader(file)
	records, _ := reader.ReadAll()

	for i, row := range records {
		if i == 0 {
			continue
		}
		provinceID, _ := strconv.Atoi(row[1])
		district := entity.District{
			NameTH:     row[2],
			NameEN:     row[3],
			ProvinceID: uint(provinceID),
		}
		db.FirstOrCreate(&district, entity.District{NameTH: district.NameTH, ProvinceID: district.ProvinceID})
	}
	log.Println("✅ Districts imported")
}

func ImportPostcodesCSV(db *gorm.DB, filePath string) {
	file, _ := os.Open(filePath)
	defer file.Close()
	reader := csv.NewReader(file)
	records, _ := reader.ReadAll()

	for i, row := range records {
		if i == 0 {
			continue
		}
		postcode := entity.Postcode{
			Postcode: row[1],
		}
		db.FirstOrCreate(&postcode, entity.Postcode{Postcode: postcode.Postcode})
	}
	log.Println("✅ Postcodes imported")
}

func ImportSubDistrictsCSV(db *gorm.DB, filePath string) {
	file, _ := os.Open(filePath)
	defer file.Close()
	reader := csv.NewReader(file)
	records, _ := reader.ReadAll()

	for i, row := range records {
		if i == 0 {
			continue
		}
		districtID, _ := strconv.Atoi(row[1])
		postcodeID, _ := strconv.Atoi(row[4])
		subDistrict := entity.SubDistrict{
			NameTH:     row[2],
			NameEN:     row[3],
			DistrictID: uint(districtID),
			PostcodeID: uint(postcodeID),
		}
		db.FirstOrCreate(&subDistrict, entity.SubDistrict{NameTH: subDistrict.NameTH, DistrictID: subDistrict.DistrictID})
	}
	log.Println("✅ SubDistricts imported")
}

// คำนวณอายุจากวันเกิด
func calcAge(b time.Time) int {
	now := time.Now()
	age := now.Year() - b.Year()
	if now.YearDay() < b.YearDay() {
		age--
	}
	return age
}

func seedStudents(db *gorm.DB) {
	// โหลด gender → map
	var genders []entity.Gender
	db.Find(&genders)
	gmap := map[string]uint{}
	for _, g := range genders {
		gmap[g.Name] = g.ID
		if g.NameTH != "" {
			gmap[g.NameTH] = g.ID
		}
	}
	// helper หา user id
	getUserID := func(email string) (uint, bool) {
		var u entity.User
		if err := db.Select("id").Where("email = ?", email).First(&u).Error; err != nil {
			log.Println("seed student: user not found:", email, err)
			return 0, false
		}
		return u.ID, true
	}

	// ✅ ใช้ AddressID ที่มีอยู่จริงใน DB (แก้เลขตามฐานข้อมูลของคุณได้)
	addrIDByEmail := map[string]uint{
		"jetsadaphon31852@gmail.com": 1,
		"s2@example.com":             2,
		"s3@example.com":             3,
		"s4@example.com":             4,
		"b6526542@g.sut.ac.th":       5,
	}

	type row struct {
		Email          string
		First, Last    string
		Birth          time.Time
		Nat, Rel, Tel  string
		Height, Weight float64
		GenderName     string
	}

	rows := []row{
		{Email: "jetsadaphon31852@gmail.com", First: "เจษฎาภรณ์", Last: "ตัวอย่าง",
			Birth: time.Date(2002, 1, 1, 0, 0, 0, 0, time.UTC), Nat: "ไทย", Rel: "พุทธ",
			Tel: "0890000000", Height: 175, Weight: 65, GenderName: "Male"},
		{Email: "s2@example.com", First: "วิชญ์", Last: "เทคโน",
			Birth: time.Date(2002, 10, 20, 0, 0, 0, 0, time.UTC), Nat: "ไทย", Rel: "พุทธ",
			Tel: "0891234567", Height: 170, Weight: 62, GenderName: "Male"},
		{Email: "s3@example.com", First: "อรพิน", Last: "ใจเย็น",
			Birth: time.Date(2001, 3, 15, 0, 0, 0, 0, time.UTC), Nat: "ไทย", Rel: "พุทธ",
			Tel: "0912345678", Height: 160, Weight: 50, GenderName: "Female"},
		{Email: "s4@example.com", First: "พิมพ์ใจ", Last: "คนดี",
			Birth: time.Date(2002, 2, 10, 0, 0, 0, 0, time.UTC), Nat: "ไทย", Rel: "พุทธ",
			Tel: "0999999999", Height: 158, Weight: 48, GenderName: "Female"},
		{Email: "b6526542@g.sut.ac.th", First: "สุริยา", Last: "ตัวอย่าง",
			Birth: time.Date(2001, 7, 12, 0, 0, 0, 0, time.UTC), Nat: "ไทย", Rel: "พุทธ",
			Tel: "0810000000", Height: 172, Weight: 68, GenderName: "Male"},
	}

	for _, r := range rows {
		uid, ok := getUserID(r.Email)
		if !ok {
			continue
		}
		gid := gmap[r.GenderName]
		addrID := addrIDByEmail[r.Email] // ← ใช้ ID ที่มีอยู่

		stu := entity.Student{
			FirstName:   r.First,
			LastName:    r.Last,
			Birthday:    r.Birth,
			Age:         uint(calcAge(r.Birth)),
			Nationality: r.Nat,
			Religion:    r.Rel,
			PhoneNumber: r.Tel,
			Height:      r.Height,
			Weight:      r.Weight,
			GenderID:    gid,
			UserID:      uid,
			AddressID:   addrID, // ✅ ผูกที่อยู่ตาม ID ที่มีอยู่จริง
		}

		// กันซ้ำด้วย UserID
		if err := db.FirstOrCreate(&stu, entity.Student{UserID: uid}).Error; err != nil {
			log.Println("seed student:", r.Email, err)
		}
	}
}
