package config

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
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
		&entity.StatusVerify{},
	)

	createSeedData(db)
	insertEducationFromCSV(db, "./config/data/university_2567.csv")

}

func createSeedData(db *gorm.DB) {
	// สร้าง Role
	roles := []entity.Role{
		{RoleName: "Admin"},
		{RoleName: "Company"},
		{RoleName: "Student"},
		{RoleName: "AcademicStaff"},
	}
	for _, role := range roles {
		db.FirstOrCreate(&role, entity.Role{RoleName: role.RoleName})
	}

	// สร้าง Gender
	genders := []entity.Gender{
		{Name: "Male"},
		{Name: "Female"},
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
		{Email: "s5@example.com", Password: hashedPassword, RoleID: 3, IsActive: true},

		{Email: "tn2@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
		{Email: "tn3@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
		{Email: "tn4@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
		{Email: "tn5@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
	}
	for _, pkg := range User {
		db.FirstOrCreate(&pkg, entity.User{Email: pkg.Email})
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
		{WorkMode: "ทั้งหมด"},
		{WorkMode: "On-site"},
		{WorkMode: "Remote"},
		{WorkMode: "Hybrid"},
	}
	for _, pkg := range workModes {
		db.FirstOrCreate(&pkg, entity.WorkMode{WorkMode: pkg.WorkMode})
	}

	// Seed Work Days
	workDays := []entity.WorkDay{
		{WorkDay: "ทั้งหมด"},
		{WorkDay: "จันทร์ - ศุกร์"},
		{WorkDay: "จันทร์ - เสาร์"},
		{WorkDay: "บริษัทกำหนดเอง"},
	}
	for _, pkg := range workDays {
		db.FirstOrCreate(&pkg, entity.WorkDay{WorkDay: pkg.WorkDay})
	}

	stipends := []entity.Stipend{
		{Stipend: "ทั้งหมด"},
		{Stipend: "ไม่กำหนด"},
		{Stipend: "ตามความสามารถนักศึกษา"},
		{Stipend: "5,000 - 10,000 THB"},
		{Stipend: "10,000 - 15,000 THB"},
		{Stipend: "15,000+ THB"},
	}
	for _, pkg := range stipends {
		db.FirstOrCreate(&pkg, entity.Stipend{Stipend: pkg.Stipend})
	}
	//----------------Provinces-------------//
	provinces := []string{
		"กรุงเทพมหานคร", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น",
		"จันทบุรี", "ฉะเชิงเทรา", "ชัยนาท", "ชัยภูมิ", "ชลบุรี",
		"ชุมพร", "เชียงใหม่", "เชียงราย", "ตราด", "ตรัง",
		"ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา",
		"นครสวรรค์", "นครศรีธรรมราช", "นนทบุรี", "นราธิวาส", "น่าน",
		"บึงกาฬ", "บุรีรัมย์", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปทุมธานี",
		"ปัตตานี", "พระนครศรีอยุธยา", "พังงา", "พัทลุง", "พะเยา",
		"เพชรบุรี", "เพชรบูรณ์", "พิจิตร", "พิษณุโลก", "แพร่",
		"มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร",
		"ร้อยเอ็ด", "ระนอง", "ราชบุรี", "ระยอง", "ลพบุรี",
		"ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร",
		"สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว",
		"สระบุรี", "สงขลา", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี",
		"สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อำนาจเจริญ", "อุดรธานี",
		"อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี", "อ่างทอง", "อำนาจเจริญ",
		"บึงกาฬ", "ยะลา", "ยโสธร",
	}
	for _, provinceName := range provinces {
		db.FirstOrCreate(&entity.Provinces{Province: provinceName}, &entity.Provinces{Province: provinceName})
	}

	// ที่อยู่ (Address)
	addresses := []entity.Address{
		{
			HouseNumber: "123",
			Village:     "หมู่บ้าน ABC",
			Street:      "ถนนหลัก",
			SubStreet:   "ซอยรอง",
			Subdistrict: "ตำบลทดสอบ 1",
			District:    "อำเภอเมือง",
			Province:    "กรุงเทพมหานคร",
			Postcode:    "12345",
		},
		{
			HouseNumber: "456",
			Village:     "หมู่บ้าน XYZ",
			Street:      "ถนนรอง",
			SubStreet:   "ซอยรอง",
			Subdistrict: "ตำบลทดสอบ 2",
			District:    "อำเภอบางนา",
			Province:    "กรุงเทพมหานคร",
			Postcode:    "12345",
		},
		{
			HouseNumber: "789",
			Village:     "หมู่บ้าน QWE",
			Street:      "ถนนใหญ่",
			SubStreet:   "ซอยรอง",
			Subdistrict: "ตำบลทดสอบ 3",
			District:    "อำเภอพระโขนง",
			Province:    "กรุงเทพมหานคร",
			Postcode:    "12345",
		},
		{
			HouseNumber: "101",
			Village:     "หมู่บ้าน ASD",
			Street:      "ถนนซอย",
			SubStreet:   "ซอยรอง",
			Subdistrict: "ตำบลทดสอบ 4",
			District:    "อำเภอลาดกระบัง",
			Province:    "กรุงเทพมหานคร",
			Postcode:    "12345",
		},
	}

	for _, addr := range addresses {
		db.FirstOrCreate(&addr, entity.Address{
			HouseNumber: addr.HouseNumber,
			Village:     addr.Village,
			District:    addr.District,
			Subdistrict: addr.Subdistrict,
			Province:    addr.Province,
		})
	}

	// แอดมิน (Admin)
	admins := []entity.Admin{
		{FirstName: "สมชาย", LastName: "แอดมิน", Birthday: time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC), UserID: 1},
		{FirstName: "อรพิน", LastName: "ดูแลระบบ", Birthday: time.Date(1985, 6, 15, 0, 0, 0, 0, time.UTC), UserID: 5},
	}
	for _, admin := range admins {
		db.FirstOrCreate(&admin,entity.AcademicStaff{UserID: admin.UserID})
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
		{AcademicPosition: "อาจารย์", Age: 38, Faculty: "วิทยาศาสตร์", Department: "เคมี", University: "มหาวิทยาลัย B", UserID: 14, AddressID: 1, AdminID: 1, GenderID: 2},
		{AcademicPosition: "ผู้ช่วยศาสตราจารย์", Age: 45, Faculty: "บริหารธุรกิจ", Department: "การตลาด", University: "มหาวิทยาลัย C", UserID: 15, AddressID: 1, AdminID: 1, GenderID: 1},
		{AcademicPosition: "รองศาสตราจารย์", Age: 50, Faculty: "ศิลปศาสตร์", Department: "ภาษาอังกฤษ", University: "มหาวิทยาลัย D", UserID: 16, AddressID: 1, AdminID: 1, GenderID: 2},
		{AcademicPosition: "อาจารย์", Age: 35, Faculty: "นิติศาสตร์", Department: "กฎหมายแพ่ง", University: "มหาวิทยาลัย E", UserID: 17, AddressID: 1, AdminID: 1, GenderID: 1},
	}
	for _, staff := range staffs {
		db.FirstOrCreate(&staff,entity.AcademicStaff{UserID: staff.UserID})
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
			AddressID:   2,
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
			AddressID:   3,
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
			AddressID:   3,
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
			AddressID:   3,
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
			AddressID:   4,
			AdminID:     1,
		},
	}
	for _, s := range students {
		db.FirstOrCreate(&s, entity.Student{FirstName: s.FirstName})
	}

	companies := []entity.Company{
		{CompanyName: "Alpha Tech Co., Ltd.", Logo: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png", UserID: 2, AddressID: 1},
		{CompanyName: "Beta Solutions Co., Ltd.", Logo: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png", UserID: 6, AddressID: 1},
		{CompanyName: "Gamma Innovations Co., Ltd.", Logo: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png", UserID: 7, AddressID: 1},
		{CompanyName: "Delta Software Co., Ltd.", Logo: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png", UserID: 8, AddressID: 1},
		{CompanyName: "Epsilon Systems Co., Ltd.", Logo: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png", UserID: 9, AddressID: 1},
	}
	// ค้นหาจาก company_name ถ้าไม่มีให้สร้างใหม่
	for _, company := range companies {
		db.FirstOrCreate(&company,entity.Company{CompanyName: company.CompanyName})
	}

	// สิทธิประโยชน์ (Benefit)
	benefits := []entity.Benefit{
		{Benefit: "travel", BenefitName: "ค่าเดินทาง"},
		{Benefit: "food", BenefitName: "อาหาร"},
		{Benefit: "overtime", BenefitName: "ค่าล่วงเวลา"},
		{Benefit: "accommodation", BenefitName: "ที่พัก"},
	}
	for _, b := range benefits {
		db.FirstOrCreate(&b, entity.Benefit{Benefit: b.Benefit})
	}

	// Seed Status Posts
	StatusPosts := []entity.StatusPost{
		{StatusPost: "Open"},
		{StatusPost: "Closed"},
		{StatusPost: "Pending Approval"},
	}
	for _, pkg := range StatusPosts {
		db.FirstOrCreate(&pkg, entity.StatusPost{StatusPost: pkg.StatusPost})
	}
	
	IntershipPost := []entity.IntershipPost{
		{
			PostName:        "Software Development Intern",
			PostDescription: "Join our team as a software development intern",
			Qualifications:  "Computer Science student, knowledge of Python/Java",
			Quantity:        2,
			MinGpa:          "3.0",
			CreatedAt:       time.Now(),
			CompanyID:       1,
			StatusPostID:    1,
			AdminID:         1,
			WorkModeID:      1,
			BenefitID:       1,
			WorkDayID:       1,
			StipendID:       2,
		},
		{
			PostName:        "Data Science Intern",
			PostDescription: "Opportunity to work with real-world datasets",
			Qualifications:  "Statistics/Data Science background, Python/R skills",
			Quantity:        1,
			MinGpa:          "3.2",
			CreatedAt:       time.Now(),
			CompanyID:       2,
			StatusPostID:    1,
			AdminID:         1,
			WorkModeID:      2,
			BenefitID:       3,
			WorkDayID:       2,
			StipendID:       3,
		},
		{
			PostName:        "UI/UX Designer Intern",
			PostDescription: "Assist in designing intuitive user interfaces and experiences",
			Qualifications:  "Design student or related field, knowledge of Figma or Adobe XD",
			Quantity:        1,
			MinGpa:          "2.75",
			CreatedAt:       time.Now(),
			CompanyID:       3,
			StatusPostID:    1,
			AdminID:         2,
			WorkModeID:      2,
			BenefitID:       2,
			WorkDayID:       2,
			StipendID:       1,
		},
		{
			PostName:        "Marketing Intern",
			PostDescription: "Support digital campaigns and social media content creation",
			Qualifications:  "Marketing or Business major, good communication skills",
			Quantity:        3,
			MinGpa:          "2.5",
			CreatedAt:       time.Now(),
			CompanyID:       4,
			StatusPostID:    1,
			AdminID:         3,
			WorkModeID:      3,
			BenefitID:       3,
			WorkDayID:       1,
			StipendID:       3,
		},
		{
			PostName:        "Data Analyst Intern",
			PostDescription: "Analyze data trends and provide reports using Excel and SQL",
			Qualifications:  "Math, Statistics, or CS background, strong in Excel",
			Quantity:        2,
			MinGpa:          "3.2",
			CreatedAt:       time.Now(),
			CompanyID:       1,
			StatusPostID:    1,
			AdminID:         4,
			WorkModeID:      2,
			BenefitID:       4,
			WorkDayID:       1,
			StipendID:       1,
		},
		{
			PostName:        "Content Writer Intern",
			PostDescription: "Write blogs, articles, and social media content",
			Qualifications:  "Strong writing skills, fluent in Thai and English",
			Quantity:        1,
			MinGpa:          "2.8",
			CreatedAt:       time.Now(),
			CompanyID:       2,
			StatusPostID:    1,
			AdminID:         5,
			WorkModeID:      3,
			BenefitID:       1,
			WorkDayID:       2,
			StipendID:       2,
		},
		{
			PostName:        "Network Engineer Intern",
			PostDescription: "Assist IT department in managing network and servers",
			Qualifications:  "Knowledge in networking, CCNA is a plus",
			Quantity:        2,
			MinGpa:          "3.0",
			CreatedAt:       time.Now(),
			CompanyID:       3,
			StatusPostID:    1,
			AdminID:         6,
			WorkModeID:      1,
			BenefitID:       2,
			WorkDayID:       1,
			StipendID:       3,
		},
		{
			PostName:        "Graphic Designer Intern",
			PostDescription: "Design promotional materials for print and digital media",
			Qualifications:  "Proficient in Photoshop and Illustrator",
			Quantity:        1,
			MinGpa:          "2.7",
			CreatedAt:       time.Now(),
			CompanyID:       4,
			StatusPostID:    1,
			AdminID:         7,
			WorkModeID:      2,
			BenefitID:       3,
			WorkDayID:       2,
			StipendID:       1,
		},
		{
			PostName:        "QA Tester Intern",
			PostDescription: "Test applications and report bugs to development team",
			Qualifications:  "Attention to detail, basic understanding of software testing",
			Quantity:        2,
			MinGpa:          "2.9",
			CreatedAt:       time.Now(),
			CompanyID:       4,
			StatusPostID:    1,
			AdminID:         8,
			WorkModeID:      1,
			BenefitID:       4,
			WorkDayID:       1,
			StipendID:       2,
		},
	}
	for _, pkg := range IntershipPost {
		db.FirstOrCreate(&pkg, entity.IntershipPost{PostName: pkg.PostName})
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
		Year:           3,
		EducationLevelID: 1,
		Grade:          3.5,
		StudentID:      1,
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
			Status:          "นัดแล้ว",
			StudentID:       1,
			CompanyID:       1,
		},
		{
			AppointmentDate: time.Now().Add(-3 * 24 * time.Hour),
			Mode:            "ออนไซต์",
			Details:         "คุณผ่านการสัมภาษณ์เรียบร้อยแล้ว",
			Status:          "ผ่าน",
			StudentID:       2,
			CompanyID:       2,
		},
		{
			AppointmentDate: time.Now().Add(-4 * 24 * time.Hour),
			Mode:            "ออนไลน์",
			Details:         "ขอบคุณที่เข้าร่วมสัมภาษณ์",
			Status:          "ไม่ผ่าน",
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
			VerificationDocument: "https://www.pngmart.com/files/13/Chibi-Anime-Boy-PNG-Transparent-Picture.png",
			StatusVerifyID:       1,
			UserID:               2,
		},
		{
			VerificationDocument: "https://www.pngmart.com/files/13/Chibi-Anime-Boy-PNG-Transparent-Picture.png",
			StatusVerifyID:       2,
			UserID:               6,
		},
		{
			VerificationDocument: "https://mondaymandala.com/wp-content/uploads/Kawaii-Chibi-Girl-In-Pigtails-Coloring-Sheet.pdf",
			StatusVerifyID:       3,
			UserID:               4,
		},
		{
			VerificationDocument: "https://mondaymandala.com/wp-content/uploads/Kawaii-Chibi-Girl-In-Pigtails-Coloring-Sheet.pdf",
			StatusVerifyID:       4,
			UserID:               14,
		},
	}
	for _, v := range verifies {
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
