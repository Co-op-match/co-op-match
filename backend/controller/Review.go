package controller

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// CreateReview - POST /review
func CreateReview(c *gin.Context) {
	var review entity.Review

	// Bind JSON data to review struct
	if err := c.ShouldBindJSON(&review); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// Create a new review entry
	if err := db.Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Review created successfully", "data": review})
}

// GetAllReviews - GET /reviews
func GetAllReviews(c *gin.Context) {
	var reviews []entity.Review

	db := config.DB()

	// Preload User data to include User details in the response
	results := db.Preload("User").Find(&reviews)

	if results.Error != nil || results.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No reviews found"})
		return
	}

	// Return all reviews with preloaded user data
	c.JSON(http.StatusOK, reviews)
}
