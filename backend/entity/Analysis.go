package entity

import "time"

type AnalysisKPIs struct {
	TotalApplications     int64   `json:"total_applications"`
	MatchingSuccessRate   float64 `json:"matching_success_rate"` // 0..1
	AvgCompanyReviewScore float64 `json:"avg_company_review_score"`
	ActiveUsers7d         int64   `json:"active_users_7d"`
}

type TimeSeriesPoint struct {
	Date  time.Time `json:"date"`
	Value int64     `json:"value"`
}

type ApplicationTrendResponse struct {
	Series []TimeSeriesPoint `json:"series"`
}

type ProgramStat struct {
	ProgramID   uint   `json:"program_id"`
	ProgramName string `json:"program_name"`
	Count       int64  `json:"count"`
}

type ApplicationByProgramResponse struct {
	Start   time.Time    `json:"start"`
	End     time.Time    `json:"end"`
	TopN    int          `json:"top_n"`
	Results []ProgramStat `json:"results"`
}

type CompanyRatingRow struct {
	CompanyID   uint    `json:"company_id"`
	CompanyName string  `json:"company_name"`
	AvgRating   float64 `json:"avg_rating"`
	Reviews     int64   `json:"reviews"`
}

type ReviewDistributionBin struct {
	Stars int   `json:"stars"` // 1..5
	Count int64 `json:"count"`
}

type CompanyReviewReport struct {
	OverallAverage float64                `json:"overall_average"`
	Distribution   []ReviewDistributionBin `json:"distribution"`
	TopCompanies   []CompanyRatingRow      `json:"top_companies"`
}