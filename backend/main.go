package main

import (
	"github.com/gin-gonic/gin"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/controller"
	"co-op-match.com/co-op-match/middlewares"
)

func main() {
	// เปิดการเชื่อมต่อฐานข้อมูล
	config.ConnectionDB()
	// สร้างตารางและ seed ข้อมูล (ถ้ามี)
	config.SetupDatabase()
	// สร้าง Gin engine
	r := gin.Default()
	controller.InitChatHub()

	r.GET("/ws", controller.ChatWebSocket)
	r.GET("/chat/ws", controller.ChatWebSocket)
	// เพิ่ม CORS Middleware
	r.Use(CORSMiddleware())

	// Group routes (ตัวอย่าง)
	router := r.Group("")
	{
		router.Use(middlewares.Authorizes())

		studentGroup := r.Group("/students")
		{
			studentGroup.GET("", controller.GetAllStudents)
			studentGroup.GET("/:id", controller.GetStudentByID)
		}

		chatGroup := r.Group("/chat")
		{
			chatGroup.POST("/room", controller.CreateChatRoom)
		}

		companyGroup := r.Group("/company")
		{
			companyGroup.POST("", controller.GetAllCompany)
		}
	}

	// รันเซิร์ฟเวอร์ที่พอร์ต 8080
	r.Run(":8000")
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
