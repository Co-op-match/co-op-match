package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// GET /work_days - List all work days
func GetAllWorkDays(c *gin.Context) {
	db := config.DB()
	var workDays []entity.WorkDay

	db.Find(&workDays)
	c.JSON(http.StatusOK, workDays)
}

// GET /work_days/:id
func GetWorkDayById(c *gin.Context) {
	id := c.Param("id")
	var workDay entity.WorkDay

	db := config.DB()
	result := db.First(&workDay, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Work day not found"})
		return
	}

	c.JSON(http.StatusOK, workDay)
}
