package controller

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"text/template"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"co-op-match.com/co-op-match/hub/notifyhub"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gopkg.in/gomail.v2"
	"gorm.io/gorm"
)

func InitNotiHub() { go notifyhub.H.Run() }

var notifyUpgrader = websocket.Upgrader{
	// โปรดักชัน: จำกัด Origin ให้ชัดเจน
	CheckOrigin: func(r *http.Request) bool { return true },
}

// controller/xxx.go  (helpers)
func CreateNotificationForUser(db *gorm.DB, userID uint, typeName, title, message string, labelIfCreate ...string) error {
	if db == nil {
		db = config.DB()
	}

	var user entity.User
	if err := db.First(&user, userID).Error; err != nil {
		return err
	}

	lbl := ""
	if len(labelIfCreate) > 0 {
		lbl = labelIfCreate[0]
	}

	nt, err := getOrCreateNotificationsType(db, typeName, lbl)
	if err != nil {
		return err
	}

	noti := entity.Notification{
		Title:               title,
		Message:             message,
		Read:                false,
		UserID:              userID,
		NotificationsTypeID: nt.ID,
	}
	if err := db.Create(&noti).Error; err != nil {
		return err
	}

	// 🟢 ส่ง WS: created + count
	notifyhub.H.NotifyCreated(noti.UserID, noti.ID, noti.Title, noti.Message, nt.Name, noti.CreatedAt, noti.Read)

	var count int64
	_ = db.Model(&entity.Notification{}).
		Where("user_id = ? AND read = ?", noti.UserID, false).
		Count(&count).Error
	notifyhub.H.NotifyCount(noti.UserID, int(count))

	return nil
}

// ---------------- WebSocket ----------------

func NotificationsWebSocket(c *gin.Context) {
	uidStr := c.Query("user_id")
	uid, _ := strconv.Atoi(uidStr)
	log.Printf("[WS] register uid=%d hub=%p", uid, notifyhub.H)
	if uid <= 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid user_id"})
		return
	}

	conn, err := notifyUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &notifyhub.Client{
		UserID: uint(uid),
		Conn:   conn,
		Send:   make(chan []byte, 16),
		Hub:    notifyhub.H,
	}
	notifyhub.H.Register(client)
	go client.WritePump()

	// ✅ ยิง bootstrap กลับไปทันทีหลัง register
	go func(uid uint) {
		// optional hello
		notifyhub.H.EmitToUser(uid, "ws.hello", map[string]any{
			"ts": time.Now().Format(time.RFC3339),
		})
		// ส่ง count ปัจจุบัน
		var cnt int64
		_ = config.DB().
			Model(&entity.Notification{}).
			Where("user_id = ? AND read = ?", uid, false).
			Count(&cnt).Error
		notifyhub.H.NotifyCount(uid, int(cnt))
	}(uint(uid))

	// รอปิด
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			notifyhub.H.Unregister(client)
			break
		}
	}
}

// ---------------- Email: นัดสัมภาษณ์ ----------------

