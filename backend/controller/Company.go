package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

func GetAllCompany(c *gin.Context) {
	var companies []entity.Company

	err := config.DB().
		Preload("Contact").
		Preload("IntershipPosts").
		Preload("InterviewAppointments").
		Preload("Reviews").
		Preload("User.Verifications.StatusVerify").
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

func GetCompanyByID(c *gin.Context) {
    id := c.Param("id")
    var company []entity.Company

    if err := config.DB().
 		Preload("Contact").
		Preload("IntershipPost").
		Preload("InterviewAppointment").
		Preload("Review").
        First(&company, id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        }
        return
    }

    c.JSON(http.StatusOK, company)
}