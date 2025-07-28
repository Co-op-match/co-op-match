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
		StudentID:       student.ID,
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

// GET /applications/student/:id

func GetApplicationsByStudentID(c *gin.Context) {
	studentID := c.Param("id")

	var applications []entity.Application

	if err := config.DB().
		Preload("IntershipPost.Company").
		Joins("JOIN application_details ON application_details.application_id = applications.id").
		Where("application_details.student_id = ?", studentID).
		Find(&applications).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลการสมัครของนักศึกษานี้"})
		return
	}

	// ✅ จัด response format ให้เหมาะกับ frontend
	var response []map[string]interface{}
	for _, app := range applications {
		response = append(response, map[string]interface{}{
			"id":           app.ID,
			"position":     app.IntershipPost.PostName,
			"company_name": app.IntershipPost.Company.CompanyName,
			"status":       app.Status,
			"date":         app.SubmitAt.Format("01-02-2006"),
			"resume":       app.ResumeUrl,
			"transcript":   app.TranscriptUrl,
			"companyNote":  app.CompanyNote,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// GET /application/:id
type ApplicationResponse struct {
	entity.Application
	FormattedDate string `json:"formatted_date"`
}

func GetApplicationByID(c *gin.Context) {
	applicationID := c.Param("id")
	var application entity.Application

	if err := config.DB().
		Preload("IntershipPost.Company").
		Preload("ApplicationDetails").
		Where("id = ?", applicationID).
		First(&application).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบใบสมัครนี้"})
		return
	}

	// Format วันที่
	formattedDate := application.CreatedAt.Format("02-01-2006") // DD-MM-YYYY

	c.JSON(http.StatusOK, ApplicationResponse{
		Application:   application,
		FormattedDate: formattedDate,
	})
}

// GET /applications/post/:id
// GET /applications/post/:id
func GetApplicationsByIntershipPostID(c *gin.Context) {
	postID := c.Param("id")

	var applications []entity.Application

	if err := config.DB().
		Preload("ApplicationDetails.Student").
		Preload("IntershipPost.Company").
		Where("intership_post_id = ?", postID).
		Find(&applications).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลการสมัครสำหรับโพสต์นี้"})
		return
	}

	var response []map[string]interface{}
	for _, app := range applications {
		var studentName string
		if len(app.ApplicationDetails) > 0 && app.ApplicationDetails[0].Student.ID != 0 {
			student := app.ApplicationDetails[0].Student
			studentName = student.FirstName + " " + student.LastName
		}

		response = append(response, map[string]interface{}{
			"id":           app.ID,
			"student_name": studentName,
			"status":       app.Status,
			"date":         app.SubmitAt.Format("02-01-2006"),
			"resume":       app.ResumeUrl,
			"transcript":   app.TranscriptUrl,
			"companyNote":  app.CompanyNote,
			"post_name":    app.IntershipPost.PostName, // ✅ ตรงนี้แก้แล้ว
		})

	}

	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

func UpdateApplication(c *gin.Context) {
	id := c.Param("id")

	var application entity.Application
	if err := config.DB().First(&application, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	var input struct {
		Status      string `json:"status"`
		CompanyNote string `json:"company_note"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ ใช้ db.Model().Updates() แทน .Save() เพื่ออัปเดตเฉพาะ field ที่เปลี่ยน
	if err := config.DB().Model(&application).Updates(map[string]interface{}{
		"status":       input.Status,
		"company_note": input.CompanyNote,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application updated successfully", "data": application})
}
