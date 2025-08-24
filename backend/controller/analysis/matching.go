// analysis/matching.go
package analysis

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/config"
	"github.com/gin-gonic/gin"
)

var acceptedStatus = []string{"ผ่านการคัดเลือก", "รับฝึกงาน", "Accepted"}

// GET /analysis/matching/success-rate?days=90
// ผลลัพธ์: series รายวัน + สรุปเปอร์เซ็นต์รวมช่วงเวลา
func GetMatchingSuccessRate(c *gin.Context) {
	daysStr := c.DefaultQuery("days", "90")
	days, _ := strconv.Atoi(daysStr)
	start := time.Now().AddDate(0, 0, -days)

	type row struct {
		Date        string  `json:"date"`
		Total       int64   `json:"total"`
		Matched     int64   `json:"matched"`
		SuccessRate float64 `json:"success_rate"` // 0..1
	}

	db := config.DB()

	// รวมรายวันทั้งหมด
	var totals []struct {
		Date  string
		Count int64
	}
	db.
		Table("applications").
		Select("DATE(submit_at) as date, COUNT(*) as count").
		Where("submit_at >= ?", start).
		Group("DATE(submit_at)").
		Order("DATE(submit_at)").
		Scan(&totals)

	// รวมรายวันเฉพาะที่ "จับคู่สำเร็จ"
	var matcheds []struct {
		Date  string
		Count int64
	}
	db.
		Table("applications").
		Select("DATE(submit_at) as date, COUNT(*) as count").
		Where("submit_at >= ?", start).
		Where("status IN ?", acceptedStatuses).
		Group("DATE(submit_at)").
		Order("DATE(submit_at)").
		Scan(&matcheds)

	mByDate := map[string]int64{}
	for _, m := range matcheds {
		mByDate[m.Date] = m.Count
	}

	series := make([]row, 0, len(totals))
	var sumTotal, sumMatch int64
	for _, t := range totals {
		mt := mByDate[t.Date]
		sumTotal += t.Count
		sumMatch += mt
		rate := 0.0
		if t.Count > 0 {
			rate = float64(mt) / float64(t.Count)
		}
		series = append(series, row{
			Date:        t.Date,
			Total:       t.Count,
			Matched:     mt,
			SuccessRate: rate,
		})
	}

	overall := 0.0
	if sumTotal > 0 {
		overall = float64(sumMatch) / float64(sumTotal)
	}

	c.JSON(http.StatusOK, gin.H{
		"series":      series,
		"total":       sumTotal,
		"matched":     sumMatch,
		"successRate": overall, // 0..1
	})
}

// GET /analysis/matching/export.csv?days=90
func ExportMatchingSuccessCSV(c *gin.Context) {
	daysStr := c.DefaultQuery("days", "90")
	days, _ := strconv.Atoi(daysStr)
	start := time.Now().AddDate(0, 0, -days)

	db := config.DB()

	type R struct {
		Date    string
		Total   int64
		Matched int64
	}
	var rows []R
	db.Raw(`
	  WITH t AS (
	    SELECT DATE(submit_at) AS d, COUNT(*) AS total
	    FROM applications
	    WHERE submit_at >= ?
	    GROUP BY DATE(submit_at)
	  ),
	  m AS (
	    SELECT DATE(submit_at) AS d, COUNT(*) AS matched
	    FROM applications
	    WHERE submit_at >= ? AND status IN (?,?,?)
	    GROUP BY DATE(submit_at)
	  )
	  SELECT t.d as date,
	         t.total as total,
	         COALESCE(m.matched,0) as matched
	  FROM t LEFT JOIN m ON t.d = m.d
	  ORDER BY t.d
	`, start, start, acceptedStatus[0], acceptedStatus[1], acceptedStatus[2]).Scan(&rows)

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=matching_success.csv")
	w := csv.NewWriter(c.Writer)
	defer w.Flush()

	_ = w.Write([]string{"date", "total", "matched", "success_rate"})
	for _, r := range rows {
		rate := 0.0
		if r.Total > 0 {
			rate = float64(r.Matched) / float64(r.Total)
		}
		_ = w.Write([]string{
			r.Date,
			fmt.Sprint(r.Total),
			fmt.Sprint(r.Matched),
			fmt.Sprintf("%.4f", rate),
		})
	}
}