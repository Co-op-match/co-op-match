package controller

import (
	"net/http"
	"strconv"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
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
			"error":   "Failed to fetch students",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, academicstaff)
}

func GetAllActiveAcademicStaffs(c *gin.Context) {
	var staffs []entity.AcademicStaff

	err := config.DB().
		Preload("User.Verifications.StatusVerify").
		Preload("Address.Province").
		Preload("Address.District").
		Preload("Address.SubDistrict").
		Preload("Address.Postcode").
		Preload("Contact").
		Preload("Gender").
		Preload("Admin").
		Where("deleted_at IS NULL").
		Find(&staffs).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch academic staffs",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, staffs)
}
func GetAllDeletedAcademicStaffs(c *gin.Context) {
	var staffs []entity.AcademicStaff

	err := config.DB().
		Unscoped().
		Where("deleted_at IS NOT NULL").
		Preload("User.Verifications.StatusVerify").
		Preload("Address.Province").
		Preload("Address.District").
		Preload("Address.SubDistrict").
		Preload("Address.Postcode").
		Preload("Contact").
		Preload("Gender").
		Preload("Admin").
		Find(&staffs).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch deleted academic staffs",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, staffs)
}
func DeleteAcademicStaff(c *gin.Context) {
	id := c.Param("id")

	// Step 1: หา academic staff ตาม id
	var staff entity.AcademicStaff
	if err := config.DB().First(&staff, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "academic staff not found"})
		return
	}

	// Step 2: ลบ academic staff
	if err := config.DB().Delete(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete academic staff"})
		return
	}

	// Step 3: ลบ user ที่เกี่ยวข้อง
	if err := config.DB().Delete(&entity.User{}, staff.UserID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "academic staff soft deleted"})
}
func UpdateAcademicStaff(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var staff entity.AcademicStaff
	if err := db.Preload("Address").First(&staff, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "academic staff not found"})
		return
	}

	// Input struct รวมข้อมูล Address แบบ nested
	var input struct {
		AcademicPosition string `json:"academic_position"`
		Faculty          string `json:"faculty"`
		Department       string `json:"department"`
		University       string `json:"university"`
		Age              int    `json:"age"`
		AdminID          uint   `json:"admin_id"`
		GenderID		 uint	`json:"gender_id"`
		Address          struct {
			HouseNumber   string `json:"house_number"`
			Village       string `json:"village"`
			Street        string `json:"street"`
			SubStreet     string `json:"sub_street"`
			Province      uint   `json:"Province"`
			District      uint   `json:"District"`
			SubDistrict   uint   `json:"SubDistrict"`
			Postcode      uint   `json:"Postcode"`
		} `json:"Address"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	// อัปเดต field หลักของ staff
	staff.AcademicPosition = input.AcademicPosition
	staff.Faculty = input.Faculty
	staff.Department = input.Department
	staff.University = input.University
	staff.Age = input.Age
	staff.AdminID = input.AdminID
	staff.GenderID = input.GenderID

	// อัปเดตที่อยู่ถ้ามี
	if staff.Address.ID != 0 {
		staff.Address.HouseNumber = input.Address.HouseNumber
		staff.Address.Village = input.Address.Village
		staff.Address.Street = input.Address.Street
		staff.Address.SubStreet = input.Address.SubStreet
		staff.Address.ProvinceID = input.Address.Province
		staff.Address.DistrictID = input.Address.District
		staff.Address.SubDistrictID = input.Address.SubDistrict
		staff.Address.PostcodeID = input.Address.Postcode
	}

	// บันทึกการเปลี่ยนแปลง
	if err := db.Save(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update staff"})
		return
	}

	if err := db.Save(&staff.Address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
		return
	}

	c.JSON(http.StatusOK, staff)
}
func CreateAcademicStaff(c *gin.Context) {
	academicPosition := c.PostForm("academic_position")
	ageStr := c.PostForm("age")
	faculty := c.PostForm("faculty")
	department := c.PostForm("department")
	university := c.PostForm("university")
	userIDStr := c.PostForm("user_id")
	addressIDStr := c.PostForm("address_id")
	adminIDStr := c.PostForm("admin_id")
	genderIDStr := c.PostForm("gender_id")
	contactIDStr := c.PostForm("contact_id")

	if academicPosition == "" || ageStr == "" || faculty == "" || department == "" || university == "" ||
		userIDStr == "" || addressIDStr == "" || adminIDStr == "" || genderIDStr == "" || contactIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	// แปลงเป็น int/uint
	age, _ := strconv.Atoi(ageStr)
	userID, _ := strconv.ParseUint(userIDStr, 10, 64)
	addressID, _ := strconv.ParseUint(addressIDStr, 10, 64)
	adminID, _ := strconv.ParseUint(adminIDStr, 10, 64)
	genderID, _ := strconv.ParseUint(genderIDStr, 10, 64)
	contactID, _ := strconv.ParseUint(contactIDStr, 10, 64)

	staff := entity.AcademicStaff{
		AcademicPosition: academicPosition,
		Age:              age,
		Faculty:          faculty,
		Department:       department,
		University:       university,
		UserID:           uint(userID),
		AddressID:        uint(addressID),
		AdminID:          uint(adminID),
		GenderID:         uint(genderID),
		ContactID:        uint(contactID),
	}

	if err := config.DB().Create(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create academic staff"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Academic staff created successfully",
		"data":    staff,
	})
}
func CreateUserAcademicStaffContact(c *gin.Context) {
	// === รับค่าจาก form ===
	email := c.PostForm("email")
	password := c.PostForm("password")
	roleID := c.PostForm("role_id")
	adminID := c.PostForm("admin_id")

	academicPosition := c.PostForm("academic_position")
	ageStr := c.PostForm("age")
	faculty := c.PostForm("faculty")
	department := c.PostForm("department")
	university := c.PostForm("university")
	genderID := c.PostForm("gender_id")

	// === รับค่าที่อยู่ ===
	provinceID := c.PostForm("address_province_id")
	districtID := c.PostForm("address_district_id")
	subdistrictID := c.PostForm("address_sub_district_id")
	postcodeID := c.PostForm("address_postcode_id")
	houseNumber := c.PostForm("address_house_number")
	village := c.PostForm("address_village")
	street := c.PostForm("address_street")
	subStreet := c.PostForm("address_sub_street")

	// === รับค่าติดต่อ ===
	phone := c.PostForm("contact_phone")
	contactEmail := c.PostForm("contact_email")
	website := c.PostForm("contact_website")
	line := c.PostForm("contact_line")
	facebook := c.PostForm("contact_facebook")

	// === เช็ค email ซ้ำ ===
	var existing entity.User
	if err := config.DB().Where("email = ?", email).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "อีเมลนี้ถูกใช้งานแล้ว"})
		return
	}

	// === สร้าง User ===
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), 14)
	user := entity.User{
		Email:    email,
		Password: string(hashedPassword),
		IsActive: true,
	}
	if rid, err := strconv.ParseUint(roleID, 10, 64); err == nil {
		user.RoleID = uint(rid)
	}
	if err := config.DB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างผู้ใช้ไม่สำเร็จ"})
		return
	}

	// === สร้าง Contact ===
	contact := entity.Contact{
		PhoneNumber: phone,
		Email:       contactEmail,
		Website:     website,
		Line:        line,
		Facebook:    facebook,
	}
	if err := config.DB().Create(&contact).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างข้อมูลติดต่อไม่สำเร็จ"})
		return
	}

	// === สร้าง Address ===
	provinceIDUint, _ := strconv.ParseUint(provinceID, 10, 64)
	districtIDUint, _ := strconv.ParseUint(districtID, 10, 64)
	subdistrictIDUint, _ := strconv.ParseUint(subdistrictID, 10, 64)
	postcodeIDUint, _ := strconv.ParseUint(postcodeID, 10, 64)
	address := entity.Address{
		ProvinceID:    uint(provinceIDUint),
		DistrictID:    uint(districtIDUint),
		SubDistrictID: uint(subdistrictIDUint),
		PostcodeID:    uint(postcodeIDUint),
		HouseNumber:   houseNumber,
		Village:       village,
		Street:        street,
		SubStreet:     subStreet,
	}
	if err := config.DB().Create(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างที่อยู่ไม่สำเร็จ"})
		return
	}

	// === สร้าง AcademicStaff ===
	ageInt, _ := strconv.Atoi(ageStr)
	adminIDUint, _ := strconv.ParseUint(adminID, 10, 64)
	genderIDUint, _ := strconv.ParseUint(genderID, 10, 64)

	staff := entity.AcademicStaff{
		AcademicPosition: academicPosition,
		Age:              ageInt,
		Faculty:          faculty,
		Department:       department,
		University:       university,
		UserID:           user.ID,
		ContactID:        contact.ID,
		AddressID:        address.ID,
		AdminID:          uint(adminIDUint),
		GenderID:         uint(genderIDUint),
	}
	if err := config.DB().Create(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างข้อมูลอาจารย์ไม่สำเร็จ"})
		return
	}

	// === Success ===
	c.JSON(http.StatusCreated, gin.H{
		"message": "สร้างอาจารย์สำเร็จ",
		"data":    staff,
	})
}

