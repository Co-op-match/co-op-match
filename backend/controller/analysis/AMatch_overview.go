package analysis

import (
	"math"
	"net/http"

	"co-op-match.com/co-op-match/config"
	"github.com/gin-gonic/gin"
)

type upliftSide struct {
	Total      int64    `json:"total"`
	Pass       int64    `json:"pass"`
	Fail       int64    `json:"fail"`
	PassRate   *float64 `json:"pass_rate"` // อนุญาตให้เป็น nil
	FailRate   *float64 `json:"fail_rate"` // อนุญาตให้เป็น nil
	Sufficient bool     `json:"sufficient"`
}

type upliftResp struct {
	Recommended    upliftSide `json:"recommended"`
	NonRecommended upliftSide `json:"non_recommended"`
	UpliftPassRate *float64   `json:"uplift_pass_rate"` // nil ถ้าข้อมูลไม่พอ
	MinSample      int64      `json:"min_sample"`
	Note           string     `json:"note"`
}

// GET /analysis/uplift
func GetUpliftPassFail(c *gin.Context) {
	db := config.DB()

	const MIN_SAMPLE int64 = 5

	// -------- Recommended (อยู่ใน Top-10 ของนักศึกษาคนเดียวกัน) --------
	// นับเฉพาะผลที่ "ตัดสินแล้ว": pass = 'ผ่าน', fail = 'ไม่ผ่าน'
	var recPass, recFail int64
	db.Raw(`
		SELECT
			COALESCE(SUM(CASE WHEN a.status = 'ผ่าน' THEN 1 ELSE 0 END), 0)      AS pass_cnt,
			COALESCE(SUM(CASE WHEN a.status = 'ไม่ผ่าน' THEN 1 ELSE 0 END), 0)  AS fail_cnt
		FROM applications a
		WHERE EXISTS (
			SELECT 1
			FROM job_matches jm
			WHERE jm.student_id = a.student_id
			  AND jm.internship_post_id = a.intership_post_id
			  AND jm.ranking <= 10
		)
	`).Row().Scan(&recPass, &recFail)

	recTotal := recPass + recFail
	recPassRate := rateOrNil(recPass, recTotal)
	recFailRate := rateOrNil(recFail, recTotal)
	recSufficient := recTotal >= MIN_SAMPLE

	// -------- Non-Recommended (ไม่อยู่ใน Top-10) --------
	var nonPass, nonFail int64
	db.Raw(`
		SELECT
			COALESCE(SUM(CASE WHEN a.status = 'ผ่าน' THEN 1 ELSE 0 END), 0)      AS pass_cnt,
			COALESCE(SUM(CASE WHEN a.status = 'ไม่ผ่าน' THEN 1 ELSE 0 END), 0)  AS fail_cnt
		FROM applications a
		WHERE NOT EXISTS (
			SELECT 1
			FROM job_matches jm
			WHERE jm.student_id = a.student_id
			  AND jm.internship_post_id = a.intership_post_id
			  AND jm.ranking <= 10
		)
	`).Row().Scan(&nonPass, &nonFail)

	nonTotal := nonPass + nonFail
	nonPassRate := rateOrNil(nonPass, nonTotal)
	nonFailRate := rateOrNil(nonFail, nonTotal)
	nonSufficient := nonTotal >= MIN_SAMPLE

	// -------- Uplift ของอัตราผ่าน --------
	var uplift *float64
	note := ""
	if recSufficient && nonSufficient && recPassRate != nil && nonPassRate != nil {
		v := *recPassRate - *nonPassRate // ต่างของ pass_rate (ช่วง -1..+1)
		if v < -1 {
			v = -1
		}
		if v > 1 {
			v = 1
		}
		uplift = &v
	} else {
		uplift = nil
		note = "ข้อมูลอย่างน้อยหนึ่งฝั่งมีปริมาณไม่ถึงเกณฑ์ขั้นต่ำ จึงไม่คำนวณ Uplift"
	}

	resp := upliftResp{
		Recommended: upliftSide{
			Total:      recTotal,   // pass + fail (เฉพาะที่ตัดสินแล้ว)
			Pass:       recPass,    // status = 'ผ่าน'
			Fail:       recFail,    // status = 'ไม่ผ่าน'
			PassRate:   recPassRate,
			FailRate:   recFailRate,
			Sufficient: recSufficient,
		},
		NonRecommended: upliftSide{
			Total:      nonTotal,
			Pass:       nonPass,
			Fail:       nonFail,
			PassRate:   nonPassRate,
			FailRate:   nonFailRate,
			Sufficient: nonSufficient,
		},
		UpliftPassRate: uplift,
		MinSample:      MIN_SAMPLE,
		Note:           note,
	}

	c.JSON(http.StatusOK, resp)
}

// helper: คืน pointer อัตรา (0..1) หรือ nil ถ้า total==0
func rateOrNil(num, den int64) *float64 {
	if den <= 0 {
		return nil
	}
	v := float64(num) / float64(den)
	// กัน NaN/Inf
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return nil
	}
	return &v
}