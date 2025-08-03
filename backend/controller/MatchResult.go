package controller

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// MatchResult with enhanced fields
type MatchResult struct {
	PostID          uint      `json:"post_id"`
	PostName        string    `json:"post_name"`
	CompanyName     string    `json:"company_name"`
	Score           float64   `json:"score"`
	MatchedSkills   int       `json:"matched_skills"`
	TotalRequired   int       `json:"total_required"`
	GpaMatched      bool      `json:"gpa_matched"`
	InterestMatched bool      `json:"interest_matched"`
	LocationMatched bool      `json:"location_matched"`
	Gpa             float64   `json:"gpa"`
	MinGpa          float64   `json:"min_gpa"`
	Ranking         int       `json:"ranking"`
	RecommendReason []string  `json:"recommend_reason"`
	WeakPoints      []string  `json:"weak_points"`
	SkillGap        []string  `json:"skill_gap"`
	ConfidenceLevel string    `json:"confidence_level"`
	LastUpdated     time.Time `json:"last_updated"`
}

// Enhanced matching weights
type MatchingWeights struct {
	GPA       float64 `json:"gpa_weight"`
	Skills    float64 `json:"skills_weight"`
	Interest  float64 `json:"interest_weight"`
	Location  float64 `json:"location_weight"`
	Education float64 `json:"education_weight"`
}

// Default weights
var defaultWeights = MatchingWeights{
	GPA:       0.20, // 20%
	Skills:    0.40, // 40%
	Interest:  0.20, // 20%
	Location:  0.15, // 15%
	Education: 0.05, // 5%
}

func GetRecommendedPosts(c *gin.Context) {
	studentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
		return
	}

	// Get custom weights from query params or use defaults
	weights := getWeightsFromQuery(c)

	db := config.DB()
	var student entity.Student
	if err := db.Preload("Address").
		Preload("StudentSkill").
		Preload("StudentInterest").
		Preload("Education").
		First(&student, studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	var debugLogs []string
	recommendations := AdvancedMatchStudentToPosts(student, weights, &debugLogs)

	// Save matching results to database for analytics
	go saveMatchingResults(student.ID, recommendations)

	c.JSON(http.StatusOK, gin.H{
		"matches": recommendations,
		"debug":   debugLogs,
		"weights": weights,
		"total":   len(recommendations),
	})
}

func AdvancedMatchStudentToPosts(student entity.Student, weights MatchingWeights, debug *[]string) []MatchResult {
	db := config.DB()

	// Get student data
	var studentAddress entity.Address
	db.First(&studentAddress, student.AddressID)

	// Get latest GPA
	gpa := getLatestGPA(student.Education)

	var studentSkills []entity.StudentSkill
	db.Where("student_id = ?", student.ID).Find(&studentSkills)

	var studentInterests []entity.StudentInterest
	db.Where("student_id = ?", student.ID).Find(&studentInterests)

	// Get active posts only
	var posts []entity.IntershipPost
	db.Preload("Company").
		Preload("CompanyRequiredSkills").
		Where("status_post_id = ?", 1). // Active posts only
		Find(&posts)

	*debug = append(*debug, fmt.Sprintf("🧠 StudentID: %d | GPA: %.2f | Skills: %d | Interests: %d | Province: %d",
		student.ID, gpa, len(studentSkills), len(studentInterests), studentAddress.ProvinceID))

	var results []MatchResult
	for _, post := range posts {
		result := calculateAdvancedMatch(student, post, studentAddress, gpa, studentSkills, studentInterests, weights, debug)
		if result.Score > 0.1 { // Only include posts with meaningful scores
			results = append(results, result)
		}
	}

	// Sort by score (highest first)
	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	// Add ranking and confidence levels
	for i := range results {
		results[i].Ranking = i + 1
		results[i].ConfidenceLevel = getConfidenceLevel(results[i].Score)
		results[i].LastUpdated = time.Now()
	}

	*debug = append(*debug, fmt.Sprintf("✅ Found %d suitable positions", len(results)))
	return results
}

