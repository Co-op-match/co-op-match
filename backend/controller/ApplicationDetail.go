package controller

import (
	"fmt"
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// POST /application_details - Create a new application detail entry
func CreateApplicationDetail(c *gin.Context) {
	var applicationDetail entity.ApplicationDetails

	// Bind the incoming JSON data to the ApplicationDetails struct
	if err := c.ShouldBindJSON(&applicationDetail); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// สร้าง ApplicationDetails entry
	ad := entity.ApplicationDetails{
		StudentID:     applicationDetail.StudentID,
		ApplicationID: applicationDetail.ApplicationID,
	}

	// บันทึกข้อมูล ApplicationDetails
	if err := db.Create(&ad).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Created success", "data": ad})
}

// GET /application_details - List all application details
func ListApplicationDetails(c *gin.Context) {
	// Get the Application ID parameter from the URL
	applicationID := c.Param("id")

	// Define a struct to hold the result set
	var applicationDetails []struct {
		StudentID   uint   `json:"student_id"`   // StudentID from the ApplicationDetails table
		StudentName string `json:"student_name"` // Student's name from the Students table
	}

	// Get the database connection
	db := config.DB()

	// Query to join application_details and students tables, select the required fields
	results := db.Table("application_details").
		Select("application_details.student_id, students.name as student_name").
		Joins("left join students on application_details.student_id = students.id").
		Where("application_details.application_id = ?", applicationID).
		Scan(&applicationDetails) // Scan the results into the applicationDetails struct

	// Check for errors in the query
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	// Return the results as JSON
	c.JSON(http.StatusOK, applicationDetails)
}

// GET /application_details/student/:id - Get application details by student ID
func GetApplicationDetailsByStudentID(c *gin.Context) {
	studentID := c.Param("id")

	db := config.DB()

	var applications []entity.Application

	if err := db.Preload("IntershipPost.Company").
		Joins("JOIN application_details ON application_details.application_id = applications.id").
		Where("application_details.student_id = ?", studentID).
		Find(&applications).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("Applications: %+v\n", applications)

	var response []map[string]interface{}
	for _, app := range applications {
		response = append(response, map[string]interface{}{
			"id":           app.ID,
			"position":     app.IntershipPost.PostName,
			"company":      app.IntershipPost.Company.CompanyName,
			"company_id":   app.IntershipPost.Company.ID,
			"company_name": app.IntershipPost.Company.CompanyName,
			"status":       app.Status,
			"date":         app.SubmitAt.Format("2006-01-02"),
			"resume":       app.ResumeUrl,
			"transcript":   app.TranscriptUrl,
			"companyNote":  app.CompanyNote,
		})
	}

	c.JSON(http.StatusOK, response)
}
