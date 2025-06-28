package config

import (
	"fmt"
	"log"
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
	)

	createSeedData(db)
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
			Postcode: "12345",
		},
		{
			HouseNumber: "456",
			Village:     "หมู่บ้าน XYZ",
			Street:      "ถนนรอง",
			SubStreet:   "ซอยรอง",
			Subdistrict: "ตำบลทดสอบ 2",
			District:    "อำเภอบางนา",
			Province:    "กรุงเทพมหานคร",
			Postcode: "12345",
		},
		{
			HouseNumber: "789",
			Village:     "หมู่บ้าน QWE",
			Street:      "ถนนใหญ่",
			SubStreet:   "ซอยรอง",
			Subdistrict: "ตำบลทดสอบ 3",
			District:    "อำเภอพระโขนง",
			Province:    "กรุงเทพมหานคร",
			Postcode: "12345",
		},
		{
			HouseNumber: "101",
			Village:     "หมู่บ้าน ASD",
			Street:      "ถนนซอย",
			SubStreet:   "ซอยรอง",
			Subdistrict: "ตำบลทดสอบ 4",
			District:    "อำเภอลาดกระบัง",
			Province:    "กรุงเทพมหานคร",
			Postcode: "12345",
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
	admin := entity.Admin{
		FirstName: "สมชาย",
		LastName:  "แอดมิน",
		Birthday:  time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
		UserID:    1,
	}
	db.FirstOrCreate(&admin, entity.Admin{UserID: admin.UserID})

	// Seed Permission
	permissions := []entity.Permission{
		{Name: "Read", Description: "Read-only access", AdminID: admin.ID},
		{Name: "Write", Description: "Write access", AdminID: admin.ID},
		{Name: "Delete", Description: "Delete access", AdminID: admin.ID},
	}
	for _, p := range permissions {
		db.FirstOrCreate(&p, entity.Permission{Name: p.Name})
	}

	// บุคลากรทางวิชาการ (AcademicStaff)
	staff := entity.AcademicStaff{
		AcademicPosition: "อาจารย์",
		Age:              40,
		Faculty:          "วิศวกรรมศาสตร์",
		Department:       "วิศวกรรมคอมพิวเตอร์",
		University:       "มหาวิทยาลัยตัวอย่าง",
		Verify:           true,
		UserID:           4,
		AddressID:        1,
		AdminID:          1,
		GenderID:         1,
	}
	db.FirstOrCreate(&staff, entity.AcademicStaff{UserID: staff.UserID})

	students := []entity.Student{
		{
			FirstName:   "สมชาย",
			LastName:    "ใจดี",
			Birthday:    time.Date(2002, time.January, 1, 0, 0, 0, 0, time.UTC),
			Age: 21,
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
			Age: 21,
			Religion:    "พุทธ",
			PhoneNumber: "0912345678",
			Height:      160.0,
			Weight:      50.0,
			GenderID:    2,
			UserID:      3,
			AddressID:   3,
			AdminID:     1,
		},
		{
			FirstName:   "อรพินนะ",
			LastName:    "ใจเย็น",
			Birthday:    time.Date(2001, time.March, 15, 0, 0, 0, 0, time.UTC),
			Age: 21,
			Nationality: "ไทย",
			Religion:    "พุทธ",
			PhoneNumber: "0912345678",
			Height:      160.0,
			Weight:      50.0,
			GenderID:    2,
			UserID:      3,
			AddressID:   3,
			AdminID:     1,
		},
		{
			FirstName:   "ใจร้อน",
			LastName:    "ใจเย็น",
			Birthday:    time.Date(2001, time.March, 15, 0, 0, 0, 0, time.UTC),
			Age: 21,
			Nationality: "ไทย",
			Religion:    "พุทธ",
			PhoneNumber: "0912345678",
			Height:      160.0,
			Weight:      50.0,
			GenderID:    2,
			UserID:      3,
			AddressID:   3,
			AdminID:     1,
		},
	}
	for _, s := range students {
		db.FirstOrCreate(&s, entity.Student{FirstName: s.FirstName})
	}

	company := &entity.Company{
		CompanyName: "Example Co., Ltd.",
		Logo:        "logo.png",
		Verify:      false,
		UserID:      2,
		AddressID:   1,
	}


	// ค้นหาจาก company_name ถ้าไม่มีให้สร้างใหม่
	err := db.Where("company_name = ?", company.CompanyName).FirstOrCreate(company).Error
	if err != nil {
		// handle error
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
	statusPosts := []entity.StatusPost{
		{StatusPost: "Open"},
		{StatusPost: "Closed"},
		{StatusPost: "Pending Approval"},
	}
	for _, pkg := range statusPosts {
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
			CompanyID:       1,
			StatusPostID:    1,
			AdminID:         1,
			WorkModeID:      2,
			BenefitID:       3,
			WorkDayID:       2,
			StipendID:       3,
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
	education := entity.Education{
		University:     "Chulalongkorn University",
		Faculty:        "Engineering",
		Major:          "Computer Engineering", 
		Year:           3,
		EducationLevel: "Bachelor's Degree",
		Grade:          3.5,
		StudentID:      1,
	}

	// FirstOrCreate (เช็คซ้ำกันตาม StudentID, Major, Year)
	db.FirstOrCreate(&education, entity.Education{
		StudentID: education.StudentID,
		Major:     education.Major,
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

}
