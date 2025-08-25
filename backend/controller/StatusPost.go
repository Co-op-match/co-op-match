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

func UpdateStatusPost(c *gin.Context) {
	var post entity.IntershipPost
	id := c.Param("id")

	db := config.DB()

	result := db.First(&post, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to mappayload"})
		return
	}

	result = db.Save(&post)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}