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
		db.FirstOrCreate(&admin, entity.AcademicStaff{UserID: admin.UserID})
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
		db.FirstOrCreate(&staff, entity.AcademicStaff{UserID: staff.UserID})
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

	company := []entity.Company{
		{
			CompanyName: "TechVision Corp.",
			Logo:        "data:image/jpeg;base64,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",
			UserID:      2,
			AddressID:   2,
			AdminID:     1,
		},
		{
			CompanyName: "GreenLeaf Innovations, Inc.",
			Logo:        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAABDlBMVEX///8coUluWENmTjcAmzthSTAAnD4Amjje2dVqUz0YoEbb1dD7+vkAmDRsVkDh3dn29POmmo+6sajMxL54ZFCMe231+/eSg3Xr6OXm9Ovu+PK/t68Ali/v7etzXku1q6Lc8OO/4szS69uBcGBfRSt6ZlWjl4uw2753wY7i8ufJ59OQy6Suo5nTzcdpu4al1rdbt3orpVY8qmCOyqFLr2qQzKODxpdZPR9BrWkFp0qbjYFUtHRUNhIjo1G33cKo17efxaRqYUJxZktdZ0F1VEQ/g0hqbExYfUw1i0uWgHZZTClnZ0Q7dDGm376IoYJQf0czlkjW3NJsRTRdcUaCrIdJJQBgOyNQMAI9DwAAkBpdwlu4AAAVxklEQVR4nO1cC3uiyJqGWBaxIjGXDi1EEyAmIiTcRJKOre7s9DlnZmfPbu/Mnt2d//9H9vuquGlMX9Kmtc/D+zydFoSyXuqr97sUIEk1atSoUaNGjRo1atSoUaNGjRo1atSoUaNGjRo1atSoUaNGjRo1atSoUaNGjRo1atSoUaNGjS1DM93F2E/imczYbBZP/cnQHWnb7tWmoLvjaSRTQikrQGFTjkLP1bfdu2+FNgrCGbBh8how+CLyFz8ySS2YUmU9u5KlwsJhe9s9fRlsh6hP2HELRcCHfB9VWWpuu7dfDyuBmbZikwqRoyT0HYAfJpFMlGyE4bvQ3naPvw7ulLBldiz2J3PTMAoB1TRjZHlOIotZSqn/A3E0/er4Ab1ZuDCN9cdqo7kTUSRJqfOjiM5EqfJTqW89w66Am8o9OIfQxXfp4DfCnaklP6ok8y8TStcnYNi9B/N1e/ft0MYV7/B1c2uUzohM5eD1OrcJGAmp8jO/7mx9LFNG/F2O5uxZMQOZkrhf38DIJ4zEo833bENYKIWFEnn4sjbcWKXM2my/NoZxQZApzstNzYOIZzc1dawUMzCaf0tD9oOi7iLFceEkyPQbJ5LhKMoLjfwV4RUEVf/bWwt6OzeKxQgyZSMOzWW93XKMi9wNMvZNU7CEGakv8DavBjvPJNjmhN6M2O4E4sYsJ7jJ667Th52JbsIskmFko65aV51NNvcNmOSOkGxY4k26Gz7Dzisuirfppi15J6ZinBEkr2BTwXTzbX41vMxGWfQauhBuPwjX1bwa8zo5T/S5Csirw890lFRDEH1z3XLHG2vqhR3Ighm6FIyGG4y4xubm2noJMlfI5Go/AvVhc79gbHcQ8yFUl2yUMrpBgbC2WinOhzCu7pxSmT0/iP3O/v5+90hstPdzdLI9UqfYtX+A+zoH/1Ld7h/Ah7xA2ce9/bLtI95Sud0t29rvStUf6Kw95mnh085coVodsjmqa299gNq/PLtoNRqNvevHc/zJo71GhtabW86xfdXMdzXuT2H7ovnTT/n2gSSd3jcazcesuXPYGFyWzXfg3OZZ2c+bQdHW4DbvAv5+Y6+77piutIp0zRAaEdJm4TqCpxfN1uEe4rAxOEOGb/gm/jlsniHF9lmL7wHsDZDhdWvvX7PtJjJswrfNm4whbDROKgzh3NbbkuFxo2irmTO85PvKs8pjDhtPGWbV36WAOyvXrMsyLgdIpdUcDAbNVqtgeNhoNnm/jwuGuKfZfI8Mr37+6UO2fZ8z3MtG5IsYZufmDMUlbl231xzzhOFQePulSWfnecbT1Od0wIfq7fndwd3JWTGGhxdHUv+kgSPZzxgelj8V0Hfv/vLhqGyEM9wTtvklDBt3TzrRgsOap9VjDlb7msHPhrCa1ueZ1HIIwHGFfb/If7BzUmEIQwVfNvYzhq2CoYGLrO/++oShIPYChvA7rbNH+HP1/DEFDJbNwkoE45ZF79lKGNfh5rfcVoXhYYXhYSF1Vg+aeve3Ui9zhoeN85cwPMAzTu/g72C/cswzYzgUM46klX3TcmGNrtTcTqGp1tmyIAuG3aPuJR/fo5zh2VuOI0nnDH/+VWznDPlcGtx9EcPDK37qmTCLxwb+TBtmROPx6TEVx8PhCDbELHfZPbmEulyUwqnW4PP9/IqjnysNSA/+zABGJVOawxYHMJ7APPzlg9jcyxi2Hrn6Dg5Ov0RpRFsDbhZdnAvH4otmf/WY5orSGCIxZNPKsPjVtXvGlgLwkuFJkzfYzb1Fi5O64HO/oqUD7EP7r3/7+cMel7pBI2PYOOk08MpcPLa+WEvfd/IdjY44MPMfn9DSTDWr9dERkatYtlNhpfjp8p4rZ8Hw7ArNTmiQsNLb8xNEG/3hBzjikm+f5wwvpTs847C193mGrWN+7iWOWP/iELpw1G7jrxy+6a8cc3IkLSEQdFSz3DVeZrjEXurwi4UD1Tm/bZQMcV6cY9e4j1jRUmCYaVF+nQRDfr1KUf0Ew6qKcJ/0BmcIXtnm+bpjKhAWyWblHhHOLNlpNWrm3qLFm+0Olhhmv/P4HMO9pwyl88FzDMvtVS19U8xxPjmu2muOKdF+4HRopTozL1af5FlGsVrauONC32y9vbkBsssMj1A7cIZk3qItkI9hP98sGeYUVxkeXt9wPHby3hdtZTrMGRau63mGuigDKxXBLLy9HOWSQ6vx6QmP2g5bDZSWZYbSLU6Hx1xpLjgOLwXDYvu0ylC6ba5jiO3zMP0uUxFx7t6jMKJBdvH2m5kqPM8wExpqrnJGyw3TwmVUS4zne40i8m5c9KsMuzgig37uLThQ7QTDbPt8iWEmg6sMMzRzhuLcxlupgwFbHspI+DuNzqcYWmIayqUZzklumnEa+vmUXMqs+pdXLdTl1sXbU549HYITaPFZdjYAub6B4GbQzIHRcnuvso0M31ei6Jt72KhkT/vlsU0cQ/w+w+Bt+xGPzsNR0dBj1sZahmK5qRp1F8X9ZOrRRW6xy2qDWerBQScPHtqwcSDCp/6B+Ng5KIEXYV983Mf/+/yw/YMi9jgQO4u2+ZHieEyXu9m5+KfT5p8LoRWb2TErbkJA5IYVoWnnRirPnGC2KAU1+kThug+/eCTa72b/oKX8vy7254hv2eix+ZH9LsdRfpjUzSoG/bIdqV8NwLrZDxU/IImWPwOhJbT0eLYwUrxDbZL6f4+iJGNMk2drxe0rsJrbC/y5Nk6KFqaI0sEFbp9cNFrX5+hHoefDv/wK+27QE7yFLLrVgKh0H7Mt6fQKpvQltnD7RrTTxfCzUbpF3vLVI253+Sl3cMr1yZPOrELYZCX55WbLIvCJ1EkXkwT0dCaGlTy77i0Y3mNveD8uBic5w5vmSadziVPv7FxLyb/BVDlqYO+7nc7VZbdzJHWwu+eD407nfA+pQzsZw4PGfue4sLx2s4PT/DhneD64hVMu1lpmFVPhDstJJgZ1ljIIVSfuOGQpmYViGHvPrdkIhsfXNxnDwxMMepDhQZNPz7v3fdiMlV8G4JXOwZPy0864XiDDowH/2OXKefvmWDC8a1SNVIzh5cWJYNhvCLX5rJ1mNmgWOzCgAXZxQBhbWHOfBJRNMkN9blFeMLxtt25FPxqdg/f7nOFxltzsnWpp45d3v/3736X2Rae/JyK7guHdhegoHn582wY/wq30+H3FCAXD0y7oKDI8vf4ctSWGZZqr4RBGFJQ0oNQ3JF9ZMDqJMrmh65f3szEER3YucYb7YEP9/QrD6/+IyX/+/HEPQty7FtrnCsOs3nLLGUI7pxKvJ522HssfEQylg3u4QsDwarUXn2LIZoVOmgpmUjA7aRig8YaKN1Mm0zwIkNfWdXOGENEd7AmG0u3V3RvoItcE6b9+/wgt7P32h+JJbzFFFFlywbA74EHz0cU5Z4jtiCJPp4ymc4YQcNxBmNFpddZ15fMMLSxLES+hICxWnEhTZTgjaeH4mbxutaZgCOl6NoYglofX+M31vmT+d/MPrNP88eGjEnTBSPvd69OSIUZFN63TttQ5Q2NFhtAOhO13p5Ao3UlHnWWG0nFLnHLXlro3XfDGn2TI6xWsXPxaqMJ7QF5MY9uzhj0LRbUIVWm8xme0Me294QZ1+Q/ox/sDThtT3aPH//n999//eIe/8vE3Rrxfucqc3mMkxxOUfZ6l397f379/i8IoZOj2H11p/3/v30PicNzkJtyGqS1d8FMe7/GU4/f3/Pu7/1stWyzBp8vePFCEe7dAcWACanrkEup4ZcZIwjXqhRFJV1zquyPxD0MTmNbW9OPHj/K7LIaQySQLPOD6S6KSfyQClKODO9HRTrdo5+gOh6d7JhV7ROjTvque8pkx5KNTsdKMC00sdILkQRu7CvMXwDvK1sGXSlafhuHF/Bkiubw+L7hJoPu0hv018Oiylo6LfMkGRZV7c2mosnCogP9AucGE8WkJdT1cZ6as5NIvYviNmNNlf1jMOBIaDyoGrCmhPjJ8QING38+UL1go0wO8h1ZexeZv9PgsRH5YJg6lppBY91Q6MzyFphYwnDrgJYVRk8/cPaIPE/XJ8HGoXzj+G4QpbLJYgMnmIc4dGtlm0hsaRPFwDENgx4RRfyIIB3rzUCbL9FiRr6jf/+YhjesHKW4DFXedsCkP3ligDR0p7M2BN/Vximb5ovKc2miuEz15io85ccFwC3cq8uSCFj0W/pBFkxj3q6GOiw76mAinGOX3Z64P3+w0qj7Gl6ddk2lR+qkWLb8XeHGUFjctWdlSmxyEOJqUeG0pNkBk6MShLB7i0dHa2GYUROqSddJkBpcKpt6DHxZjuIX7alyRD+abZnHrUCCem1FiycbKPxmGjCUgOfIM3cZS9Q09e0hXJh8NfUqcWF08+OOHvCzJvju/vLRGc3XkuQX30WQ8j5E9+AYdj7BjxkIXHSNfy+lVSlPgGujyY4pY5pkw4oRqmoaL0MlrP/HaPrwy+BxRiv5itMZ1RlZ8G3whzlGLwCjbmPW7KnRduIyiSmyMZ/nwzWKWTz82jGjsKVMrcf08jHiyVPd9wNWTTvJN9OvMm/Kd8lwPwbFh7Yb6tgJR5Rwd44TLTU/cA6R5tHB9FEWTTtEklfmUMosSy7F9r/SxW7mvHTPCSjmRa4nqebguzXqJaXhyAOOsosdQ5h46Ru4zVZ+LxoIphWzC6JLMiEkaKGTsqI5hTyaVx8S2c1s7X7kguciJIAfCGP54F4Ox03RprjLUU6KDgVInAB4i/rYTYZ8iaFUw5yIe/GGJTVhsEQh+7BCOpnIkrsN2bqXlZloGG2LlifqjkIgne8O51o4cUCRII0H26TiAL7i5BSyP0yegV9RH6j7OUmqBjnrj3lAaRiqVE0f4/E/cY/WqGPWWNACNDBOnRA+EQNLeRPJsC+eiDvRJEBAFYyDNyR9jZ1PUkh6oLRgyr0OC5oL4WpIfT51FkCYiDqDbun1PVKNyM8X7MHzwF1R2jbDHLz3epgGSqwQjirLr/YkjaMTF/GK4+kEdfhFwxVUZhfhgpq1b7nzhl2Ec3dbdexZ3e7nMQaTK4gDLbTDX3ESl/FabEVqyjt2npoNDoWcW6sOojkF7GNNxFtporilMZrBQiyoE2GGxgEazlRtavi+4FytuVRijIC4waKOxq1lTSiGoMxnOIvSdzMQcT4+EBUNABq4SaTlmDxrBq9UbpYRMpEX+HgIa+elU/qrqwKbB4+nChEzkO7PGoCeM+LZkOxHENRCVLTD+gYGAS6Fld9zMAph6ARY5mIk6CwqDgUvEhiBg/OUn4D0Wns/dibK9R6D4HSel1nCnr1gW2iFVQuiXa+FDURouLYqA1EdOM0jZ4diZDv6GhhqvaKFND+2ZLXlRHD+Enmtb4yh3KVt8PIjfvFesA9s8+u55mt/jbn/mYRlnmnLPqWD0gxU56idgnxT8DIbjytxSs6hONmxBxTBdb0qLYsYW8vsSWrI0iNNsrcmwZOH22YMrWSOTGzOwHUGnWeQxxfVBSETN1QAjBZklMgkxEniIQVuWXmnD2Faf8OJpoZpX3NyekIjYNBwhmRSTgpRmaoFmrHgJTcAo6VjnVwctnY18SmNbgnhouYgowqQt8pNEhlEOIppjFDEGnt2eqjzbdyUN+6zq4rY3FlmUuuglRgHyRVfJEj3phbq06BWLAIzmRBnd8sNPOtpTUUUxUWtScBgqmKcdKgrEp5LGIzNJXA3iPpApcAZHgmGeas+x0GFQD4NxqnIoLPZTJ1u/I9t+poTf/VXeEZyiaqYTEHwSmpLuJUrPRn1Bl2JzRbV7xJ2rIJwGGjjDMxRPciXdNDRtZLvufG4NAz/OxpBt/7kgMTJ5wVb4DweVhjJ88Yc5CWAQKYbOPHC1ffKAcbg8Qh0GFwhzE9N+d8aieBr6fpjEs9JGN/5Q40swQndelIbRA4CajqY4YHS64IPr4To3Rt8QgxMl0HHqaY6YwVP+CoUFhgn8JVLLSrNS1tkS8FblspCScoqJ4XGfqDLfaks6LpCi21dMTyEGWm3KQz7qaVFkS+BAl/WzUNRXeiTua+H1qjdc8JowndmjmFcpaA/8WaBzawbfEIHEYLox56UrMjcwEBjHVFEVgi8BI0QFVx+DtfLoYfvPHwr4pBJ5mGBoCTi2hTThfj/LPjRgrroWGilq68hWcgb4DinNHnrj1ElTLxha1tzzY75atSvPOvN4mrHcZQwpL30TX0NHnt+DCnEafPBpz4REkska6CnorSZpKY1Cx5vbI0M3dNMK0jBmVLwAbBceks1gPECvo3zOpAqbBaFCIoi7pxCA8eEdgt8bGxGjuIjDEnAhDO+oGiUK5kmE2yh/qVuhozTeiQedMxgxzLLCdfnQ+2HQY+rUlsxU7mEdALyCYrtUJIugoZM/kxE+q7haEcZ4horbIHZDZXIIipnjR6slgQ3Zj4Iv07NSDbNlMFKHChGFQGWMsYrm+RFVMKPnIoNv4ZslvuNjrLpjBPEtWEAxyUZRg0yepCOHwHhM55w3wwAuZmSOktODMAAkhmuM7i5AYwDpeDF3bVCZZIaLkOYWyayHFkIG9JBNnRFQVHxjjrGNMoO4xFBkssB41NZBYfh72TxIQsLxwh1pvA6ijdxgHEYic6IPuzaCHGkPLn3WM6RIIpsnw7gIb8J3tg2d180ef8uSPlUZf18kWKY8iyBSw0+ZyvTCnXnrxzLmKiROmZPGicnUMWQYag/CMldlM2MOIquZWDO1nd7y8zUiYsu2duz1O1WYD4TlUbjxQPDGGltykyEn/wDRJ8miO3DpjOYKgx4imvqOE/LlQhLv0st3VmGklCm+mIw4McEOnRGqylAFoRn3piYcY+FbkjUdRGUCYczEG1q27QbOVFTwabr9fOmTcCNCZpmlOnytDRJcfF0d+IkQPQSuSERhGsxtHTJCzTCtRSYw/J6baJcHMINHlZ5YQsvqEn+6yJAEkom1Jp5zgIlCLg9WShS1p6rZC0+Zsutvhsygp5BQeFwNbQy+VRsZcgnSvHBGRRYhnDzoZ5RA2svHT/Z2VEKfYuSzXsw9PabCWMZZqBCjaDpOQHPupX4I8J0UM4khxNp4w1Ts7fgEXAaGowly1MYU3z+w+BOGMGQJZhFIREPobpBOZ5jXU5oMfyh+CGMY/TlDs3MjiFnGKUQEKr7AW8V3QsdxHM3wM1YtSE9Of6D3JFcxCuI/p3M+ZJAjDntLHj5bYFJIPPlB6QnoCx+LSd6QV6KWsiR8u37sL3YyAP06gKEaoSilFgEaj2LS4XMvwf7x4C1w7ZcDouwHP124/zzkEBokVenEME1zZPwwHu+rMHckSd2losvGMbWk+VbuvftuiAxp+mMEnC+EFmlG759z/uUI02jrq4CvC83btRcf16hRo0aNGjVq1KhRo0aNGjVq1KhRo0aNGjVq1KhRo0aNGjVq1KhRo0aNGjVq1KhRo0aNHwj/D95WQNICOjJ7AAAAAElFTkSuQmCC",
			UserID:      2,
			AddressID:   3,
			AdminID:     1,
		},
		{
			CompanyName: "Skynet Solutions",
			Logo:        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEA0PDw8QDw4QEQ8QEA8QDxUPDxIOFxEYFhUSExUYHCggGB0xGxMVIz0iKjUrMzExFx8zOzMsNygtLisBCgoKDg0OGxAQGyslICUzMi0rLy0uLS0rNSsyMi03Ky01LS0tLS0tLS4tLS0rKy0tLSstLS0tLS0tLS0tLTUtLf/AABEIAOEA4QMBIgACEQEDEQH/xAAcAAEAAQUBAQAAAAAAAAAAAAAABwECAwUGBAj/xABHEAABAwIDBgEHBwoEBwEAAAABAAIDBBEFEiEGBxMxQVFhFCIycYGRszQ1QlJic3QVIzNVcpOhsbLRFyVUlCSCg8HD0tMW/8QAGQEBAAMBAQAAAAAAAAAAAAAAAAECAwQF/8QAJxEBAAMAAgECBgIDAAAAAAAAAAECEQMSITFRBCIykfDxQdETUoH/2gAMAwEAAhEDEQA/AOCREXtvOEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBUVCVYXagdToB1J7BRMpZLos5wypAzGlqQ363k8uW3ry2Xj4nPw0PgVHaDGVFh4o7j3q4PTsYyIsJlHf+KcUdx71OjMisDlR0gCaMiqsIkV7XJovVFQlWlyaL7pdYeKO496cUdx71GjNdLrDxR3HvTijuPemjNdFh4o7j3q5r79VOjKioFVSgREQEREBERAVCqqhQZaCifUTQ08QvLM9sbAeVyeZ8ALk+AK+iNktjqagjaImB89hxKl7QZXu62P0W/ZH8TqoY3WvaMXoc9tTOGk/XMDwP7e1fRK8/wCKvO9XVw1jNFwm9WjpG00dRLBG6qNRTRQSjzJM7pQTdw1cA0PNjcaLjNq6PaCjnmqG1VVPBnc5ssDuJG1l7gPp7ENsPAjxXO49tvPiJwyOdrGmCZpc6MkNle57AHlp9EgAjmfSPLkqU4p2JiVrXjMmH0dkHYe5Qdj2zEmIbRYhTx3ZEx1O+eUDSOLyWLl0zHUAes8gVOawU9HGx0z2MDXzPEkr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",
			UserID:      2,
			AddressID:   4,
			AdminID:     1,
		},
		{
			CompanyName: "OceanTech Marine Services",
			Logo:        "data:image/jpeg;base64,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",
			UserID:      2,
			AddressID:   5,
			AdminID:     1,
		},
	}
	// ค้นหาจาก company_name ถ้าไม่มีให้สร้างใหม่
	for _, c := range company {
		err := db.Where("company_name = ?", c.CompanyName).FirstOrCreate(&c).Error
		if err != nil {
			log.Printf("Error creating company %s: %v", c.CompanyName, err)
		}
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
			VerificationDocument: "https://swr.co.th/verify1.png",
			StatusVerifyID:       1,
			UserID:               2,
		},
		{
			VerificationDocument: "https://swr.co.th/verify1.png",
			StatusVerifyID:       2,
			UserID:               6,
		},
		{
			VerificationDocument: "https://swr.co.th/verify2.png",
			StatusVerifyID:       3,
			UserID:               4,
		},
		{
			VerificationDocument: "https://swr.co.th/verify1.png",
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
