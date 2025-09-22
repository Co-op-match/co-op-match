package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/controller"
	"co-op-match.com/co-op-match/controller/analysis"
	"co-op-match.com/co-op-match/controller/role"
	"co-op-match.com/co-op-match/controller/searchjob"
	"co-op-match.com/co-op-match/controller/users"
	"co-op-match.com/co-op-match/hub/notifyhub"
	"co-op-match.com/co-op-match/middlewares"
)

const PORT = "8080"

func main() {
	// 1) โหลด .env (ถ้ามี)
	_ = godotenv.Load()

	// 2) log SMTP env (ไม่โชว์รหัสผ่าน) ไว้ตรวจว่าอ่าน ENV ได้
	logSMTPEnv()

	// init hub / notify
	controller.InitChatHub()
	notifyhub.Start()

	// DB
	config.ConnectionDB()
	config.SetupDatabase()

	r := gin.Default()

	r.Use(CORSMiddleware())
	r.Static("/uploads", "./public/uploads")
	r.Static("/public", "./public")

	// ---------- Public Routes ----------
	r.POST("/sign-up", users.SignUp)
	r.POST("/sign-in", users.SignIn)
	r.POST("/logout", users.Logout)

	// Forgot/reset password (+rate-limit)
	auth := r.Group("/auth/password")
	{
		auth.POST("/forgot", middlewares.RateLimitForgotPassword(), users.SendResetPasswordEmail)
		auth.POST("/reset-otp", users.ResetPasswordWithOTP)
	}

	r.GET("/roles", role.GetAll)
	r.GET("/provinces", searchjob.GetAllProvinces)
	r.GET("/universities", controller.GetUniversities)

	// โพสต์ฝั่งบริษัท (ยังเปิดเป็น public ตามของเดิม; ถ้าต้องการคุ้มด้วย auth ย้ายไปกลุ่ม protected ด้านล่าง)
	r.POST("/post", controller.CreateInternshipPost)

	// ตัวเลือกต่างๆ
	r.GET("/work_modes", controller.GetAllWorkModes)
	r.GET("/work_days", controller.GetAllWorkDays)
	r.GET("/stipends", controller.GetAllStipends)
	r.GET("/job_types", controller.GetAllJobTypes)
	r.GET("/status_posts", controller.GetAllStatusPosts)
	r.GET("/benefit", controller.GetAllBenefits)

	// รายการโพสต์ public
	r.GET("/getpost", controller.ListIntershipPosts)
	r.GET("/getpost/:id", controller.GetInternshipPostById)
	r.GET("/posts/company/:id", controller.GetPostsByCompanyID)
	r.DELETE("/post/:id", controller.DeleteInternshipPost) // *ถ้าควรล็อกอิน ให้ย้ายไป protected

	// applications public ที่มีในเดิม
	r.POST("/applications/:id", controller.CreateApplication)
	r.GET("/interview_appointments/company/:company_id", controller.GetInterviewAppointmentsByCompanyID)
	r.GET("/application_details/student/:id", controller.GetApplicationDetailsByStudentID)
	r.GET("/applications/student/:id", controller.GetApplicationsByStudentID)
	r.GET("/student/user/:user_id", controller.GetStudentByUserID)
	r.GET("/application/:id", controller.GetApplicationByID)
	r.GET("/applications/post/:id", controller.GetApplicationsByIntershipPostID)
	r.PUT("/applications/post/:id", controller.UpdateApplication) // *ถ้าควรล็อกอิน ให้ย้ายไป protected
	r.GET("/applications/summary/:companyId", controller.GetTotalApplicationsByCompanyID)
	r.GET("/applications/company/:id", controller.GetPendingInterviewApplicationsByCompanyID)
	r.POST("/company/interview_appointments", controller.CreateInterviewAppointment)

	// reviews (บางส่วนยังเป็น public ตามของเดิม)
	r.GET("/reviews/:user_id", controller.GetReviewsByUserID)
	r.POST("/review/like", controller.LikeReview) // *ถ้าควรล็อกอิน ให้ย้ายไป protected
	r.GET("/review/liked/:user_id", controller.GetLikedReviews)
	r.POST("/review/unlike", controller.UnlikeReview) // *ถ้าควรล็อกอิน ให้ย้ายไป protected

	// Chat / Notifications (public websocket + endpoints ตามของเดิม)
	r.GET("/chat/ws", controller.ChatWebSocket)
	r.GET("/ws/notifications", controller.NotificationsWebSocket)
	r.GET("/notifications/:userID", controller.GetNotificationsByUser)
	r.POST("/debug/push", controller.DebugPush)
	r.GET("/debug/hub-stats", controller.HubStats)
	r.PATCH("/notifications/:id/read", controller.MarkNotificationAsRead)
	r.GET("/chat/messages/:room_id", controller.GetMessagesByChatRoomID)
	r.PATCH("/chat/messages/:room_id/read", controller.MarkMessagesAsRead)

	// admin ดูรวม (public เดิม)
	r.GET("/all-users", controller.GetAllUser)
	r.GET("/all-login-logs", controller.GetAllLoginLogs)
	r.PUT("/update-user/:id", controller.UpdateUser)
	r.PUT("/update-status-posts/:id", controller.UpdateStatusPost)
	r.GET("/admin/db/export", controller.AdminExportSQLite)

	// ---------- Protected Routes (ใช้ AuthRequired: รับได้ทั้ง Bearer และ Cookie) ----------
	protected := r.Group("/")
	protected.Use(middlewares.AuthRequired()) // << แทน Authorizes()

	// ค้นหาโพสต์ที่ต้องล็อกอินถึงจะเห็น
	protected.GET("/intership-posts", searchjob.GetAllIntershipPosts)
	protected.GET("/students/recommended-posts/:id", controller.GetRecommendedPosts)
	protected.GET("/interview_appointments", controller.ListInterviewAppointments)

	// liked posts
	protected.POST("/liked-post", controller.LikePost)
	protected.GET("/liked-posts/student/:id", controller.GetLikedPostsByStudentID)
	protected.DELETE("/liked-post/:student_id/:post_id", controller.DeleteLikedPost)

	// students
	studentGroup := protected.Group("/students")
	{
		studentGroup.GET("", controller.GetAllStudents)
		studentGroup.POST("", controller.CreateStudent)
		studentGroup.PUT("/:id", controller.UpdateStudent)
		studentGroup.GET("/:id", controller.GetStudentByID)
		studentGroup.GET("user/:user_id", controller.GetStudentByUserID)
		studentGroup.GET("/applications/:user_id", controller.GetApplicationsByUserID)
	}

	// address
	addressGroup := protected.Group("/address")
	{
		addressGroup.GET("/", controller.GetAllAdress)
		addressGroup.GET("/provinces", controller.GetAllProvinces)
		addressGroup.GET("/:user_id", controller.GetAddressByUserID)
		addressGroup.POST("/:role_id/:user_id", controller.CreateAddressByRoleIDAndUserID)
		addressGroup.PUT("/:role_id/:user_id", controller.UpdateAddressByRoleIDAndUserID)
	}

	// skills & interests
	studentSkillGroup := protected.Group("/skills")
	{
		studentSkillGroup.GET("/", controller.GetAllSkill)
		studentSkillGroup.GET("/:user_id", controller.GetStudentSkillsByUserID)
		studentSkillGroup.POST("/:user_id", controller.CreateStudentSkillsAndInterestsByUserID)
		studentSkillGroup.PUT("/:user_id", controller.UpdateStudentSkillsAndInterestsByUserID)
	}
	interestGroup := protected.Group("/interests")
	{
		interestGroup.GET("/", controller.GetAllInterest)
		interestGroup.GET("/:user_id", controller.GetStudentInterestsByUserID)
	}

	// education
	eduGroup := protected.Group("/education")
	{
		eduGroup.GET("/", controller.GetAllEducation)
		eduGroup.GET("/levels", controller.GetAllEducationLevel)
		eduGroup.GET("/:user_id", controller.GetEcudutionByUserID)
		eduGroup.POST("/", controller.CreateEducation)
		eduGroup.PUT("/:user_id", controller.UpdateEducationByUserID)
	}

	// user
	userGroup := protected.Group("/user")
	{
		userGroup.GET("/:id", controller.GetUserByID)
		userGroup.POST("/image", controller.CreateProfileImage)
		userGroup.PUT("/image/:id", controller.UpdateProfileImage)
		userGroup.GET("/gender", controller.GetAllGender)
		userGroup.GET("/image/:id", controller.GetProfileImageByUserID)
	}

	// reviews (ที่ควรล็อกอิน)
	reviewGroup := protected.Group("/reviews")
	{
		reviewGroup.POST("", controller.CreateReview)
		reviewGroup.GET("/company/:company_id", controller.GetReviewsByCompanyID)
		reviewGroup.GET("/student/:student_id", controller.GetReviewsByStudentID)
		reviewGroup.GET("/application/passed/student/:id", controller.GetPassedApplicationsByStudentID)
		reviewGroup.GET("/tags", controller.GetAllTags)
	}

	// chat APIs ที่ต้องล็อกอิน
	chatGroup := protected.Group("/chat")
	{
		chatGroup.POST("/session", controller.CreateChatSession)

		// 🔄 สร้างห้องแชท
		chatGroup.POST("/room", controller.CreateChatRoom)

		// 📋 ดึงห้องแชททั้งหมดของ user
		chatGroup.GET("/rooms/:user_id", controller.GetChatRoomsByUserID)

		// 🔌 WebSocket เชื่อมต่อ
		// chatGroup.GET("/ws", controller.ChatWebSocket)
	}

	// notification (ส่วนที่เป็น action)
	notificationGroup := protected.Group("/notification")
	{
		notificationGroup.POST("/interview/send-email/:student_id/:company_id", controller.SendInterviewEmail)
		notificationGroup.GET("/user/:userID", controller.GetNotificationsByUser)
		notificationGroup.PUT("/:id/read", controller.MarkNotificationAsRead)
		notificationGroup.POST("/email/verify-status/:userID", controller.SendVerifyStatusEmail)
		notificationGroup.GET("/calendar/student/:user_id", controller.GetCalendarEventsStudentByUserID)
		notificationGroup.GET("/calendar/company/:user_id", controller.GetCalendarEventsCompanyByUserID)
	}

	// company
	companyGroup := protected.Group("/company")
	{
		companyGroup.GET("", controller.GetAllCompany)
		companyGroup.GET("/:id", controller.GetCompanyByID)
		companyGroup.POST("", controller.CreateCompany)
		companyGroup.PUT("/logo/:user_id", controller.UpdateCompanyLogoByUserID)
		companyGroup.GET("/user/:user_id", controller.GetCompanyByUserId)
		companyGroup.GET("/verify/:user_id", controller.GetVerifyByUserId)
		companyGroup.POST("/verify/:user_id", controller.CreateSendVerifyCompany)
	}

	// academic staff
	academicstaffGroup := protected.Group("/academicstaff")
	{
		academicstaffGroup.GET("", controller.GetAllAcademicStaff)
		academicstaffGroup.PUT("/:id", controller.UpdateAcademicStaff)
		academicstaffGroup.GET("/:id", controller.GetAcademicStaffByID)
		academicstaffGroup.POST("", controller.CreateAcademicStaff)
		academicstaffGroup.GET("/user/:user_id", controller.GetAcademicStaffByUserId)
		academicstaffGroup.GET("/verify/:user_id", controller.GetVerifyByUserId)
		academicstaffGroup.POST("/verify/:user_id", controller.CreateSendVerifyAcademicStaffy)
		academicstaffGroup.GET("/advisor/:userId", controller.GetAdviseeStudents)
		academicstaffGroup.GET("/student/advisor/:user_id", controller.GetAdviseeStudents)
		academicstaffGroup.GET("/company/advisor/:user_id", controller.GetAdviseeCompanySummary)
		academicstaffGroup.GET("all", controller.GetAllAcademicStaff)
	}

	// contact
	contactGroup := protected.Group("/contact")
	{
		contactGroup.POST("", controller.CreateContact)
		contactGroup.GET("/:user_id", controller.GetContactByUserId)
		contactGroup.PUT("/:user_id", controller.UpdateContactByUserID)
	}

	// admin
	adminGroup := protected.Group("/admin")
	{
		adminGroup.GET("/all", controller.GetAllAdmin)
		adminGroup.GET("/user/:id", controller.GetAdminByUserID)
		// NOTE: วาง static routes ก่อน dynamic
		adminGroup.GET("/get-allpost", controller.GetAllInternshipPostsInAdmin)
		adminGroup.GET("/get-post-by-postid/:id", controller.GetInternshipPostsInAdminByIPostID)
		adminGroup.GET("/:id", controller.GetAdminByID)
		adminGroup.POST("", controller.CreateAdmin)
		adminGroup.POST("/uploads/image", controller.UploadImageByAdmin)
	}

	// analysis
	analysisGroup := protected.Group("/analysis")
	{
		//analysisGroup.GET("/dashboard-summary", analysis.GetAdminStatusSummaries)
		analysisGroup.GET("/dashboard-overview", analysis.GetAdminDashboardOverview)
		//analysisGroup.GET("/monthly-application-stats", analysis.GetAdminMonthlyApplicationStats)
		//analysisGroup.GET("/recent-activities", analysis.GetAdminRecentActivities)
		//analysisGroup.GET("/pending-posts", analysis.GetAdminPendingPosts)
		analysisGroup.GET("/monthly-user-by-role", analysis.GetMonthlyUsersByRole)
		//analysisGroup.GET("/users-by-role-series", analysis.GetUsersByRoleSeries)
		analysisGroup.GET("/top-jobs", analysis.GetTopJobs)
		analysisGroup.GET("/popular-companies", analysis.GetPopularCompanies)
		analysisGroup.GET("/popular-admin", analysis.GetTopPopularAdmin)
		analysisGroup.GET("/uplift", analysis.GetUpliftPassFail)
	}
	analysisCompanyGroup := protected.Group("/analysis/company/:companyId")
	{
		analysisCompanyGroup.GET("/overview", analysis.CompanyOverview)
		analysisCompanyGroup.GET("/trend", analysis.CompanyTrend)
		analysisCompanyGroup.GET("/status-application", analysis.CompanyStatusApplication)
		analysisCompanyGroup.GET("/latest-pending", analysis.CompanyLatestPending)
	}
	analysisAcademicGroup := r.Group("/analysis/academic/user/:userId")
	{
		analysisAcademicGroup.GET("/dashboard/overview", analysis.GetAcademicOverview)
		analysisAcademicGroup.GET("/trend", analysis.GetAcademicTrend)
		analysisAcademicGroup.GET("/students", analysis.ListAcademicStudents)
		analysisAcademicGroup.GET("/applications", analysis.ListAcademicApplications)
	}
	analysisAdminGroup := r.Group("/analysis/admin")
	{
		analysisAdminGroup.GET("/trend", analysis.GetTrendForAdmin)
	}

	// articles (ต้องล็อกอิน)
	articles := protected.Group("/articles")
	{
		articles.GET("", controller.ListArticles)
		articles.GET("/:id", controller.GetArticle)

		// จำกัดสิทธิ์เฉพาะ Admin
		articles.POST("", middlewares.RequireAdmin(), controller.CreateArticle)
		articles.PUT("/:id", middlewares.RequireAdmin(), controller.UpdateArticle)
		articles.DELETE("/:id", middlewares.RequireAdmin(), controller.DeleteArticle)
	}

	// verify
	verifyGroup := r.Group("/verify")
	{
		verifyGroup.GET("", controller.GetAllVerifications)
		verifyGroup.GET("/:id", controller.GetVerificationByID)
		verifyGroup.GET("/user/:user_id/latest", controller.GetLatestVerificationByUserID)
		verifyGroup.GET("/status", controller.GetAllStatusVerify)
		verifyGroup.PUT("/update-verify/:id", controller.UpdateVerifyStatus)
		verifyGroup.GET("/stats", controller.GetVerifyStats)
	}

	// health
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	// Run
	r.Run(":" + PORT)
}

