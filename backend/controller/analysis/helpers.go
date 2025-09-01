// controller/analysis/helpers.go
package analysis

import (
	"strconv"
	"time"
)

func safeDivide(a, b int64) float64 {
	if b == 0 {
		return 0
	}
	return float64(a) / float64(b)
}

func betweenDays(daysParam string) (startUTC, endUTC time.Time) {
    days := 30
    if v, err := strconv.Atoi(daysParam); err == nil && v > 0 {
        days = v
    }

    loc, _ := time.LoadLocation("Asia/Bangkok")
    nowLocal := time.Now().In(loc)

    // รวม "วันนี้" แบบ local: [00:00 ของวันเริ่ม .. 23:59:59.999 ของวันนี้]
    startLocal := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, loc).
        AddDate(0, 0, -(days-1))
    endLocal := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 23, 59, 59, int(time.Millisecond*999), loc)

    return startLocal.UTC(), endLocal.UTC()
}

func betweenStartEnd(startStr, endStr string) (time.Time, time.Time, error) {
	layout := "2006-01-02"
	s, err := time.Parse(layout, startStr)
	if err != nil { return time.Time{}, time.Time{}, err }
	e, err := time.Parse(layout, endStr)
	if err != nil { return time.Time{}, time.Time{}, err }
	// normalize to midnight
	s = s.Truncate(24 * time.Hour)
	e = e.Truncate(24 * time.Hour)
	return s, e, nil
}