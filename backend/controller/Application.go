package controller

import (
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// POST /applications - Create a new application entry
func CreateApplication(c *gin.Context) {
	var application entity.Application

	// Bind the incoming JSON data to the Application struct
	if err := c.ShouldBindJSON(&application); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบว่า IntershipPostID มีอยู่ในฐานข้อมูลหรือไม่
	var internshipPost entity.IntershipPost
	db := config.DB()
	db.First(&internshipPost, application.IntershipPostID)
	if internshipPost.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Internship post not found"})
		return
	}

	// สร้าง Application entry
	app := entity.Application{
		Status:          application.Status,
		ResumeUrl:       application.ResumeUrl,
		SubmitAt:        application.SubmitAt,
		IntershipPostID: application.IntershipPostID, // โยงความสัมพันธ์กับ IntershipPost
		// IntershipPost:   internshipPost,              // โยงความสัมพันธ์กับ IntershipPost
	}

	// บันทึกข้อมูล Application
	if err := db.Create(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create application"})
		return
	}

	// ส่ง response กลับไปที่ client
	c.JSON(http.StatusCreated, gin.H{
		"message": "Application created successfully",
		"data":    app,
	})
}

// GET /applications - List all applications
func ListApplications(c *gin.Context) {
	var applications []struct {
		ID              uint      `json:"id"`
		Status          string    `json:"status"`
		ResumeUrl       string    `json:"resume_url"`
		SubmitAt        time.Time `json:"submit_at"`
		IntershipPostID uint      `json:"internship_post_id"`
		PostName        string    `json:"post_name"`
	}

	db := config.DB()

	results := db.Table("applications").
		Select(`
            applications.id, 
            applications.status, 
            applications.resume_url, 
            applications.submit_at, 
            applications.internship_post_id, 
            internship_posts.post_name
        `).
		Joins("left join internship_posts on internship_posts.id = applications.internship_post_id").
		Scan(&applications)

	if results.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, applications)
}

// GET /applications/:id - Get details of a specific application
func GetApplicationById(c *gin.Context) {
	applicationID := c.Param("id")
	var application entity.Application

	db := config.DB()

	// Query a specific application entry by ID
	result := db.First(&application, applicationID)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	c.JSON(http.StatusOK, application)
}

// PUT /applications/:id - Update a specific application entry
func UpdateApplication(c *gin.Context) {
	applicationID := c.Param("id")
	var application entity.Application

	db := config.DB()

	// Find the existing application entry
	if err := db.First(&application, applicationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	// Bind the incoming JSON data to the Application struct
	if err := c.ShouldBindJSON(&application); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the application entry in the database
	if err := db.Save(&application).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application updated successfully", "data": application})
}

// DELETE /applications/:id - Delete a specific application entry
func DeleteApplication(c *gin.Context) {
	id := c.Param("id")

	db := config.DB()

	if tx := db.Exec("DELETE FROM applications WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Application not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application deleted successfully"})
}
