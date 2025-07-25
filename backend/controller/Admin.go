package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

func GetAllAdmin(c *gin.Context) {
	var admin []entity.Admin

	err := config.DB().
		Preload("Permission").
		Preload("IntershipPost").
		Preload("Company").
		Preload("AcademicStaff").
		Preload("Student").
		Preload("User").
		Preload("User.Role").
		Find(&admin).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch admin",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, admin)
}

func GetAdminByID(c *gin.Context) {
    id := c.Param("id")
    var admin []entity.Admin

    if err := config.DB().
		Preload("Permission").
		Preload("IntershipPost").
		Preload("Company").
		Preload("AcademicStaff").
		Preload("Student").
		Preload("User").
        First(&admin, id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        }
        return
    }

    c.JSON(http.StatusOK, admin)
}

func GetAdminByUserID(c *gin.Context) {
	id := c.Param("id") // UserID ที่ส่งเข้ามา

	var admin entity.Admin

	if err := config.DB().
		Preload("Permission").
		Preload("IntershipPost").
		Preload("Company").
		Preload("AcademicStaff").
		Preload("Student").
		Preload("User").
		Where("user_id = ?", id).
		First(&admin).Error; err != nil {

		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, admin)
}

func GetAllActiveAdmins(c *gin.Context) {
	var admins []entity.Admin
	if err := config.DB().
		Preload("Permission").
		Preload("IntershipPost").
		Preload("Company").
		Preload("User").
		Preload("AcademicStaff").
		Preload("Student").
		Where("deleted_at IS NULL").
		Find(&admins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch active admins"})
		return
	}
	c.JSON(http.StatusOK, admins)
}

func GetAllDeletedAdmins(c *gin.Context) {
	var admins []entity.Admin
	if err := config.DB().
		Unscoped().
		Where("deleted_at IS NOT NULL").
		Preload("Permission").
		Preload("IntershipPost").
		Preload("Company").
		Preload("User").
		Preload("AcademicStaff").
		Preload("Student").
		Find(&admins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deleted admins"})
		return
	}
	c.JSON(http.StatusOK, admins)
}

func DeleteAdmin(c *gin.Context) {
	id := c.Param("id")

	var admin entity.Admin
	if err := config.DB().First(&admin, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "admin not found"})
		return
	}

	// Soft delete admin
	if err := config.DB().Delete(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete admin"})
		return
	}

	// Delete related user
	if err := config.DB().Delete(&entity.User{}, admin.UserID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete related user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "admin deleted successfully"})
}