package controller

import (
	"fmt"
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// POST /post
func CreateInternshipPost(c *gin.Context) {
	var internshipPost entity.IntershipPost
	db := config.DB()

	var payload struct {
		entity.IntershipPost
		Skills     []uint `json:"skills"`      // 🔹 skill IDs
		BenefitIDs []uint `json:"benefit_ids"` // 🔹 benefit IDs
	}

	// 🔹 Bind JSON from request body
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	internshipPost = payload.IntershipPost

	// 🔹 Validate foreign keys
	var (
		jobType    entity.JobType
		stipend    entity.Stipend
		workDay    entity.WorkDay
		workMode   entity.WorkMode
		statusPost entity.StatusPost
	)

	db.First(&jobType, payload.JobTypeID)
	db.First(&stipend, payload.StipendID)
	db.First(&workDay, payload.WorkDayID)
	db.First(&workMode, payload.WorkModeID)
	db.First(&statusPost, payload.StatusPostID)

	if jobType.ID == 0 || stipend.ID == 0 || workDay.ID == 0 || workMode.ID == 0 || statusPost.ID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid foreign key(s) provided"})
		return
	}

	// 🔹 Build []Benefit from IDs
	var benefits []entity.Benefit
	for _, id := range payload.BenefitIDs {
		benefits = append(benefits, entity.Benefit{Model: gorm.Model{ID: id}})
	}

	// 🔹 Create Internship Post
	post := entity.IntershipPost{
		PostName:        internshipPost.PostName,
		PostDescription: internshipPost.PostDescription,
		Quantity:        internshipPost.Quantity,
		MinGpa:          internshipPost.MinGpa,
		CreatedAt:       time.Now(), // 🔄 ใส่เวลาปัจจุบัน
		LocationDetail:  internshipPost.LocationDetail,
		Subdistrict:     internshipPost.Subdistrict,
		District:        internshipPost.District,
		Province:        internshipPost.Province,
		CompanyID:       internshipPost.CompanyID,
		AdminID:         internshipPost.AdminID,
		JobTypeID:       internshipPost.JobTypeID,
		StipendID:       internshipPost.StipendID,
		WorkDayID:       internshipPost.WorkDayID,
		WorkModeID:      internshipPost.WorkModeID,
		StatusPostID:    internshipPost.StatusPostID,
		Benefits:        benefits,
	}

	if err := db.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create internship post"})
		return
	}

	// 🔹 Create CompanyRequiredSkills (if any)
	for _, skillID := range payload.Skills {
		var skill entity.Skill
		if err := db.First(&skill, skillID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Skill with ID %d not found", skillID)})
			return
		}

		companySkill := entity.CompanyRequiredSkill{
			SkillID:         skillID,
			IntershipPostID: post.ID,
		}
		if err := db.Create(&companySkill).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create required skill"})
			return
		}
	}

	// 🔹 Preload full post with relationships
	var fullPost entity.IntershipPost
	if err := db.Preload("Company").
		Preload("JobType").
		Preload("Stipend").
		Preload("WorkDay").
		Preload("WorkMode").
		Preload("StatusPost").
		Preload("Benefits").
		Preload("CompanyRequiredSkills.Skill"). // 👈 สำคัญ
		Where("id = ?", post.ID).
		First(&fullPost).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load full post"})
		return
	}

	// 🔚 Success
	c.JSON(http.StatusCreated, gin.H{
		"message": "Internship post created successfully",
		"data":    fullPost,
	})
}

// GET /internship_posts - List all internship posts
func ListIntershipPosts(c *gin.Context) {
	var intershipPosts []struct {
		ID              uint      `json:"id"`
		PostName        string    `json:"post_name"`
		PostDescription string    `json:"post_description"`
		Quantity        int32     `json:"quantity"`
		MinGpa          string    `json:"min_gpa"`
		CreatedAt       time.Time `json:"created_at"`
		JobTypeID       uint      `json:"JobTypeID"`
		JobTypeName     string    `json:"job_type"`
		StipendID       uint      `json:"StipendID"`
		StipendName     string    `json:"stipend"`
		WorkDayID       uint      `json:"WorkDayID"`
		WorkDayName     string    `json:"work_day"`
		WorkModeID      uint      `json:"WorkModeID"`
		WorkModeName    string    `json:"work_mode"`
		StatusPostID    uint      `json:"StatusPostID"`
		StatusPostName  string    `json:"status_post"`
		BenefitID       uint      `json:"benefit_id"`
		BenefitName     string    `json:"benefit"`
		// ✅ ฟิลด์ที่เพิ่มใหม่
		LocationDetail string `json:"location_detail"`
		Subdistrict    string `json:"subdistrict"`
		District       string `json:"district"`
		Province       string `json:"province"`
	}

	db := config.DB()

	results := db.Table("intership_posts").
		Select(`
            intership_posts.id, 
            intership_posts.post_name, 
            intership_posts.post_description,  
            intership_posts.quantity, 
            intership_posts.min_gpa, 
            intership_posts.created_at,
            job_types.id as job_type_id, 
            job_types.job_type as job_type_name,
            stipends.id as stipend_id, 
            stipends.stipend as stipend_name,
            work_days.id as work_day_id, 
            work_days.work_day as work_day_name,
            work_modes.id as work_mode_id, 
            work_modes.work_mode as work_mode_name,
            status_posts.id as status_post_id, 
            status_posts.status_post as status_post_name,
            benefits.id as benefit_id, 
            benefits.benefit as benefit,

			 
            intership_posts.location_detail,
            intership_posts.subdistrict,
            intership_posts.district,
            intership_posts.province
        `).
		Joins("left join job_types on job_types.id = intership_posts.job_type_id").
		Joins("left join stipends on stipends.id = intership_posts.stipend_id").
		Joins("left join work_days on work_days.id = intership_posts.work_day_id").
		Joins("left join work_modes on work_modes.id = intership_posts.work_mode_id").
		Joins("left join status_posts on status_posts.id = intership_posts.status_post_id").
		Joins("left join benefits on benefits.id = intership_posts.benefit_id").
		Scan(&intershipPosts)

	if results.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, intershipPosts)
}

