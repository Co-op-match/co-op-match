package entity
/* type KPIResponse struct {
	TotalApplications       int64   `json:"total_applications"`
	MatchedApplications     int64   `json:"matched_applications"`
	MatchingSuccessRate     float64 `json:"matching_success_rate"`
	AvgCompanyReviewScore   float64 `json:"avg_company_review_score"`
	ApplicationsLast7d      int64   `json:"applications_last_7d"`
}

type TimeSeriesPoint struct {
	Date  string `json:"date"`
	Value int64  `json:"value"`
}
 */
type TrendResponse struct {
	Series []TimeSeriesPoint `json:"series"`
}

type MajorTrendItem struct {
	Label string `json:"label"`
	Value int64  `json:"value"`
}

type MajorTrendResponse struct {
	Items []MajorTrendItem `json:"items"`
}

type ReviewSummary struct {
	AvgRating float64        `json:"avg_rating"`
	Buckets   map[string]int `json:"buckets"` // "1", "2", ..., "5"
}