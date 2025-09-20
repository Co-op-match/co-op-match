package controller

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"co-op-match.com/co-op-match/config"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ---------- helpers ----------
func quoteSQLiteString(s string) string {
	// escape ' → ''
	return "'" + strings.ReplaceAll(s, "'", "''") + "'"
}

func getSQLiteMainPath(db *gorm.DB) (string, error) {
	type row struct {
		Seq  int    `gorm:"column=seq"`
		Name string `gorm:"column=name"`
		File string `gorm:"column=file"`
	}
	var rows []row
	if err := db.Raw("PRAGMA database_list;").Scan(&rows).Error; err != nil {
		return "", err
	}
	for _, r := range rows {
		if r.Name == "main" {
			return r.File, nil
		}
	}
	return "", nil
}

// ---------- endpoint ----------
func AdminExportSQLite(c *gin.Context) {
	// ปลอดภัยนิดนึง: ต้องส่ง secret header ให้ตรงกับ ENV
	if c.GetHeader("X-Export-Secret") != os.Getenv("EXPORT_SECRET") {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	db := config.DB()
	tmpPath := "/tmp/coopmatch_export.sqlite"

	// วิธีหลัก: ใช้ VACUUM INTO เพื่อ snapshot แบบ consistent
	vacuumSQL := "VACUUM INTO " + quoteSQLiteString(tmpPath) + ";"
	if err := db.Exec(vacuumSQL).Error; err != nil {
		// ถ้าใช้ไม่ได้ → พยายามหา path ไฟล์จริง
		src := os.Getenv("SQLITE_PATH")
		if strings.TrimSpace(src) == "" {
			// auto-detect จาก PRAGMA database_list
			if p, derr := getSQLiteMainPath(db); derr == nil && strings.TrimSpace(p) != "" {
				src = p
			}
		}
		if strings.TrimSpace(src) == "" || src == ":memory:" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่รู้ตำแหน่งไฟล์ SQLite (ตั้ง SQLITE_PATH หรือใช้ VACUUM INTO ให้ได้)"})
			return
		}
		// copy ไฟล์ดิบเป็น fallback
		bin, rerr := os.ReadFile(src)
		if rerr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "อ่านไฟล์ DB ไม่ได้: " + rerr.Error()})
			return
		}
		if werr := os.WriteFile(tmpPath, bin, 0600); werr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "เขียนไฟล์ชั่วคราวไม่ได้: " + werr.Error()})
			return
		}
	}

	// ส่งเป็นไฟล์แนบ
	c.FileAttachment(tmpPath, filepath.Base(tmpPath))
}
