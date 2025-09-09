package controller

import (
	"net/http"
	"strings"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"co-op-match.com/co-op-match/middlewares"
	"github.com/gin-gonic/gin"
)

type CreateArticleInput struct {
	Title       string             `form:"title" json:"title" binding:"required"`
	Subtitle    string             `form:"subtitle" json:"subtitle"`
	Body        string             `form:"body" json:"body"`
	Category    string             `form:"category" json:"category"`
	Type        entity.ArticleType `form:"type" json:"type" binding:"required,oneof=news career"`
	IsPublished *bool              `json:"is_published" form:"is_published"`
}

// controller/article.go (เฉพาะฟังก์ชัน CreateArticle)
func CreateArticle(c *gin.Context) {
	var in CreateArticleInput

	isMP := strings.Contains(c.GetHeader("Content-Type"), "multipart/form-data")
	if isMP {
		_ = c.Request.ParseMultipartForm(32 << 20)
		_ = c.ShouldBind(&in)
		// ทับ is_published จากฟอร์ม (เหมือนเดิม)
		if raw := c.PostForm("is_published"); raw != "" {
			if b, ok := parseBoolStr(raw); ok {
				in.IsPublished = &b
			}
		} else if raw := c.Request.FormValue("is_published"); raw != "" {
			if b, ok := parseBoolStr(raw); ok {
				in.IsPublished = &b
			}
		}
	} else {
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// ดึง admin_id จาก context (มาจาก JWT)
	aid, ok := middlewares.CurrentAdminID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "admin only"})
		return
	}

	article := entity.Article{
		Title:       in.Title,
		Subtitle:    in.Subtitle,
		Body:        in.Body,
		Category:    in.Category,
		Type:        in.Type,
		IsPublished: in.IsPublished,
		AdminID:     aid,
	}

	if in.IsPublished != nil && *in.IsPublished {
		now := time.Now()
		article.PublishedAt = &now
	} else {
		article.PublishedAt = nil
	}

	if err := config.DB().Create(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "สร้างเรียบร้อย", "article": article})
}

// แปลงสตริงเป็นบูล (รองรับ "true/false", "1/0", "on/off", "yes/no")
func parseBoolStr(s string) (bool, bool) {
	if s == "" {
		return false, false
	}
	v := strings.ToLower(strings.TrimSpace(s))
	switch v {
	case "true", "1", "on", "yes":
		return true, true
	case "false", "0", "off", "no":
		return false, true
	default:
		return false, false
	}
}

type UpdateArticleInput struct {
	Title       *string             `json:"title" form:"title"`
	Subtitle    *string             `json:"subtitle" form:"subtitle"`
	Body        *string             `json:"body" form:"body"`
	Category    *string             `json:"category" form:"category"`
	IsPublished *bool               `json:"is_published" form:"is_published"`
	Type        *entity.ArticleType `json:"type" form:"type" binding:"omitempty,oneof=news career"`
}

func UpdateArticle(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var art entity.Article
	if err := db.First(&art, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}

	var in UpdateArticleInput
	if strings.Contains(c.GetHeader("Content-Type"), "multipart/form-data") {
		_ = c.Request.ParseMultipartForm(32 << 20)
		_ = c.ShouldBind(&in)
	} else {
		_ = c.ShouldBindJSON(&in)
	}

	if in.IsPublished == nil {
		if raw := c.PostForm("is_published"); raw != "" {
			if b, ok := parseBoolStr(raw); ok {
				in.IsPublished = &b
			}
		} else if raw := c.Request.FormValue("is_published"); raw != "" {
			if b, ok := parseBoolStr(raw); ok {
				in.IsPublished = &b
			}
		}
	}

	update := map[string]interface{}{}
	if in.Title != nil {
		update["title"] = *in.Title
	}
	if in.Subtitle != nil {
		update["subtitle"] = *in.Subtitle
	}
	if in.Body != nil {
		update["body"] = *in.Body
	}
	if in.Category != nil {
		update["category"] = *in.Category
	}
	if in.Type != nil {
		update["type"] = *in.Type
	}
	if in.IsPublished != nil {
		update["is_published"] = *in.IsPublished
		if *in.IsPublished {
			now := time.Now()
			update["published_at"] = &now
		} else {
			update["published_at"] = nil
		}
	}

	if len(update) == 0 {
		c.JSON(http.StatusOK, art)
		return
	}

	if err := db.Model(&art).Updates(update).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	db.First(&art, "id = ?", id)
	c.JSON(http.StatusOK, gin.H{"message": "Article updated successfully", "article": art})
}

func DeleteArticle(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	if err := db.Delete(&entity.Article{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Article deleted successfully"})
}

func GetArticle(c *gin.Context) {
	id := c.Param("id")
	var art entity.Article
	if err := config.DB().First(&art, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}
	c.JSON(http.StatusOK, art)
}

func ListArticles(c *gin.Context) {
	t := c.Query("type")
	q := c.Query("q")
	isPub := c.Query("is_published")
	limit := 50
	offset := 0

	db := config.DB().Model(&entity.Article{})
	if t != "" {
		db = db.Where("type = ?", t)
	}
	switch isPub {
	case "true":
		db = db.Where("is_published = ?", true)
	case "false":
		db = db.Where("is_published = ?", false)
	}
	if q != "" {
		db = db.Where("title LIKE ? OR subtitle LIKE ? OR category LIKE ?", "%"+q+"%", "%"+q+"%", "%"+q+"%")
	}

	var items []entity.Article
	if err := db.Order("published_at DESC, created_at DESC").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list failed"})
		return
	}
	c.JSON(http.StatusOK, items)
}
