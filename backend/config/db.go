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
		&entity.Benefit{},
		&entity.WorkMode{},
		&entity.WorkMode{},
		&entity.JobType{},
		&entity.JobType{},
		&entity.Stipend{},
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
	db.Create(&genders)

	// ผู้ใช้ (User)
	user1 := entity.User{Email: "staff1@example.com", Password: "password123"}
	user2 := entity.User{Email: "admin1@example.com", Password: "adminpass"}
	user3 := entity.User{Email: "company@example.com", Password: "companypass"}
	db.Create(&user1)
	db.Create(&user2)
	db.Create(&user3)

	// ที่อยู่ (Address)
	address := entity.Address{
		HouseNumber: "123",
		Village:     "หมู่บ้าน ABC",
		Street:      "ถนนหลัก",
		SubStreet:   "",
		Subdistrict: "ตำบลทดสอบ",
		District:    "อำเภอเมือง",
		Province:    "กรุงเทพมหานคร",
	}

	db.Create(&address)
	address2 := entity.Address{
		HouseNumber: "123",
		Village:     "หมู่บ้าน ABC",
		Street:      "ถนนหลัก",
		SubStreet:   "",
		Subdistrict: "ตำบลทดสอบ",
		District:    "อำเภอเมือง",
		Province:    "กรุงเทพมหานคร",
	}
	db.Create(&address2)
	// แอดมิน (Admin)
	admin := entity.Admin{
		FirstName: "สมชาย",
		LastName:  "แอดมิน",
		Birthday:  time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
		UserID:    2,
	}
	db.Create(&admin)

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
		UserID:           1,
		AddressID:        1,
		AdminID:          1,
		GenderID:         1,
	}
	db.Create(&staff)
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
	db.Create(&student)
	// สิทธิประโยชน์ (Benefit)
	benefit := entity.Benefit{
		Benefit:     "ค่าตอบแทน",
		BenefitName: "มีเบี้ยเลี้ยง",
	}
	db.Create(&benefit)
}