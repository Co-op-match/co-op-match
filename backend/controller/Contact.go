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