func SendInterviewEmail(c *gin.Context) {
	studentID := c.Param("student_id")
	companyID := c.Param("company_id")

	db := config.DB()

	// 1) ดึงนัดสัมภาษณ์
	var appointment entity.InterviewAppointment
	if err := db.
		Preload("Company.User").
		Preload("Student.User").
		Where("student_id = ? AND company_id = ?", studentID, companyID).
		First(&appointment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนัดสัมภาษณ์ที่ตรงกับ student_id และ company_id"})
		return
	}

	// 2) ดึงสถานะจาก application
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

	// 3) ประกอบ template
	body, err := buildEmailBody(appointment, logoBase64, application.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดขณะสร้างเนื้อหาอีเมล: " + err.Error()})
		return
	}

	// 4) ส่งอีเมล
	if err := sendEmail(
		appointment.Student.User.Email,
		"แจ้งเตือนนัดสัมภาษณ์จากระบบ Co-op Match",
		body,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถส่งอีเมล: " + err.Error()})
		return
	}

	// 4.1) บันทึก Notification + ยิง WS
	loc, _ := time.LoadLocation("Asia/Bangkok")

	title := "นัดสัมภาษณ์จาก " + appointment.Company.CompanyName
	msg := "วัน-เวลา: " + appointment.AppointmentDate.In(loc).Format("2006-01-02 15:04") + "\nรายละเอียด: " + appointment.Details

	if err := CreateNotificationForUser(
		db,
		appointment.Student.User.ID,
		"interview", // typeName
		title,
		msg,
		"การนัดสัมภาษณ์", // label (ถ้ายังไม่มี type จะถูกสร้างพร้อม label นี้)
	); err != nil {
		log.Printf("[NOTI] ❌ create failed user=%d err=%v", appointment.Student.User.ID, err)
	} else {
		log.Printf("[NOTI] ✅ created user=%d type=%s title=%q",
			appointment.Student.User.ID, "interview", title)

		// (A) นับ unread ปัจจุบัน + ส่ง count ให้ทุกแท็บ + log
		var cnt int64
		if err := db.Model(&entity.Notification{}).
			Where("user_id = ? AND read = ?", appointment.Student.User.ID, false).
			Count(&cnt).Error; err != nil {
			log.Printf("[NOTI] count unread error user=%d err=%v", appointment.Student.User.ID, err)
		} else {
			notifyhub.H.NotifyCount(appointment.Student.User.ID, int(cnt))
			log.Printf("[NOTI] unread=%d user=%d", cnt, appointment.Student.User.ID)
		}

		// (B) log จำนวน WS connections ต่อ user (debug ง่ายว่ามีแท็บไหนฟังอยู่บ้าง)
		stats := notifyhub.H.Stats() // map[userID]connections
		log.Printf("[WS] live clients: %#v", stats)
	}

	// 5) Response
	c.JSON(http.StatusOK, gin.H{
		"message": "ส่งอีเมลแจ้งเตือนนัดสัมภาษณ์เรียบร้อยแล้ว",
		"appointment": gin.H{
			"id":               appointment.ID,
			"appointment_date": appointment.AppointmentDate.Format("2006-01-02 15:04"),
			"status":           application.Status,
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

// ---------------- Email: Verify Status (บริษัท/อาจารย์) ----------------

func SendVerifyStatusEmail(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	db := config.DB()

	// 1) Verify ล่าสุด
	var latestVerify entity.Verify
	if err := db.
		Preload("StatusVerify").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		First(&latestVerify).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบสถานะการยืนยันล่าสุด"})
		return
	}
	status := latestVerify.StatusVerify.StatusVerify

	// 2) หา Company ก่อน
	var company entity.Company
	errCompany := db.Preload("User").Where("user_id = ?", userID).First(&company).Error

	// 3) ถ้าไม่เจอ Company -> หา AcademicStaff
	var staff entity.AcademicStaff
	var errStaff error
	if errCompany != nil {
		errStaff = db.Preload("User").Where("user_id = ?", userID).First(&staff).Error
	}

	if errCompany != nil && errStaff != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัทหรืออาจารย์ของผู้ใช้นี้"})
		return
	}

	var (
		role           string // "company" | "academic_staff"
		recipientEmail string
		recipientName  string
		entityName     string
		subject        string
		actionURL      string
		userIDForNoti  uint
		tmplFile       string
	)

	if errCompany == nil {
		role = "company"
		recipientEmail = company.User.Email
		recipientName = company.CompanyName
		entityName = company.CompanyName
		actionURL = "https://coopmatch.example/company/dashboard"
		tmplFile = "utils/email_template_Verify.html"
		userIDForNoti = company.User.ID
	} else {
		role = "academic_staff"
		recipientEmail = staff.User.Email
		recipientName = staff.FirstName + " " + staff.LastName

		// ✅ ใช้ NameTH จากความสัมพันธ์
		uni := staff.University.NameTH
		fac := staff.Faculty.NameTH
		dept := staff.Program.NameTH // ใช้ Program เป็น "ภาควิชา/แผนก" แทน Department

		switch {
		case uni != "":
			entityName = uni
		case fac != "":
			entityName = fac
		case dept != "":
			entityName = dept
		default:
			entityName = "บัญชีอาจารย์"
		}

		actionURL = "https://coopmatch.example/academic/dashboard"
		tmplFile = "utils/email_template_Verify_Academic.html"
		userIDForNoti = staff.User.ID
	}

	switch status {
	case "รับรอง":
		if role == "company" {
			subject = "ยืนยันผล: บริษัทของคุณได้รับการรับรอง (Co-op Match)"
		} else {
			subject = "ยืนยันผล: บัญชีอาจารย์ของท่านได้รับการรับรอง (Co-op Match)"
		}
	case "ปฏิเสธ":
		if role == "company" {
			subject = "แจ้งผล: บริษัทของคุณไม่ได้รับการรับรอง (Co-op Match)"
		} else {
			subject = "แจ้งผล: บัญชีอาจารย์ของท่านไม่ได้รับการรับรอง (Co-op Match)"
		}
	case "รอรับรอง":
		if role == "company" {
			subject = "อยู่ระหว่างตรวจสอบคำขอรับรองบริษัท (Co-op Match)"
		} else {
			subject = "อยู่ระหว่างตรวจสอบคำขอรับรองบัญชีอาจารย์ (Co-op Match)"
		}
	default:
		subject = "แจ้งสถานะการยืนยันบัญชีจากระบบ Co-op Match"
	}

	logoBase64 := "data:image/png;base64," + getLogoBase64()

	data := map[string]interface{}{
		"LogoBase64":     logoBase64,
		"RecipientName":  recipientName,
		"Status":         status,
		"Company":        entityName,
		"ActionURL":      actionURL,
		"PrivacyURL":     "https://coopmatch.example/privacy",
		"TermsURL":       "https://coopmatch.example/terms",
		"UnsubscribeURL": "https://coopmatch.example/unsubscribe",

		// ใช้เฉพาะฝั่งอาจารย์ (template จะ ignore ถ้าไม่ได้อ้างถึง)
		"University": staff.University.NameTH,
		"Faculty":    staff.Faculty.NameTH,
		"Department": staff.Program.NameTH, // map Program → Department เพื่อไม่ต้องแก้ template
	}

	tmpl, err := template.ParseFiles(tmplFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถโหลด template: " + err.Error()})
		return
	}
	var body bytes.Buffer
	if err := tmpl.Execute(&body, data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถ render template: " + err.Error()})
		return
	}

	if err := sendEmail(recipientEmail, subject, body.String()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ส่งอีเมลล้มเหลว: " + err.Error()})
		return
	}

	// Notification + WS
	var notiTitle string
	if role == "company" {
		notiTitle = "สถานะการยืนยันบริษัท: " + status
	} else {
		notiTitle = "สถานะการยืนยันบัญชีอาจารย์: " + status
	}
	notiMsg := "สถานะล่าสุดของคุณคือ \"" + status + "\" (" + entityName + ")"

	_ = CreateNotificationForUser(
		db,
		userIDForNoti,
		"verify",
		notiTitle,
		notiMsg,
		"การยืนยันบัญชี",
	)

	c.JSON(http.StatusOK, gin.H{
		"message":  "ส่งอีเมลแจ้งสถานะการยืนยันเรียบร้อยแล้ว",
		"email":    recipientEmail,
		"status":   status,
		"role":     role,
		"receiver": recipientName,
		"entity":   entityName,
	})
}

// ---------------- REST: Get + Mark Read ----------------

func GetNotificationsByUser(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid userID"})
		return
	}

	var notifications []entity.Notification
	if err := config.DB().
		Preload("NotificationsType").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, notifications)
}

