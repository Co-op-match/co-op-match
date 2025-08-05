package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// POST /reviews - สร้างรีวิวใหม่
func CreateReview(c *gin.Context) {
	var review entity.Review

	if err := c.ShouldBindJSON(&review); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if review.StudentID == 0 || review.CompanyID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student_id หรือ company_id ไม่ถูกต้อง"})
		return
	}

	// ตรวจสอบว่ามี Application ที่ผ่านแล้วหรือไม่
	var application entity.Application
	if err := config.DB().Where("student_id = ? AND intership_post_id IN (?) AND status = ?",
		review.StudentID,
		config.DB().Model(&entity.IntershipPost{}).Select("id").Where("company_id = ?", review.CompanyID),
		"ผ่าน",
	).First(&application).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, gin.H{"error": "ไม่สามารถรีวิวได้เพราะยังไม่ได้สมัครหรือยังไม่ผ่าน"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}

	// บันทึก Review
	if err := config.DB().Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Review created successfully", "data": review})
}

// GET /reviews/company/:company_id - ดึงรีวิวของบริษัท
func GetReviewsByCompanyID(c *gin.Context) {
	id := c.Param("company_id")
	var reviews []entity.Review

	if err := config.DB().Preload("Student.User").Where("company_id = ?", id).Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reviews})
}

// GET /reviews/student/:student_id - ดึงรีวิวของนักศึกษาคนหนึ่ง
func GetReviewsByStudentID(c *gin.Context) {
	id := c.Param("student_id")
	var reviews []entity.Review

	if err := config.DB().Preload("Company").Where("student_id = ?", id).Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reviews})
}

func GetPassedApplicationsByStudentID(c *gin.Context) {
	studentID := c.Param("id")
	var apps []entity.Application
	if err := config.DB().
		Preload("IntershipPost.Company").
		Where("student_id = ? AND status = ?", studentID, "ผ่าน").
		Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}
	c.JSON(http.StatusOK, apps)
}