func calculateAdvancedMatch(student entity.Student, post entity.IntershipPost,
	studentAddress entity.Address, gpa float64, studentSkills []entity.StudentSkill,
	studentInterests []entity.StudentInterest, weights MatchingWeights, debug *[]string) MatchResult {

	db := config.DB()

	// Initialize result
	result := MatchResult{
		PostID:          post.ID,
		PostName:        post.PostName,
		CompanyName:     post.Company.CompanyName,
		Gpa:             gpa,
		MinGpa:          float64(post.MinGpa),
		RecommendReason: []string{},
		WeakPoints:      []string{},
		SkillGap:        []string{},
	}

	var totalScore float64

	// 1. GPA Score with soft matching
	gpaScore := calculateGPAScore(gpa, float64(post.MinGpa))
	result.GpaMatched = gpa >= float64(post.MinGpa)
	if result.GpaMatched {
		result.RecommendReason = append(result.RecommendReason, "GPA ผ่านเกณฑ์")
	} else {
		result.WeakPoints = append(result.WeakPoints, fmt.Sprintf("GPA ต่ำกว่าเกณฑ์ %.1f คะแนน", float64(post.MinGpa)-gpa))
	}

	// 2. Skills Score with weighted matching
	skillScore, matchedCount, skillGaps := calculateSkillScore(studentSkills, post.CompanyRequiredSkills)
	result.MatchedSkills = matchedCount
	result.TotalRequired = len(post.CompanyRequiredSkills)
	result.SkillGap = skillGaps

	if matchedCount > 0 {
		result.RecommendReason = append(result.RecommendReason, fmt.Sprintf("ตรงกับทักษะที่ต้องการ %d/%d", matchedCount, len(post.CompanyRequiredSkills)))
	}

	// 3. Interest Score with semantic matching
	interestScore := calculateInterestScore(studentInterests, post.PostName, post.PostDescription)
	result.InterestMatched = interestScore > 0
	if result.InterestMatched {
		result.RecommendReason = append(result.RecommendReason, "สอดคล้องกับความสนใจ")
	}

	// 4. Location Score
	var companyAddress entity.Address
	db.First(&companyAddress, post.Company.AddressID)
	locationScore := calculateLocationScore(studentAddress, companyAddress)
	result.LocationMatched = studentAddress.ProvinceID == companyAddress.ProvinceID
	if result.LocationMatched {
		result.RecommendReason = append(result.RecommendReason, "ในจังหวัดเดียวกัน")
	}

	// 5. Education Level Score (new)
	educationScore := calculateEducationScore(student.Education, post.JobTypeID)

	// Calculate weighted total score
	totalScore = (gpaScore * weights.GPA) +
		(skillScore * weights.Skills) +
		(interestScore * weights.Interest) +
		(locationScore * weights.Location) +
		(educationScore * weights.Education)

	result.Score = math.Min(totalScore, 1.0) // Cap at 1.0

	*debug = append(*debug, fmt.Sprintf(
		"📄 %s | GPA: %.2f (%.2f) | Skills: %d/%d (%.2f) | Interest: %.2f | Location: %.2f | Total: %.3f",
		post.PostName, gpaScore, gpa, matchedCount, len(post.CompanyRequiredSkills),
		skillScore, interestScore, locationScore, result.Score,
	))

	return result
}

func calculateGPAScore(studentGPA, minGPA float64) float64 {
	if studentGPA >= minGPA {
		// Bonus for exceeding minimum
		excess := studentGPA - minGPA
		return math.Min(1.0+(excess*0.1), 1.5) // Max 1.5 for excellent GPA
	}

	// Penalty for not meeting minimum (soft matching)
	deficit := minGPA - studentGPA
	if deficit <= 0.5 {
		return 0.5 - (deficit * 0.4) // Gradual penalty
	}
	return 0.0
}

