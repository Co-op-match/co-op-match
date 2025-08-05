package entity

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Analysis struct {
	gorm.Model

	AnalysisTypeID uint         `json:"analysis_type_id"`
	AnalysisType   AnalysisType `gorm:"foreignKey:AnalysisTypeID"`

	SummaryData datatypes.JSON `json:"summary_data"` // เช่น {"total_applications": 50, "approved": 30, "rejected": 20}
	AnalyzedAt  time.Time      `json:"analyzed_at"`

	// Optional: แสดงว่าเป็นของใคร
	AdminID *uint  `json:"admin_id"`
	Admin   *Admin `gorm:"foreignKey:AdminID"`

	StudentID *uint    `json:"student_id"`
	Student   *Student `gorm:"foreignKey:StudentID"`

	CompanyID *uint    `json:"company_id"`
	Company   *Company `gorm:"foreignKey:CompanyID"`

	IntershipPostID *uint          `json:"intership_post_id"`
	IntershipPost   *IntershipPost `gorm:"foreignKey:IntershipPostID"`
}

type AnalysisType struct {
	gorm.Model
	TypeCode string     `json:"type_code"` // เช่น application, review, matching, post
	TypeName string     `json:"type_name"` // เช่น การสมัคร, รีวิว, การจับคู่, โพสต์
	Analyses []Analysis `gorm:"foreignKey:AnalysisTypeID"`
}

type LoginLog struct {
	gorm.Model	
	IP      string    `json:"ip"`
	Device  string    `json:"device"`
	LoginAt time.Time `json:"login_at"`

	UserID  uint      `json:"user_id"`
	User    User      `gorm:"foreignKey:UserID"`
}

// วิเคราะห์ทักษะที่บริษัทต้องการมากที่สุด
type SkillDemandAnalysis struct {
	gorm.Model
	SkillID   uint      `json:"skill_id"`
	Skill     Skill     `gorm:"foreignKey:SkillID"`
	Count     int       `json:"count"` // จำนวนโพสต์ที่ต้องการทักษะนี้
	UpdatedAt time.Time `json:"updated_at"`

	Year  int `json:"year"`
	Month int `json:"month"`
}

// สถิติการสมัครงาน เช่น จำนวนผู้สมัครต่อโพสต์, อัตราการผ่าน, ฯลฯ
type ApplicationStatistics struct {
	gorm.Model
	IntershipPostID uint          `json:"intership_post_id"`
	IntershipPost   IntershipPost `gorm:"foreignKey:IntershipPostID"`

	TotalApplicants       int `json:"total_applicants"`
	PassedApplicants      int `json:"passed_applicants"`
	RejectedApplicants    int `json:"rejected_applicants"`
	InterviewedApplicants int `json:"interviewed_applicants"`

	UpdatedAt time.Time `json:"updated_at"` // เก็บวันเวลาที่คำนวณ

	Day int `json:"day"`
}

// วิเคราะห์ศักยภาพของนักศึกษาที่สมัครงาน เช่น GPA, ทักษะ, ความแมตช์
type StudentPerformanceAnalysis struct {
	gorm.Model
	StudentID uint    `json:"student_id"`
	Student   Student `gorm:"foreignKey:StudentID"`

	AverageGPA       float64 `json:"average_gpa"`
	MatchedSkills    int     `json:"matched_skills"`
	TotalSkills      int     `json:"total_skills"`
	ApplicationsMade int     `json:"applications_made"`

	UpdatedAt time.Time `json:"updated_at"`

	Year  int `json:"year"`
	Month int `json:"month"`
}

// สถิติรีวิวของแต่ละบริษัท เช่น คะแนนเฉลี่ย ความนิยม
type CompanyReviewStats struct {
	gorm.Model
	CompanyID     uint    `json:"company_id"`
	Company       Company `gorm:"foreignKey:CompanyID"`
	AverageRating float64 `json:"average_rating"`
	TotalReviews  int     `json:"total_reviews"`

	UpdatedAt time.Time `json:"updated_at"`
}

// วิเคราะห์ว่าแต่ละ Interest (ความสนใจ) ของนักศึกษามีแนวโน้มเปลี่ยนแปลงยังไง
type InterestTrendAnalysis struct {
	gorm.Model
	InterestID uint      `json:"interest_id"`
	Interest   Interest  `gorm:"foreignKey:InterestID"`
	Count      int       `json:"count"` // จำนวนคนที่มีความสนใจนี้
	UpdatedAt  time.Time `json:"updated_at"`

	Year  int `json:"year"`
	Month int `json:"month"`
}

// วิเคราะห์การสมัครงานของนักศึกษาตามมหาวิทยาลัย
type UniversityApplicationAnalysis struct {
	gorm.Model
	UniversityID uint       `json:"university_id"`
	University   University `gorm:"foreignKey:UniversityID"`

	TotalApplicants int     `json:"total_applicants"`
	AverageGPA      float64 `json:"average_gpa"`

	UpdatedAt time.Time `json:"updated_at"`

	Year int `json:"year"`
}