func logSMTPEnv() {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USERNAME")
	from := os.Getenv("FROM_EMAIL")
	insecure := os.Getenv("DEV_SMTP_INSECURE")
	fmt.Printf("[smtp:init] host=%s port=%s user=%s from=%s dev_insecure=%s\n",
		host, port, user, from, insecure)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// รองรับหลาย origins สำหรับ development และ production
		origin := c.Request.Header.Get("Origin")
		allowedOrigins := []string{
			"http://localhost:5173",         // Development
			"http://localhost:3000",         // Alternative development port
			"https://coop-match.online",     // Production frontend
			"https://www.coop-match.online", // Production frontend with www
			"https://api.coop-match.online", // API domain (for testing)
		}

		// เช็ค environment variable
		corsOrigin := os.Getenv("CORS_ORIGIN")
		if corsOrigin != "" {
			allowedOrigins = append(allowedOrigins, corsOrigin)
		}

		// ตรวจสอบว่า origin ที่ request มาอยู่ใน allowed list หรือไม่
		isAllowed := false
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				isAllowed = true
				break
			}
		}

		// ถ้า origin ได้รับอนุญาต ให้ set header
		if isAllowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			// ถ้าไม่มี origin หรือไม่ได้รับอนุญาต ใช้ default
			defaultOrigin := os.Getenv("CORS_ORIGIN")
			if defaultOrigin == "" {
				defaultOrigin = "http://localhost:5173"
			}
			c.Writer.Header().Set("Access-Control-Allow-Origin", defaultOrigin)
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
