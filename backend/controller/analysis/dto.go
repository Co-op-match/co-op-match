// controller/analysis/dto.go
package analysis

type OverviewResponse struct {
	TotalApplications int64    `json:"totalApplications"`
	InterviewRate     float64  `json:"interviewRate"` // 0..1
	OfferRate         float64  `json:"offerRate"`     // 0..1
	RejectRate        float64  `json:"rejectRate"`    // 0..1
	AvgReviewScore    *float64 `json:"avgReviewScore,omitempty"`
	TopPost           *struct {
		PostID       uint   `json:"postId"`
		PostName     string `json:"postName"`
		Applications int64  `json:"applications"`
	} `json:"topPost,omitempty"`
}

type TrendPoint struct {
	Date  string `json:"date"`  // YYYY-MM-DD
	Value int64  `json:"value"` // applications count
}

type PipelineBucket struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
}

type PostPerformanceRow struct {
	PostID                 uint    `json:"post_id"`
	PostName               string  `json:"post_name"`
	Applications           int64   `json:"applications"`
	Interviewed            int64   `json:"interviewed"`
	Passed                 int64   `json:"passed"`
	AvgTimeToDecisionDays  float64 `json:"avg_time_to_decision_days"`
	AvgGPA                 *float64 `json:"avg_gpa,omitempty"`
	MinGPA                 *float64 `json:"min_gpa,omitempty"`
	WorkMode               string   `json:"work_mode"`
}

type InterviewStatsResponse struct {
	Scheduled                    int64 `json:"scheduled"`
	NoShow                       int64 `json:"no_show"` // ถ้ายังไม่มี field เก็บ ให้เป็น 0 ไปก่อน
	Mode                         []struct {
		Mode     string  `json:"mode"`
		Count    int64   `json:"count"`
		PassRate *float64 `json:"pass_rate,omitempty"`
	} `json:"mode"`
	AvgDaysSubmitToSchedule  *float64 `json:"avg_days_submit_to_schedule,omitempty"`
	AvgDaysScheduleToDecision *float64 `json:"avg_days_schedule_to_decision,omitempty"`
}