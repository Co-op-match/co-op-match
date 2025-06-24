package searchjob

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAllProvinces(c *gin.Context) {
	db := config.DB()
	var provinces []entity.Provinces
	db.Find(&provinces)
	c.JSON(http.StatusOK, &provinces)
}
