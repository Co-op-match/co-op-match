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

/*==========================  Intership Post in Admin  ==========================*/
func GetAllInternshipPostsInAdmin(c *gin.Context) {
	var posts []entity.IntershipPost

	err := config.DB().
		Preload("Company").
		Preload("Company.User.Role").
		Preload("Company.Address.Province").
		Preload("Company.Address.District").
		Preload("Company.Address.SubDistrict.Postcode").
		Preload("Company.Contact").
		Preload("Company.Admin").
		Preload("JobType").
		Preload("Stipend").
		Preload("WorkDay").
		Preload("WorkMode").
		Preload("StatusPost").
		Preload("Benefits").
		Preload("Admin.User.Role").
		Preload("Applications.Student").
		Find(&posts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "ไม่สามารถดึงข้อมูลโพสต์ฝึกงานได้",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, posts)
}

func GetInternshipPostsInAdminByIPostID(c *gin.Context) {
	id := c.Param("id") // รับ post id จาก URL param

	var post entity.IntershipPost

	err := config.DB().
		Preload("Company").
		Preload("Company.User.Role").
		Preload("Company.Address.Province").
		Preload("Company.Address.District").
		Preload("Company.Address.SubDistrict.Postcode").
		Preload("Company.Contact").
		Preload("Company.Admin").
		Preload("JobType").
		Preload("Stipend").
		Preload("WorkDay").
		Preload("WorkMode").
		Preload("StatusPost").
		Preload("Benefits").
		Preload("Admin.User.Role").
		Preload("Applications.Student").
		First(&post, id).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "ไม่พบโพสต์ฝึกงาน",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, post)
}
func GetAllActiveAdmins(c *gin.Context) {
	var admins []entity.Admin
	if err := config.DB().
		Preload("Permission").
		Preload("IntershipPost").
		Preload("Company").
		Preload("User.Role").
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
		Preload("User.Role").
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