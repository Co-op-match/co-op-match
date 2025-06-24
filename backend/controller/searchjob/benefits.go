package searchjob

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAllBenefits(c *gin.Context) {
	db := config.DB()
	var benefits []entity.Benefit
	db.Find(&benefits)
	c.JSON(http.StatusOK, &benefits)
}
