// ===== controller/debug.go =====
package controller

import (
	"strconv"
	"time"

	"co-op-match.com/co-op-match/hub/notifyhub"
	"github.com/gin-gonic/gin"
)

func HubStats(c *gin.Context) { c.JSON(200, notifyhub.H.Stats()) }

func DebugPush(c *gin.Context) {
	uid, _ := strconv.Atoi(c.Query("uid"))
	if uid <= 0 {
		c.JSON(400, gin.H{"error": "uid"})
		return
	}
	now := time.Now()
	notifyhub.H.NotifyCreated(uint(uid), 99999, "ทดสอบ", "สวัสดี realtime", "info", now, false)
	notifyhub.H.NotifyCount(uint(uid), 123)
	c.JSON(200, gin.H{"ok": true})
}
