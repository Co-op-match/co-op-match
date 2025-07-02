package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"

	"github.com/gin-gonic/gin"
)

func GetAllEducation(c *gin.Context) {
	var educations []entity.Education

	err := config.DB().
		Find(&educations).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch educations",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, educations)
}
func GetAllEducationLevel(c *gin.Context) {
	var educationlevels []entity.EducationLevel

	err := config.DB().
		Find(&educationlevels).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch educationlevels",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, educationlevels)
}
func GetEcudutionByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	var student entity.Student
	if err := config.DB().Preload("Education").Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษา"})
		return
	}

	c.JSON(http.StatusOK, student.Education)
}

type EducationPayload struct {
	UserID           uint    `json:"user_id"`
	UniversityID     uint    `json:"university_id"`
	FacultyID        uint    `json:"faculty_id"`
	ProgramID        uint    `json:"program_id"`
	Year             int     `json:"year"`
	EducationLevelID uint    `json:"education_level_id"`
	Grade            float64 `json:"grade"`
}

func CreateEducation(c *gin.Context) {
	var payload EducationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// หา student ด้วย user_id
	var student entity.Student
	if err := config.DB().Where("user_id = ?", payload.UserID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษาจาก user_id นี้"})
		return
	}

	// สร้าง Education record โดยใช้ ID ตรงๆ
	education := entity.Education{
		UniversityID:     payload.UniversityID,
		FacultyID:        payload.FacultyID,
		ProgramID:        payload.ProgramID,
		Year:             payload.Year,
		EducationLevelID: payload.EducationLevelID,
		Grade:            payload.Grade,
		StudentID:        student.ID,
	}

	if err := config.DB().Create(&education).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข้อมูลการศึกษาไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "บันทึกข้อมูลการศึกษาเรียบร้อย",
		"data":    education,
	})
}

func UpdateEducationByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	// รับข้อมูลจาก body
	var educationInput entity.Education
	if err := c.ShouldBindJSON(&educationInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง", "details": err.Error()})
		return
	}

	// หา student จาก user_id
	var student entity.Student
	if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษา"})
		return
	}

	// หา education ที่เชื่อมกับ student
	var education entity.Education
	if err := config.DB().Where("student_id = ?", student.ID).First(&education).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลการศึกษาของนักศึกษา"})
		return
	}

	// อัปเดตข้อมูล
	if err := config.DB().Model(&education).Updates(educationInput).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตข้อมูลการศึกษาได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "อัปเดตข้อมูลการศึกษาเรียบร้อยแล้ว",
		"education": education,
	})
}
