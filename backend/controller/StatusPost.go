package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// GET /status_posts - List all status posts
func GetAllStatusPosts(c *gin.Context) {
	db := config.DB()
	var statusPosts []entity.StatusPost

	db.Find(&statusPosts)

	c.JSON(http.StatusOK, statusPosts)
}
