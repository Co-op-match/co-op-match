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

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {
	database, err := gorm.Open(sqlite.Open("co-op-match.db?cache=shared"), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	fmt.Println("connected database")
	db = database
}
func SetupDatabase() {
	// Migrate เฉพาะ Entity ที่ระบุ
	db.AutoMigrate(
		&entity.Role{},
		&entity.Permission{},
		&entity.RolePermission{},
		&entity.User{},
		&entity.Gender{},
		&entity.Provinces{},
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
	)
	createSeedData(db)
	insertEducationFromCSV(db, "./config/data/university_2567.csv")
	ImportProvincesCSV(db, "./config/data/address/provinces.csv")
	ImportDistrictsCSV(db, "./config/data/address/districts.csv")
	ImportPostcodesCSV(db, "./config/data/address/postcode.csv")
	ImportSubDistrictsCSV(db, "./config/data/address/subdistricts.csv")
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

	// ผู้ใช้ (User)
	hashedPassword, _ := HashPassword("123456")

	//User
	User := []entity.User{
		{Email: "a@example.com", Password: hashedPassword, RoleID: 1, IsActive: true},
		{Email: "c@example.com", Password: hashedPassword, RoleID: 2, IsActive: true},
		{Email: "Jetsadaphon31852@gmail.com", Password: hashedPassword, RoleID: 3, IsActive: true},
		{Email: "tn@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},

		{Email: "a2@example.com", Password: hashedPassword, RoleID: 1, IsActive: true},

		{Email: "c2@example.com", Password: hashedPassword, RoleID: 2, IsActive: true},
		{Email: "c3@example.com", Password: hashedPassword, RoleID: 2, IsActive: true},
		{Email: "c4@example.com", Password: hashedPassword, RoleID: 2, IsActive: true},
		{Email: "c5@example.com", Password: hashedPassword, RoleID: 2, IsActive: true},

		{Email: "s2@example.com", Password: hashedPassword, RoleID: 3, IsActive: true},
		{Email: "s3@example.com", Password: hashedPassword, RoleID: 3, IsActive: true},
		{Email: "s4@example.com", Password: hashedPassword, RoleID: 3, IsActive: true},
		{Email: "B6526542@g.sut.ac.th", Password: hashedPassword, RoleID: 3, IsActive: true},

		{Email: "tn2@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
		{Email: "tn3@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
		{Email: "tn4@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
		{Email: "tn5@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
	}
	for _, pkg := range User {
		db.Unscoped().FirstOrCreate(&pkg, entity.User{Email: pkg.Email})
	}

	// Seed Profile Images
	profileImages := []entity.ProfileImage{
		{
			ImageURL: "https://example.com/profiles/user1.jpg",
			UserID:   1,
		},
		{
			ImageURL: "https://example.com/profiles/user2.jpg",
			UserID:   2,
		},
		{
			ImageURL: "https://img2.pic.in.th/pic/Co-op-match-Photoroom.png",
			UserID:   3,
		},
		{
			ImageURL: "https://example.com/profiles/user4.jpg",
			UserID:   4,
		},
	}
	for _, pkg := range profileImages {
		db.FirstOrCreate(&pkg, entity.ProfileImage{UserID: pkg.UserID})
	}

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
	for _, pkg := range jobTypes {
		db.FirstOrCreate(&pkg, entity.JobType{JobType: pkg.JobType})
	}

	// Seed Work Modes
	workModes := []entity.WorkMode{
		{WorkMode: "On-site"},
		{WorkMode: "Remote"},
		{WorkMode: "Hybrid"},
	}
	for _, pkg := range workModes {
		db.FirstOrCreate(&pkg, entity.WorkMode{WorkMode: pkg.WorkMode})
	}

	// Seed Work Days
	workDays := []entity.WorkDay{
		{WorkDay: "จันทร์ - ศุกร์"},
		{WorkDay: "จันทร์ - เสาร์"},
		{WorkDay: "บริษัทกำหนดเอง"},
	}
	for _, pkg := range workDays {
		db.FirstOrCreate(&pkg, entity.WorkDay{WorkDay: pkg.WorkDay})
	}

	stipends := []entity.Stipend{
		{Stipend: "ไม่กำหนด"},
		{Stipend: "ตามความสามารถนักศึกษา"},
		{Stipend: "5,000 - 10,000 THB"},
		{Stipend: "10,000 - 15,000 THB"},
		{Stipend: "15,000+ THB"},
	}
	for _, pkg := range stipends {
		db.FirstOrCreate(&pkg, entity.Stipend{Stipend: pkg.Stipend})
	}

	// ที่อยู่ (Address)
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
			DistrictID:    addr.DistrictID,
			SubDistrictID: addr.SubDistrictID,
			Province:      addr.Province,
		})
	}

	// แอดมิน (Admin)
	admins := []entity.Admin{
		{FirstName: "สมชาย", LastName: "แอดมิน", Birthday: time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC), UserID: 1},
		{FirstName: "อรพิน", LastName: "ดูแลระบบ", Birthday: time.Date(1985, 6, 15, 0, 0, 0, 0, time.UTC), UserID: 5},
	}
	for _, admin := range admins {
		db.Unscoped().FirstOrCreate(&admin, entity.AcademicStaff{UserID: admin.UserID})
	}

	// Seed Permission
	permissions := []entity.Permission{
		{Name: "Read", Description: "Read-only access", AdminID: 1},
		{Name: "Write", Description: "Write access", AdminID: 1},
		{Name: "Delete", Description: "Delete access", AdminID: 1},
	}
	for _, p := range permissions {
		db.FirstOrCreate(&p, entity.Permission{Name: p.Name})
	}

	// บุคลากรทางวิชาการ (AcademicStaff)
	staffs := []entity.AcademicStaff{
		{AcademicPosition: "อาจารย์", Age: 40, Faculty: "วิศวกรรมศาสตร์", Department: "คอมพิวเตอร์", University: "มหาวิทยาลัย A", UserID: 4, AddressID: 1, AdminID: 1, GenderID: 1},
		{AcademicPosition: "อาจารย์", Age: 38, Faculty: "วิทยาศาสตร์", Department: "เคมี", University: "มหาวิทยาลัย B", UserID: 14, AddressID: 2, AdminID: 1, GenderID: 2},
		{AcademicPosition: "ผู้ช่วยศาสตราจารย์", Age: 45, Faculty: "บริหารธุรกิจ", Department: "การตลาด", University: "มหาวิทยาลัย C", UserID: 15, AddressID: 3, AdminID: 1, GenderID: 1},
		{AcademicPosition: "รองศาสตราจารย์", Age: 50, Faculty: "ศิลปศาสตร์", Department: "ภาษาอังกฤษ", University: "มหาวิทยาลัย D", UserID: 16, AddressID: 4, AdminID: 1, GenderID: 2},
		{AcademicPosition: "อาจารย์", Age: 35, Faculty: "นิติศาสตร์", Department: "กฎหมายแพ่ง", University: "มหาวิทยาลัย E", UserID: 17, AddressID: 5, AdminID: 1, GenderID: 1},
	}
	for _, staff := range staffs {
		db.Unscoped().FirstOrCreate(&staff, entity.AcademicStaff{UserID: staff.UserID})
	}

	students := []entity.Student{
		{
			FirstName:   "สมชาย",
			LastName:    "ใจดี",
			Birthday:    time.Date(2002, time.January, 1, 0, 0, 0, 0, time.UTC),
			Age:         21,
			Nationality: "ไทย",
			Religion:    "พุทธ",
			PhoneNumber: "0987654321",
			Height:      175.0,
			Weight:      65.0,
			GenderID:    1,
			UserID:      3,
			AddressID:   6,
			AdminID:     1,
		},
		{
			FirstName:   "อรพินมา",
			LastName:    "ใจเย็น",
			Birthday:    time.Date(2001, time.March, 15, 0, 0, 0, 0, time.UTC),
			Nationality: "ไทย",
			Age:         21,
			Religion:    "พุทธ",
			PhoneNumber: "0912345678",
			Height:      160.0,
			Weight:      50.0,
			GenderID:    2,
			UserID:      10,
			AddressID:   7,
			AdminID:     1,
		},
		{
			FirstName:   "อรพินนะ",
			LastName:    "ใจเย็น",
			Birthday:    time.Date(2001, time.March, 15, 0, 0, 0, 0, time.UTC),
			Age:         21,
			Nationality: "ไทย",
			Religion:    "พุทธ",
			PhoneNumber: "0912345678",
			Height:      160.0,
			Weight:      50.0,
			GenderID:    2,
			UserID:      11,
			AddressID:   8,
			AdminID:     1,
		},
		{
			FirstName:   "ใจร้อน",
			LastName:    "ใจเย็น",
			Birthday:    time.Date(2001, time.March, 15, 0, 0, 0, 0, time.UTC),
			Age:         21,
			Nationality: "ไทย",
			Religion:    "พุทธ",
			PhoneNumber: "0912345678",
			Height:      160.0,
			Weight:      50.0,
			GenderID:    2,
			UserID:      12,
			AddressID:   9,
			AdminID:     1,
		},
		{
			FirstName:   "พิมพ์ใจ",
			LastName:    "คนดี",
			Birthday:    time.Date(2002, time.February, 10, 0, 0, 0, 0, time.UTC),
			Age:         22,
			Nationality: "ไทย",
			Religion:    "พุทธ",
			PhoneNumber: "0999999999",
			Height:      158.0,
			Weight:      48.0,
			GenderID:    2,
			UserID:      13,
			AddressID:   10,
			AdminID:     1,
		},
		{
			FirstName:   "วิชญ์",
			LastName:    "เทคโน",
			Birthday:    time.Date(2002, 10, 20, 0, 0, 0, 0, time.UTC),
			Age:         22,
			Nationality: "ไทย",
			Religion:    "พุทธ",
			PhoneNumber: "0891234567",
			Height:      158.0,
			Weight:      48.0,
			GenderID:    1,
			UserID:      5,
			AddressID:   4,
			AdminID:     1,
		},
	}
	for _, s := range students {
		db.Unscoped().FirstOrCreate(&s, entity.Student{UserID: s.UserID})
	}

	companies := []entity.Company{
		{CompanyName: "Alpha Tech Co., Ltd.", Logo: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png", UserID: 2, AddressID: 11},
		{CompanyName: "Beta Solutions Co., Ltd.", Logo: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png", UserID: 6, AddressID: 12},
		{CompanyName: "Gamma Innovations Co., Ltd.", Logo: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png", UserID: 7, AddressID: 13},
		{CompanyName: "Delta Software Co., Ltd.", Logo: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png", UserID: 8, AddressID: 14},
		{CompanyName: "Epsilon Systems Co., Ltd.", Logo: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png", UserID: 9, AddressID: 15},
	}
	for _, company := range companies {
		db.Unscoped().FirstOrCreate(&company, entity.Company{UserID: company.UserID})
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
	StatusPosts := []entity.StatusPost{
		{StatusPost: "Open", StatusPostTH: "เปิดรับสมัคร"},
		{StatusPost: "Closed", StatusPostTH: "ปิดรับสมัคร"},
		{StatusPost: "Pending Approval", StatusPostTH: "รอตรวจสอบ"},
	}
	for _, pkg := range StatusPosts {
		db.FirstOrCreate(&pkg, entity.StatusPost{StatusPost: pkg.StatusPost})
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
			Benefits: []entity.Benefit{
				{Model: gorm.Model{ID: 1}}, // Or whichever Benefit ID is appropriate
			},
			WorkDayID: 1,
			StipendID: 2,
			JobTypeID: 1,
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
			Benefits: []entity.Benefit{
				{Model: gorm.Model{ID: 3}}, // Or whichever Benefit ID is appropriate
			},
			WorkDayID: 2,
			StipendID: 3,
			JobTypeID: 4,
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
			Benefits: []entity.Benefit{
				{Model: gorm.Model{ID: 2}}, // Or whichever Benefit ID is appropriate
			},
			WorkDayID: 3,
			StipendID: 2,
			JobTypeID: 4,
		},
		{
			PostName:        "Frontend Developer Intern",
			PostDescription: "Build beautiful UIs with React",
			Quantity:        1,
			MinGpa:          2.8,
			CreatedAt:       time.Now(),
			CompanyID:       1,
			StatusPostID:    1,
			AdminID:         1,
			WorkModeID:      1,
			Benefits: []entity.Benefit{
				{Model: gorm.Model{ID: 1}}, // Or whichever Benefit ID is appropriate
			},
			WorkDayID: 1,
			StipendID: 2,
			JobTypeID: 1,
		},
	}

	for _, post := range intershipPosts {
		db.Create(&post)
		db.Create(&entity.CompanyRequiredSkill{
			SkillID:         1,
			IntershipPostID: intershipPosts[0].ID,
		})
		db.Create(&entity.CompanyRequiredSkill{
			SkillID:         2,
			IntershipPostID: intershipPosts[0].ID,
		})
		db.Create(&entity.CompanyRequiredSkill{
			SkillID:         3,
			IntershipPostID: intershipPosts[1].ID,
		})
		db.Create(&entity.CompanyRequiredSkill{
			SkillID:         4,
			IntershipPostID: intershipPosts[1].ID,
		})
		db.Create(&entity.CompanyRequiredSkill{SkillID: 1, IntershipPostID: 3}) // Python
		db.Create(&entity.CompanyRequiredSkill{SkillID: 5, IntershipPostID: 3}) // Data Analysis

		db.Create(&entity.CompanyRequiredSkill{SkillID: 3, IntershipPostID: 4}) // JavaScript
		db.Create(&entity.CompanyRequiredSkill{SkillID: 4, IntershipPostID: 4}) // SQL

	}
	// Seed Skills
	skills := []entity.Skill{
		{SkillName: "Python"},
		{SkillName: "Java"},
		{SkillName: "JavaScript"},
		{SkillName: "SQL"},
		{SkillName: "Data Analysis"},
	}
	for _, pkg := range skills {
		db.FirstOrCreate(&pkg, entity.Skill{SkillName: pkg.SkillName})
	}

	// Seed Interests
	interests := []entity.Interest{
		{InterestName: "Web Development"},
		{InterestName: "Mobile Development"},
		{InterestName: "Data Science"},
		{InterestName: "AI/ML"},
	}
	for _, pkg := range interests {
		db.FirstOrCreate(&pkg, entity.Interest{InterestName: pkg.InterestName})
	}
	// Seed Student Skills
	studentSkills := []entity.StudentSkill{
		{SkillID: 1, StudentID: 1}, // Python
		{SkillID: 2, StudentID: 1}, // Java
		{SkillID: 4, StudentID: 1}, // SQL
		{SkillID: 1, StudentID: 2}, // Python
		{SkillID: 5, StudentID: 2}, // Data Analysis
	}
	for _, pkg := range studentSkills {
		db.FirstOrCreate(&pkg, entity.StudentSkill{SkillID: pkg.SkillID})
	}

	companyRequiredSkills := []entity.CompanyRequiredSkill{
		{SkillID: 1, IntershipPostID: 1}, // Python for Software Dev
		{SkillID: 2, IntershipPostID: 1}, // Java for Software Dev
		{SkillID: 1, IntershipPostID: 2}, // Python for Data Science
		{SkillID: 5, IntershipPostID: 2}, // Data Analysis for Data Science
	}

	for _, pkg := range companyRequiredSkills {
		db.FirstOrCreate(&pkg, entity.CompanyRequiredSkill{
			SkillID:         pkg.SkillID,
			IntershipPostID: pkg.IntershipPostID,
		})
	}
	studentInterests := []entity.StudentInterest{
		{StudentID: 1, InterestID: 1}, // Web Development
		{StudentID: 1, InterestID: 3}, // Data Science
		{StudentID: 2, InterestID: 4}, // AI/ML
		{StudentID: 3, InterestID: 2}, // Mobile Development
	}

	for _, si := range studentInterests {
		db.FirstOrCreate(&si, entity.StudentInterest{
			StudentID:  si.StudentID,
			InterestID: si.InterestID,
		})
	}

	// Seed Educational Background
	EducationLevels := []entity.EducationLevel{
		{Name: "ปริญญาตรี"},
		{Name: "ปริญญาโท"},
		{Name: "ปริญญาเอก"},
	}
	for _, pkg := range EducationLevels {
		db.FirstOrCreate(&pkg, entity.EducationLevel{Name: pkg.Name})
	}
	// 4. เพิ่มข้อมูล Education
	education := entity.Education{
		UniversityID:     1,
		FacultyID:        1,
		ProgramID:        1,
		Year:             3,
		EducationLevelID: 1,
		Grade:            3.5,
		StudentID:        1,
	}

	// Insert เฉพาะถ้ายังไม่มีข้อมูลซ้ำ
	db.FirstOrCreate(&education, entity.Education{
		StudentID: education.StudentID,
		ProgramID: education.ProgramID,
		Year:      education.Year,
	})
	interviewAppointments := []entity.InterviewAppointment{
		{
			AppointmentDate: time.Now().Add(7 * 24 * time.Hour),
			Mode:            "ออนไลน์",
			Details:         "ลิงก์ Zoom จะส่งให้ทางอีเมล",
			StudentID:       1,
			CompanyID:       1,
		},
		{
			AppointmentDate: time.Now().Add(-3 * 24 * time.Hour),
			Mode:            "ออนไซต์",
			Details:         "คุณผ่านการสัมภาษณ์เรียบร้อยแล้ว",
			StudentID:       2,
			CompanyID:       2,
		},
		{
			AppointmentDate: time.Now().Add(-4 * 24 * time.Hour),
			Mode:            "ออนไลน์",
			Details:         "ขอบคุณที่เข้าร่วมสัมภาษณ์",
			StudentID:       3,
			CompanyID:       1,
		},
	}

	for _, appointment := range interviewAppointments {
		db.FirstOrCreate(&appointment, entity.InterviewAppointment{
			StudentID:       appointment.StudentID,
			CompanyID:       appointment.CompanyID,
			AppointmentDate: appointment.AppointmentDate,
		})
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

	// Seed Status Posts
	StatusVerifies := []entity.StatusVerify{
		{StatusVerify: "ยังไม่ได้ส่งคำขอ"},
		{StatusVerify: "รอรับรอง"},
		{StatusVerify: "รับรอง"},
		{StatusVerify: "ปฏิเสธ"},
	}
	for _, pkg := range StatusVerifies {
		db.FirstOrCreate(&pkg, entity.StatusVerify{StatusVerify: pkg.StatusVerify})
	}

	// ยืนยันตัวตนของ อาจารย์ && บริษัท
	verifies := []entity.Verify{
		{
			VerificationDocument: "/uploads/verifyDocument/001.png",
			StatusVerifyID:       2,
			UserID:               2,
		},
		{
			VerificationDocument: "/uploads/verifyDocument/002.pdf",
			StatusVerifyID:       2,
			UserID:               6,
		},
		{
			VerificationDocument: "/uploads/verifyDocument/001.png",
			StatusVerifyID:       2,
			UserID:               4,
		},
		{
			VerificationDocument: "/uploads/verifyDocument/002.pdf",
			StatusVerifyID:       2,
			UserID:               14,
		},
	}
	for _, v := range verifies {
		v.Reason = "" // เพิ่มไว้เพื่อกัน struct validation error หากมี
		db.FirstOrCreate(&v, entity.Verify{UserID: v.UserID})
	}
}

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
