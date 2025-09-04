package controller

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"os"
	"strconv"
	"strings"
	"sync"
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


/* =========================
   Template cache
========================= */

var (
	tplOnce       sync.Once
	tplInterview  *template.Template
	tplResult     *template.Template
	tplInitErr    error
	interviewPath = "utils/email_template_interview.html"
	resultPath    = "utils/email_template_interview_result.html"
)

func initTemplates() {
	tplInterview, tplInitErr = template.ParseFiles(interviewPath)
	if tplInitErr != nil {
		return
	}
	tplResult, tplInitErr = template.ParseFiles(resultPath)
}

/* =========================
   Email queue + worker
========================= */

type emailJob struct {
	to, subject, html string
}

var (
	mailQueue  = make(chan emailJob, 200)
	workerOnce sync.Once
)

// 🔴 Hardcode SMTP config
const (
	smtpHost = "smtp.gmail.com"
	smtpPort = 587
	smtpUser = "coopmatch4@gmail.com" // Gmail ของคุณ
	smtpPass = "gbjedwdbdchlzcyx"     // App Password 16 หลัก (ไม่มีช่องว่าง)
	fromName = "Co-op Match"          // ชื่อที่โชว์ในช่องผู้ส่ง
)

/* =========================
   Worker
========================= */

func validEmail(s string) bool {
	s = strings.TrimSpace(s)
	if s == "" {
		return false
	}
	_, err := mail.ParseAddress(s)
	return err == nil
}

func initEmailWorker() {
	// worker 2 ตัว
	for i := 1; i <= 2; i++ {
		go emailWorker(i)
	}
}

func emailWorker(id int) {
	var (
		dialer = gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPass)
		sc     gomail.SendCloser
		err    error
		alive  bool
	)

	// ✅ TLS config: ใส่ ServerName ให้ตรวจใบรับรองผ่าน
	dialer.TLSConfig = &tls.Config{
		ServerName: smtpHost,
		MinVersion: tls.VersionTLS12,
	}

	reconnect := func() {
		if alive {
			_ = sc.Close()
			alive = false
		}
		sc, err = dialer.Dial()
		if err != nil {
			log.Printf("[MAIL %d] dial fail: %v", id, err)
			time.Sleep(2 * time.Second)
			return
		}
		alive = true
	}

	for job := range mailQueue {
		to := strings.TrimSpace(job.to)
		if !validEmail(to) {
			log.Printf("[MAIL %d] skip invalid TO: %q", id, to)
			continue
		}

		if !alive {
			reconnect()
			if !alive {
				log.Printf("[MAIL %d] skip send to=%s (no connection)", id, to)
				continue
			}
		}

		msg := gomail.NewMessage()
		msg.SetAddressHeader("From", smtpUser, fromName)
		msg.SetHeader("To", to)
		msg.SetHeader("Subject", job.subject)
		msg.SetBody("text/html", job.html)

		if err := gomail.Send(sc, msg); err != nil {
			log.Printf("[MAIL %d] send error to=%s: %v", id, to, err)
			reconnect()
		} else {
			log.Printf("[MAIL %d] sent to=%s", id, to)
		}
	}
}

func enqueueEmail(to, subject, html string) {
	select {
	case mailQueue <- emailJob{to: to, subject: subject, html: html}:
	default:
		log.Printf("[MAIL] queue full; drop email to=%s", to)
	}
}

/* =========================
   Handler
========================= */

func SendInterviewEmail(c *gin.Context) {
	tplOnce.Do(initTemplates)
	workerOnce.Do(initEmailWorker)
	if tplInitErr != nil {
		c.JSON(500, gin.H{"error": "template init failed: " + tplInitErr.Error()})
		return
	}

	studentID := c.Param("student_id")
	companyID := c.Param("company_id")

	db := config.DB()

	var appointment entity.InterviewAppointment
	if err := db.
		Preload("Company.User").
		Preload("Student.User").
		Where("student_id = ? AND company_id = ?", studentID, companyID).
		First(&appointment).Error; err != nil {
		c.JSON(404, gin.H{"error": "ไม่พบนัดสัมภาษณ์"})
		return
	}

	var application entity.Application
	if err := db.
		Preload("IntershipPost").
		Joins("JOIN application_details ON application_details.application_id = applications.id").
		Joins("JOIN intership_posts ON applications.intership_post_id = intership_posts.id").
		Where("application_details.student_id = ? AND intership_posts.company_id = ?", studentID, companyID).
		First(&application).Error; err != nil {
		c.JSON(404, gin.H{"error": "ไม่พบการสมัคร"})
		return
	}

	positionName := strings.TrimSpace(application.IntershipPost.PostName)
	if positionName == "" {
		positionName = "ไม่ระบุตำแหน่ง"
	}

	logoBase64 := "data:image/png;base64," + getLogoBase64()

	body, err := buildEmailBody(appointment, logoBase64, application.Status, positionName)
	if err != nil {
		c.JSON(500, gin.H{"error": "สร้างอีเมลล้มเหลว: " + err.Error()})
		return
	}

	to := strings.TrimSpace(appointment.Student.User.Email)
	if !validEmail(to) {
		c.JSON(400, gin.H{"error": "อีเมลผู้รับไม่ถูกต้อง"})
		return
	}

	enqueueEmail(to, "แจ้งเตือนนัดสัมภาษณ์จากระบบ Co-op Match", body)

	loc, _ := time.LoadLocation("Asia/Bangkok")
	c.JSON(202, gin.H{
		"message": "คิวส่งอีเมลถูกสร้างแล้ว",
		"appointment": gin.H{
			"id":               appointment.ID,
			"appointment_date": appointment.AppointmentDate.In(loc).Format("2006-01-02 15:04"),
			"status":           application.Status,
			"mode":             appointment.Mode,
			"details":          appointment.Details,
			"position":         positionName,
		},
		"student": gin.H{
			"id":         appointment.Student.ID,
			"first_name": appointment.Student.FirstName,
			"last_name":  appointment.Student.LastName,
			"email":      to,
		},
		"company": gin.H{
			"id":           appointment.Company.ID,
			"company_name": appointment.Company.CompanyName,
			"email":        appointment.Company.User.Email,
		},
	})
}

