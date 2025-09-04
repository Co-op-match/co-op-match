package analysis

//==============================    Company Dashboard       ==============================
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
	PostID                uint     `json:"post_id"`
	PostName              string   `json:"post_name"`
	Applications          int64    `json:"applications"`
	Interviewed           int64    `json:"interviewed"`
	Passed                int64    `json:"passed"`
	AvgTimeToDecisionDays float64  `json:"avg_time_to_decision_days"`
	AvgGPA                *float64 `json:"avg_gpa,omitempty"`
	MinGPA                *float64 `json:"min_gpa,omitempty"`
	WorkMode              string   `json:"work_mode"`
}

type InterviewStatsResponse struct {
	Scheduled int64 `json:"scheduled"`
	NoShow    int64 `json:"no_show"` // ถ้ายังไม่มี field เก็บ ให้เป็น 0 ไปก่อน
	Mode      []struct {
		Mode     string   `json:"mode"`
		Count    int64    `json:"count"`
		PassRate *float64 `json:"pass_rate,omitempty"`
	} `json:"mode"`
	AvgDaysSubmitToSchedule   *float64 `json:"avg_days_submit_to_schedule,omitempty"`
	AvgDaysScheduleToDecision *float64 `json:"avg_days_schedule_to_decision,omitempty"`
}

//==============================    Academic Staff Dashboard       ==============================

type KV struct {
	Key   string `json:"key"`
	Count int    `json:"count"`
}

type KVTime struct {
	Period string `json:"period"`
	Count  int    `json:"count"`
}

type TopCompany struct {
	CompanyID   uint
	CompanyName string
	Count       int
}

type AcademicOverviewResponse struct {
	UniversityID uint `json:"university_id"`
	Students     int  `json:"students"`

	ApplicationsByStatus []KV         `json:"applications_by_status"`
	InterviewsUpcoming   int          `json:"interviews_upcoming"`
	ReviewsTotal         int          `json:"reviews_total"`
	TopCompanies         []TopCompany `json:"top_companies"`
	NeverApplied         int          `json:"never_applied"`

	AppsPerWeek     []KVTime `json:"apps_per_week"`
	AppsPerMonth    []KVTime `json:"apps_per_month"`
	AppsPerSemester []KVTime `json:"apps_per_semester"`
}

type AcademicStudentItem struct {
	ID        uint   `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Gender    string `json:"gender"`
	Age       uint   `json:"age"`

	ProgramName    string `json:"program_name"`
	FacultyName    string `json:"faculty_name"`
	UniversityName string `json:"university_name"`

	ApplicationsTotal int `json:"applications_total"`
}

type ListAcademicStudentsResponse struct {
	UniversityID uint                  `json:"university_id"`
	Total        int64                 `json:"total"`
	Page         int                   `json:"page"`
	PageSize     int                   `json:"page_size"`
	Items        []AcademicStudentItem `json:"items"`
}

type AcademicApplicationItem struct {
	ID              uint   `json:"id"`
	Status          string `json:"status"`
	SubmitAt        string `json:"submit_at"`
	CompanyName     string `json:"company_name"`
	PostName        string `json:"post_name"`
	StudentID       uint   `json:"student_id"`
	StudentFullName string `json:"student_full_name"`
	UpdatedAt       string `json:"updated_at"`
	ResumeUrl       string `json:"resume_url"`
	TranscriptUrl   string `json:"transcript_url"`
	CompanyNote     string `json:"company_note"`
}

type ListAcademicApplicationsResponse struct {
	UniversityID uint                      `json:"university_id"`
	Total        int64                     `json:"total"`
	Page         int                       `json:"page"`
	PageSize     int                       `json:"page_size"`
	Items        []AcademicApplicationItem `json:"items"`
}
