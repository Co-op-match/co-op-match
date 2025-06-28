package controller

import (
	"net/http"
	"strconv"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"

	"github.com/gin-gonic/gin"
)

func GetAllSkill(c *gin.Context) {
	var skill []entity.Skill

	err := config.DB().
		Find(&skill).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch skill",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, skill)
}

func GetAllInterest(c *gin.Context) {
	var interestl []entity.Interest

	err := config.DB().
		Find(&interestl).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch interestl",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, interestl)
}

func GetAllStudentSkill(c *gin.Context) {
	var studentSkill []entity.StudentSkill

	err := config.DB().
		Find(&studentSkill).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch studentskill",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, studentSkill)
}

func GetStudentSkillsByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	var student entity.Student
	if err := config.DB().
		Preload("StudentSkill.Skill").
		Where("user_id = ?", userID).
		First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษาหรือทักษะ"})
		return
	}

	c.JSON(http.StatusOK, student.StudentSkill)
}

func GetStudentInterestsByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	var student entity.Student
	if err := config.DB().
		Preload("StudentInterest.Interest").
		Where("user_id = ?", userID).
		First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษาหรือความสนใจ"})
		return
	}

	c.JSON(http.StatusOK, student.StudentInterest)
}

func CreateStudentSkillsAndInterestsByUserID(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id ไม่ถูกต้อง"})
		return
	}

	// หา student ด้วย user_id
	var student entity.Student
	if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษาที่มี user_id นี้"})
		return
	}

	// รับข้อมูลทักษะและความสนใจจาก body
	var payload struct {
		SkillIDs    []uint `json:"skill_ids"`
		InterestIDs []uint `json:"interest_ids"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง", "details": err.Error()})
		return
	}

	var studentSkills []entity.StudentSkill
	for _, skillID := range payload.SkillIDs {
		studentSkills = append(studentSkills, entity.StudentSkill{
			StudentID: student.ID,
			SkillID:   skillID,
		})
	}

	var studentInterests []entity.StudentInterest
	for _, interestID := range payload.InterestIDs {
		studentInterests = append(studentInterests, entity.StudentInterest{
			StudentID:  student.ID,
			InterestID: interestID,
		})
	}

	db := config.DB()
	if len(studentSkills) > 0 {
		if err := db.Create(&studentSkills).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกทักษะได้"})
			return
		}
	}

	if len(studentInterests) > 0 {
		if err := db.Create(&studentInterests).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกความสนใจได้"})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":           "เพิ่มทักษะและความสนใจสำเร็จ",
		"student_skills":    studentSkills,
		"student_interests": studentInterests,
	})
}



func UpdateStudentSkillsAndInterestsByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	// ค้นหา Student จาก user_id
	var student entity.Student
	if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษา"})
		return
	}

	// รับ skill_ids และ interest_ids จาก JSON
	var input struct {
		SkillIDs    []uint `json:"skill_ids"`
		InterestIDs []uint `json:"interest_ids"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง", "details": err.Error()})
		return
	}

	// ลบรายการเดิมของนักศึกษาคนนี้ก่อน (เพื่อล้างก่อนอัปเดตใหม่)
	config.DB().Where("student_id = ?", student.ID).Delete(&entity.StudentSkill{})
	config.DB().Where("student_id = ?", student.ID).Delete(&entity.StudentInterest{})

	// เพิ่มรายการใหม่
	var skills []entity.StudentSkill
	for _, skillID := range input.SkillIDs {
		skills = append(skills, entity.StudentSkill{StudentID: student.ID, SkillID: skillID})
	}
	if len(skills) > 0 {
		config.DB().Create(&skills)
	}

	var interests []entity.StudentInterest
	for _, interestID := range input.InterestIDs {
		interests = append(interests, entity.StudentInterest{StudentID: student.ID, InterestID: interestID})
	}
	if len(interests) > 0 {
		config.DB().Create(&interests)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "อัปเดตทักษะและความสนใจเรียบร้อยแล้ว",
	})
}


