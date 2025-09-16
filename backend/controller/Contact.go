package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

type CreateContactInput struct {
	PhoneNumber string `json:"phone_number"`
	Website     string `json:"website"`
	Email       string `json:"email"`
	Line        string `json:"line"`
	Facebook    string `json:"facebook"`
}

func CreateContact(c *gin.Context) {
	var input CreateContactInput

	// รับข้อมูล JSON เข้ามา
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}
	// สร้าง Contact record
	contact := entity.Contact{
		PhoneNumber: input.PhoneNumber,
		Website:     input.Website,
		Email:       input.Email,
		Line:        input.Line,
		Facebook:    input.Facebook,
	}

	db := config.DB()
	if err := db.Create(&contact).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contact: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, contact)
}

func GetContactByUserId(c *gin.Context) {
	userID := c.Param("user_id")

	var company entity.Company
	if err := config.DB().Where("user_id = ?", userID).First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัทที่เชื่อมกับ user_id นี้"})
		return
	}

	var contacts []entity.Contact
	if err := config.DB().Where("company_id = ?", company.ID).Find(&contacts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูล contact"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": contacts})
}
func UpdateContactByUserID(c *gin.Context) {
	userID := c.Param("user_id")
	db := config.DB()

	// ลองหา Company และ AcademicStaff ที่อ้างถึง user_id เดียวกัน
	var company entity.Company
	var staff entity.AcademicStaff

	errC := db.Where("user_id = ?", userID).First(&company).Error
	errS := db.Where("user_id = ?", userID).First(&staff).Error

	// ไม่พบทั้งสองประเภท
	if (errC != nil && errC != gorm.ErrRecordNotFound) || (errS != nil && errS != gorm.ErrRecordNotFound) {
		// error DB อย่างอื่น
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการค้นหาข้อมูลเจ้าของ"})
		return
	}
	if errC == gorm.ErrRecordNotFound && errS == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัทหรืออาจารย์สำหรับ user_id นี้"})
		return
	}
	// กรณีมีทั้ง Company และ AcademicStaff พร้อมกัน (ไม่น่าจะเกิด) → แจ้งกำกวม
	if errC == nil && errS == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "พบทั้งบริษัทและอาจารย์ที่ผูกกับ user_id นี้ โปรดระบุให้ชัดเจน"})
		return
	}

	// ระบุ owner และดึง ContactID
	owner := "company"
	contactID := company.ContactID
	if errC == gorm.ErrRecordNotFound {
		owner = "academic_staff"
		contactID = staff.ContactID
	}

	// ต้องมี Contact เดิม
	if contactID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ยังไม่พบข้อมูล Contact ที่ผูกกับเจ้าของรายนี้"})
		return
	}

	var contact entity.Contact
	if err := db.First(&contact, contactID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล Contact"})
		return
	}

	// รับอินพุต
	var input entity.Contact
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	// อัปเดตด้วย map เพื่ออนุญาต zero-value
	updated := map[string]interface{}{
		"phone_number": input.PhoneNumber,
		"website":      input.Website,
		"email":        input.Email,
		"line":         input.Line,
		"facebook":     input.Facebook,
	}

	if err := db.Model(&contact).Updates(updated).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Contact ไม่สำเร็จ: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "อัปเดต Contact สำเร็จ",
		"owner":   owner, // "company" หรือ "academic_staff"
		"contact": contact,
	})
}
