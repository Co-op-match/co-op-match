package controller

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"text/template"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
	"gopkg.in/gomail.v2"
)

// type CreateNotificationRequest struct {
// 	UserID uint                   `json:"user_id" binding:"required"`
// 	Name   string                 `json:"name" binding:"required"` // ใช้ Name เป็น TypeKey
// 	Data   map[string]interface{} `json:"data"`
// 	Email  string                 `json:"email"` // <-- เพิ่ม email (optional)
// }
// // โหลด HTML template แล้วแทนค่าข้อความ message
// func renderEmailHTMLTemplate(message string) (string, error) {
// 	path := filepath.Join("utils", "email_template.html")
// 	file, err := os.ReadFile(path)
// 	if err != nil {
// 		return "", err
// 	}

// 	tmpl, err := template.New("email").Parse(string(file))
// 	if err != nil {
// 		return "", err
// 	}

// 	data := struct {
// 		Message string
// 	}{
// 		Message: message,
// 	}

// 	var buf bytes.Buffer
// 	if err := tmpl.Execute(&buf, data); err != nil {
// 		return "", err
// 	}

// 	return buf.String(), nil
// }
// // สร้าง Notification ใหม่ (พร้อมส่ง email ถ้ามี)
// func CreateNotification(c *gin.Context) {
// 	var input CreateNotificationRequest

// 	if err := c.ShouldBindJSON(&input); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}

// 	// ดึง NotificationsType จาก Name
// 	var notiType entity.NotificationsType
// 	if err := config.DB().Where("name = ?", input.Name).First(&notiType).Error; err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification type"})
// 		return
// 	}

// 	// Template parse (message ธรรมดา)
// 	message, err := utils.ParseTemplate(notiType.Label, input.Data)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Template parse error: " + err.Error()})
// 		return
// 	}

// 	// บันทึก Notification ใน DB
// 	notification := entity.Notification{
// 		Title:               input.Name,
// 		Message:             message,
// 		Read:                false,
// 		UserID:              input.UserID,
// 		NotificationsTypeID: notiType.ID,
// 	}

// 	if err := config.DB().Create(&notification).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	// ถ้ามี Email ให้ส่ง email ด้วย
// 	if input.Email != "" {
// 		// ดึง HTML Template
// 		htmlBody, err := renderEmailHTMLTemplate(message)
// 		if err != nil {
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "HTML template parse error: " + err.Error()})
// 			return
// 		}

// 		if err := sendEmail(input.Email, "Notification: "+input.Name, htmlBody); err != nil {
// 			c.JSON(http.StatusOK, gin.H{
// 				"notification": notification,
// 				"email_error":  err.Error(),
// 			})
// 			return
// 		}
// 	}

// 	// สำเร็จ
// 	c.JSON(http.StatusCreated, notification)
// }

func SendInterviewEmail(c *gin.Context) {
	studentID := c.Param("student_id")
	companyID := c.Param("company_id")

	db := config.DB()

	// 1. ดึงนัดสัมภาษณ์ตาม student_id และ company_id
	var appointment entity.InterviewAppointment
	if err := db.
		Preload("Company.User").
		Preload("Student.User").
		Where("student_id = ? AND company_id = ?", studentID, companyID).
		First(&appointment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนัดสัมภาษณ์ที่ตรงกับ student_id และ company_id"})
		return
	}

	// 2. ดึง status จากตาราง application ที่เชื่อมกับ student_id และ company_id
	var application entity.Application
	if err := db.
		Joins("JOIN application_details ON application_details.application_id = applications.id").
		Joins("JOIN intership_posts ON applications.intership_post_id = intership_posts.id").
		Where("application_details.student_id = ? AND intership_posts.company_id = ?", studentID, companyID).
		First(&application).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลการสมัครที่ตรงกับ student และบริษัท"})
		return
	}

	logoBase64 := "data:image/png;base64," + getLogoBase64()

	// 3. ส่งสถานะ application.Status ไปสร้าง email template
	body, err := buildEmailBody(appointment, logoBase64, application.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดขณะสร้างเนื้อหาอีเมล: " + err.Error()})
		return
	}

	// 4. ส่งอีเมล
	err = sendEmail(
		appointment.Student.User.Email,
		"แจ้งเตือนนัดสัมภาษณ์จากระบบ Co-op Match",
		body,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถส่งอีเมล: " + err.Error()})
		return
	}

	// 5. ส่ง response กลับ
	c.JSON(http.StatusOK, gin.H{
		"message": "ส่งอีเมลแจ้งเตือนนัดสัมภาษณ์เรียบร้อยแล้ว",
		"appointment": gin.H{
			"id":               appointment.ID,
			"appointment_date": appointment.AppointmentDate.Format("2006-01-02 15:04"),
			"status":           application.Status, // 👈 ใช้ status จาก application
			"mode":             appointment.Mode,
			"details":          appointment.Details,
		},
		"student": gin.H{
			"id":         appointment.Student.ID,
			"first_name": appointment.Student.FirstName,
			"last_name":  appointment.Student.LastName,
			"email":      appointment.Student.User.Email,
		},
		"company": gin.H{
			"id":           appointment.Company.ID,
			"company_name": appointment.Company.CompanyName,
			"email":        appointment.Company.User.Email,
		},
	})
}