// / GET /internship_posts/:id - Get details of a specific internship post
func GetInternshipPostById(c *gin.Context) {
	internshipPostID := c.Param("id")
	var internshipPost entity.IntershipPost

	db := config.DB()

	// โหลดข้อมูลพร้อม relations: WorkDay, WorkMode, etc.
	result := db.Preload("Company").
		Preload("JobType").
		Preload("Stipend").
		Preload("WorkDay").
		Preload("WorkMode").
		Preload("StatusPost").
		Preload("Benefits").
		Preload("CompanyRequiredSkills.Skill").
		First(&internshipPost, internshipPostID)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Internship post not found"})
		return
	}

	c.JSON(http.StatusOK, internshipPost)
}

// PUT /internship_posts/:id - Update a specific internship post entry
func UpdateInternshipPost(c *gin.Context) {
	internshipPostID := c.Param("id")
	var internshipPost entity.IntershipPost

	db := config.DB()

	// Find the existing internship post entry
	if err := db.First(&internshipPost, internshipPostID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Internship post not found"})
		return
	}

	// Bind the incoming JSON data to the InternshipPost struct
	if err := c.ShouldBindJSON(&internshipPost); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the internship post entry in the database
	if err := db.Save(&internshipPost).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update internship post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Internship post updated successfully", "data": internshipPost})
}

// DELETE /internship_posts/:id - Delete a specific internship post entry
func DeleteInternshipPost(c *gin.Context) {
	id := c.Param("id")

	db := config.DB()

	if tx := db.Exec("DELETE FROM internship_posts WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Internship post not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Internship post deleted successfully"})
}

// GET /interview_appointments/company/:company_id - Get interview appointments by company ID
func GetInterviewAppointmentsByCompanyID(c *gin.Context) {
	companyID := c.Param("company_id")
	var appointments []entity.InterviewAppointment

	db := config.DB()

	// Query all interview appointments with the given company ID
	result := db.Where("company_id = ?", companyID).Find(&appointments)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if len(appointments) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No interview appointments found for this company"})
		return
	}

	c.JSON(http.StatusOK, appointments)
}

// GET /posts/company/:id

func GetPostsByCompanyID(c *gin.Context) {
	id := c.Param("id")

	var posts []entity.IntershipPost

	db := config.DB()

	if err := db.Preload("Company"). // ✅ เพิ่มบรรทัดนี้
						Preload("StatusPost").
						Preload("JobType").
						Preload("Stipend").
						Preload("WorkDay").
						Preload("WorkMode").
						Preload("Benefits").
						Preload("CompanyRequiredSkills.Skill").
						Where("company_id = ?", id).
						Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, posts)
}

func GetAllInternshipPostsInAdmin(c *gin.Context) {
	var posts []entity.IntershipPost

	err := config.DB().
		Preload("Company").
		Preload("Company.User.Role").
		Preload("Company.Address.Province").
		Preload("Company.Address.District").
		Preload("Company.Address.SubDistrict.Postcode").
		Preload("Company.Contact").
		Preload("Company.Admin").
		Preload("JobType").
		Preload("Stipend").
		Preload("WorkDay").
		Preload("WorkMode").
		Preload("StatusPost").
		Preload("Benefits").
		Preload("Admin.User.Role").
		Preload("Applications.Student").
		Find(&posts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "ไม่สามารถดึงข้อมูลโพสต์ฝึกงานได้",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, posts)
}

func GetInternshipPostsInAdminByIPostID(c *gin.Context) {
	id := c.Param("id") // รับ post id จาก URL param

	var post entity.IntershipPost

	err := config.DB().
		Preload("Company").
		Preload("Company.User.Role").
		Preload("Company.Address.Province").
		Preload("Company.Address.District").
		Preload("Company.Address.SubDistrict.Postcode").
		Preload("Company.Contact").
		Preload("Company.Admin").
		Preload("JobType").
		Preload("Stipend").
		Preload("WorkDay").
		Preload("WorkMode").
		Preload("StatusPost").
		Preload("Benefits").
		Preload("Admin.User.Role").
		Preload("Applications.Student").
		First(&post, id).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "ไม่พบโพสต์ฝึกงาน",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, post)
}