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
	type StatusUpdateInput struct {
		PostID        uint `json:"post_id"`
		StatusPostID  uint `json:"status_post_id"` // ID ของสถานะใหม่ เช่น "เปิดรับสมัคร"
	}

	var input StatusUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	var post entity.IntershipPost
	if err := config.DB().First(&post, input.PostID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// เปลี่ยน StatusPostID
	post.StatusPostID = input.StatusPostID
	if err := config.DB().Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}
