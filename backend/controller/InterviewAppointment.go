package controller

import (
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// POST /interview_appointments - Create a new interview appointment entry
func CreateInterviewAppointment(c *gin.Context) {
	var interviewAppointment entity.InterviewAppointment

	// Bind the incoming JSON data to the InterviewAppointment struct
	if err := c.ShouldBindJSON(&interviewAppointment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// ตรวจสอบว่า CompanyID และ StudentID มีอยู่ในฐานข้อมูลหรือไม่
	var company entity.Company
	db := config.DB()
	db.First(&company, interviewAppointment.CompanyID)
	if company.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		return
	}

	var student entity.Student
	db.First(&student, interviewAppointment.StudentID)
	if student.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// สร้าง InterviewAppointment entry
	appointment := entity.InterviewAppointment{
		AppointmentDate: interviewAppointment.AppointmentDate,
		Status:          interviewAppointment.Status,
		Mode:            interviewAppointment.Mode,
		Details:         interviewAppointment.Details,
		CompanyID:       interviewAppointment.CompanyID, // โยงความสัมพันธ์กับ Company
		Company:         company,                        // โยงความสัมพันธ์กับ Company
		StudentID:       interviewAppointment.StudentID, // โยงความสัมพันธ์กับ Student
		Student:         student,                        // โยงความสัมพันธ์กับ Student
	}

	// บันทึกข้อมูล InterviewAppointment
	if err := db.Create(&appointment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create interview appointment"})
		return
	}

	// ส่ง response กลับไปที่ client
	c.JSON(http.StatusCreated, gin.H{
		"message": "Interview appointment created successfully",
		"data":    appointment,
	})
}

// GET /interview_appointments - List all interview appointments
func ListInterviewAppointments(c *gin.Context) {
	var appointments []struct {
		ID              uint      `json:"id"`
		AppointmentDate time.Time `json:"appointment_date"`
		Status          string    `json:"status"`
		Mode            string    `json:"mode"`
		Details         string    `json:"details"`
		CompanyID       uint      `json:"company_id"`
		CompanyName     string    `json:"company_name"`
		StudentID       uint      `json:"student_id"`
		StudentName     string    `json:"student_name"`
	}

	db := config.DB()

	results := db.Table("interview_appointments").
		Select(`
            interview_appointments.id, 
            interview_appointments.appointment_date, 
            interview_appointments.status, 
            interview_appointments.mode, 
            interview_appointments.details, 
            interview_appointments.company_id, 
            companies.company_name as company_name,
            interview_appointments.student_id, 
          	-- students.name as student_name,  -- 
						students.first_name || ' ' || students.last_name as student_name
        `).
		Joins("left join companies on companies.id = interview_appointments.company_id").
		Joins("left join students on students.id = interview_appointments.student_id").
		Scan(&appointments)

	if results.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, appointments)
}

// GET /interview_appointments/:id - Get details of a specific interview appointment
func GetInterviewAppointmentById(c *gin.Context) {
	appointmentID := c.Param("id")
	var appointment entity.InterviewAppointment

	db := config.DB()

	// Query a specific interview appointment entry by ID
	result := db.First(&appointment, appointmentID)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Interview appointment not found"})
		return
	}

	c.JSON(http.StatusOK, appointment)
}

// PUT /interview_appointments/:id
func UpdateInterviewAppointment(c *gin.Context) {
	appointmentID := c.Param("id")
	var existing entity.InterviewAppointment
	var input entity.InterviewAppointment

	db := config.DB()

	// หา record เดิมก่อน
	if err := db.First(&existing, appointmentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Interview appointment not found"})
		return
	}

	// รับ input ใหม่
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตเฉพาะฟิลด์
	existing.AppointmentDate = input.AppointmentDate
	existing.Status = input.Status
	existing.Mode = input.Mode
	existing.Details = input.Details

	if err := db.Save(&existing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update interview appointment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Interview appointment updated successfully", "data": existing})
}

// DELETE /interview_appointments/:id - Delete a specific interview appointment entry
func DeleteInterviewAppointment(c *gin.Context) {
	id := c.Param("id")

	db := config.DB()

	if tx := db.Exec("DELETE FROM interview_appointments WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Interview appointment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Interview appointment deleted successfully"})
}

func GetPendingInterviewApplicationsByCompanyID(c *gin.Context) {
	companyID := c.Param("id") // รับ company_id จากพารามิเตอร์ URL
	var applications []entity.Application

	db := config.DB()

	err := db.Preload("Student").
		Preload("IntershipPost").
		Joins("JOIN intership_posts ON intership_posts.id = applications.intership_post_id").
		Where("intership_posts.company_id = ? AND applications.status LIKE ?", companyID, "%รอการนัดสัมภาษณ์%").
		Find(&applications).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": applications})
}
