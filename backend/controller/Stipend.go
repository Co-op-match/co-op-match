package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// GET /stipends - List all stipends
func GetAllStipends(c *gin.Context) {
	db := config.DB()
	var stipends []entity.Stipend

	db.Find(&stipends)

	c.JSON(http.StatusOK, stipends)
}

// GET /stipends/:id
func GetStipendById(c *gin.Context) {
	id := c.Param("id")
	var stipend entity.Stipend

	db := config.DB()
	result := db.First(&stipend, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stipend not found"})
		return
	}

	c.JSON(http.StatusOK, stipend)
}
