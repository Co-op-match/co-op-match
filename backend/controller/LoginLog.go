package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAllLoginLogs(c *gin.Context) {
	var logs []entity.LoginLog
	if err := config.DB().
		Preload("User.Role").
		Order("login_at DESC").
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get login logs"})
		return
	}
	c.JSON(http.StatusOK, logs)
}
