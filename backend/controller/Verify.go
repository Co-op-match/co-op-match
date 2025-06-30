package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"

	"github.com/gin-gonic/gin"
)

func GetAllaaaaaaaaaaaaaaaaaaa(c *gin.Context) {
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
