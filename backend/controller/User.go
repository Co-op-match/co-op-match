package controller

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetAllUser(c *gin.Context) {
	var users []entity.User

	err := config.DB().
	Preload("Role").
	Preload("Student").
	Preload("AcademicStaff").
	Preload("Company").
	Preload("Admin").
	Preload("Verify").
	Find(&users).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch users",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, users)
}

func GetAllGender(c *gin.Context) {
	var gender []entity.Gender

	err := config.DB().
		Find(&gender).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch gender",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gender)
}

func GetUserByID(c *gin.Context) {
	id := c.Param("id")
	var user entity.User

	if err := config.DB().
		Preload("Role").
		Preload("Student").
		Preload("ProfileImage").
		Preload("Company").
		First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		}
		return
	}

	c.JSON(http.StatusOK, user)
}

func CreateProfileImage(c *gin.Context) {
	// รับค่า UserID จาก Form
	userIDStr := c.PostForm("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "UserID is required"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UserID"})
		return
	}

	// รับไฟล์ภาพจาก FormData
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please upload a file"})
		return
	}

	// สร้างโฟลเดอร์อัปโหลดถ้ายังไม่มี
	uploadDir := "public/uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create upload directory"})
			return
		}
	}

	// ตั้งชื่อไฟล์ใหม่ด้วย timestamp
	filename := fmt.Sprintf("%s-%s", time.Now().In(time.FixedZone("Asia/Bangkok", 7*60*60)).Format("20060102-150405"), file.Filename)
	filePath := filepath.Join(uploadDir, filename)

	// บันทึกไฟล์
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save the file"})
		return
	}

	// สร้าง path สำหรับเก็บในฐานข้อมูล
	relativePath := fmt.Sprintf("/uploads/%s", filename)

	// สร้างข้อมูล ProfileImage
	image := entity.ProfileImage{
		ImageURL: relativePath,
		UserID:   uint(userID),
	}

	// บันทึกลง DB
	if err := config.DB().Create(&image).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save the image"})
		return
	}

	// ส่งข้อมูลกลับ
	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Profile image uploaded successfully",
		"data":    image,
	})
}

func UpdateProfileImage(c *gin.Context) {
	userIDStr := c.PostForm("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "UserID is required"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UserID"})
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please upload a file"})
		return
	}

	// ค้นหาโปรไฟล์ที่มีอยู่
	var existingImage entity.ProfileImage
	if err := config.DB().Where("user_id = ?", userID).First(&existingImage).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile image not found"})
		return
	}

	// ลบไฟล์ภาพเก่า (ถ้ามี)
	if existingImage.ImageURL != "" {
		oldFilePath := filepath.Join("public", strings.Replace(existingImage.ImageURL, "/uploads/", "uploads/", 1))
		if err := os.Remove(oldFilePath); err != nil && !os.IsNotExist(err) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete old image"})
			return
		}
	}

	// สร้างโฟลเดอร์ถ้ายังไม่มี
	uploadDir := "public/uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create upload directory"})
			return
		}
	}

	// สร้างชื่อไฟล์ใหม่
	filename := fmt.Sprintf("%s-%s", time.Now().In(time.FixedZone("Asia/Bangkok", 7*60*60)).Format("20060102-150405"), file.Filename)
	filePath := filepath.Join(uploadDir, filename)

	// บันทึกไฟล์ใหม่
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save the new file"})
		return
	}

	// อัปเดต URL ใหม่
	newURL := fmt.Sprintf("/uploads/%s", filename)
	existingImage.ImageURL = newURL

	// บันทึกการเปลี่ยนแปลง
	if err := config.DB().Save(&existingImage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update the profile image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Profile image updated successfully",
		"data":    existingImage,
	})
}

func GetProfileImage(c *gin.Context) {
    userIDStr := c.Query("user_id")
    if userIDStr == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "UserID is required"})
        return
    }

    userID, err := strconv.ParseUint(userIDStr, 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UserID"})
        return
    }

    var image entity.ProfileImage
    err = config.DB().Where("user_id = ?", userID).First(&image).Error
    if err != nil {
        // ถ้าไม่เจอ record หรือ error อื่น ๆ ก็ส่ง Not Found
        c.JSON(http.StatusNotFound, gin.H{"error": "Profile image not found"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "status":  "success",
        "message": "Profile image found",
        "data":    image,
    })
}
func GetProfileImageByUserID(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UserID"})
		return
	}

	var image entity.ProfileImage
	if err := config.DB().Where("user_id = ?", userID).First(&image).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile image not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   image,
	})
}
