package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// GET /benefits - List all benefits
func GetAllBenefits(c *gin.Context) {
	db := config.DB()
	var benefits []entity.Benefit

	db.Find(&benefits)
	c.JSON(http.StatusOK, benefits)
}

// GET /benefits/:id
func GetBenefitById(c *gin.Context) {
	id := c.Param("id")
	var benefit entity.Benefit

	db := config.DB()
	result := db.First(&benefit, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Benefit not found"})
		return
	}

	c.JSON(http.StatusOK, benefit)
}
