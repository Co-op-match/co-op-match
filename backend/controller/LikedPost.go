package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

type LikedPostInput struct {
	StudentID       uint `json:"StudentID"`
	IntershipPostID uint `json:"IntershipPostID"`
}

// POST /liked-post
func LikePost(c *gin.Context) {
	var input LikedPostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	liked := entity.LikedPost{
		StudentID:       input.StudentID,
		IntershipPostID: input.IntershipPostID,
	}

	if err := db.Create(&liked).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกโพสต์ที่สนใจได้"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "บันทึกสำเร็จ"})
}

// GET /liked-posts/student/:id
func GetLikedPostsByStudentID(c *gin.Context) {
	studentID := c.Param("id")
	var likedPosts []entity.LikedPost

	db := config.DB()
	if err := db.Preload("IntershipPost.Company").Preload("IntershipPost.Company.Address.Province").Preload("IntershipPost.Company.Address.District").Preload("IntershipPost.WorkDay").Preload("IntershipPost.Stipend").Preload("IntershipPost.WorkMode").
		Where("student_id = ?", studentID).Find(&likedPosts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, likedPosts)
}

// DELETE /liked-post/:student_id/:post_id
func DeleteLikedPost(c *gin.Context) {
	studentID := c.Param("student_id")
	postID := c.Param("post_id")

	db := config.DB()
	if err := db.Where("student_id = ? AND intership_post_id = ?", studentID, postID).
		Delete(&entity.LikedPost{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบโพสต์ที่สนใจได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบโพสต์ที่สนใจแล้ว"})
}
