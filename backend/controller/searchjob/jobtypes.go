package searchjob

import (
	"net/http"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

func GetAllJobTypes(c *gin.Context) {
	db := config.DB()
	var Jobtypes []entity.JobType
	db.Find(&Jobtypes)
	c.JSON(http.StatusOK, &Jobtypes)
}
