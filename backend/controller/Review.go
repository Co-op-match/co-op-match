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
	ID           int       `json:"id"`
	Reviewer     string    `json:"reviewer"`
	Rating       int16     `json:"rating"`
	Comment      string    `json:"comment"`
	Date         time.Time `json:"date"`
	Position     string    `json:"position"`
	Tags         []string  `json:"tags"`
	Helpful      int       `json:"helpful"`
	ProfileImage string    `json:"image_url"`
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

	// Step 2: ดึงรีวิวของบริษัทนั้น พร้อม preload Student, ProfileImage, Tags
	var reviews []entity.Review
	if err := config.DB().
		Preload("Student").
		Preload("Student.User.ProfileImage").
		Preload("Tags").
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
			continue
		}

		// แปลง []*Tag เป็น []string
		var tagNames []string
		for _, tag := range r.Tags {
			tagNames = append(tagNames, tag.Name)
		}

		var imageURL string
		if len(r.Student.User.ProfileImage) > 0 {
			imageURL = r.Student.User.ProfileImage[0].ImageURL
		}

		response = append(response, ReviewResponse{
			ID:           int(r.ID),
			Reviewer:     r.Student.FirstName + " " + r.Student.LastName,
			Rating:       r.Rating,
			Comment:      r.Comment,
			Date:         r.CreatedAt,
			Position:     apps[0].IntershipPost.PostName,
			Tags:         tagNames,
			Helpful:      int(r.Like),
			ProfileImage: imageURL,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}



// ✅ กดไลค์รีวิว (ถ้ายังไม่เคย)
func LikeReview(c *gin.Context) {
	var input struct {
		UserID   uint `json:"user_id"`
		ReviewID uint `json:"review_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	// 🔍 หา Student จาก UserID
	var student entity.Student
	if err := config.DB().Where("user_id = ?", input.UserID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษาที่เกี่ยวข้องกับบัญชีนี้"})
		return
	}

	// 🔁 เช็คว่ามีอยู่แล้วหรือไม่ (โดยไม่สน soft-delete)
	var count int64
	config.DB().Model(&entity.ReviewLike{}).
		Where("student_id = ? AND review_id = ?", student.ID, input.ReviewID).
		Count(&count)

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "คุณได้กดไลค์รีวิวนี้ไปแล้ว"})
		return
	}

	// ✅ เพิ่มข้อมูลใหม่
	like := entity.ReviewLike{
		StudentID: student.ID,
		ReviewID:  input.ReviewID,
	}
	if err := config.DB().Create(&like).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไลค์ได้"})
		return
	}

	// ✅ เพิ่ม like count
	config.DB().Model(&entity.Review{}).
		Where("id = ?", input.ReviewID).
		Update("like", gorm.Expr("like + 1"))

	c.JSON(http.StatusOK, gin.H{"message": "ไลค์รีวิวเรียบร้อย"})
}



func GetLikedReviews(c *gin.Context) {
	userID := c.Param("user_id")

	// หา Student จาก user_id
	var student entity.Student
	if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ Student ที่ตรงกับ user_id นี้"})
		return
	}

	// ดึง review_id ทั้งหมดที่ student นี้เคยกดไลค์
	var likes []entity.ReviewLike
	if err := config.DB().
		Where("student_id = ?", student.ID).
		Find(&likes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลไลค์ได้"})
		return
	}

	// คืนค่าเฉพาะ review_id
	var reviewIDs []uint
	for _, like := range likes {
		reviewIDs = append(reviewIDs, like.ReviewID)
	}

	c.JSON(http.StatusOK, reviewIDs)
}

func UnlikeReview(c *gin.Context) {
	var input struct {
		UserID   uint `json:"user_id"`
		ReviewID uint `json:"review_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	// 🔍 หา Student จาก UserID
	var student entity.Student
	if err := config.DB().Where("user_id = ?", input.UserID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ Student ที่ตรงกับ user_id นี้"})
		return
	}

	// 🔥 ลบแบบ Hard Delete (ใช้ Unscoped())
	if err := config.DB().Unscoped().
		Where("student_id = ? AND review_id = ?", student.ID, input.ReviewID).
		Delete(&entity.ReviewLike{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถยกเลิกไลค์ได้"})
		return
	}

	// ✅ ลด like count
	if err := config.DB().Model(&entity.Review{}).
		Where("id = ?", input.ReviewID).
		Update("like", gorm.Expr("like - 1")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลดจำนวนไลค์ได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ยกเลิกไลค์รีวิวเรียบร้อย"})
}

