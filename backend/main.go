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
		chatGroup.POST("/room", controller.CreateChatRoom)
		chatGroup.GET("/rooms/:user_id", controller.GetChatRoomsByUserID)
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
		academicstaffGroup.GET("/:id", controller.GetAcademicStaffByID)
		academicstaffGroup.POST("", controller.CreateAcademicStaff)
		academicstaffGroup.GET("/user/:user_id", controller.GetAcademicStaffByUserId)
		academicstaffGroup.GET("/verify/:user_id", controller.GetVerifyByUserId)
		academicstaffGroup.POST("/verify/:user_id", controller.CreateSendVerifyAcademicStaffy)
		academicstaffGroup.GET("/advisor/:userId", controller.GetAdviseeStudents)
		academicstaffGroup.GET("/student/advisor/:user_id", controller.GetAdviseeStudents)
		academicstaffGroup.GET("/company/advisor/:user_id", controller.GetAdviseeCompanySummary)
		
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
	}
	analysisCompanyGroup := protected.Group("/analysis/company/:companyId")
	{
		analysisCompanyGroup.GET("/overview", analysis.CompanyOverview)
		analysisCompanyGroup.GET("/trend", analysis.CompanyTrend)
		analysisCompanyGroup.GET("/status-application", analysis.CompanyStatusApplication)
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
		articles.POST("", controller.CreateArticle)
		articles.PUT("/:id", controller.UpdateArticle)
		articles.DELETE("/:id", controller.DeleteArticle)
	}

	// verify
	verifyGroup := r.Group("/verify")
	{
		verifyGroup.GET("", controller.GetAllVerifications)
		verifyGroup.GET("/:id", controller.GetVerificationByID)
		verifyGroup.GET("/user/:user_id/latest", controller.GetLatestVerificationByUserID)
		verifyGroup.GET("/status", controller.GetAllStatusVerify)
		verifyGroup.PUT("/update-verify/:id", controller.UpdateVerifyStatus)
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
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://api.coop-match.online")
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

/*package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv" // << เพิ่ม

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/controller"
	"co-op-match.com/co-op-match/controller/analysis"
	"co-op-match.com/co-op-match/controller/role"
	"co-op-match.com/co-op-match/controller/searchjob"
	"co-op-match.com/co-op-match/controller/users"
	"co-op-match.com/co-op-match/hub/notifyhub"
	"co-op-match.com/co-op-match/middlewares"
)

const PORT = "8000"

func main() {
	// 1) โหลด .env (ถ้ามี)
	_ = godotenv.Load()
	// 2) พิมพ์ log ค่า SMTP (ไม่โชว์รหัสผ่าน) เพื่อเช็คว่าอ่าน ENV ได้จริง
	logSMTPEnv()
	controller.InitChatHub()
	notifyhub.Start()

	config.ConnectionDB()
	config.SetupDatabase()

	r := gin.Default()

	r.Use(CORSMiddleware())
	r.Static("/uploads", "./public/uploads")

	// Public Routes
	r.POST("/sign-up", users.SignUp)
	r.POST("/sign-in", users.SignIn)
	//r.POST("/reset-password", users.SimpleResetPassword)
	r.POST("/logout", users.Logout)
	auth := r.Group("/auth/password")
	{
		auth.POST("/forgot", users.SendResetPasswordEmail)  // body: { "email": "..." }
		auth.POST("/reset-otp", users.ResetPasswordWithOTP) // body: { "email":"...", "otp":"123456", "new_password":"..." }
	}
	r.GET("/roles", role.GetAll)
	r.GET("/provinces", searchjob.GetAllProvinces)
	r.GET("/universities", controller.GetUniversities)

	r.POST("/post", controller.CreateInternshipPost)

	r.GET("/work_modes", controller.GetAllWorkModes)
	r.GET("/work_days", controller.GetAllWorkDays)
	r.GET("/stipends", controller.GetAllStipends)
	r.GET("/job_types", controller.GetAllJobTypes)
	r.GET("/status_posts", controller.GetAllStatusPosts)
	r.GET("/benefit", controller.GetAllBenefits)
	r.GET("/getpost", controller.ListIntershipPosts)
	r.GET("/getpost/:id", controller.GetInternshipPostById)
	r.GET("/posts/company/:id", controller.GetPostsByCompanyID)
	r.DELETE("/post/:id", controller.DeleteInternshipPost)
	r.GET("/interview_appointments/company/:company_id", controller.GetInterviewAppointmentsByCompanyID)
	r.GET("/application_details/student/:id", controller.GetApplicationDetailsByStudentID)
	r.GET("/applications/student/:id", controller.GetApplicationsByStudentID)
	r.GET("/student/user/:user_id", controller.GetStudentByUserID)
	r.GET("/application/:id", controller.GetApplicationByID)
	r.GET("/applications/post/:id", controller.GetApplicationsByIntershipPostID)
	r.PUT("/applications/post/:id", controller.UpdateApplication)
	r.GET("/applications/summary/:companyId", controller.GetTotalApplicationsByCompanyID)
	r.GET("/reviews/:user_id", controller.GetReviewsByUserID)
	r.POST("/review/like", controller.LikeReview)
	r.GET("/review/liked/:user_id", controller.GetLikedReviews)
	r.POST("/review/unlike", controller.UnlikeReview)
	// วิเคราะห์
	// r.POST("/reviews/:id/analyze", controller.AnalyzeReview)
	// r.POST("/reviews/analyze/batch", controller.AnalyzeBatch)

	// สรุป/แนวโน้ม (สำหรับ FE dashboard)
	// r.GET("/analysis/comments/summary", controller.GetCommentSummary)
	// r.GET("/analysis/comments/trend", controller.GetCommentTrend)

	r.POST("/company/interview_appointments", controller.CreateInterviewAppointment)
	// r.GET("/applications/company/:id", controller.GetInterviewAppointmentByCompanyID)
	r.GET("/applications/company/:id", controller.GetPendingInterviewApplicationsByCompanyID)

	r.Static("/public", "./public")/ๅ

	r.POST("/applications/:id", controller.CreateApplication)
	r.GET("/chat/ws", controller.ChatWebSocket)
	r.GET("/ws/notifications", controller.NotificationsWebSocket)
	r.GET("/notifications/:userID", controller.GetNotificationsByUser)
	r.POST("/debug/push", controller.DebugPush)
	r.GET("/debug/hub-stats", controller.HubStats)
	r.PATCH("/notifications/:id/read", controller.MarkNotificationAsRead)
	// 📩 ดึงข้อความย้อนหลัง
	r.GET("/chat/messages/:room_id", controller.GetMessagesByChatRoomID)

	// ✅ อัปเดตข้อความว่าอ่านแล้ว
	r.PATCH("/chat/messages/:room_id/read", controller.MarkMessagesAsRead)

	r.GET("/all-users", controller.GetAllUser)
	r.GET("/all-login-logs", controller.GetAllLoginLogs)
	r.PUT("/update-user/:id", controller.UpdateUser)
	r.PUT("/update-status-posts/:id", controller.UpdateStatusPost)

	// Protected Routes
	router := r.Group("/")
	{
		router.Use(middlewares.Authorizes())

		router.GET("/intership-posts", searchjob.GetAllIntershipPosts)
		router.GET("/students/recommended-posts/:id", controller.GetRecommendedPosts)
		router.GET("/interview_appointments", controller.ListInterviewAppointments)
		router.POST("/liked-post", controller.LikePost)
		router.GET("/liked-posts/student/:id", controller.GetLikedPostsByStudentID)
		router.DELETE("/liked-post/:student_id/:post_id", controller.DeleteLikedPost)

		studentGroup := router.Group("/students")
		{
			studentGroup.GET("", controller.GetAllStudents)
			studentGroup.POST("", controller.CreateStudent)
			studentGroup.PUT("/:id", controller.UpdateStudent)
			studentGroup.GET("/:id", controller.GetStudentByID)
			studentGroup.GET("user/:user_id", controller.GetStudentByUserID)
			studentGroup.GET("/applications/:user_id", controller.GetApplicationsByUserID)
		}

		addressGroup := router.Group("/address")
		{
			addressGroup.GET("/", controller.GetAllAdress)
			addressGroup.GET("/provinces", controller.GetAllProvinces)
			addressGroup.GET("/:user_id", controller.GetAddressByUserID)
			addressGroup.POST("/:role_id/:user_id", controller.CreateAddressByRoleIDAndUserID)
			addressGroup.PUT("/:role_id/:user_id", controller.UpdateAddressByRoleIDAndUserID)
		}

		studentSkillGroup := router.Group("/skills")
		{
			studentSkillGroup.GET("/", controller.GetAllSkill)
			studentSkillGroup.GET("/:user_id", controller.GetStudentSkillsByUserID)
			studentSkillGroup.POST("/:user_id", controller.CreateStudentSkillsAndInterestsByUserID)
			studentSkillGroup.PUT("/:user_id", controller.UpdateStudentSkillsAndInterestsByUserID)
		}

		interestGroup := router.Group("/interests")
		{
			interestGroup.GET("/", controller.GetAllInterest)
			interestGroup.GET("/:user_id", controller.GetStudentInterestsByUserID)
		}

		eduGroup := router.Group("/education")
		{
			eduGroup.GET("/", controller.GetAllEducation)
			eduGroup.GET("/levels", controller.GetAllEducationLevel)
			eduGroup.GET("/:user_id", controller.GetEcudutionByUserID)
			eduGroup.POST("/", controller.CreateEducation)
			eduGroup.PUT("/:user_id", controller.UpdateEducationByUserID)
		}

		userGroup := router.Group("/user")
		{
			userGroup.GET("/:id", controller.GetUserByID)
			userGroup.POST("/image", controller.CreateProfileImage)
			userGroup.PUT("/image/:id", controller.UpdateProfileImage)
			userGroup.GET("/gender", controller.GetAllGender)
			userGroup.GET("/image/:id", controller.GetProfileImageByUserID)
		}

		reviewGroup := router.Group("/reviews")
		{
			reviewGroup.POST("", controller.CreateReview)
			reviewGroup.GET("/company/:company_id", controller.GetReviewsByCompanyID)
			reviewGroup.GET("/student/:student_id", controller.GetReviewsByStudentID)
			reviewGroup.GET("/application/passed/student/:id", controller.GetPassedApplicationsByStudentID)
			reviewGroup.GET("/tags", controller.GetAllTags)
		}

		chatGroup := router.Group("/chat")
		{
			chatGroup.POST("/session", controller.CreateChatSession)

			// 🔄 สร้างห้องแชท
			chatGroup.POST("/room", controller.CreateChatRoom)

			// 📋 ดึงห้องแชททั้งหมดของ user
			chatGroup.GET("/rooms/:user_id", controller.GetChatRoomsByUserID)

			// 🔌 WebSocket เชื่อมต่อ
			// chatGroup.GET("/ws", controller.ChatWebSocket)
		}

		notificationGroup := router.Group("/notification")
		{
			notificationGroup.POST("/interview/send-email/:student_id/:company_id", controller.SendInterviewEmail)
			notificationGroup.GET("/user/:userID", controller.GetNotificationsByUser)
			notificationGroup.PUT("/:id/read", controller.MarkNotificationAsRead)
			notificationGroup.POST("/email/verify-status/:userID", controller.SendVerifyStatusEmail)
			notificationGroup.GET("/calendar/student/:user_id", controller.GetCalendarEventsStudentByUserID)
			notificationGroup.GET("/calendar/company/:user_id", controller.GetCalendarEventsCompanyByUserID)
		}

		companyGroup := router.Group("/company")
		{
			companyGroup.GET("", controller.GetAllCompany)
			companyGroup.GET("/:id", controller.GetCompanyByID)
			companyGroup.POST("", controller.CreateCompany)
			companyGroup.PUT("/logo/:user_id", controller.UpdateCompanyLogoByUserID)
			companyGroup.GET("/user/:user_id", controller.GetCompanyByUserId)
			companyGroup.GET("/verify/:user_id", controller.GetVerifyByUserId)
			companyGroup.POST("/verify/:user_id", controller.CreateSendVerifyCompany)
		}
		academicstaffGroup := router.Group("/academicstaff")
		{
			academicstaffGroup.GET("", controller.GetAllAcademicStaff)
			academicstaffGroup.PUT("/:id", controller.UpdateAcademicStaff)
			academicstaffGroup.GET("/:id", controller.GetAcademicStaffByID)
			academicstaffGroup.POST("", controller.CreateAcademicStaff)
			academicstaffGroup.GET("/user/:user_id", controller.GetAcademicStaffByUserId)
			academicstaffGroup.GET("/verify/:user_id", controller.GetVerifyByUserId)
			academicstaffGroup.POST("/verify/:user_id", controller.CreateSendVerifyAcademicStaffy)
			academicstaffGroup.GET("/student/advisor/:user_id", controller.GetAdviseeStudents)
			academicstaffGroup.GET("/company/advisor/:user_id", controller.GetAdviseeCompanySummary)

		}

		contactGroup := router.Group("/contact")
		{
			contactGroup.POST("", controller.CreateContact)
			contactGroup.GET("/:user_id", controller.GetContactByUserId)
			contactGroup.PUT("/:user_id", controller.UpdateContactByUserID)
		}

		adminGroup := router.Group("/admin")
		{
			adminGroup.GET("/all", controller.GetAllAdmin)
			adminGroup.GET("/user/:id", controller.GetAdminByUserID)
			adminGroup.GET("/:id", controller.GetAdminByID)
			adminGroup.GET("/get-allpost", controller.GetAllInternshipPostsInAdmin)
			adminGroup.GET("/get-post-by-postid/:id", controller.GetInternshipPostsInAdminByIPostID)
		}
		analysisGroup := router.Group("/analysis")
		{
			analysisGroup.GET("/dashboard-summary", analysis.GetAdminStatusSummaries)
			analysisGroup.GET("/dashboard-overview", analysis.GetAdminDashboardOverview)
			analysisGroup.GET("/monthly-application-stats", analysis.GetAdminMonthlyApplicationStats)
			analysisGroup.GET("/recent-activities", analysis.GetAdminRecentActivities)
			analysisGroup.GET("/pending-posts", analysis.GetAdminPendingPosts)
			analysisGroup.GET("/monthly-user-by-role", analysis.GetMonthlyUsersByRole)
			analysisGroup.GET("/users-by-role-series", analysis.GetUsersByRoleSeries)
			analysisGroup.GET("/top-jobs", analysis.GetTopJobs)
			analysisGroup.GET("/popular-companies", analysis.GetPopularCompanies)
		}
		analysisCompanyGroup := router.Group("/analysis/company/:companyId")
		{
			analysisCompanyGroup.GET("/overview", analysis.CompanyOverview)
			analysisCompanyGroup.GET("/trend", analysis.CompanyTrend)
			analysisCompanyGroup.GET("/status-application", analysis.CompanyStatusApplication)
		}
		analysisAcademicGroup := r.Group("/analysis/academic/user/:userId")
		{
			analysisAcademicGroup.GET("/dashboard/overview", analysis.GetAcademicOverview)
			analysisAcademicGroup.GET("/students", analysis.ListAcademicStudents)
			analysisAcademicGroup.GET("/applications", analysis.ListAcademicApplications)
		}
		verifyGroup := r.Group("/verify")
		{
			verifyGroup.GET("", controller.GetAllVerifications)
			verifyGroup.GET("/:id", controller.GetVerificationByID)
			verifyGroup.GET("/status", controller.GetAllStatusVerify)
			verifyGroup.PUT("/update-verify/:id", controller.UpdateVerifyStatus)
		}
		academicGroup := router.Group("/academic")
		{
			academicGroup.GET("all", controller.GetAllAcademicStaff)
		}
	}
	articles := router.Group("/articles")
	{
		articles.GET("", controller.ListArticles)
		articles.POST("", controller.CreateArticle)
		articles.PUT("/:id", controller.UpdateArticle)
		articles.DELETE("/:id", controller.DeleteArticle)
	}

	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	r.Run("localhost:" + PORT)
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
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
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
*/
// func CORSMiddleware() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173") // ✅ ชี้ domain React
// 		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")             // ✅ สำคัญ
// 		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
// 		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")

// 		if c.Request.Method == "OPTIONS" {
// 			c.AbortWithStatus(204)
// 			return
// 		}
// 		c.Next()
// 	}
// }
