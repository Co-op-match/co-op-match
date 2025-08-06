package controller

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
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

func CreateSendVerify(c *gin.Context) {
	var verify entity.Verify

	userID := c.Param("user_id")
	// รับค่าจากฟอร์ม
	statusVerifyID := c.PostForm("status_verify_id")
	reason := c.PostForm("reason")

	// แปลง string เป็น uint
	statusID, err := strconv.ParseUint(statusVerifyID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status_verify_id"})
		return
	}
	uid, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	file, err := c.FormFile("verification_document")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาอัปโหลดเอกสาร"})
		return
	}

	// ✅ เปลี่ยนชื่อไฟล์ใหม่ให้ปลอดภัย
	ext := filepath.Ext(file.Filename)
	newFileName := fmt.Sprintf("verify_%d_%d%s", uid, time.Now().Unix(), ext)
	filePath := filepath.Join("public/uploads/verifyDocument", newFileName)
	filePath = strings.ReplaceAll(filePath, "\\", "/") 

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไฟล์ได้"})
		return
	}
	// สร้าง Verify record
	verify = entity.Verify{
		VerificationDocument: filePath,
		Reason:               reason,
		StatusVerifyID:       uint(statusID),
		UserID:               uint(uid),
		AdminID:              nil,
	}

	if err := config.DB().Create(&verify).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": verify})
}

