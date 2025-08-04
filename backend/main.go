package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/controller"
	"co-op-match.com/co-op-match/controller/role"
	"co-op-match.com/co-op-match/controller/searchjob"
	"co-op-match.com/co-op-match/controller/users"
	"co-op-match.com/co-op-match/middlewares"
)

const PORT = "8000"

func main() {
	config.ConnectionDB()
	config.SetupDatabase()

	r := gin.Default()
	r.Use(CORSMiddleware())
	r.Static("/uploads", "./public/uploads")

	// Public Routes
	r.POST("/sign-up", users.SignUp)
	r.POST("/sign-in", users.SignIn)
	r.POST("/reset-password", users.SimpleResetPassword)
	r.POST("/logout", users.Logout)

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
	r.GET("/interview_appointments/company/:company_id", controller.GetInterviewAppointmentsByCompanyID)

	r.GET("/application_details/student/:id", controller.GetApplicationDetailsByStudentID)
	r.GET("/applications/student/:id", controller.GetApplicationsByStudentID)
	r.GET("/student/user/:user_id", controller.GetStudentByUserID)
	r.GET("/application/:id", controller.GetApplicationByID)
	r.GET("/applications/post/:id", controller.GetApplicationsByIntershipPostID)
	r.PUT("/applications/post/:id", controller.UpdateApplication)
	r.GET("/applications/summary/:companyId", controller.GetTotalApplicationsByCompanyID)

	r.POST("/company/interview_appointments", controller.CreateInterviewAppointment)
	// r.GET("/applications/company/:id", controller.GetInterviewAppointmentByCompanyID)
	r.GET("/applications/company/:id", controller.GetPendingInterviewApplicationsByCompanyID)

	r.Static("/public", "./public")

	// ✅ ย้ายมานอก group เพื่อไม่ใช้ middlewares.Authorizes()
	r.POST("/applications/:id", controller.CreateApplication)

	r.GET("/status_verifies", controller.GetAllStatusVerify)
	r.PATCH("/patch-verify/:id", controller.UpdateVerifyStatus)
	r.PUT("/posts/update-status", controller.UpdateStatusPost)

	// Protected Routes
	router := r.Group("/")
	{
		router.Use(middlewares.Authorizes())

		router.GET("/intership-posts", searchjob.GetAllIntershipPosts)
		router.GET("/students/recommended-posts/:id", controller.GetRecommendedPosts)
		router.GET("/interview_appointments", controller.ListInterviewAppointments)

		studentGroup := router.Group("/students")
		{
			studentGroup.GET("", controller.GetAllStudents)
			studentGroup.POST("", controller.CreateStudent)
			studentGroup.PUT("/:id", controller.UpdateStudent)
			studentGroup.GET("/:id", controller.GetStudentByID)
			studentGroup.GET("user/:user_id", controller.GetStudentByUserID)
			studentGroup.GET("/applications/:user_id", controller.GetApplicationsByUserID)
			studentGroup.GET("/all-active", controller.GetAllActiveStudents)
			studentGroup.GET("/all-deleted", controller.GetAllDeletedStudents)
			studentGroup.DELETE("/delete/:id", controller.DeleteStudent)
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

		chatGroup := router.Group("/chat")
		{
			chatGroup.POST("/room", controller.CreateChatRoom)
		}

		notificationGroup := router.Group("/notification")
		{
			notificationGroup.POST("/interview/send-email/:student_id/:company_id", controller.SendInterviewEmail)
			notificationGroup.GET("/user/:userID", controller.GetNotificationsByUser)
			notificationGroup.PUT("/:id/read", controller.MarkNotificationAsRead)
			notificationGroup.POST("/email/verify-status/:userID", controller.SendVerifyStatusEmail)
			notificationGroup.GET("/calendar/user/:user_id", controller.GetCalendarEventsByUserID)
		}

		companyGroup := router.Group("/company")
		{
			companyGroup.GET("", controller.GetAllCompany)
			companyGroup.POST("", controller.CreateCompany)
			companyGroup.GET("/user/:user_id", controller.GetCompanyByUserId)
			companyGroup.GET("/verify/:user_id", controller.GetVerifyByUserId)
			companyGroup.GET("/all-active", controller.GetAllActiveCompanies)
			companyGroup.GET("/all-deleted", controller.GetAllDeletedCompany)
			companyGroup.DELETE("/delete/:id", controller.DeleteCompany)
			companyGroup.PATCH("/patch-company/:id", controller.UpdateCompany)
		}

		contactGroup := router.Group("/contact")
		{
			contactGroup.POST("", controller.CreateContact)
			contactGroup.GET("/:user_id", controller.GetContactByUserId)
		}
		adminGroup := r.Group("/admin")
		{
			adminGroup.GET("/all", controller.GetAllAdmin)
			adminGroup.GET("/user/:id", controller.GetAdminByUserID)
			adminGroup.GET("/:id", controller.GetAdminByID)
			adminGroup.GET("/all-active", controller.GetAllActiveAdmins)
			adminGroup.GET("/all-deleted", controller.GetAllDeletedAdmins)
			adminGroup.DELETE("/delete/:id", controller.DeleteAdmin)
			adminGroup.GET("/get-allpost", controller.GetAllInternshipPostsInAdmin)
			adminGroup.GET("/get-post-by-postid/:id", controller.GetInternshipPostsInAdminByIPostID)
		}
		verifyGroup := r.Group("/verifications")
		{
			verifyGroup.GET("", controller.GetAllVerifications)
			verifyGroup.GET("/:id", controller.GetVerificationByID)
		}
		academicStaffGroup := r.Group("/academic-staff")
		{
			academicStaffGroup.GET("/all-active", controller.GetAllActiveAcademicStaffs)
			academicStaffGroup.GET("/all-deleted", controller.GetAllDeletedAcademicStaffs)
			academicStaffGroup.DELETE("/delete/:id", controller.DeleteAcademicStaff)
			academicStaffGroup.PATCH("/update/:id", controller.UpdateAcademicStaff)
		}
	}
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	r.Run("localhost:" + PORT)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
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
