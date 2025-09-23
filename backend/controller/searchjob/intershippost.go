package searchjob

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

/*
	func GetAllIntershipPosts(c *gin.Context) {
		var posts []entity.IntershipPost
		db := config.DB()
		results := db.Where("status_post_id = ?", 1).Preload("Company").Preload("Company.Address.Province").Preload("Company.Address.District").Preload("WorkMode").Preload("WorkDay").Preload("Stipend").Preload("JobType").Preload("Benefits").Find(&posts)
		if results.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
			return
		}
		c.JSON(http.StatusOK, posts)
	}
*/
func GetAllIntershipPosts(c *gin.Context) {
	userID := c.Query("user_id")
	studentID := c.Query("student_id")

	var posts []entity.IntershipPost
	db := config.DB()

	q := db.Model(&entity.IntershipPost{}).
		Where("intership_posts.status_post_id = ?", 1)

	switch {
	case studentID != "":
		// ใช้ student_id ตรง ๆ
		q = q.Joins(`
            LEFT JOIN applications 
              ON applications.intership_post_id = intership_posts.id
             AND applications.student_id = ?
        `, studentID).
			Where("applications.id IS NULL")

	case userID != "":
		// ใช้ user_id แล้วกรองด้วย NOT EXISTS (หาว่า user นี้เคยสมัครโพสต์นั้นมั้ย)
		sub := db.Model(&entity.Application{}).
			Select("1").
			Joins("JOIN students ON students.id = applications.student_id").
			Where("applications.intership_post_id = intership_posts.id").
			Where("students.user_id = ?", userID)
		q = q.Where("NOT EXISTS (?)", sub)
		// ข้อดี: ไม่เกิดแถวซ้ำจาก JOIN หลายชั้น

	default:
		// ไม่ส่งอะไรมาเลย → ไม่กรอง (หรือถ้าอยากให้ว่าง ก็เปลี่ยนเป็น c.JSON(200, []entity.IntershipPost{})
	}

	q = q.
		Preload("Company").
		Preload("Company.Address.Province").
		Preload("Company.Address.District").
		Preload("WorkMode").
		Preload("WorkDay").
		Preload("Stipend").
		Preload("JobType").
		Preload("Benefits")

	if err := q.Find(&posts).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, posts)
}