func MarkNotificationAsRead(c *gin.Context) {
	notificationIDStr := c.Param("id")
	notificationID, err := strconv.Atoi(notificationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	db := config.DB()

	var notification entity.Notification
	if err := db.First(&notification, notificationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	notification.Read = true
	if err := db.Save(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ✅ Emit WS ให้ sync UI ทุกแท็บ + อัปเดต count
	notifyhub.H.NotifyRead(notification.UserID, notification.ID)

	var count int64
	_ = db.Model(&entity.Notification{}).
		Where("user_id = ? AND read = ?", notification.UserID, false).
		Count(&count).Error
	notifyhub.H.NotifyCount(notification.UserID, int(count))

	c.JSON(http.StatusOK, notification)
}

func getLogoBase64() string {
	path := "static/logo.png"
	file, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return base64.StdEncoding.EncodeToString(file)
}
func buildEmailBody(appointment entity.InterviewAppointment, logoBase64 string, status string) (string, error) {
	var tmplPath string

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
		"Status":         status,
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

// ============================ Verify Status Email ============================
// func SendVerifyStatusEmail(c *gin.Context) {
// 	userIDStr := c.Param("userID")
// 	userID, err := strconv.Atoi(userIDStr)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
// 		return
// 	}
// 	db := config.DB()

// 	// 1) ดึง Verify ล่าสุดตาม user_id (ใช้ร่วมทั้งบริษัท/อาจารย์)
// 	var latestVerify entity.Verify
// 	if err := db.
// 		Preload("StatusVerify").
// 		Where("user_id = ?", userID).
// 		Order("created_at DESC").
// 		First(&latestVerify).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบสถานะการยืนยันล่าสุด"})
// 		return
// 	}
// 	status := latestVerify.StatusVerify.StatusVerify

// 	// 2) พยายามหา Company ก่อน
// 	var company entity.Company
// 	errCompany := db.Preload("User").Where("user_id = ?", userID).First(&company).Error

// 	// 3) ถ้าไม่เจอ Company ให้ลองหา AcademicStaff
// 	var staff entity.AcademicStaff
// 	errStaff := error(nil)
// 	if errCompany != nil {
// 		errStaff = db.Preload("User").Where("user_id = ?", userID).First(&staff).Error
// 	}

// 	if errCompany != nil && errStaff != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัทหรืออาจารย์ของผู้ใช้นี้"})
// 		return
// 	}

// 	// 4) เตรียมข้อมูลตามชนิดผู้รับ
// 	var (
// 		role           string // "company" | "academic_staff"
// 		recipientEmail string
// 		recipientName  string
// 		entityName     string // จะ map เข้า key ".Company" ใน template
// 		subject        string
// 		actionURL      string
// 		userIDForNoti  uint
// 		tmplFile       string
// 	)

// 	if errCompany == nil {
// 		// ผู้รับ: บริษัท
// 		role = "company"
// 		recipientEmail = company.User.Email
// 		recipientName = company.CompanyName
// 		entityName = company.CompanyName
// 		actionURL = "https://coopmatch.example/company/dashboard"
// 		tmplFile = "utils/email_template_Verify.html"
// 		userIDForNoti = company.User.ID
// 	} else {
// 		// ผู้รับ: อาจารย์
// 		role = "academic_staff"
// 		recipientEmail = staff.User.Email
// 		recipientName = staff.FirstName + " " + staff.LastName
// 		// ใช้สังกัดที่เหมาะสมแสดงแทนชื่อบริษัท
// 		if staff.University != "" {
// 			entityName = staff.University
// 		} else if staff.Faculty != "" {
// 			entityName = staff.Faculty
// 		} else {
// 			entityName = "บัญชีอาจารย์"
// 		}
// 		actionURL = "https://coopmatch.example/academic/dashboard"
// 		tmplFile = "utils/email_template_Verify_Academic.html" // ← เทมเพลตสำหรับอาจารย์
// 		userIDForNoti = staff.User.ID
// 	}

// 	// 5) สร้าง subject ที่อ่านรู้เรื่องตาม status + role
// 	switch status {
// 	case "รับรอง":
// 		if role == "company" {
// 			subject = "ยืนยันผล: บริษัทของคุณได้รับการรับรอง (Co-op Match)"
// 		} else {
// 			subject = "ยืนยันผล: บัญชีอาจารย์ของท่านได้รับการรับรอง (Co-op Match)"
// 		}
// 	case "ปฏิเสธ":
// 		if role == "company" {
// 			subject = "แจ้งผล: บริษัทของคุณไม่ได้รับการรับรอง (Co-op Match)"
// 		} else {
// 			subject = "แจ้งผล: บัญชีอาจารย์ของท่านไม่ได้รับการรับรอง (Co-op Match)"
// 		}
// 	case "รอรับรอง":
// 		if role == "company" {
// 			subject = "อยู่ระหว่างตรวจสอบคำขอรับรองบริษัท (Co-op Match)"
// 		} else {
// 			subject = "อยู่ระหว่างตรวจสอบคำขอรับรองบัญชีอาจารย์ (Co-op Match)"
// 		}
// 	default:
// 		subject = "แจ้งสถานะการยืนยันบัญชีจากระบบ Co-op Match"
// 	}

// 	// 6) เตรียม data สำหรับเทมเพลต
// 	logoBase64 := "data:image/png;base64," + getLogoBase64()

// 	// หมายเหตุ: ถ้าคุณมี field "Reason" ใน entity.Verify ให้ map ใส่ไปด้วยได้:
// 	// reason := latestVerify.Reason  // <-- ปรับตามชื่อฟิลด์จริงของคุณ
// 	data := map[string]interface{}{
// 		"LogoBase64":     logoBase64,
// 		"RecipientName":  recipientName,
// 		"Status":         status,
// 		"Company":        entityName, // key เดิมในเทมเพลต: บริษัท/สังกัด
// 		"ActionURL":      actionURL,
// 		"PrivacyURL":     "https://coopmatch.example/privacy",
// 		"TermsURL":       "https://coopmatch.example/terms",
// 		"UnsubscribeURL": "https://coopmatch.example/unsubscribe",

// 		// ถ้าคุณต้องการแสดงรายละเอียดอาจารย์เพิ่มเติมในเทมเพลต สามารถเปิดใช้ได้
// 		"AcademicPosition": staff.AcademicPosition,
// 		"Faculty":          staff.Faculty,
// 		"Department":       staff.Department,
// 		"University":       staff.University,
// 		// "Reason":           reason, // เปิดใช้เมื่อมีฟิลด์ใน Verify
// 	}

// 	// 7) Render เทมเพลตตาม role
// 	tmpl, err := template.ParseFiles(tmplFile)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถโหลด template: " + err.Error()})
// 		return
// 	}
// 	var body bytes.Buffer
// 	if err := tmpl.Execute(&body, data); err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถ render template: " + err.Error()})
// 		return
// 	}

// 	// 8) ส่งอีเมล
// 	if err := sendEmail(recipientEmail, subject, body.String()); err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ส่งอีเมลล้มเหลว: " + err.Error()})
// 		return
// 	}

// 	// 9) สร้าง Notification (type: verify) + (ถ้ามี WS จะเด้ง real-time)
// 	var notiTitle string
// 	if role == "company" {
// 		notiTitle = "สถานะการยืนยันบริษัท: " + status
// 	} else {
// 		notiTitle = "สถานะการยืนยันบัญชีอาจารย์: " + status
// 	}
// 	notiMsg := "สถานะล่าสุดของคุณคือ \"" + status + "\" (" + entityName + ")"

// 	_ = CreateNotificationForUser(
// 		db,
// 		userIDForNoti,
// 		"verify",
// 		notiTitle,
// 		notiMsg,
// 		"การยืนยันบัญชี",
// 	)

// 	// 10) ส่ง response กลับ
// 	c.JSON(http.StatusOK, gin.H{
// 		"message":  "ส่งอีเมลแจ้งสถานะการยืนยันเรียบร้อยแล้ว",
// 		"email":    recipientEmail,
// 		"status":   status,
// 		"role":     role,
// 		"receiver": recipientName,
// 		"entity":   entityName,
// 	})
// }

// ============================ Notifications API ============================

// --------- (optional) ให้ frontend ยิงตรงเพื่อสร้าง notification ---------

type CreateNotificationRequest struct {
	Title               string `json:"title" binding:"required"`
	Message             string `json:"message" binding:"required"`
	UserID              uint   `json:"user_id" binding:"required"`
	NotificationsTypeID uint   `json:"notifications_type_id,omitempty"`
	TypeName            string `json:"type_name,omitempty"`
	Label               string `json:"label,omitempty"`
}

func CreateNotification(c *gin.Context) {
	var req CreateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	db := config.DB()

	// ยืนยัน user
	var user entity.User
	if err := db.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบผู้ใช้ตาม user_id"})
		return
	}

	// หา/สร้าง type
	var typeID uint
	if req.NotificationsTypeID != 0 {
		var nt entity.NotificationsType
		if err := db.First(&nt, req.NotificationsTypeID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ notifications_type ตาม ID"})
			return
		}
		typeID = nt.ID
	} else {
		if req.TypeName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ต้องระบุ notifications_type_id หรือ type_name อย่างน้อยหนึ่งอย่าง"})
			return
		}
		nt, err := getOrCreateNotificationsType(db, req.TypeName, req.Label)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเตรียมประเภทการแจ้งเตือน: " + err.Error()})
			return
		}
		typeID = nt.ID
	}

	// สร้าง noti
	noti := entity.Notification{
		Title:               req.Title,
		Message:             req.Message,
		Read:                false,
		UserID:              req.UserID,
		NotificationsTypeID: typeID,
	}
	if err := db.Create(&noti).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกการแจ้งเตือนล้มเหลว: " + err.Error()})
		return
	}

	// preload type เพื่อส่งกลับ
	_ = db.Preload("NotificationsType").First(&noti, noti.ID)

	// Emit WS "notification.created"
	// ws.H.EmitToUser(noti.UserID, ws.Event{
	// 	Type: "notification.created",
	// 	Data: map[string]interface{}{
	// 		"id":         noti.ID,
	// 		"title":      noti.Title,
	// 		"message":    noti.Message,
	// 		"read":       noti.Read,
	// 		"user_id":    noti.UserID,
	// 		"type":       noti.NotificationsTypeID,
	// 		"created_at": noti.CreatedAt,
	// 	},
	// })

	c.JSON(http.StatusCreated, noti)
}

