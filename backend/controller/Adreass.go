package controller

import (
	"net/http"
	"strconv"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"

	"github.com/gin-gonic/gin"
)

func GetAllAdress(c *gin.Context) {
	var addresses []entity.Address

	err := config.DB().
		Preload("Province").
		Preload("District").
		Preload("SubDistrict").
		Preload("Postcode").
		Find(&addresses).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch address",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, addresses)
}

func GetAddressByUserID(c *gin.Context) {
	userID := c.Param("id")

	var student entity.Student
	if err := config.DB().Preload("Address").Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษา"})
		return
	}

	c.JSON(http.StatusOK, student.Address)
}

func CreateAddressByRoleIDAndUserID(c *gin.Context) {
	roleIDStr := c.Param("role_id")
	userID := c.Param("user_id")

	roleID, err := strconv.Atoi(roleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role_id ไม่ถูกต้อง"})
		return
	}

	// Bind address ข้อมูลจาก body
	var address entity.Address
	if err := c.ShouldBindJSON(&address); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง", "details": err.Error()})
		return
	}

	// บันทึก Address ใหม่
	if err := config.DB().Create(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกที่อยู่ได้"})
		return
	}

	var updateErr error
	switch roleID {
	case 2: // company
		// ตรวจสอบว่า user มีอยู่จริงหรือไม่
		var user entity.User
		if err := config.DB().Where("id = ?", userID).First(&user).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้"})
			return
		}

	case 3: // student
		var student entity.Student
		if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษา"})
			return
		}
		student.AddressID = address.ID
		updateErr = config.DB().Save(&student).Error

	case 4: // academic staff
		var staff entity.AcademicStaff
		if err := config.DB().Where("user_id = ?", userID).First(&staff).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบอาจารย์"})
			return
		}
		staff.AddressID = address.ID
		updateErr = config.DB().Save(&staff).Error

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "role_id ไม่รองรับ"})
		return
	}

	if updateErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เชื่อมที่อยู่ไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "สร้างที่อยู่เรียบร้อยและเชื่อมกับ role ID สำเร็จ",
		"address": address,
		"id":      address.ID,
	})
}

func UpdateAddressByRoleIDAndUserID(c *gin.Context) {
	roleIDStr := c.Param("role_id")
	userID := c.Param("user_id")

	roleID, err := strconv.Atoi(roleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role_id ไม่ถูกต้อง"})
		return
	}

	var addressInput entity.Address
	if err := c.ShouldBindJSON(&addressInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง", "details": err.Error()})
		return
	}

	var addressID uint
	switch roleID {
	case 2: // company
		var company entity.Company
		if err := config.DB().Where("user_id = ?", userID).First(&company).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัท"})
			return
		}
		addressID = company.AddressID
	case 3: // student
		var student entity.Student
		if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษา"})
			return
		}
		addressID = student.AddressID

	case 4: // academic staff
		var staff entity.AcademicStaff
		if err := config.DB().Where("user_id = ?", userID).First(&staff).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบอาจารย์"})
			return
		}
		addressID = staff.AddressID

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "role_id ไม่รองรับ"})
		return
	}

	// ตรวจสอบว่า address นี้มีอยู่จริง
	var existingAddress entity.Address
	if err := config.DB().First(&existingAddress, addressID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบันทึกที่อยู่เดิม"})
		return
	}

	// อัปเดตข้อมูล address
	if err := config.DB().Model(&existingAddress).Updates(addressInput).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตที่อยู่ได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "อัปเดตที่อยู่เรียบร้อยแล้ว",
		"address": existingAddress,
	})
}
func GetAllProvinces(c *gin.Context) {
	var provinces []entity.Provinces

	// preload ทุกระดับที่จำเป็น
	if err := config.DB().
		Preload("Districts").
		Preload("Districts.SubDistricts").
		Preload("Districts.SubDistricts.Postcode").
		Find(&provinces).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, provinces)
}
