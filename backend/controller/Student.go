package controller

import (
	"net/http"
	"strconv"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetAllStudents(c *gin.Context) {
	var students []entity.Student

	err := config.DB().
		Preload("Education").
		Preload("StudentSkill").
		Preload("StudentInterest").
		Preload("ApplicationDetails").
		Preload("InterviewAppointment").
		Preload("JobMatch").
		Preload("Review").
		Find(&students).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch students",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, students)
}

func GetStudentByID(c *gin.Context) {
	id := c.Param("id")
	var student []entity.Student

	if err := config.DB().
		Preload("User").
		Preload("Admin").
		Preload("Education").
		Preload("Gender").
		Preload("Address").
		Preload("StudentSkill").
		Preload("StudentInterest").
		First(&student, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, student)
}

func GetStudentByUserID(c *gin.Context) {
    id := c.Param("user_id")

     UserID, err := strconv.ParseUint(id, 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
        return
    }

    var student entity.Student

    if err := config.DB().
        Preload("User").
        Preload("Admin").
        Preload("Education").
        Preload("Gender").
        Preload("Address").
        Preload("StudentSkill").
        Preload("StudentInterest").
        Where("user_id = ?", UserID).
        First(&student).Error; err != nil {

        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        }
        return
    }

    c.JSON(http.StatusOK, student)
}