/* =========================
   Email body
========================= */

func buildEmailBody(appointment entity.InterviewAppointment, logoBase64, status, position string) (string, error) {
	var tmpl *template.Template
	switch status {
	case "ผ่าน", "ไม่ผ่าน":
		tmpl = tplResult
	default:
		tmpl = tplInterview
	}
	if tmpl == nil {
		return "", fmt.Errorf("template not initialised")
	}

	loc, _ := time.LoadLocation("Asia/Bangkok")
	scheduleTime := appointment.AppointmentDate.In(loc)
	thaiMonths := [...]string{"", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
		"กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"}
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
		"Mode":           appointment.Mode,
		"Position":       position,
		"Schedule":       formattedDate,
		"ActionURL":      "https://coopmatch.example/interview/",
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
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

	// ใช้ worker ส่งเมลแบบ async (ครั้งเดียวพอ)
	workerOnce.Do(initEmailWorker)

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
	errCompany := db.
		Preload("User").
		Where("user_id = ?", userID).
		First(&company).Error

	// 3) ถ้าไม่เจอ Company -> หา AcademicStaff (พร้อม preload ที่ต้องใช้)
	var staff entity.AcademicStaff
	var errStaff error
	if errCompany != nil {
		errStaff = db.
			Preload("User").
			Preload("University").
			Preload("Faculty").
			Preload("Program").
			Where("user_id = ?", userID).
			First(&staff).Error
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
		tmplFile       string
		userIDForNoti  uint
	)

	if errCompany == nil {
		role = "company"
		recipientEmail = strings.TrimSpace(company.User.Email)
		recipientName = company.CompanyName
		entityName = company.CompanyName
		actionURL = "https://coopmatch.example/company/dashboard"
		tmplFile = "utils/email_template_Verify.html"
		userIDForNoti = company.User.ID
	} else {
		role = "academic_staff"
		recipientEmail = strings.TrimSpace(staff.User.Email)
		recipientName = strings.TrimSpace(staff.FirstName + " " + staff.LastName)

		switch {
		case strings.TrimSpace(staff.University.NameTH) != "":
			entityName = staff.University.NameTH
		case strings.TrimSpace(staff.Faculty.NameTH) != "":
			entityName = staff.Faculty.NameTH
		case strings.TrimSpace(staff.Program.NameTH) != "":
			entityName = staff.Program.NameTH
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

	// เตรียมข้อมูล template
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

		// ฝั่งอาจารย์ (template บริษัทจะไม่อ้างถึง)
		"University": staff.University.NameTH,
		"Faculty":    staff.Faculty.NameTH,
		"Department": staff.Program.NameTH, // map Program → Department
	}

	// โหลด + render template
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

	// ตรวจอีเมลผู้รับ
	if !validEmail(recipientEmail) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "อีเมลผู้รับไม่ถูกต้อง"})
		return
	}

	// ✅ ส่งแบบเร็ว: ดันเข้าคิว แล้วตอบกลับทันที
	enqueueEmail(recipientEmail, subject, body.String())

	// ส่ง Notification แบบ async เล็กน้อย
	go func() {
		title := map[string]string{
			"company":        "สถานะการยืนยันบริษัท: " + status,
			"academic_staff": "สถานะการยืนยันบัญชีอาจารย์: " + status,
		}[role]
		msg := "สถานะล่าสุดของคุณคือ \"" + status + "\" (" + entityName + ")"
		_ = CreateNotificationForUser(db, userIDForNoti, "verify", title, msg, "การยืนยันบัญชี")
	}()

	// ตอบไว (ไม่บล็อกรอ SMTP)
	c.JSON(http.StatusAccepted, gin.H{
		"message":  "คิวส่งอีเมลถูกสร้างแล้ว",
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
