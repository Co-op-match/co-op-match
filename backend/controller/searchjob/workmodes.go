package searchjob

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAllWorkModes(c *gin.Context) {
	db := config.DB()
	var workmodes []entity.WorkMode
	db.Find(&workmodes)
	c.JSON(http.StatusOK, &workmodes)
}
