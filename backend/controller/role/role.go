package role

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAll(c *gin.Context) {
	db := config.DB()
	var roles []entity.Role
	db.Find(&roles)
	c.JSON(http.StatusOK, &roles)
}
