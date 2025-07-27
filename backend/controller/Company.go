package controller

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

func GetAllCompany(c *gin.Context) {
	var company []entity.Company

	err := config.DB().
		Preload("Contact").
		Preload("IntershipPosts").
		Preload("InterviewAppointments").
		Preload("Reviews").
		Find(&company).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch students",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, company)
}

func GetCompanyByID(c *gin.Context) {
	id := c.Param("id")
	var company entity.Company

	if err := config.DB().
		Preload("Contact").
		Preload("IntershipPosts").
		Preload("InterviewAppointments").
		Preload("Reviews").
		First(&company, id).Error; err != nil {

		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, company)
}

func CreateCompany(c *gin.Context) {
	// รับค่าจาก form
	companyName := c.PostForm("company_name")
	userIDStr := c.PostForm("user_id")
	addressIDStr := c.PostForm("address_id")
	adminIDStr := c.PostForm("admin_id")
	contactIDStr := c.PostForm("contact_id")

	if companyName == "" || userIDStr == "" || addressIDStr == "" || adminIDStr == "" || contactIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	// แปลงเป็นตัวเลข
	userID, _ := strconv.ParseUint(userIDStr, 10, 64)
	addressID, _ := strconv.ParseUint(addressIDStr, 10, 64)
	contactID, _ := strconv.ParseUint(contactIDStr, 10, 64)

	// รับไฟล์ logo
	file, err := c.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Logo file is required"})
		return
	}

	// เตรียม path และบันทึกไฟล์
	uploadDir := "public/uploads/companyLogo"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		_ = os.MkdirAll(uploadDir, os.ModePerm)
	}

	filename := fmt.Sprintf("%s-%s", time.Now().Format("20060102-150405"), file.Filename)
	filePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save logo"})
		return
	}
	relativePath := fmt.Sprintf("/uploads/companyLogo/%s", filename)

	// สร้าง Company object
	company := entity.Company{
		CompanyName: companyName,
		Logo:        relativePath,
		UserID:      uint(userID),
		AddressID:   uint(addressID),
		ContactID:   uint(contactID),
	}

	// บันทึกลงฐานข้อมูล
	if err := config.DB().Create(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create company"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Company created successfully",
		"data":    company,
	})
}

func GetCompanyByUserId(c *gin.Context) {
	userID := c.Param("user_id")

	var company entity.Company
	if err := config.DB().
		Preload("Contact").
		Preload("IntershipPosts").
		Preload("InterviewAppointments").
		Preload("Address").
		Preload("Address.Postcode").
		Preload("Address.Province").
		Preload("Address.SubDistrict").
		Preload("Address.District").
		Preload("Reviews").Where("user_id = ?", userID).First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัทที่เชื่อมกับ user_id นี้"})
		return
	}
	c.JSON(http.StatusOK, company)
}

func GetVerifyByUserId(c *gin.Context) {
	userID := c.Param("user_id")

	var verify entity.Verify
	if err := config.DB().Preload("StatusVerify").Where("user_id = ?", userID).First(&verify).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัทที่เชื่อมกับ user_id นี้"})
		return
	}
	c.JSON(http.StatusOK, verify)
}

func GetAllActiveCompanies(c *gin.Context) {
	var companies []entity.Company

	err := config.DB().
		Preload("Address.Province").
		Preload("Address.District").
		Preload("Address.SubDistrict").
		Preload("Address.Postcode").
		Preload("Admin").
		Preload("Contact").
		Preload("IntershipPosts").
		Preload("InterviewAppointments").
		Preload("Reviews").
		Preload("User.Verifications.StatusVerify").
		Where("deleted_at IS NULL").
		Find(&companies).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch companies",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, companies)
}

func GetAllDeletedCompany(c *gin.Context) {
	var companies []entity.Company
	if err := config.DB().
		Unscoped(). // ดึงรวม soft deleted
		Where("deleted_at IS NOT NULL").
		Preload("Address.Province").
		Preload("Address.District").
		Preload("Address.SubDistrict").
		Preload("Address.Postcode").
		Preload("Contact").
		Preload("IntershipPosts").
		Preload("InterviewAppointments").
		Preload("Reviews").
		Preload("User.Verifications.StatusVerify").
		Find(&companies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get companies"})
		return
	}

	c.JSON(http.StatusOK, companies)
}

func DeleteCompany(c *gin.Context) {
	id := c.Param("id")

	// Step 1: หา company ตาม id
	var company entity.Company
	if err := config.DB().First(&company, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	// Step 2: ลบ company
	if err := config.DB().Delete(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete company"})
		return
	}

	// Step 3: ลบ user ที่เกี่ยวข้อง
	if err := config.DB().Delete(&entity.User{}, company.UserID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "soft deleted"})
}

func UpdateCompany(c *gin.Context) {
	idStr := c.Param("id")
	companyID, _ := strconv.ParseUint(idStr, 10, 64)

	// 1. รับ json_data จาก form-data แล้ว parse
	var input struct {
		CompanyName string `json:"company_name"`
		Logo        string `json:"logo"` // override ทีหลัง
		Address     struct {
			HouseNumber string `json:"house_number"`
			Village     string `json:"village"`
			Street      string `json:"street"`
			SubStreet   string `json:"sub_street"`
			Province    uint   `json:"Province"`
			District    uint   `json:"District"`
			SubDistrict uint   `json:"SubDistrict"`
			Postcode    uint   `json:"Postcode"`
		} `json:"Address"`
	}

	jsonData := c.PostForm("json_data")
	fmt.Println("📦 RAW json_data =", jsonData)

	if err := json.Unmarshal([]byte(jsonData), &input); err != nil {
		fmt.Println("❌ JSON parse error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json_data"})
		return
	}

	// 2. รับไฟล์โลโก้จาก form-data
	file, err := c.FormFile("logo")
	if err == nil {
		uploadDir := "public/uploads/companyLogo"
		os.MkdirAll(uploadDir, os.ModePerm)

		filename := fmt.Sprintf("%s-%s", time.Now().Format("20060102-150405"), file.Filename)
		filePath := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save logo"})
			return
		}

		input.Logo = fmt.Sprintf("/uploads/companyLogo/%s", filename)
	}

	// 3. ดึง company จาก DB
	var company entity.Company
	if err := config.DB().Preload("Address").First(&company, companyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		return
	}

	// 4. อัปเดตฟิลด์
	company.CompanyName = input.CompanyName
	if input.Logo != "" {
		company.Logo = input.Logo
	}

	if company.Address.ID != 0 {
		company.Address.HouseNumber = input.Address.HouseNumber
		company.Address.Village = input.Address.Village
		company.Address.Street = input.Address.Street
		company.Address.SubStreet = input.Address.SubStreet
		company.Address.ProvinceID = input.Address.Province
		company.Address.DistrictID = input.Address.District
		company.Address.SubDistrictID = input.Address.SubDistrict
		company.Address.PostcodeID = input.Address.Postcode
	}

	// 5. Save ทั้ง company และ address
	if err := config.DB().Save(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update company"})
		return
	}
	if err := config.DB().Save(&company.Address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
		return
	}

	// 6. ตอบกลับ
	c.JSON(http.StatusOK, gin.H{
		"message": "Company updated successfully",
		"data":    company,
	})
}
