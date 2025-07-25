package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAllAcademicStaff(c *gin.Context) {
	var academicstaff []entity.AcademicStaff

	err := config.DB().
		Preload("User").
		Preload("Address").
		Preload("Admin").
		Preload("Gender").
		Preload("Contact").
		Find(&academicstaff).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch students",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, academicstaff)
}

func GetAllActiveAcademicStaffs(c *gin.Context) {
	var staffs []entity.AcademicStaff

	err := config.DB().
		Preload("User.Verifications.StatusVerify").
		Preload("Address.Province").
		Preload("Address.District").
		Preload("Address.SubDistrict").
		Preload("Address.Postcode").
		Preload("Contact").
		Preload("Gender").
		Preload("Admin").
		Where("deleted_at IS NULL").
		Find(&staffs).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch academic staffs",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, staffs)
}

func GetAllDeletedAcademicStaffs(c *gin.Context) {
	var staffs []entity.AcademicStaff

	err := config.DB().
		Unscoped().
		Where("deleted_at IS NOT NULL").
		Preload("User.Verifications.StatusVerify").
		Preload("Address.Province").
		Preload("Address.District").
		Preload("Address.SubDistrict").
		Preload("Address.Postcode").
		Preload("Contact").
		Preload("Gender").
		Preload("Admin").
		Find(&staffs).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch deleted academic staffs",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, staffs)
}

func DeleteAcademicStaff(c *gin.Context) {
	id := c.Param("id")

	// Step 1: หา academic staff ตาม id
	var staff entity.AcademicStaff
	if err := config.DB().First(&staff, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "academic staff not found"})
		return
	}

	// Step 2: ลบ academic staff
	if err := config.DB().Delete(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete academic staff"})
		return
	}

	// Step 3: ลบ user ที่เกี่ยวข้อง
	if err := config.DB().Delete(&entity.User{}, staff.UserID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "academic staff soft deleted"})
}
func UpdateAcademicStaff(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var staff entity.AcademicStaff
	if err := db.Preload("Address").First(&staff, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "academic staff not found"})
		return
	}

	// Input struct รวมข้อมูล Address แบบ nested
	var input struct {
		AcademicPosition string `json:"academic_position"`
		Faculty          string `json:"faculty"`
		Department       string `json:"department"`
		University       string `json:"university"`
		Age              int    `json:"age"`
		AdminID          uint   `json:"admin_id"`
		GenderID		 uint	`json:"gender_id"`
		Address          struct {
			HouseNumber   string `json:"house_number"`
			Village       string `json:"village"`
			Street        string `json:"street"`
			SubStreet     string `json:"sub_street"`
			Province      uint   `json:"Province"`
			District      uint   `json:"District"`
			SubDistrict   uint   `json:"SubDistrict"`
			Postcode      uint   `json:"Postcode"`
		} `json:"Address"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	// อัปเดต field หลักของ staff
	staff.AcademicPosition = input.AcademicPosition
	staff.Faculty = input.Faculty
	staff.Department = input.Department
	staff.University = input.University
	staff.Age = input.Age
	staff.AdminID = input.AdminID
	staff.GenderID = input.GenderID

	// อัปเดตที่อยู่ถ้ามี
	if staff.Address.ID != 0 {
		staff.Address.HouseNumber = input.Address.HouseNumber
		staff.Address.Village = input.Address.Village
		staff.Address.Street = input.Address.Street
		staff.Address.SubStreet = input.Address.SubStreet
		staff.Address.ProvinceID = input.Address.Province
		staff.Address.DistrictID = input.Address.District
		staff.Address.SubDistrictID = input.Address.SubDistrict
		staff.Address.PostcodeID = input.Address.Postcode
	}

	// บันทึกการเปลี่ยนแปลง
	if err := db.Save(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update staff"})
		return
	}

	if err := db.Save(&staff.Address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
		return
	}

	c.JSON(http.StatusOK, staff)
}