// ฟังก์ชันย่อย: สร้างเนื้อหาอีเมลจาก template
func buildEmailBody(appointment entity.InterviewAppointment, logoBase64 string, status string) (string, error) {
	var tmplPath string

	fmt.Println("application.Status: ", status)
	// ตรวจสอบสถานะเพื่อเลือก template
	switch status {
	case "ผ่าน", "ไม่ผ่าน":
		tmplPath = "utils/email_template_interview_result.html"
	default:
		tmplPath = "utils/email_template_interview.html"
	}

	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return "", err
	}

	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		return "", err
	}
	scheduleTime := appointment.AppointmentDate.In(loc)

	// แปลงเดือนเป็นภาษาไทย
	thaiMonths := [...]string{
		"", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
		"กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
	}
	formattedDate := fmt.Sprintf("%02d %s %d เวลา %02d:%02d",
		scheduleTime.Day(),
		thaiMonths[int(scheduleTime.Month())],
		scheduleTime.Year(),
		scheduleTime.Hour(),
		scheduleTime.Minute(),
	)

	data := map[string]interface{}{
		"LogoBase64":     logoBase64,
		"RecipientName":  appointment.Student.FirstName + " " + appointment.Student.LastName,
		"Title":          "นัดสัมภาษณ์งานจากบริษัท " + appointment.Company.CompanyName,
		"Message":        appointment.Details,
		"Status":         status, // 👈 เปลี่ยนเป็น status ที่รับเข้ามา
		"Company":        appointment.Company.CompanyName,
		"Position":       "ตำแหน่งที่คุณสมัคร",
		"Schedule":       formattedDate,
		"ActionURL":      "https://coopmatch.example/interview/",
		"PrivacyURL":     "https://coopmatch.example/privacy",
		"TermsURL":       "https://coopmatch.example/terms",
		"UnsubscribeURL": "https://coopmatch.example/unsubscribe",
	}

	var body bytes.Buffer
	if err := tmpl.Execute(&body, data); err != nil {
		return "", err
	}

	return body.String(), nil
}

func sendEmail(to, subject, body string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", "coopmatch4@gmail.com")
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer("smtp.gmail.com", 587, "coopmatch4@gmail.com", "vzyb vdiz kdgc klzv")

	return d.DialAndSend(m)
}

// ฟังก์ชันย่อย: โหลด logo เป็น base64
func getLogoBase64() string {
	path := "static/logo.png" // ปรับ path ตามโปรเจกต์
	file, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return base64.StdEncoding.EncodeToString(file)
}

// ดึง Notification ตาม user id
func GetNotificationsByUser(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid userID"})
		return
	}

	var notifications []entity.Notification
	if err := config.DB().Preload("NotificationsType").Where("user_id = ?", userID).Order("created_at desc").Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

// อัปเดตสถานะว่าอ่านแล้ว
func MarkNotificationAsRead(c *gin.Context) {
	notificationIDStr := c.Param("id")
	notificationID, err := strconv.Atoi(notificationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	var notification entity.Notification
	if err := config.DB().First(&notification, notificationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	notification.Read = true
	if err := config.DB().Save(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notification)
}

func SendVerifyStatusEmail(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// 1. ดึงข้อมูล User และ Company ที่เกี่ยวข้อง
	var company entity.Company
	if err := config.DB().
		Preload("User").
		Where("user_id = ?", userID).
		First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลบริษัทของผู้ใช้นี้"})
		return
	}

	// 2. ดึง Verify ล่าสุดจาก user_id
	var latestVerify entity.Verify
	if err := config.DB().
		Preload("StatusVerify").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		First(&latestVerify).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบสถานะการยืนยันล่าสุด"})
		return
	}

	// 3. เตรียมข้อความและไอคอนตามสถานะ
	status := latestVerify.StatusVerify.StatusVerify

	// 4. โหลดโลโก้
	logoBase64 := "data:image/png;base64," + getLogoBase64()

	// 5. เตรียมข้อมูลส่งเข้า template
	data := map[string]interface{}{
		"LogoBase64":     logoBase64,
		"RecipientName":  company.CompanyName,
		"Status":         status,
		"Company":        company.CompanyName,
		"ActionURL":      "https://coopmatch.example/company/dashboard",
		"PrivacyURL":     "https://coopmatch.example/privacy",
		"TermsURL":       "https://coopmatch.example/terms",
		"UnsubscribeURL": "https://coopmatch.example/unsubscribe",
	}

	// 6. โหลดและประมวลผล HTML Template
	tmpl, err := template.ParseFiles("utils/email_template_Verify.html")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถโหลด template: " + err.Error()})
		return
	}

	var body bytes.Buffer
	if err := tmpl.Execute(&body, data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถ render template: " + err.Error()})
		return
	}

	// 7. ส่งอีเมลจริง
	if err := sendEmail(
		company.User.Email,
		"แจ้งสถานะการยืนยันบริษัทจากระบบ Co-op Match",
		body.String(),
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ส่งอีเมลล้มเหลว: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ส่งอีเมลแจ้งสถานะการยืนยันบริษัทเรียบร้อยแล้ว",
		"email":   company.User.Email,
		"status":  status,
	})

}

func GetCalendarEventsByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	// 1. หานักเรียนจาก user_id
	var student entity.Student
	if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักเรียนที่ตรงกับ user_id นี้"})
		return
	}

	// 2. หา InterviewAppointment จาก student.ID
	var interviews []entity.InterviewAppointment
	if err := config.DB().Preload("Company").Where("student_id = ?", student.ID).Find(&interviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลนัดสัมภาษณ์ไม่สำเร็จ"})
		return
	}

	// 3. สร้าง response struct (ไม่มี type)
	type CalendarEvent struct {
		Date    string `json:"date"`
		Content string `json:"content"`
	}

	var events []CalendarEvent
	for _, i := range interviews {
		events = append(events, CalendarEvent{
			Date:    i.AppointmentDate.Format("2006-01-02"),
			Content: "นัดสัมภาษณ์กับ " + i.Company.CompanyName,
		})
	}

	// 4. ส่งออก
	c.JSON(http.StatusOK, events)
}
