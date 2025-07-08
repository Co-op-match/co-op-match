package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// GET /work_modes - List all work modes
func GetAllWorkModes(c *gin.Context) {
	db := config.DB()
	var workModes []entity.WorkMode

	db.Find(&workModes)

	c.JSON(http.StatusOK, workModes)
}

// GET /work_modes/:id
func GetWorkModeById(c *gin.Context) {
	id := c.Param("id")
	var workMode entity.WorkMode

	db := config.DB()
	result := db.First(&workMode, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Work mode not found"})
		return
	}

	c.JSON(http.StatusOK, workMode)
}
