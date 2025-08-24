// analysis/majors.go
package analysis

import (
	"net/http"
	"strconv"
	"time"

	"co-op-match.com/co-op-match/config"
	"github.com/gin-gonic/gin"
)

// GET /analysis/majors?days=90&top=5
// response:
// {
//   "series": [
//      { "program": "วิศวกรรมคอมพิวเตอร์", "data": [ { "date": "2025-08-01", "value": 3 }, ... ] },
//      ...
//   ],
//   "others": [ { "date": "...", "value": N }, ... ] // รวมโปรแกรมนอก Top-N
// }
func GetApplicationTrendByProgram(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "90"))
	topN, _ := strconv.Atoi(c.DefaultQuery("top", "5"))
	if topN <= 0 {
		topN = 5
	}
	start := time.Now().AddDate(0, 0, -days)
	db := config.DB()

	// 1) จัดอันดับโปรแกรมตามจำนวนใบสมัครช่วงเวลา
	type TopRow struct {
		Program string
		Count   int64
	}
	var tops []TopRow

	// เลือก Education ล่าสุดของนักศึกษาแต่ละคนด้วย subquery (max(id)) หรือ max(updated_at)
	// ปรับชื่อตาราง/คอลัมน์ตาม schema จริงของคุณ
	db.Raw(`
	  WITH latest_edu AS (
	    SELECT e.*
	    FROM educations e
	    JOIN (
	      SELECT student_id, MAX(id) AS max_id
	      FROM educations
	      WHERE deleted_at IS NULL
	      GROUP BY student_id
	    ) x ON x.student_id = e.student_id AND x.max_id = e.id
	  )
	  SELECT COALESCE(p.program_name, 'ไม่ระบุ') AS program,
	         COUNT(a.id) AS count
	  FROM applications a
	  JOIN students s ON s.id = a.student_id
	  LEFT JOIN latest_edu le ON le.student_id = s.id
	  LEFT JOIN programs p ON p.id = le.program_id
	  WHERE a.submit_at >= ?
	  GROUP BY COALESCE(p.program_name, 'ไม่ระบุ')
	  ORDER BY count DESC
	  LIMIT ?
	`, start, topN).Scan(&tops)

	// สร้างชุดชื่อโปรแกรมใน TopN
	progSet := map[string]struct{}{}
	for _, t := range tops {
		progSet[t.Program] = struct{}{}
	}

	// 2) ดึง series รายวัน แยกโปรแกรม (รวม others)
	type DayRow struct {
		Date    string
		Program string
		Count   int64
	}
	var rows []DayRow
	db.Raw(`
	  WITH latest_edu AS (
	    SELECT e.*
	    FROM educations e
	    JOIN (
	      SELECT student_id, MAX(id) AS max_id
	      FROM educations
	      WHERE deleted_at IS NULL
	      GROUP BY student_id
	    ) x ON x.student_id = e.student_id AND x.max_id = e.id
	  )
	  SELECT DATE(a.submit_at) AS date,
	         COALESCE(p.program_name, 'ไม่ระบุ') AS program,
	         COUNT(a.id) AS count
	  FROM applications a
	  JOIN students s ON s.id = a.student_id
	  LEFT JOIN latest_edu le ON le.student_id = s.id
	  LEFT JOIN programs p ON p.id = le.program_id
	  WHERE a.submit_at >= ?
	  GROUP BY DATE(a.submit_at), COALESCE(p.program_name, 'ไม่ระบุ')
	  ORDER BY DATE(a.submit_at)
	`, start).Scan(&rows)

	// 3) map → series ต่อ program
	type Point struct {
		Date  string `json:"date"`
		Value int64  `json:"value"`
	}
	type Series struct {
		Program string  `json:"program"`
		Data    []Point `json:"data"`
	}
	seriesMap := map[string][]Point{}
	othersMap := map[string]int64{} // รวมโปรแกรมนอก TopN

	for _, r := range rows {
		if _, ok := progSet[r.Program]; ok {
			seriesMap[r.Program] = append(seriesMap[r.Program], Point{Date: r.Date, Value: r.Count})
		} else {
			othersMap[r.Date] += r.Count
		}
	}

	result := make([]Series, 0, len(seriesMap))
	for prog, pts := range seriesMap {
		result = append(result, Series{Program: prog, Data: pts})
	}
	// others
	others := make([]Point, 0, len(othersMap))
	for d, v := range othersMap {
		others = append(others, Point{Date: d, Value: v})
	}

	c.JSON(http.StatusOK, gin.H{
		"series": result,
		"others": others,
	})
}