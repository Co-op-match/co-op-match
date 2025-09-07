package controller

import (
	"net/http"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"

	"github.com/gin-gonic/gin"
)

func GetAllStatusVerify(c *gin.Context) {
	var statuses []entity.StatusVerify

	db := config.DB()

	if err := db.Find(&statuses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลสถานะได้"})
		return
	}
	c.JSON(http.StatusOK, statuses)
}

// handler PUT /verify/:id
func UpdateVerifyStatus(c *gin.Context) {
	var updateData entity.Verify
	id := c.Param("id")

	// รับ JSON ที่ส่งเข้ามาเป็น Verify struct
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	var verify entity.Verify
	if err := config.DB().First(&verify, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "verify not found"})
		return
	}

	// อัปเดตเฉพาะ field ที่ต้องการ
	if updateData.StatusVerifyID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid Status Verify ID"})
		return
	}

	verify.StatusVerifyID = updateData.StatusVerifyID
	verify.AdminID = updateData.AdminID
	verify.Reason = updateData.Reason

	now := time.Now()
	verify.VerifiedAt = &now

	if err := config.DB().Save(&verify).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}

	c.JSON(http.StatusOK, verify)
}

// GET /api/verifications
func GetAllVerifications(c *gin.Context) {
	var verifications []entity.Verify
	if err := config.DB().
		Preload("User.Company").
		Preload("User.AcademicStaff").
		Preload("User.ProfileImage").
		Preload("User.Role").
		Preload("StatusVerify").
		Preload("Admin").
		Find(&verifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}
	c.JSON(http.StatusOK, verifications)
}

// GET /api/verifications/:id
func GetVerificationByID(c *gin.Context) {
	id := c.Param("id")
	var verify entity.Verify
	if err := config.DB().
		Preload("User.Company").
		Preload("User.AcademicStaff").
		Preload("User.ProfileImage").
		Preload("User.Role").
		Preload("StatusVerify").
		Preload("Admin").
		First(&verify, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลการรับรอง"})
		return
	}
	c.JSON(http.StatusOK, verify)
}

// GET /api/verifications/user/:user_id/latest
func GetLatestVerificationByUserID(c *gin.Context) {
	userIDStr := c.Param("user_id")
	
	userID, err := strconv.Atoi(userIDStr)
	if err != nil || userID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id ไม่ถูกต้อง"})
		return
	}

	var verify entity.Verify
	if err := config.DB().Preload("User.Company").
		Preload("User.AcademicStaff").
		Preload("User.ProfileImage").
		Preload("User.Role").
		Preload("StatusVerify").
		Preload("Admin").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		First(&verify).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลการรับรองของผู้ใช้นี้"})
		return
	}
	c.JSON(http.StatusOK, verify)
}