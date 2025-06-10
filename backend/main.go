package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/controller"
	"co-op-match.com/co-op-match/controller/role"
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
	// Auth Route
	r.POST("/sign-up", users.SignUp)
	r.POST("/sign-in", users.SignIn)

	// Group routes (ตัวอย่าง)
	router := r.Group("/")
	{
		router.Use(middlewares.Authorizes())

		studentGroup := r.Group("/students")
		{
			studentGroup.GET("/:id", controller.GetStudentByID)
		}
	}
	r.GET("/roles", role.GetAll)
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
