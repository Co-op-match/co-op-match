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
		Preload("Education.University").
		Preload("Education.Faculty").
		Preload("Education.Program").
		Preload("Gender").
		Preload("Address").
		Preload("Address.Postcode").
		Preload("Address.Province").
		Preload("Address.SubDistrict").
		Preload("Address.District").
		Preload("StudentSkill").
		Preload("StudentInterest").
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
	id := c.Param("id")

	var student entity.Student
	if err := config.DB().First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	var input entity.Student
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตฟิลด์ต่าง ๆ
	student.FirstName = input.FirstName
	student.LastName = input.LastName
	student.Birthday = input.Birthday
	student.Age = input.Age
	student.Nationality = input.Nationality
	student.Religion = input.Religion
	student.PhoneNumber = input.PhoneNumber
	student.Height = input.Height
	student.Weight = input.Weight

	student.GenderID = input.GenderID
	student.UserID = input.UserID
	student.AddressID = input.AddressID
	student.AdminID = input.AdminID

	if err := config.DB().Save(&student).Error; err != nil {
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

// GET /students/active
func GetAllActiveStudents(c *gin.Context) {
	var students []entity.Student

	err := config.DB().
		Preload("Gender").
		Preload("User").
		Preload("Address.Province").
		Preload("Address.District").
		Preload("Address.SubDistrict").
		Preload("Address.Postcode").
		Preload("Admin").
		Preload("Education.University").
		Preload("Education.Faculty").
		Preload("Education.Program").
		Preload("Education.EducationLevel").
		Preload("StudentSkill.Skill").
		Preload("StudentInterest.Interest").
		Preload("ApplicationDetails").
		Preload("InterviewAppointment").
		Preload("Reviews").
		Preload("JobMatches").
		Where("students.deleted_at IS NULL").
		Find(&students).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch active students",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, students)
}

// GET /students/deleted
func GetAllDeletedStudents(c *gin.Context) {
	var students []entity.Student

	err := config.DB().
		Unscoped(). // ดึง soft deleted ด้วย
		Where("students.deleted_at IS NOT NULL").
		Preload("Gender").
		Preload("User").
		Preload("Address.Province").
		Preload("Address.District").
		Preload("Address.SubDistrict").
		Preload("Address.Postcode").
		Preload("Admin").
		Preload("Education.University").
		Preload("Education.Faculty").
		Preload("Education.Program").
		Preload("Education.EducationLevel").
		Preload("StudentSkill.Skill").
		Preload("StudentInterest.Interest").
		Preload("ApplicationDetails").
		Preload("InterviewAppointment").
		Preload("Reviews").
		Preload("JobMatches").
		Find(&students).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch deleted students",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, students)
}

func DeleteStudent(c *gin.Context) {
	id := c.Param("id")

	// Step 1: หา student ตาม id
	var student entity.Student
	if err := config.DB().First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}

	// Step 2: ลบ student
	if err := config.DB().Delete(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete student"})
		return
	}

	// Step 3: ลบ user ที่เกี่ยวข้อง
	if err := config.DB().Delete(&entity.User{}, student.UserID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "student soft deleted successfully"})
}