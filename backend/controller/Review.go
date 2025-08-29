package controller

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// POST /reviews - สร้างรีวิวใหม่
func CreateReview(c *gin.Context) {
	var input entity.Review

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.StudentID == 0 || input.CompanyID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student_id หรือ company_id ไม่ถูกต้อง"})
		return
	}

	// ตรวจสอบว่ามี Application ที่ผ่านแล้วหรือไม่
	var application entity.Application
	if err := config.DB().Where("student_id = ? AND intership_post_id IN (?) AND status = ?",
		input.StudentID,
		config.DB().Model(&entity.IntershipPost{}).Select("id").Where("company_id = ?", input.CompanyID),
		"ผ่าน",
	).First(&application).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, gin.H{"error": "ไม่สามารถรีวิวได้เพราะยังไม่ได้สมัครหรือยังไม่ผ่าน"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}

	// ประมวลผล Tags
	var tags []*entity.Tag
	for _, tag := range input.Tags {
		var existingTag entity.Tag
		if err := config.DB().Where("name = ?", tag.Name).First(&existingTag).Error; err != nil {
			// ถ้าไม่เจอ → สร้างใหม่
			newTag := entity.Tag{Name: tag.Name}
			if err := config.DB().Create(&newTag).Error; err == nil {
				tags = append(tags, &newTag)
			}
		} else {
			// ถ้าเจอแล้ว
			tags = append(tags, &existingTag)
		}
	}

	// สร้าง Review ใหม่ พร้อม Tags ที่เชื่อม
	review := entity.Review{
		Rating:    input.Rating,
		Comment:   input.Comment,
		StudentID: input.StudentID,
		CompanyID: input.CompanyID,
		Tags:      tags,
	}

	if err := config.DB().Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Review created successfully", "data": review})
}

// GET /reviews/company/:company_id - ดึงรีวิวของบริษัท
func GetReviewsByCompanyID(c *gin.Context) {
	id := c.Param("company_id")
	var reviews []entity.Review

	if err := config.DB().Preload("Student.User").Where("company_id = ?", id).Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reviews})
}

// GET /reviews/student/:student_id - ดึงรีวิวของนักศึกษาคนหนึ่ง
func GetReviewsByStudentID(c *gin.Context) {
	id := c.Param("student_id")
	var reviews []entity.Review

	if err := config.DB().Preload("Company").Where("student_id = ?", id).Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reviews})
}

func GetPassedApplicationsByStudentID(c *gin.Context) {
	studentID := c.Param("id")
	var apps []entity.Application
	if err := config.DB().
		Preload("IntershipPost.Company").
		Where("student_id = ? AND status = ?", studentID, "ผ่าน").
		Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}
	c.JSON(http.StatusOK, apps)
}

type ReviewResponse struct {
	ID           int       `json:"id"`
	Reviewer     string    `json:"reviewer"`
	Rating       int16     `json:"rating"`
	Comment      string    `json:"comment"`
	Date         time.Time `json:"date"`
	Position     string    `json:"position"`
	Tags         []string  `json:"tags"`
	Helpful      int       `json:"helpful"`
	ProfileImage string    `json:"image_url"`
}

func GetReviewsByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	// Step 1: หา Company จาก user_id
	var company entity.Company
	if err := config.DB().
		Where("user_id = ?", userID).
		First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัทที่เกี่ยวข้องกับ user_id นี้"})
		return
	}

	// Step 2: ดึงรีวิวของบริษัทนั้น พร้อม preload Student, ProfileImage, Tags
	var reviews []entity.Review
	if err := config.DB().
		Preload("Student").
		Preload("Student.User.ProfileImage").
		Preload("Tags").
		Where("company_id = ?", company.ID).
		Order("created_at DESC").
		Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลรีวิวได้", "detail": err.Error()})
		return
	}

	// Step 3: กรองเฉพาะรีวิวที่มี Application สถานะ "ผ่าน"
	var response []ReviewResponse
	for _, r := range reviews {
		var apps []entity.Application
		err := config.DB().
			Preload("IntershipPost").
			Joins("JOIN intership_posts ON intership_posts.id = applications.intership_post_id").
			Where("applications.student_id = ? AND intership_posts.company_id = ? AND applications.status = ?", r.StudentID, company.ID, "ผ่าน").
			Order("applications.submit_at DESC").
			Find(&apps).Error

		if err != nil || len(apps) == 0 || apps[0].IntershipPost.ID == 0 {
			continue
		}

		// แปลง []*Tag เป็น []string
		var tagNames []string
		for _, tag := range r.Tags {
			tagNames = append(tagNames, tag.Name)
		}

		var imageURL string
		if len(r.Student.User.ProfileImage) > 0 {
			imageURL = r.Student.User.ProfileImage[0].ImageURL
		}

		response = append(response, ReviewResponse{
			ID:           int(r.ID),
			Reviewer:     r.Student.FirstName + " " + r.Student.LastName,
			Rating:       r.Rating,
			Comment:      r.Comment,
			Date:         r.CreatedAt,
			Position:     apps[0].IntershipPost.PostName,
			Tags:         tagNames,
			Helpful:      int(r.Like),
			ProfileImage: imageURL,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// ✅ กดไลค์รีวิว (ถ้ายังไม่เคย)
func LikeReview(c *gin.Context) {
	var input struct {
		UserID   uint `json:"user_id"`
		ReviewID uint `json:"review_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	// 🔍 หา Student จาก UserID
	var student entity.Student
	if err := config.DB().Where("user_id = ?", input.UserID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักศึกษาที่เกี่ยวข้องกับบัญชีนี้"})
		return
	}

	// 🔁 เช็คว่ามีอยู่แล้วหรือไม่ (โดยไม่สน soft-delete)
	var count int64
	config.DB().Model(&entity.ReviewLike{}).
		Where("student_id = ? AND review_id = ?", student.ID, input.ReviewID).
		Count(&count)

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "คุณได้กดไลค์รีวิวนี้ไปแล้ว"})
		return
	}

	// ✅ เพิ่มข้อมูลใหม่
	like := entity.ReviewLike{
		StudentID: student.ID,
		ReviewID:  input.ReviewID,
	}
	if err := config.DB().Create(&like).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไลค์ได้"})
		return
	}

	// ✅ เพิ่ม like count
	config.DB().Model(&entity.Review{}).
		Where("id = ?", input.ReviewID).
		Update("like", gorm.Expr("like + 1"))

	c.JSON(http.StatusOK, gin.H{"message": "ไลค์รีวิวเรียบร้อย"})
}

func GetLikedReviews(c *gin.Context) {
	userID := c.Param("user_id")

	// หา Student จาก user_id
	var student entity.Student
	if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ Student ที่ตรงกับ user_id นี้"})
		return
	}

	// ดึง review_id ทั้งหมดที่ student นี้เคยกดไลค์
	var likes []entity.ReviewLike
	if err := config.DB().
		Where("student_id = ?", student.ID).
		Find(&likes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลไลค์ได้"})
		return
	}

	// คืนค่าเฉพาะ review_id
	var reviewIDs []uint
	for _, like := range likes {
		reviewIDs = append(reviewIDs, like.ReviewID)
	}

	c.JSON(http.StatusOK, reviewIDs)
}

func UnlikeReview(c *gin.Context) {
	var input struct {
		UserID   uint `json:"user_id"`
		ReviewID uint `json:"review_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	// 🔍 หา Student จาก UserID
	var student entity.Student
	if err := config.DB().Where("user_id = ?", input.UserID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ Student ที่ตรงกับ user_id นี้"})
		return
	}

	// 🔥 ลบแบบ Hard Delete (ใช้ Unscoped())
	if err := config.DB().Unscoped().
		Where("student_id = ? AND review_id = ?", student.ID, input.ReviewID).
		Delete(&entity.ReviewLike{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถยกเลิกไลค์ได้"})
		return
	}

	// ✅ ลด like count
	if err := config.DB().Model(&entity.Review{}).
		Where("id = ?", input.ReviewID).
		Update("like", gorm.Expr("like - 1")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลดจำนวนไลค์ได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ยกเลิกไลค์รีวิวเรียบร้อย"})
}

// func AnalyzeReview(c *gin.Context) {
// 	db := config.DB()
// 	var review entity.Review
// 	if err := db.First(&review, "id = ?", c.Param("id")).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
// 		return
// 	}

// 	// ข้ามถ้ามีผลอยู่แล้ว (เว้นแต่ force=true)
// 	force := c.Query("force") == "true"
// 	if !force {
// 		var cnt int64
// 		db.Model(&entity.ReviewAnalysis{}).Where("review_id = ?", review.ID).Count(&cnt)
// 		if cnt > 0 {
// 			c.JSON(http.StatusOK, gin.H{"message": "already analyzed"})
// 			return
// 		}
// 	}

// 	// เรียก NLP
// 	res, err := services.AnalyzeText(review.Comment, "th")
// 	if err != nil {
// 		c.JSON(http.StatusBadGateway, gin.H{"error": "nlp unavailable", "detail": err.Error()})
// 		return
// 	}

// 	ra := entity.ReviewAnalysis{
// 		ReviewID:       review.ID,
// 		Sentiment:      res.Sentiment,
// 		SentimentScore: res.SentimentScore,
// 		ToxicityScore:  res.ToxicityScore,
// 		AspectsJSON:    toJSON(res.Aspects),
// 		AnalyzedAt:     time.Now(),
// 	}
// 	// upsert ตาม review_id
// 	if err := db.Clauses(clause.OnConflict{
// 		Columns: []clause.Column{{Name: "review_id"}},
// 		DoUpdates: clause.AssignmentColumns([]string{
// 			"sentiment", "sentiment_score", "toxicity_score", "aspects_json", "analyzed_at", "updated_at",
// 		}),
// 	}).Create(&ra).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "save analysis failed"})
// 		return
// 	}

// 	c.JSON(http.StatusOK, gin.H{"ok": true, "analysis": ra})
// }

func toJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}
func getInt64Query(c *gin.Context, key string, def int64) int64 {
	v := c.Query(key)
	if v == "" {
		return def
	}
	n, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return def
	}
	return n
}

// uint
func getUintQuery(c *gin.Context, key string, def uint) uint {
	v := c.Query(key)
	if v == "" {
		return def
	}
	u64, err := strconv.ParseUint(v, 10, 64)
	if err != nil {
		return def
	}
	return uint(u64)
}

// bool (รองรับ "true/1/false/0")
func getBoolQuery(c *gin.Context, key string, def bool) bool {
	v := c.Query(key)
	if v == "" {
		return def
	}
	switch v {
	case "1", "true", "TRUE", "True":
		return true
	case "0", "false", "FALSE", "False":
		return false
	default:
		return def
	}
}
func getIntQuery(c *gin.Context, key string, def int) int {
	v := c.Query(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

// POST /reviews/analyze/batch?days=30&company_id=&limit=500
// func AnalyzeBatch(c *gin.Context) {
// 	days := getIntQuery(c, "days", 30)
// 	limit := getIntQuery(c, "limit", 500)
// 	companyID := getIntQuery(c, "company_id", 0)

// 	db := config.DB()
// 	since := time.Now().AddDate(0, 0, -days)

// 	// เลือกรีวิวที่ยังไม่มีผลวิเคราะห์
// 	type Row struct {
// 		ID      uint
// 		Comment string
// 	}
// 	var rows []Row
// 	q := db.Table("reviews r").
// 		Select("r.id, r.comment").
// 		Where("r.created_at >= ?", since).
// 		Where("NOT EXISTS (SELECT 1 FROM review_analyses a WHERE a.review_id = r.id)")
// 	if companyID > 0 {
// 		q = q.Where("r.company_id = ?", companyID)
// 	}
// 	if err := q.Limit(limit).Scan(&rows).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
// 		return
// 	}
// 	if len(rows) == 0 {
// 		c.JSON(http.StatusOK, gin.H{"ok": true, "count": 0})
// 		return
// 	}

// 	// ทำ batch call → NLP
// 	items := make([]services.BatchItem, len(rows))
// 	for i, r := range rows {
// 		items[i] = services.BatchItem{ID: r.ID, Text: r.Comment, Lang: "th"}
// 	}
// 	out, err := services.AnalyzeBatch(items)
// 	if err != nil {
// 		c.JSON(http.StatusBadGateway, gin.H{"error": "nlp unavailable", "detail": err.Error()})
// 		return
// 	}

// 	tx := db.Begin()
// 	defer func() {
// 		if r := recover(); r != nil {
// 			tx.Rollback()
// 		}
// 	}()
// 	now := time.Now()

// 	for _, it := range out.Items {
// 		ra := entity.ReviewAnalysis{
// 			ReviewID:       it.ID,
// 			Sentiment:      it.Sentiment,
// 			SentimentScore: it.SentimentScore,
// 			ToxicityScore:  it.ToxicityScore,
// 			AspectsJSON:    toJSON(it.Aspects),
// 			AnalyzedAt:     now,
// 		}
// 		if err := tx.Clauses(clause.OnConflict{
// 			Columns: []clause.Column{{Name: "review_id"}},
// 			DoUpdates: clause.AssignmentColumns([]string{
// 				"sentiment", "sentiment_score", "toxicity_score", "aspects_json", "analyzed_at", "updated_at",
// 			}),
// 		}).Create(&ra).Error; err != nil {
// 			tx.Rollback()
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "save analysis failed"})
// 			return
// 		}
// 	}
// 	if err := tx.Commit().Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
// 		return
// 	}

// 	c.JSON(http.StatusOK, gin.H{"ok": true, "count": len(out.Items)})
// }
// func GetCommentTrend(c *gin.Context) {
// 	days := getIntQuery(c, "days", 90)
// 	companyID := getIntQuery(c, "company_id", 0)
// 	db := config.DB()
// 	since := time.Now().AddDate(0, 0, -days)

// 	type Row struct {
// 		Date    string  `json:"date"`
// 		Count   int64   `json:"count"`
// 		Pos     int64   `json:"pos"`
// 		Neu     int64   `json:"neu"`
// 		Neg     int64   `json:"neg"`
// 		ToxRate float64 `json:"tox_rate"`
// 	}
// 	var out []Row

// 	q := `
//     SELECT DATE(r.created_at) AS date,
//            COUNT(*) AS count,
//            SUM(CASE a.sentiment WHEN 'positive' THEN 1 ELSE 0 END) AS pos,
//            SUM(CASE a.sentiment WHEN 'neutral'  THEN 1 ELSE 0 END) AS neu,
//            SUM(CASE a.sentiment WHEN 'negative' THEN 1 ELSE 0 END) AS neg,
//            COALESCE(AVG(CASE WHEN a.toxicity_score >= 0.5 THEN 1.0 ELSE 0.0 END),0) AS tox_rate
//     FROM reviews r
//     LEFT JOIN review_analyses a ON a.review_id = r.id
//     WHERE r.created_at >= ?`
// 	args := []any{since}
// 	if companyID > 0 {
// 		q += " AND r.company_id = ?"
// 		args = append(args, companyID)
// 	}
// 	q += " GROUP BY DATE(r.created_at) ORDER BY date"

// 	if err := db.Raw(q, args...).Scan(&out).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
// 		return
// 	}
// 	c.JSON(http.StatusOK, gin.H{"series": out})
// }
// func GetCommentSummary(c *gin.Context) {
// 	// --- อ่านพารามิเตอร์ ---
// 	days := getIntQuery(c, "days", 30)
// 	companyID := getIntQuery(c, "company_id", 0)

// 	db := config.DB()
// 	since := time.Now().AddDate(0, 0, -days)

// 	// --- 1) totals / unique users ---
// 	var total, uniq int64

// 	qBase := db.Table("reviews").Where("created_at >= ?", since)
// 	if companyID > 0 {
// 		qBase = qBase.Where("company_id = ?", companyID)
// 	}
// 	if err := qBase.Count(&total).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "count total failed"})
// 		return
// 	}

// 	qUniq := db.Table("reviews").Where("created_at >= ?", since)
// 	if companyID > 0 {
// 		qUniq = qUniq.Where("company_id = ?", companyID)
// 	}
// 	if err := qUniq.Select("COUNT(DISTINCT student_id)").Scan(&uniq).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "count unique users failed"})
// 		return
// 	}

// 	// --- 2) avg length ---
// 	var avgLen float64
// 	qAvg := db.Table("reviews").Where("created_at >= ?", since)
// 	if companyID > 0 {
// 		qAvg = qAvg.Where("company_id = ?", companyID)
// 	}
// 	if err := qAvg.
// 		Select("COALESCE(AVG(LENGTH(comment)), 0)").
// 		Scan(&avgLen).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "avg length failed"})
// 		return
// 	}

// 	// --- 3) sentiment ratio ---
// 	type srow struct {
// 		Sentiment string
// 		C         int64
// 	}
// 	var srows []srow

// 	qSent := `
// 		SELECT a.sentiment, COUNT(*) AS c
// 		FROM review_analyses a
// 		JOIN reviews r ON r.id = a.review_id
// 		WHERE r.created_at >= ?`
// 	argsSent := []any{since}
// 	if companyID > 0 {
// 		qSent += " AND r.company_id = ?"
// 		argsSent = append(argsSent, companyID)
// 	}
// 	qSent += " GROUP BY a.sentiment"

// 	if err := db.Raw(qSent, argsSent...).Scan(&srows).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "sentiment ratio failed"})
// 		return
// 	}

// 	ratio := map[string]float64{"positive": 0, "neutral": 0, "negative": 0}
// 	tot := math.Max(1, float64(total))
// 	for _, r := range srows {
// 		ratio[r.Sentiment] = float64(r.C) / tot
// 	}

// 	// --- 4) avg sentiment (map pos=1, neu=0.5, neg=0) ---
// 	var avgSent float64
// 	qAvgSent := `
//   SELECT COALESCE(AVG(CASE a.sentiment
//     WHEN 'positive' THEN 1.0
//     WHEN 'neutral'  THEN 0.5
//     ELSE 0.0 END), 0)
//   FROM review_analyses a
//   JOIN reviews r ON r.id = a.review_id
//   WHERE r.created_at >= ?`
// 	argsAvg := []any{since}
// 	if companyID > 0 {
// 		qAvgSent += " AND r.company_id = ?"
// 		argsAvg = append(argsAvg, companyID)
// 	}
// 	if err := db.Raw(qAvgSent, argsAvg...).Scan(&avgSent).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "avg sentiment failed"})
// 		return
// 	}

// 	// --- 5) toxicity rate (threshold 0.5) ---
// 	var toxRate float64
// 	qTox := `
// 		SELECT COALESCE(AVG(CASE WHEN a.toxicity_score >= 0.5 THEN 1.0 ELSE 0.0 END), 0)
// 		FROM review_analyses a
// 		JOIN reviews r ON r.id = a.review_id
// 		WHERE r.created_at >= ?`
// 	argsTox := []any{since}
// 	if companyID > 0 {
// 		qTox += " AND r.company_id = ?"
// 		argsTox = append(argsTox, companyID)
// 	}
// 	if err := db.Raw(qTox, argsTox...).Scan(&toxRate).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "toxicity rate failed"})
// 		return
// 	}

// 	// --- 6) top aspects ---
// 	var raws []struct{ AspectsJSON string }
// 	qAspects := `
// 		SELECT a.aspects_json
// 		FROM review_analyses a
// 		JOIN reviews r ON r.id = a.review_id
// 		WHERE r.created_at >= ?`
// 	argsAsp := []any{since}
// 	if companyID > 0 {
// 		qAspects += " AND r.company_id = ?"
// 		argsAsp = append(argsAsp, companyID)
// 	}
// 	if err := db.Raw(qAspects, argsAsp...).Scan(&raws).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "aspects query failed"})
// 		return
// 	}

// 	counts := map[string]int{}
// 	for _, row := range raws {
// 		if row.AspectsJSON == "" {
// 			continue
// 		}
// 		var arr []string
// 		_ = json.Unmarshal([]byte(row.AspectsJSON), &arr)
// 		for _, a := range arr {
// 			counts[a]++
// 		}
// 	}
// 	type named struct {
// 		Name  string `json:"name"`
// 		Count int    `json:"count"`
// 	}
// 	top := make([]named, 0, len(counts))
// 	for k, v := range counts {
// 		top = append(top, named{Name: k, Count: v})
// 	}
// 	// เลือก top 5 แบบง่าย ๆ
// 	for i := 0; i < len(top); i++ {
// 		for j := i + 1; j < len(top); j++ {
// 			if top[j].Count > top[i].Count {
// 				top[i], top[j] = top[j], top[i]
// 			}
// 		}
// 	}
// 	if len(top) > 5 {
// 		top = top[:5]
// 	}

// 	c.JSON(http.StatusOK, gin.H{
// 		"from":            since.Format("2006-01-02"),
// 		"to":              time.Now().Format("2006-01-02"),
// 		"total_comments":  total,
// 		"unique_users":    uniq,
// 		"avg_len":         avgLen,
// 		"sentiment_ratio": ratio,
// 		"avg_sentiment":   avgSent,
// 		"toxicity_rate":   toxRate,
// 		"top_aspects":     top,
// 	})
// }
