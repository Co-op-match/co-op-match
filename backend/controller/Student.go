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
		Preload("User").
		Preload("Admin").
		Preload("Education").
		Preload("Gender").
		Preload("Address").
		Preload("StudentSkill").
		Preload("StudentInterest").
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
		Preload("User.ProfileImage").
		Preload("Admin").
		Preload("Education").
		Preload("Education.University").
		Preload("Education.Faculty").
		Preload("Education.Program").
		Preload("Education.EducationLevel").
		Preload("Gender").
		Preload("Address").
		Preload("Address.Postcode").
		Preload("Address.Province").
		Preload("Address.SubDistrict").
		Preload("Address.District").
		Preload("StudentSkill.Skill").       // ดึงชื่อ skill
		Preload("StudentInterest.Interest"). // ดึงชื่อ interest

		Where("user_id = ?", UserID).
		First(&student).Error; err != nil {

		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		}
		return
	}

	c.JSON(http.StatusOK, student)
}

func CreateStudent(c *gin.Context) {
	var student entity.Student

	// Bind JSON body -> struct
	if err := c.ShouldBindJSON(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Save to DB
	if err := config.DB().Create(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create student"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Student created successfully",
		"data":    student,
	})
}

func UpdateStudent(c *gin.Context) {
	userID := c.Param("id") // ใช้ user_id แทน
	var student entity.Student
	if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found with this user_id"})
		return
	}
	var input entity.Student
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updateData := map[string]interface{}{}

	// เพิ่มเฉพาะ field ที่มีการเปลี่ยนแปลง
	if input.FirstName != "" && input.FirstName != student.FirstName {
		updateData["first_name"] = input.FirstName
	}
	if input.LastName != "" && input.LastName != student.LastName {
		updateData["last_name"] = input.LastName
	}
	if input.PhoneNumber != "" && input.PhoneNumber != student.PhoneNumber {
		updateData["phone_number"] = input.PhoneNumber
	}
	if !input.Birthday.IsZero() && input.Birthday != student.Birthday {
		updateData["birthday"] = input.Birthday
	}
	if input.Age != 0 && input.Age != student.Age {
		updateData["age"] = input.Age
	}
	if input.GenderID != 0 && input.GenderID != student.GenderID {
		updateData["gender_id"] = input.GenderID
	}

	// อื่น ๆ เช่น Nationality, Religion, Height, Weight
	if input.Nationality != "" && input.Nationality != student.Nationality {
		updateData["nationality"] = input.Nationality
	}
	if input.Religion != "" && input.Religion != student.Religion {
		updateData["religion"] = input.Religion
	}
	if input.Height != 0 && input.Height != student.Height {
		updateData["height"] = input.Height
	}
	if input.Weight != 0 && input.Weight != student.Weight {
		updateData["weight"] = input.Weight
	}

	if len(updateData) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "ไม่มีข้อมูลที่เปลี่ยนแปลง"})
		return
	}

	if err := config.DB().Model(&student).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update student"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Student updated successfully",
		"data":    student,
	})
}

// GET /universities
func GetUniversities(c *gin.Context) {
	var universities []entity.University

	err := config.DB().
		Preload("Faculties").
		Preload("Faculties.Programs").
		Find(&universities).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, universities)
}

func GetApplicationsByUserID(c *gin.Context) {
	userIDParam := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// ค้นหา student ID ที่สัมพันธ์กับ user_id
	var student entity.Student
	if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found for this user"})
		return
	}

	// ดึง Application ทั้งหมดของ Student คนนั้น พร้อม preload ข้อมูลที่เกี่ยวข้อง
	var applications []entity.Application
	if err := config.DB().
		Preload("IntershipPost").
		Preload("IntershipPost.Company").
		Where("student_id = ?", student.ID).
		Find(&applications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": applications})
}