func calculateSkillScore(studentSkills []entity.StudentSkill, requiredSkills []entity.CompanyRequiredSkill) (float64, int, []string) {
	if len(requiredSkills) == 0 {
		return 1.0, 0, []string{}
	}

	db := config.DB()
	matchCount := 0
	var skillGaps []string

	// Create map for faster lookup
	studentSkillMap := make(map[uint]bool)
	for _, ss := range studentSkills {
		studentSkillMap[ss.SkillID] = true
	}

	// Check each required skill
	for _, rs := range requiredSkills {
		if studentSkillMap[rs.SkillID] {
			matchCount++
		} else {
			// Find skill name for gap analysis
			var skill entity.Skill
			if db.First(&skill, rs.SkillID).Error == nil {
				skillGaps = append(skillGaps, skill.SkillName)
			}
		}
	}

	// Base score from exact matches
	baseScore := float64(matchCount) / float64(len(requiredSkills))

	// Bonus for having extra relevant skills
	bonusScore := 0.0
	if len(studentSkills) > matchCount {
		bonusScore = math.Min(float64(len(studentSkills)-matchCount)*0.05, 0.2)
	}

	return math.Min(baseScore+bonusScore, 1.0), matchCount, skillGaps
}

func calculateInterestScore(studentInterests []entity.StudentInterest, postName, postDescription string) float64 {
	if len(studentInterests) == 0 {
		return 0.0
	}

	db := config.DB()
	postText := strings.ToLower(postName + " " + postDescription)
	matchScore := 0.0

	for _, si := range studentInterests {
		var interest entity.Interest
		if db.First(&interest, si.InterestID).Error == nil {
			interestName := strings.ToLower(interest.InterestName)

			// Exact match
			if strings.Contains(postText, interestName) {
				matchScore += 1.0
			} else {
				// Partial match using keywords
				keywords := strings.Fields(interestName)
				for _, keyword := range keywords {
					if len(keyword) > 3 && strings.Contains(postText, keyword) {
						matchScore += 0.3
					}
				}
			}
		}
	}

	return math.Min(matchScore/float64(len(studentInterests)), 1.0)
}

func calculateLocationScore(studentAddr, companyAddr entity.Address) float64 {
	if studentAddr.ProvinceID == companyAddr.ProvinceID {
		if studentAddr.DistrictID == companyAddr.DistrictID {
			return 1.0 // Same district
		}
		return 0.8 // Same province
	}
	return 0.2 // Different province but still possible
}

func calculateEducationScore(educations []entity.Education, jobTypeID uint) float64 {
	if len(educations) == 0 {
		return 0.5 // Neutral if no education data
	}

	// Get latest education
	sort.Slice(educations, func(i, j int) bool {
		return educations[i].Year > educations[j].Year
	})

	latestEd := educations[0]

	// Simple matching based on program and job type
	// This would need more sophisticated mapping in real application
	if latestEd.Grade >= 3.0 {
		return 1.0
	} else if latestEd.Grade >= 2.5 {
		return 0.7
	}
	return 0.4
}
func getLatestGPA(educations []entity.Education) float64 {
	if len(educations) == 0 {
		fmt.Println("❌ ไม่มีข้อมูล education")
		return 0.0
	}

	sort.Slice(educations, func(i, j int) bool {
		return educations[i].Year > educations[j].Year
	})

	fmt.Printf("✅ ใช้ GPA: %.2f (จากปี %d)\n", educations[0].Grade, educations[0].Year)
	return educations[0].Grade
}

func getConfidenceLevel(score float64) string {
	if score >= 0.8 {
		return "สูง"
	} else if score >= 0.6 {
		return "ปานกลาง"
	} else if score >= 0.4 {
		return "ต่ำ"
	}
	return "ต่ำมาก"
}

func getWeightsFromQuery(c *gin.Context) MatchingWeights {
	weights := defaultWeights

	if gpaWeight := c.Query("gpa_weight"); gpaWeight != "" {
		if w, err := strconv.ParseFloat(gpaWeight, 64); err == nil {
			weights.GPA = w
		}
	}

	if skillsWeight := c.Query("skills_weight"); skillsWeight != "" {
		if w, err := strconv.ParseFloat(skillsWeight, 64); err == nil {
			weights.Skills = w
		}
	}

	if interestWeight := c.Query("interest_weight"); interestWeight != "" {
		if w, err := strconv.ParseFloat(interestWeight, 64); err == nil {
			weights.Interest = w
		}
	}

	if locationWeight := c.Query("location_weight"); locationWeight != "" {
		if w, err := strconv.ParseFloat(locationWeight, 64); err == nil {
			weights.Location = w
		}
	}

	// Normalize weights to sum to 1.0
	total := weights.GPA + weights.Skills + weights.Interest + weights.Location + weights.Education
	if total > 0 {
		weights.GPA /= total
		weights.Skills /= total
		weights.Interest /= total
		weights.Location /= total
		weights.Education /= total
	}

	return weights
}

