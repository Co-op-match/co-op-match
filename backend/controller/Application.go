package controller

import (
	"net/http"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// POST /applications/:id → id = InternshipPostID
func CreateApplication(c *gin.Context) {
	postID := c.Param("id")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing post ID"})
		return
	}

	var internshipPost entity.IntershipPost
	if err := config.DB().First(&internshipPost, postID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Internship post not found"})
		return
	}

	// ✅ รับข้อมูลจาก form-data
	status := c.PostForm("status")
	submitAtStr := c.PostForm("submit_at")
	userIDStr := c.PostForm("student_id")

	if status == "" || submitAtStr == "" || userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	submitAt, err := time.Parse(time.RFC3339, submitAtStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submitAt format"})
		return
	}

	// ✅ รับไฟล์ resume
	resumeFile, err := c.FormFile("resume")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Resume file is required"})
		return
	}
	resumePath := "public/uploads/resumes/" + resumeFile.Filename
	c.SaveUploadedFile(resumeFile, resumePath)

	// ✅ รับไฟล์ transcript (optional)
	transcriptFile, err := c.FormFile("transcript")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Transcript file is required"})
		return
	}
	transcriptPath := "public/uploads/transcripts/" + transcriptFile.Filename
	c.SaveUploadedFile(transcriptFile, transcriptPath)

	// ✅ หา student
	var student entity.Student
	if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// ✅ ตรวจสอบการสมัครซ้ำ
	var existingApp entity.Application
	if err := config.DB().
		Joins("JOIN application_details ON applications.id = application_details.application_id").
		Where("application_details.student_id = ? AND applications.intership_post_id = ?", student.ID, internshipPost.ID).
		First(&existingApp).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You have already applied for this post"})
		return
	}

	// ✅ บันทึก application
	application := entity.Application{
		Status:          status,
		ResumeUrl:       "/" + resumePath, // หรือเก็บเป็น relative path
		TranscriptUrl:   "/" + transcriptPath,
		SubmitAt:        submitAt,
		IntershipPostID: internshipPost.ID,
	}
	if err := config.DB().Create(&application).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create application"})
		return
	}

	appDetail := entity.ApplicationDetails{
		StudentID:     student.ID,
		ApplicationID: application.ID,
	}
	if err := config.DB().Create(&appDetail).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create application detail"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":            "Application submitted successfully",
		"application":        application,
		"application_detail": appDetail,
	})
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
