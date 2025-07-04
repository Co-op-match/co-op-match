package searchjob

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAllIntershipPosts(c *gin.Context) {
	var posts []entity.IntershipPost
	db := config.DB()
	results := db.Preload("Company").Preload("WorkMode").Preload("WorkDay").Preload("Stipend").Preload("JobType").Find(&posts)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, posts)
}
