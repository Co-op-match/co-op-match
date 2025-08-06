package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAllTags(c *gin.Context) {
	var tags []entity.Tag
	if err := config.DB().Find(&tags).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงแท็กได้"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tags})
}
