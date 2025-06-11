package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
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
