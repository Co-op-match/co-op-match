package controller

import (
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// POST /reviews - สร้างรีวิวใหม่
func CreateReview(c *gin.Context) {
	var input entity.Review

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.StudentID == 0 || input.CompanyID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student_id หรือ company_id ไม่ถูกต้อง"})
		return
	}

	// ตรวจสอบว่ามี Application ที่ผ่านแล้วหรือไม่
	var application entity.Application
	if err := config.DB().Where("student_id = ? AND intership_post_id IN (?) AND status = ?",
		input.StudentID,
		config.DB().Model(&entity.IntershipPost{}).Select("id").Where("company_id = ?", input.CompanyID),
		"ผ่าน",
	).First(&application).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, gin.H{"error": "ไม่สามารถรีวิวได้เพราะยังไม่ได้สมัครหรือยังไม่ผ่าน"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}

	// ประมวลผล Tags
	var tags []*entity.Tag
	for _, tag := range input.Tags {
		var existingTag entity.Tag
		if err := config.DB().Where("name = ?", tag.Name).First(&existingTag).Error; err != nil {
			// ถ้าไม่เจอ → สร้างใหม่
			newTag := entity.Tag{Name: tag.Name}
			if err := config.DB().Create(&newTag).Error; err == nil {
				tags = append(tags, &newTag)
			}
		} else {
			// ถ้าเจอแล้ว
			tags = append(tags, &existingTag)
		}
	}

	// สร้าง Review ใหม่ พร้อม Tags ที่เชื่อม
	review := entity.Review{
		Rating:    input.Rating,
		Comment:   input.Comment,
		StudentID: input.StudentID,
		CompanyID: input.CompanyID,
		Tags:      tags,
	}

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