// ============================ Calendar Events ============================

func GetCalendarEventsStudentByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	var student entity.Student
	if err := config.DB().Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบนักเรียนที่ตรงกับ user_id นี้"})
		return
	}

	var interviews []entity.InterviewAppointment
	if err := config.DB().Preload("Company").Where("student_id = ?", student.ID).Find(&interviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลนัดสัมภาษณ์ไม่สำเร็จ"})
		return
	}

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
	c.JSON(http.StatusOK, events)
}

func GetCalendarEventsCompanyByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	var company entity.Company
	if err := config.DB().Where("user_id = ?", userID).First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบcompanyที่ตรงกับ user_id นี้"})
		return
	}

	var interviews []entity.InterviewAppointment
	// แก้ไข: ใช้ company_id แทน student_id
	if err := config.DB().Preload("Student").Where("company_id = ?", company.ID).Find(&interviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลนัดสัมภาษณ์ไม่สำเร็จ"})
		return
	}

	type CalendarEvent struct {
		Date    string `json:"date"`
		Content string `json:"content"`
	}

	var events []CalendarEvent
	for _, i := range interviews {
		events = append(events, CalendarEvent{
			Date:    i.AppointmentDate.Format("2006-01-02"),
			Content: "นัดสัมภาษณ์กับ " + i.Student.FirstName + " " + i.Student.LastName,
		})
	}
	c.JSON(http.StatusOK, events)
}

// ============================ Notification Helpers ============================

func getOrCreateNotificationsType(db *gorm.DB, name string, label string) (*entity.NotificationsType, error) {
	var nt entity.NotificationsType
	if err := db.Where("name = ?", name).First(&nt).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			nt = entity.NotificationsType{
				Name:  name,
				Label: coalesce(label, name),
			}
			if err := db.Create(&nt).Error; err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	return &nt, nil
}

func coalesce(s string, fallback string) string {
	if s != "" {
		return s
	}
	return fallback
}
