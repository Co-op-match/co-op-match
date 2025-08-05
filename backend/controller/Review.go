package controller

import (
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// CreateReview - POST /review
func CreateReview(c *gin.Context) {
	var review entity.Review

	// Bind JSON data to review struct
	if err := c.ShouldBindJSON(&review); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// Create a new review entry
	if err := db.Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Review created successfully", "data": review})
}

// GetAllReviews - GET /reviews
func GetAllReviews(c *gin.Context) {
	var reviews []entity.Review

	db := config.DB()

	// Preload User data to include User details in the response
	results := db.Preload("User").Find(&reviews)

	if results.Error != nil || results.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No reviews found"})
		return
	}

	// Return all reviews with preloaded user data
	c.JSON(http.StatusOK, reviews)
}

type ReviewResponse struct {
	Reviewer  string    `json:"reviewer"`
	Rating    int16     `json:"rating"`
	Comment   string    `json:"comment"`
	Date      time.Time `json:"date"`
	Position  string    `json:"position"`
	Tags      []string  `json:"tags"`
	Helpful   int       `json:"helpful"`
}

func GetReviewsByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	// Step 1: หา Company จาก user_id
	var company entity.Company
	if err := config.DB().
		Where("user_id = ?", userID).
		First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัทที่เกี่ยวข้องกับ user_id นี้"})
		return
	}

	// Step 2: ดึงรีวิวของบริษัทนั้น พร้อม preload ข้อมูล Student
	var reviews []entity.Review
	if err := config.DB().
		Preload("Student").
		Where("company_id = ?", company.ID).
		Order("created_at DESC").
		Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลรีวิวได้", "detail": err.Error()})
		return
	}

	// Step 3: กรองเฉพาะรีวิวที่มี Application สถานะ "ผ่าน"
	var response []ReviewResponse
	for _, r := range reviews {
		var apps []entity.Application
		err := config.DB().
			Preload("IntershipPost").
			Joins("JOIN intership_posts ON intership_posts.id = applications.intership_post_id").
			Where("applications.student_id = ? AND intership_posts.company_id = ? AND applications.status = ?", r.StudentID, company.ID, "ผ่าน").
			Order("applications.submit_at DESC").
			Find(&apps).Error

		if err != nil || len(apps) == 0 || apps[0].IntershipPost.ID == 0 {
			continue // ❌ ไม่มี Application ที่ผ่าน → ข้ามรีวิวนี้
		}

		response = append(response, ReviewResponse{
			Reviewer:  r.Student.FirstName + " " + r.Student.LastName,
			Rating:    r.Rating,
			Comment:   r.Comment,
			Date:      r.CreatedAt,
			Position:  apps[0].IntershipPost.PostName,
			Tags:      []string{"ได้เรียนรู้งานจริง", "พี่ๆ ใจดี"}, // สามารถปรับเป็น dynamic ได้ภายหลัง
			Helpful:   int(r.Like),                                          
		})
	}

	// Step 4: ส่งกลับ frontend
	c.JSON(http.StatusOK, gin.H{"data": response})
}
