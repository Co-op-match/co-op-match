package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"

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

	// Step 1: ค้นหา Company จาก user_id
	var company entity.Company
	if err := config.DB().Where("user_id = ?", userID).First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัทที่เกี่ยวข้องกับ user_id นี้"})
		return
	}

	// Step 2: ค้นหา Contact เดิม (ต้องมี)
	var contact entity.Contact
	if err := config.DB().First(&contact, company.ContactID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล Contact"})
		return
	}

	// Step 3: รับข้อมูลใหม่จาก JSON
	var input entity.Contact
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	// Step 4: อัปเดต contact
	updated := entity.Contact{
		PhoneNumber: input.PhoneNumber,
		Website:     input.Website,
		Email:       input.Email,
		Line:        input.Line,
		Facebook:    input.Facebook,
	}

	if err := config.DB().Model(&contact).Updates(&updated).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Contact ไม่สำเร็จ: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดต Contact สำเร็จ", "contact": contact})
}
