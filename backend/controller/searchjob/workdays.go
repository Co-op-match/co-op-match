package searchjob

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAllWorkDays(c *gin.Context) {
	db := config.DB()
	var workdays []entity.WorkDay
	db.Find(&workdays)
	c.JSON(http.StatusOK, &workdays)
}
