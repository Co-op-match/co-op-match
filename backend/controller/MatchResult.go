// main.go หรือ controller.go (ตามโครงสร้างโปรเจกต์)
package controller

import (
	"net/http"
	"sort"
	"strconv"
	"strings"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

type MatchResult struct {
	PostID          uint    `json:"post_id"`
	PostName        string  `json:"post_name"`
	CompanyName     string  `json:"company_name"`
	Score           float64 `json:"score"`
	MatchedSkills   int     `json:"matched_skills"`
	TotalRequired   int     `json:"total_required"`
	GpaMatched      bool    `json:"gpa_matched"`
	InterestMatched bool    `json:"interest_matched"`
	LocationMatched bool    `json:"location_matched"`
	Gpa             float64 `json:"gpa"`     // ✅ ใหม่
	MinGpa          float64 `json:"min_gpa"` // ✅ ใหม่
}

func GetRecommendedPosts(c *gin.Context) {
	studentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
		return
	}

	db := config.DB()

	var student entity.Student
	if err := db.Preload("Address").First(&student, studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	recommendations := MatchStudentToPosts(student)

	c.JSON(http.StatusOK, recommendations)
}

func MatchStudentToPosts(student entity.Student) []MatchResult {
	db := config.DB()

	// โหลดข้อมูลที่เกี่ยวข้อง
	var studentSkills []entity.StudentSkill
	db.Where("student_id = ?", student.ID).Find(&studentSkills)

	var studentInterests []entity.StudentInterest
	db.Where("student_id = ?", student.ID).Find(&studentInterests)

	var educations []entity.Education
	db.Where("student_id = ?", student.ID).Find(&educations)

	var posts []entity.IntershipPost
	db.Preload("Company").Preload("CompanyRequiredSkills").Find(&posts)

	var studentAddress entity.Address
	db.First(&studentAddress, student.AddressID)

	// ดึง GPA ล่าสุด
	gpa := 0.0
	if len(educations) > 0 {
		gpa = educations[len(educations)-1].Grade
	}

	var results []MatchResult
	for _, post := range posts {
		// GPA
		gpaMatched := gpa >= float64(post.MinGpa)
		gpaScore := 0.0
		if gpaMatched {
			gpaScore = 1.0
		}

		// Skill Matching
		requiredSkills := post.CompanyRequiredSkills
		matchCount := 0
		for _, rs := range requiredSkills {
			for _, ss := range studentSkills {
				if rs.SkillID == ss.SkillID {
					matchCount++
					break
				}
			}
		}
		skillScore := float64(matchCount)
		if len(requiredSkills) > 0 {
			skillScore /= float64(len(requiredSkills))
		}

		// Interest Matching (ใช้ PostName แทน JobTypeID)
		interestMatched := false
		for _, si := range studentInterests {
			var interest entity.Interest
			db.First(&interest, si.InterestID)
			if strings.Contains(strings.ToLower(post.PostName), strings.ToLower(interest.InterestName)) {
				interestMatched = true
				break
			}
		}
		interestScore := 0.0
		if interestMatched {
			interestScore = 1.0
		}

		// Location
		var companyAddress entity.Address
		db.First(&companyAddress, post.Company.AddressID)
		locationMatched := studentAddress.ProvinceID == companyAddress.ProvinceID
		locationScore := 0.0
		if locationMatched {
			locationScore = 1.0
		}

		score := gpaScore*0.25 + skillScore*0.4 + interestScore*0.15 + locationScore*0.2

		results = append(results, MatchResult{
			PostID:          post.ID,
			PostName:        post.PostName,
			CompanyName:     post.Company.CompanyName,
			Score:           score,
			MatchedSkills:   matchCount,
			TotalRequired:   len(requiredSkills),
			GpaMatched:      gpaMatched,
			InterestMatched: interestMatched,
			LocationMatched: locationMatched,
			Gpa:             gpa, // ✅ เพิ่ม
			MinGpa:          float64(post.MinGpa),
		})
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	return results

}
