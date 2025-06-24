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
		{Email: "s@example.com", Password: hashedPassword, RoleID: 3, IsActive: true},
		{Email: "tn@example.com", Password: hashedPassword, RoleID: 4, IsActive: true},
	}
	for _, pkg := range User {
		db.FirstOrCreate(&pkg, entity.User{Email: pkg.Email})
	}

	// ที่อยู่ (Address)
	addresses := []entity.Address{
		{
			HouseNumber: "123",
			Village:     "หมู่บ้าน ABC",
			Street:      "ถนนหลัก",
			SubStreet:   "",
			Subdistrict: "ตำบลทดสอบ 1",
			District:    "อำเภอเมือง",
			Province:    "กรุงเทพมหานคร",
		},
		{
			HouseNumber: "456",
			Village:     "หมู่บ้าน XYZ",
			Street:      "ถนนรอง",
			SubStreet:   "",
			Subdistrict: "ตำบลทดสอบ 2",
			District:    "อำเภอบางนา",
			Province:    "กรุงเทพมหานคร",
		},
		{
			HouseNumber: "789",
			Village:     "หมู่บ้าน QWE",
			Street:      "ถนนใหญ่",
			SubStreet:   "",
			Subdistrict: "ตำบลทดสอบ 3",
			District:    "อำเภอพระโขนง",
			Province:    "กรุงเทพมหานคร",
		},
		{
			HouseNumber: "101",
			Village:     "หมู่บ้าน ASD",
			Street:      "ถนนซอย",
			SubStreet:   "",
			Subdistrict: "ตำบลทดสอบ 4",
			District:    "อำเภอลาดกระบัง",
			Province:    "กรุงเทพมหานคร",
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

	// Student
	student := entity.Student{
		FirstName:   "สมชาย",
		LastName:    "ใจดี",
		Birthday:    time.Date(2002, time.January, 1, 0, 0, 0, 0, time.UTC),
		Nationality: "ไทย",
		Religion:    "พุทธ",
		PhoneNumber: "0987654321",
		Height:      175.0,
		Weight:      65.0,
		GenderID:    1,
		UserID:      3,
		AddressID:   2,
		AdminID:     1,
	}
	db.FirstOrCreate(&student, entity.Student{UserID: student.UserID})

	// หมวดหมู่งาน (jobtype)
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

	// สถานที่ปฏิบัติงาน (WorkMode)
	workModes := []entity.WorkMode{
		{WorkMode: "ทั้งหมด"},
		{WorkMode: "On-site"},
		{WorkMode: "Hybrid"},
		{WorkMode: "Work From Home"},
	}
	for _, wm := range workModes {
		db.FirstOrCreate(&wm, entity.WorkMode{WorkMode: wm.WorkMode})
	}
	// จำนวนวันฝึกงาน
	workDays := []entity.WorkDay{
		{WorkDay: "ทั้งหมด"},
		{WorkDay: "5 วัน/สัปดาห์"},
		{WorkDay: "6 วัน/สัปดาห์"},
		{WorkDay: "บริษัทกำหนดเอง"},
	}
	for _, wd := range workDays {
		db.FirstOrCreate(&wd, entity.WorkDay{WorkDay: wd.WorkDay})
	}
	// เบี้ยเลี้ยง
	stipends := []entity.Stipend{
		{Stipend: "ทั้งหมด"},
		{Stipend: "ไม่กำหนด"},
		{Stipend: "ตามความสามารถนักศึกษา"},
		{Stipend: "500"},
		{Stipend: "1000"},
	}
	for _, s := range stipends {
		db.FirstOrCreate(&s, entity.Stipend{Stipend: s.Stipend})
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

}
