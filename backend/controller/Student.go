package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm" // เพิ่ม import สำหรับ gorm
)
func GetStudentByID(c *gin.Context) {
    id := c.Param("id")
    var student []entity.Gender

    if err := config.DB().First(&student, id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        }
        return
    }

    c.JSON(http.StatusOK, student)
}