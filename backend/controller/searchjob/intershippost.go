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
	results := db.Where("status_post_id = ?", 1).Preload("Company").Preload("Company.Address.Province").Preload("WorkMode").Preload("WorkDay").Preload("Stipend").Preload("JobType").Preload("Benefit").Find(&posts)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, posts)
}
