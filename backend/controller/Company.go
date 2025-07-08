package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

func GetAllActiveCompanies(c *gin.Context) {
	var companies []entity.Company

	err := config.DB().
		Preload("Address").
		Preload("Admin").
		Preload("Contact").
		Preload("IntershipPosts").
		Preload("InterviewAppointments").
		Preload("Reviews").
		Preload("User.Verifications.StatusVerify").
		Where("deleted_at IS NULL").
		Find(&companies).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch companies",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, companies)
}

func GetAllDeletedCompany(c *gin.Context) {
	var companies []entity.Company
	if err := config.DB().
		Unscoped(). // ดึงรวม soft deleted
		Where("deleted_at IS NOT NULL").
		Preload("Contact").
		Preload("IntershipPosts").
		Preload("InterviewAppointments").
		Preload("Reviews").
		Preload("User.Verifications.StatusVerify").
		Find(&companies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get companies"})
		return
	}

	c.JSON(http.StatusOK, companies)
}

func GetCompanyByID(c *gin.Context) {
	id := c.Param("id")
	var company []entity.Company

	if err := config.DB().
		Preload("Address").
		Preload("Admin").
		Preload("Contact").
		Preload("IntershipPost").
		Preload("InterviewAppointment").
		Preload("Review").
		First(&company, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, company)
}

func DeleteCompany(c *gin.Context) {
	id := c.Param("id")

	// Step 1: หา company ตาม id
	var company entity.Company
	if err := config.DB().First(&company, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	// Step 2: ลบ company
	if err := config.DB().Delete(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete company"})
		return
	}

	// Step 3: ลบ user ที่เกี่ยวข้อง
	if err := config.DB().Delete(&entity.User{}, company.UserID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "soft deleted"})
}

/* func SuspendCompany(c *gin.Context) {
	id := c.Param("id")

	var company entity.Company
	if err := config.DB().Preload("User").First(&company, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัท"})
		return
	}

	if company.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "บริษัทไม่มีบัญชีผู้ใช้"})
		return
	}

	if err := config.DB().Model(&entity.User{}).Where("id = ?", company.UserID).
		Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถระงับบัญชีได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ระงับบัญชีบริษัทแล้ว"})
} */