func saveMatchingResults(studentID uint, results []MatchResult) {
	db := config.DB()

	// Delete old results
	db.Where("student_id = ?", studentID).Delete(&entity.JobMatch{})

	// Save new results
	for i, result := range results {
		if i >= 20 { // Save only top 20 matches
			break
		}

		reasonsJSON, _ := json.Marshal(result.RecommendReason)
		weakPointsJSON, _ := json.Marshal(result.WeakPoints)
		skillGapJSON, _ := json.Marshal(result.SkillGap)

		jobMatch := entity.JobMatch{
			Score:            result.Score,
			Reasons:          "", // หรือใส่สรุป reason หลัก ๆ เป็น string
			StudentID:        studentID,
			InternshipPostID: result.PostID,
			MatchedAt:        result.LastUpdated,
			Ranking:          result.Ranking,

			// ✅ เพิ่มตรงนี้เพื่อให้ข้อมูลไม่เป็น 0
			GPA:             result.Gpa,
			MinGPA:          result.MinGpa,
			GpaMatched:      result.GpaMatched,
			InterestMatched: result.InterestMatched,
			LocationMatched: result.LocationMatched,
			MatchedSkills:   result.MatchedSkills,
			TotalRequired:   result.TotalRequired,
			ConfidenceLevel: result.ConfidenceLevel,

			// ✅ เพิ่ม JSON fields
			RecommendReasons: reasonsJSON,
			WeakPoints:       weakPointsJSON,
			SkillGap:         skillGapJSON,
		}

		db.Create(&jobMatch)
	}
}

// Batch recommendation for multiple students
func BatchRecommendStudents(c *gin.Context) {
	db := config.DB()

	var students []entity.Student
	db.Preload("Address").
		Preload("StudentSkill").
		Preload("StudentInterest").
		Preload("Education").
		Find(&students)

	results := make(map[uint][]MatchResult)
	weights := defaultWeights

	for _, student := range students {
		var debugLogs []string
		recommendations := AdvancedMatchStudentToPosts(student, weights, &debugLogs)
		results[student.ID] = recommendations

		// Save results asynchronously
		go saveMatchingResults(student.ID, recommendations)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Batch recommendation completed",
		"total_students": len(students),
		"results":        results,
	})
}

// Get saved recommendations
func GetSavedRecommendations(c *gin.Context) {
	studentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
		return
	}

	db := config.DB()
	var jobMatches []entity.JobMatch
	db.Preload("IntershipPost.Company").
		Where("student_id = ?", studentID).
		Order("score DESC").
		Limit(10).
		Find(&jobMatches)

	var results []MatchResult
	for _, jm := range jobMatches {
		var skillGap, recommendReason, weakPoints []string
		_ = json.Unmarshal(jm.SkillGap, &skillGap)
		_ = json.Unmarshal(jm.RecommendReasons, &recommendReason)
		_ = json.Unmarshal(jm.WeakPoints, &weakPoints)
		result := MatchResult{
			PostID:      jm.InternshipPostID,
			PostName:    jm.InternshipPost.PostName,
			CompanyName: jm.InternshipPost.Company.CompanyName,
			Score:       jm.Score,
			Ranking:     jm.Ranking,
			LastUpdated: jm.MatchedAt,

			// ✅ เพิ่ม field ที่ React ต้องใช้
			Gpa:             jm.GPA,
			MinGpa:          jm.MinGPA,
			GpaMatched:      jm.GpaMatched,
			InterestMatched: jm.InterestMatched,
			LocationMatched: jm.LocationMatched,
			MatchedSkills:   jm.MatchedSkills,
			TotalRequired:   jm.TotalRequired,
			SkillGap:        skillGap,
			RecommendReason: recommendReason,
			WeakPoints:      weakPoints, // ต้องเป็น []string
			ConfidenceLevel: jm.ConfidenceLevel,
		}
		results = append(results, result)
	}

	c.JSON(http.StatusOK, gin.H{
		"matches": results,
		"total":   len(results),
	})
}
