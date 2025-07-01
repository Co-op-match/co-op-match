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
	// เปิดการเชื่อมต่อฐานข้อมูล
	config.ConnectionDB()

	// สร้างตารางและ seed ข้อมูล (ถ้ามี)
	config.SetupDatabase()

	// สร้าง Gin engine
	r := gin.Default()

	// เพิ่ม CORS Middleware
	r.Use(CORSMiddleware())
	r.Static("/uploads", "./public/uploads")
	// Auth Route
	r.POST("/sign-up", users.SignUp)
	r.POST("/sign-in", users.SignIn)
	r.POST("/reset-password", users.SimpleResetPassword)

	r.GET("/roles", role.GetAll)
	r.GET("/provinces", searchjob.GetAllProvinces)
	r.GET("/jobtypes", searchjob.GetAllJobTypes)
	r.GET("/stipends", searchjob.GetAllStipends)
	r.GET("/workdays", searchjob.GetAllWorkDays)
	r.GET("/workmodes", searchjob.GetAllWorkModes)
	r.GET("/benefits", searchjob.GetAllBenefits)
	r.GET("/universities", controller.GetUniversities)
	r.GET("/status_verifies", controller.GetAllStatusVerify)
	// Group routes (ตัวอย่าง)
	router := r.Group("/")
	{
		router.Use(middlewares.Authorizes())
		router.GET("/intership-posts", searchjob.GetAllIntershipPosts)

		studentGroup := router.Group("/students")
		{
			studentGroup.GET("", controller.GetAllStudents)
			studentGroup.POST("", controller.CreateStudent)
			studentGroup.PUT("/:id", controller.UpdateStudent)
			studentGroup.GET("/:id", controller.GetStudentByID)
			studentGroup.GET("user/:user_id", controller.GetStudentByUserID)
			studentGroup.GET("users", controller.GetAllUser)
		}
		addressGroup := router.Group("/address")
		{
			addressGroup.GET("/", controller.GetAllAdress)
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
			notificationGroup.POST("/interview/send-email/:id", controller.SendInterviewEmail) // <-- ครอบคลุมทั้งสร้าง notification + ส่ง email ในตัว
			notificationGroup.GET("/user/:userID", controller.GetNotificationsByUser)
			notificationGroup.PUT("/:id/read", controller.MarkNotificationAsRead)
		}

		companyGroup := router.Group("/company")
		{
			companyGroup.GET("", controller.GetAllCompany)
		}
		adminGroup := r.Group("/admin")
		{
			adminGroup.GET("/all", controller.GetAllAdmin)
			adminGroup.GET("/user/:id", controller.GetAdminByUserID)
			adminGroup.GET("/:id", controller.GetAdminByID)
		}
	}
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})
	// Run the server
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
