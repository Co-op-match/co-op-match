package searchjob

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAllStipends(c *gin.Context) {
	db := config.DB()
	var stipends []entity.Stipend
	db.Find(&stipends)
	c.JSON(http.StatusOK, &stipends)
}
