package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// GET /job_types - List all job types
func GetAllJobTypes(c *gin.Context) {
	db := config.DB()

	var jobTypes []entity.JobType

	db.Find(&jobTypes)

	c.JSON(http.StatusOK, jobTypes)
}

// GET /job_types/:id
func GetJobTypeById(c *gin.Context) {
	id := c.Param("id")
	var jobType entity.JobType

	db := config.DB()
	result := db.First(&jobType, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job type not found"})
		return
	}

	c.JSON(http.StatusOK, jobType)
}
