package users

import (
	"crypto/rand"
	"crypto/tls"
	"encoding/hex"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"co-op-match.com/co-op-match/services"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/gomail.v2"
)

// ====== ค่าคงที่ความปลอดภัย/พฤติกรรมระบบ ======
const (
	otpTTL          = 10 * time.Minute // อายุ OTP
	otpCooldown     = 60 * time.Second // เวลารอก่อนขอรหัสซ้ำ
	otpMaxAttempts  = 5                // จำนวนครั้งที่กรอกผิดได้
	otpLockDuration = 10 * time.Minute // ล็อกกี่นาทีถ้ากรอกผิดเกิน limit

	ipRateWindow    = 1 * time.Minute // หน้าต่างเวลา rate limit ต่อ IP
	ipRateMaxPerWin = 5               // จำนวนครั้งสูงสุดต่อ window
)

// ====== โครงสร้างและตัวแปรสำหรับ OTP (thread-safe) ======
type OTPData struct {
	Code        string    `json:"code"`
	Email       string    `json:"email"`
	ExpiresAt   time.Time `json:"expires_at"`
	Attempts    int       `json:"attempts"`
	LockedUntil time.Time `json:"locked_until"`
	LastSent    time.Time `json:"last_sent"`
}

var (
	otpMu    sync.RWMutex
	otpStore = map[string]OTPData{}
)

// cleanup OTP ที่หมดอายุเป็นระยะ
func startOTPCleanup() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			now := time.Now()
			otpMu.Lock()
			for k, v := range otpStore {
				if now.After(v.ExpiresAt) && now.After(v.LockedUntil) {
					delete(otpStore, k)
				}
			}
			otpMu.Unlock()
		}
	}()
}

// init: เริ่ม cleanup อัตโนมัติเมื่อ import package
func init() {
	startOTPCleanup()
}

// ====== โครงสร้างสำหรับ rate-limit ต่อ IP (เบาๆ) ======
type bucket struct {
	last  time.Time
	count int
}

var (
	ipMu      sync.Mutex
	ipBuckets = map[string]*bucket{}
)

// อนุญาต/ปฏิเสธตาม rate ต่อ IP
func allowIP(ip string) bool {
	ipMu.Lock()
	defer ipMu.Unlock()

	now := time.Now()
	b, ok := ipBuckets[ip]
	if !ok || now.Sub(b.last) > ipRateWindow {
		ipBuckets[ip] = &bucket{last: now, count: 1}
		return true
	}
	if b.count >= ipRateMaxPerWin {
		return false
	}
	b.count++
	b.last = now
	return true
}

// ====== Request DTOs ======
type SendResetPasswordEmailRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordWithOTPRequest struct {
	Email       string `json:"email" binding:"required,email"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
	OTP         string `json:"otp" binding:"required,len=6"`
}

// Signup/Signin DTOs
type SignUpInput struct {
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
	RoleName        string `json:"role" binding:"required"`
}
type SignInInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// ====== Helper: Cookie params ตาม ENV ======
func cookieParamsForEnv() (domain string, secure bool, sameSite http.SameSite) {
	domain = strings.TrimSpace(os.Getenv("COOKIE_DOMAIN")) // เช่น ".coop-match.online" หรือว่างตอน dev
	env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	if env == "prod" {
		secure = true
		sameSite = http.SameSiteNoneMode // ข้ามโดเมนต้อง None + Secure
	} else {
		secure = false
		sameSite = http.SameSiteLaxMode // dev ส่วนใหญ่อยู่ origin เดียว
	}
	return
}

// ====== Auth พื้นฐาน ======
func SignUp(c *gin.Context) {
	var input SignUpInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	normalizedEmail := strings.ToLower(strings.TrimSpace(input.Email))

	db := config.DB()

	var role entity.Role
	if err := db.Where("role_name = ?", input.RoleName).First(&role).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	hashedPassword, _ := config.HashPassword(input.Password)
	user := entity.User{
		Email:      normalizedEmail,
		Password:   hashedPassword,
		RoleID:     role.ID,
		IsActive:   true,
		IsLoggedIn: false,
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "ลงทะเบียนเรียบร้อยแล้ว"})
}

func SignIn(c *gin.Context) {
	var input SignInInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))

	var user entity.User
	db := config.DB()
	if err := db.Preload("Role").Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ"})
		return
	}
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "บัญชีนี้ยังไม่ได้เปิดใช้งาน"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"})
		return
	}

	// ตั้งสถานะออนไลน์ + log
	db.Model(&user).Update("is_logged_in", true)
	loginLog := entity.LoginLog{
		//Device:  c.GetHeader("User-Agent"),
		LoginAt: time.Now(),
		UserID:  user.ID,
	}
	if err := db.Create(&loginLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลการเข้าสู่ระบบได้"})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-only"
	}
	jwtWrapper := services.JwtWrapper{
		SecretKey:       secret,
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}

	signedToken, err := jwtWrapper.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
		return
	}

	// ตั้งคุกกี้ให้ตรง env
	domain, secure, sameSite := cookieParamsForEnv()
	c.SetSameSite(sameSite)
	c.SetCookie("auth_token", signedToken, 3600*24, "/", domain, secure, true)

	c.JSON(http.StatusOK, gin.H{
		"message":    "เข้าสู่ระบบสำเร็จ",
		"token_type": "Bearer",
		"token":      signedToken, // เผื่อ FE ใช้แบบ header
		"role":       user.Role.RoleName,
		"roleId":     user.RoleID,
		"id":         user.ID,
	})
}

func Logout(c *gin.Context) {
	var request struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(request.Email))

	db := config.DB()
	var user entity.User
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบัญชีผู้ใช้"})
		return
	}

	db.Model(&user).Update("is_logged_in", false)

	var latestLog entity.LoginLog
	if err := db.Where("user_id = ?", user.ID).Order("login_at desc").First(&latestLog).Error; err == nil {
		now := time.Now()
		db.Model(&latestLog).Update("logout_at", &now)
	}

	// เคลียร์คุกกี้ฝั่งเบราว์เซอร์
	domain, secure, sameSite := cookieParamsForEnv()
	c.SetSameSite(sameSite)
	c.SetCookie("auth_token", "", -1, "/", domain, secure, true)

	c.JSON(http.StatusOK, gin.H{"message": "ออกจากระบบเรียบร้อยแล้ว"})
}

// ====== Forgot Password (OTP) ======

// ส่ง OTP (ตอบกลางๆ เพื่อกัน enumeration) + Cooldown + IP rate limit
func SendResetPasswordEmail(c *gin.Context) {
	// IP rate limit เบื้องต้น
	if !allowIP(c.ClientIP()) {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": true, "message": "ขอรีเซ็ตบ่อยเกินไป ลองใหม่ภายหลัง"})
		return
	}

	var req SendResetPasswordEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	db := config.DB()
	var user entity.User
	_ = db.Where("email = ?", email).First(&user).Error // อย่าบอกผู้ใช้ว่าไม่เจออีเมล

	// สร้าง OTP (สุ่ม 6 หลัก)
	otp, err := generateOTP(6)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "ไม่สามารถสร้างรหัสยืนยันได้"})
		return
	}

	now := time.Now()

	// ตรวจ cooldown ต่ออีเมล
	otpMu.Lock()
	if data, ok := otpStore[email]; ok {
		if now.Sub(data.LastSent) < otpCooldown {
			otpMu.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{"error": true, "message": "คุณเพิ่งขอรหัส กรุณารอสักครู่แล้วลองใหม่"})
			return
		}
	}
	// บันทึก/รีเฟรช OTP
	otpStore[email] = OTPData{
		Code:      otp,
		Email:     email,
		ExpiresAt: now.Add(otpTTL),
		Attempts:  0,
		LastSent:  now,
	}
	otpMu.Unlock()

	// ถ้าอีเมลมีจริง ค่อยยิง SMTP (ลดสแปม outgoing)
	if user.ID != 0 {
		if err := sendOTPEmail(email, otp); err != nil {
			// ไม่แสดงรายละเอียดกับ user
			fmt.Printf("[email] send OTP failed: %v\n", err)
		}
	}

	// ตอบกลางๆ เสมอ
	c.JSON(http.StatusOK, gin.H{
		"error":   false,
		"message": "ถ้ามีอีเมลในระบบ เราได้ส่งรหัสยืนยันแล้ว",
	})
}

// ยืนยัน OTP + ตั้งรหัสผ่านใหม่ (ป้องกัน brute force)
func ResetPasswordWithOTP(c *gin.Context) {
	var req ResetPasswordWithOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	otpMu.Lock()
	data, exists := otpStore[email]
	if !exists {
		otpMu.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "ไม่พบรหัสยืนยัน กรุณาขอรหัสใหม่"})
		return
	}

	now := time.Now()
	// หมดอายุ
	if now.After(data.ExpiresAt) {
		delete(otpStore, email)
		otpMu.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "รหัสยืนยันหมดอายุแล้ว กรุณาขอรหัสใหม่"})
		return
	}
	// ถูกล็อกจากพยายามมากเกินไป
	if now.Before(data.LockedUntil) {
		otpMu.Unlock()
		c.JSON(http.StatusTooManyRequests, gin.H{"error": true, "message": "พยายามมากเกินไป ลองใหม่ภายหลัง"})
		return
	}

	// ตรวจรหัส
	if data.Code != req.OTP {
		data.Attempts++
		if data.Attempts >= otpMaxAttempts {
			data.LockedUntil = now.Add(otpLockDuration)
		}
		otpStore[email] = data
		otpMu.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "รหัสยืนยันไม่ถูกต้อง"})
		return
	}

	// ถูกต้อง → ล้าง OTP ทันที
	delete(otpStore, email)
	otpMu.Unlock()

	// ตั้งรหัสผ่านใหม่
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "ไม่สามารถเข้ารหัสรหัสผ่านได้"})
		return
	}
	db := config.DB()
	if err := db.Model(&entity.User{}).Where("email = ?", email).Update("password", string(hashedPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "ไม่สามารถเปลี่ยนรหัสผ่านได้"})
		return
	}

	fmt.Printf("[audit] password reset via OTP for %s at %s\n", email, time.Now().Format(time.RFC3339))
	c.JSON(http.StatusOK, gin.H{"error": false, "message": "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว"})
}

// ====== Simple Reset (backward compatibility / debug) ======
func SimpleResetPassword(c *gin.Context) {
	var request struct {
		Email       string
		NewPassword string
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(request.Email))

	var user entity.User
	if err := config.DB().Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบัญชีนี้"})
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}
	user.Password = string(hashedPassword)
	if err := config.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "เปลี่ยนรหัสผ่านสำเร็จ"})
}

// ====== Helper Functions ======

// สร้าง OTP ตัวเลขล้วน
func generateOTP(length int) (string, error) {
	const charset = "0123456789"
	result := make([]byte, length)
	for i := range result {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		result[i] = charset[n.Int64()]
	}
	return string(result), nil
}

// อ่าน ENV (ถ้าไม่มีจะแจ้งเตือนทาง stdout)
func mustGetEnv(key string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		fmt.Printf("[warn] missing env %s\n", key)
	}
	return v
}

// ดึงอีเมลออกจากรูปแบบ "Name <email@domain>"
func extractEmail(s string) string {
	s = strings.TrimSpace(s)
	if i := strings.Index(s, "<"); i >= 0 {
		if j := strings.Index(s, ">"); j > i {
			return strings.TrimSpace(s[i+1 : j])
		}
	}
	return s
}

// ส่งอีเมล OTP (รองรับ 3 โหมด: 465 SMTPS, 587 STARTTLS, และ DEV_SMTP_INSECURE)
func sendOTPEmail(toEmail, otp string) error {
	// ==== อ่าน ENV ====
	host := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	portStr := strings.TrimSpace(os.Getenv("SMTP_PORT"))
	user := strings.TrimSpace(os.Getenv("SMTP_USERNAME"))
	pass := strings.TrimSpace(os.Getenv("SMTP_PASSWORD"))
	from := strings.TrimSpace(os.Getenv("FROM_EMAIL"))
	insecureDev := strings.EqualFold(strings.TrimSpace(os.Getenv("DEV_SMTP_INSECURE")), "true")

	// บังคับต้องมี host/port
	if host == "" || portStr == "" {
		return fmt.Errorf("missing SMTP_HOST/SMTP_PORT env")
	}
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return fmt.Errorf("invalid SMTP_PORT: %v", err)
	}
	if from == "" {
		from = fmt.Sprintf("\"CoopMatch\" <%s>", user)
	}

	// ==== เนื้อหาอีเมล ====
	subject := "CoopMatch | OTP สำหรับรีเซ็ตรหัสผ่าน"
	body := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="text-align: center; background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
				<h2 style="color: #333; margin-bottom: 20px;">รหัสยืนยันสำหรับรีเซ็ตรหัสผ่าน</h2>
				<p style="color: #666; font-size: 16px;">กรุณาใช้รหัสยืนยันด้านล่างนี้:</p>
				<div style="background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">%s</h1>
				</div>
				<p style="color: #dc3545; font-weight: bold;">⏰ รหัสนี้จะหมดอายุใน 10 นาที</p>
				<p style="color: #666; font-size: 14px; margin-top: 20px;">หากคุณไม่ได้ทำการขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
			</div>
		</div>
	`, otp)

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	// ==== ตั้งค่า Dialer ====
	d := gomail.NewDialer(host, port, user, pass)

	// โหมด DEV (MailHog) — ไม่มี TLS/ไม่มี Auth
	if insecureDev {
		d.Username = ""
		d.Password = ""
		d.SSL = false
		d.TLSConfig = &tls.Config{InsecureSkipVerify: true} // สำหรับ dev เท่านั้น
		return d.DialAndSend(m)
	}

	// ถ้าเป็น SMTPS (465) ใช้ SSL
	if port == 465 {
		d.SSL = true
	}

	// ตั้ง TLS ให้ปลอดภัย (prod)
	d.TLSConfig = &tls.Config{
		ServerName: host,
		MinVersion: tls.VersionTLS12,
	}

	return d.DialAndSend(m)
}

// ===== (ออปชัน) Reset link flow: โทเค็นลิงก์ยาว =====

type PasswordResetToken struct {
	UserID    uint
	Token     string
	ExpiresAt time.Time
	UsedAt    *time.Time
	RequestIP string
	UserAgent string
}

func generateResetToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

/*
ENV ที่เกี่ยวข้อง:
- APP_ENV=dev|prod
- COOKIE_DOMAIN=           # ว่างตอน dev / ".coop-match.online" ใน prod
- JWT_SECRET=สุ่มยาวๆ
- SMTP_HOST=...
- SMTP_PORT=...
- SMTP_USERNAME=...
- SMTP_PASSWORD=...
- FROM_EMAIL=...
- DEV_SMTP_INSECURE=true   # ใช้กับ MailHog dev เท่านั้น
*/

/*package users

// แทนที่ import block เดิมด้วยอันนี้
import (
	"crypto/rand"
	"crypto/tls"
	"encoding/hex"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"co-op-match.com/co-op-match/services"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/gomail.v2"
)

// ====== ค่าคงที่ความปลอดภัย/พฤติกรรมระบบ ======
const (
	otpTTL          = 10 * time.Minute // อายุ OTP
	otpCooldown     = 60 * time.Second // เวลารอก่อนขอรหัสซ้ำ
	otpMaxAttempts  = 5                // จำนวนครั้งที่กรอกผิดได้
	otpLockDuration = 10 * time.Minute // ล็อกกี่นาทีถ้ากรอกผิดเกิน limit

	ipRateWindow    = 1 * time.Minute // หน้าต่างเวลา rate limit ต่อ IP
	ipRateMaxPerWin = 5               // จำนวนครั้งสูงสุดต่อ window
)

// ====== โครงสร้างและตัวแปรสำหรับ OTP (thread-safe) ======
type OTPData struct {
	Code        string    `json:"code"`
	Email       string    `json:"email"`
	ExpiresAt   time.Time `json:"expires_at"`
	Attempts    int       `json:"attempts"`
	LockedUntil time.Time `json:"locked_until"`
	LastSent    time.Time `json:"last_sent"`
}

var (
	otpMu    sync.RWMutex
	otpStore = map[string]OTPData{}
)

// cleanup OTP ที่หมดอายุเป็นระยะ
func startOTPCleanup() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			now := time.Now()
			otpMu.Lock()
			for k, v := range otpStore {
				if now.After(v.ExpiresAt) && now.After(v.LockedUntil) {
					delete(otpStore, k)
				}
			}
			otpMu.Unlock()
		}
	}()
}

// init: เริ่ม cleanup อัตโนมัติเมื่อ import package
func init() {
	startOTPCleanup()
}

// ====== โครงสร้างสำหรับ rate-limit ต่อ IP (เบาๆ) ======
type bucket struct {
	last  time.Time
	count int
}

var (
	ipMu      sync.Mutex
	ipBuckets = map[string]*bucket{}
)

// อนุญาต/ปฏิเสธตาม rate ต่อ IP
func allowIP(ip string) bool {
	ipMu.Lock()
	defer ipMu.Unlock()

	now := time.Now()
	b, ok := ipBuckets[ip]
	if !ok || now.Sub(b.last) > ipRateWindow {
		ipBuckets[ip] = &bucket{last: now, count: 1}
		return true
	}
	if b.count >= ipRateMaxPerWin {
		return false
	}
	b.count++
	b.last = now
	return true
}

// ====== Request DTOs ======
type SendResetPasswordEmailRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordWithOTPRequest struct {
	Email       string `json:"email" binding:"required,email"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
	OTP         string `json:"otp" binding:"required,len=6"`
}

// Signup/Signin DTOs (ของเดิม)
type SignUpInput struct {
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
	RoleName        string `json:"role" binding:"required"`
}
type SignInInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// ====== Auth พื้นฐาน (ของเดิม) ======
func SignUp(c *gin.Context) {
	var input SignUpInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB()

	var role entity.Role
	if err := db.Where("role_name = ?", input.RoleName).First(&role).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	hashedPassword, _ := config.HashPassword(input.Password)
	user := entity.User{
		Email:      input.Email,
		Password:   hashedPassword,
		RoleID:     role.ID,
		IsActive:   true,
		IsLoggedIn: false,
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Signup successful"})
}

func SignIn(c *gin.Context) {
	var input SignInInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	db := config.DB()
	if err := db.Preload("Role").Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ"})
		return
	}
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "บัญชีนี้ยังไม่ได้เปิดใช้งาน"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"})
		return
	}

	// ตั้งสถานะออนไลน์ + log
	db.Model(&user).Update("is_logged_in", true)
	loginLog := entity.LoginLog{
		IP:      c.ClientIP(),
		Device:  c.GetHeader("User-Agent"),
		LoginAt: time.Now(),
		UserID:  user.ID,
	}
	if err := db.Create(&loginLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลการเข้าสู่ระบบได้"})
		return
	}

	jwtWrapper := services.JwtWrapper{
		SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}
	//signedToken, err := jwtWrapper.GenerateToken(user.Email)
	signedToken, err := jwtWrapper.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
		return
	}

	c.SetCookie("auth_token", signedToken, 3600*24, "/", "localhost", false, true)
	c.JSON(http.StatusOK, gin.H{
		"message":    "Login successful",
		"token_type": "Bearer",
		"token":      signedToken,
		"role":       user.Role.RoleName,
		"roleId":     user.RoleID,
		"id":         user.ID,
	})
}

func Logout(c *gin.Context) {
	var request struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	db := config.DB()
	var user entity.User
	if err := db.Where("email = ?", request.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบัญชีผู้ใช้"})
		return
	}

	db.Model(&user).Update("is_logged_in", false)

	var latestLog entity.LoginLog
	if err := db.Where("user_id = ?", user.ID).Order("login_at desc").First(&latestLog).Error; err == nil {
		now := time.Now()
		db.Model(&latestLog).Update("logout_at", &now)
		c.JSON(http.StatusOK, gin.H{"success": "ผ่านนนน"})
	}
	c.JSON(http.StatusOK, gin.H{"message": "ออกจากระบบเรียบร้อยแล้ว"})
}

// ====== Forgot Password (OTP) ======

// ส่ง OTP (ตอบกลางๆ เพื่อกัน enumeration) + Cooldown + IP rate limit
func SendResetPasswordEmail(c *gin.Context) {
	// IP rate limit เบื้องต้น
	if !allowIP(c.ClientIP()) {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": true, "message": "ขอรีเซ็ตบ่อยเกินไป ลองใหม่ภายหลัง"})
		return
	}

	var req SendResetPasswordEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": err.Error()})
		return
	}

	db := config.DB()
	var user entity.User
	_ = db.Where("email = ?", req.Email).First(&user).Error // อย่าบอกผู้ใช้ว่าไม่เจออีเมล

	// สร้าง OTP (สุ่ม 6 หลัก)
	otp, err := generateOTP(6)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "ไม่สามารถสร้างรหัสยืนยันได้"})
		return
	}

	now := time.Now()

	// ตรวจ cooldown ต่ออีเมล
	otpMu.Lock()
	if data, ok := otpStore[req.Email]; ok {
		if now.Sub(data.LastSent) < otpCooldown {
			otpMu.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{"error": true, "message": "คุณเพิ่งขอรหัส กรุณารอสักครู่แล้วลองใหม่"})
			return
		}
	}
	// บันทึก/รีเฟรช OTP
	otpStore[req.Email] = OTPData{
		Code:      otp,
		Email:     req.Email,
		ExpiresAt: now.Add(otpTTL),
		Attempts:  0,
		LastSent:  now,
	}
	otpMu.Unlock()

	// ถ้าอีเมลมีจริง ค่อยยิง SMTP (ลดสแปม outgoing)
	if user.ID != 0 {
		if err := sendOTPEmail(req.Email, otp); err != nil {
			// ไม่แสดงรายละเอียดกับ user
			fmt.Printf("[email] send OTP failed: %v\n", err)
		}
	}

	// ตอบกลางๆ เสมอ
	c.JSON(http.StatusOK, gin.H{
		"error":   false,
		"message": "ถ้ามีอีเมลในระบบ เราได้ส่งรหัสยืนยันแล้ว",
	})
}

// ยืนยัน OTP + ตั้งรหัสผ่านใหม่ (ป้องกัน brute force)
func ResetPasswordWithOTP(c *gin.Context) {
	var req ResetPasswordWithOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": err.Error()})
		return
	}

	otpMu.Lock()
	data, exists := otpStore[req.Email]
	if !exists {
		otpMu.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "ไม่พบรหัสยืนยัน กรุณาขอรหัสใหม่"})
		return
	}

	now := time.Now()
	// หมดอายุ
	if now.After(data.ExpiresAt) {
		delete(otpStore, req.Email)
		otpMu.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "รหัสยืนยันหมดอายุแล้ว กรุณาขอรหัสใหม่"})
		return
	}
	// ถูกล็อกจากพยายามมากเกินไป
	if now.Before(data.LockedUntil) {
		otpMu.Unlock()
		c.JSON(http.StatusTooManyRequests, gin.H{"error": true, "message": "พยายามมากเกินไป ลองใหม่ภายหลัง"})
		return
	}

	// ตรวจรหัส
	if data.Code != req.OTP {
		data.Attempts++
		if data.Attempts >= otpMaxAttempts {
			data.LockedUntil = now.Add(otpLockDuration)
		}
		otpStore[req.Email] = data
		otpMu.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "รหัสยืนยันไม่ถูกต้อง"})
		return
	}

	// ถูกต้อง → ล้าง OTP ทันที
	delete(otpStore, req.Email)
	otpMu.Unlock()

	// ตั้งรหัสผ่านใหม่
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "ไม่สามารถเข้ารหัสรหัสผ่านได้"})
		return
	}
	db := config.DB()
	if err := db.Model(&entity.User{}).Where("email = ?", req.Email).Update("password", string(hashedPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "ไม่สามารถเปลี่ยนรหัสผ่านได้"})
		return
	}

	fmt.Printf("[audit] password reset via OTP for %s at %s\n", req.Email, time.Now().Format(time.RFC3339))
	c.JSON(http.StatusOK, gin.H{"error": false, "message": "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว"})
}

// ====== Simple Reset (backward compatibility / debug) ======
func SimpleResetPassword(c *gin.Context) {
	var request struct {
		Email       string
		NewPassword string
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	var user entity.User
	if err := config.DB().Where("email = ?", request.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบัญชีนี้"})
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}
	user.Password = string(hashedPassword)
	if err := config.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "เปลี่ยนรหัสผ่านสำเร็จ"})
}

// ====== Helper Functions ======

// สร้าง OTP ตัวเลขล้วน
func generateOTP(length int) (string, error) {
	const charset = "0123456789"
	result := make([]byte, length)
	for i := range result {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		result[i] = charset[n.Int64()]
	}
	return string(result), nil
}

// อ่าน ENV (ถ้าไม่มีจะแจ้งเตือนทาง stdout)
func mustGetEnv(key string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		fmt.Printf("[warn] missing env %s\n", key)
	}
	return v
}

// ดึงอีเมลออกจากรูปแบบ "Name <email@domain>"
func extractEmail(s string) string {
	s = strings.TrimSpace(s)
	if i := strings.Index(s, "<"); i >= 0 {
		if j := strings.Index(s, ">"); j > i {
			return strings.TrimSpace(s[i+1 : j])
		}
	}
	return s
}

// ส่งอีเมล OTP (รองรับ 3 โหมด: 465 SMTPS, 587 STARTTLS, และ DEV_INSECURE (ไม่มี TLS/AUTH))
// ส่งอีเมล OTP ด้วย gomail (รองรับ MailHog/Mailtrap/Gmail)
// - DEV_SMTP_INSECURE=true  => ไม่มี TLS/ไม่มี Auth (เหมาะกับ MailHog: localhost:1025)
// - port 465 (SMTPS)        => ใช้ SSL ตรง ๆ
// - port อื่น ๆ (587/2525)  => ใช้ StartTLS ตาม policy ของเซิร์ฟเวอร์
func sendOTPEmail(toEmail, otp string) error {
	// ==== อ่าน ENV ====
	host := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	portStr := strings.TrimSpace(os.Getenv("SMTP_PORT"))
	user := strings.TrimSpace(os.Getenv("SMTP_USERNAME"))
	pass := strings.TrimSpace(os.Getenv("SMTP_PASSWORD"))
	from := strings.TrimSpace(os.Getenv("FROM_EMAIL"))
	insecureDev := strings.EqualFold(strings.TrimSpace(os.Getenv("DEV_SMTP_INSECURE")), "true")

	// บังคับต้องมี host/port (จะได้ไม่ fallback ไป Gmail)
	if host == "" || portStr == "" {
		return fmt.Errorf("missing SMTP_HOST/SMTP_PORT env")
	}
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return fmt.Errorf("invalid SMTP_PORT: %v", err)
	}
	if from == "" {
		from = fmt.Sprintf("\"CoopMatch\" <%s>", user)
	}

	// ==== เนื้อหาอีเมล ====
	subject := "CoopMatch | OTP สำหรับรีเซ็ตรหัสผ่าน"
	body := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="text-align: center; background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
				<h2 style="color: #333; margin-bottom: 20px;">รหัสยืนยันสำหรับรีเซ็ตรหัสผ่าน</h2>
				<p style="color: #666; font-size: 16px;">กรุณาใช้รหัสยืนยันด้านล่างนี้:</p>
				<div style="background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<h1 style="color: #007bff; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">%s</h1>
				</div>
				<p style="color: #dc3545; font-weight: bold;">⏰ รหัสนี้จะหมดอายุใน 10 นาที</p>
				<p style="color: #666; font-size: 14px; margin-top: 20px;">หากคุณไม่ได้ทำการขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
			</div>
		</div>
	`, otp)

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	// ==== ตั้งค่า Dialer ====
	d := gomail.NewDialer(host, port, user, pass)

	// โหมด DEV (MailHog) — ไม่มี TLS/ไม่มี Auth
	if insecureDev {
		d.Username = ""
		d.Password = ""
		d.SSL = false
		d.TLSConfig = &tls.Config{InsecureSkipVerify: true} // สำหรับ dev เท่านั้น
		return d.DialAndSend(m)
	}

	// ถ้าเป็น SMTPS (465) ใช้ SSL
	if port == 465 {
		d.SSL = true
	}

	// ตั้ง TLS ให้ปลอดภัย (prod)
	d.TLSConfig = &tls.Config{
		ServerName: host,
		MinVersion: tls.VersionTLS12,
	}

	return d.DialAndSend(m)
}

// ===== (ออปชัน) Reset link flow: โทเค็นลิงก์ยาว =====
// ถ้ายังไม่ใช้ สามารถลบทิ้งได้ แต่เผื่อคุณอยากเปิดใช้งานภายหลัง

type PasswordResetToken struct {
	// ไม่ได้ผูก GORM ที่นี่เพื่อให้ไฟล์ self-contained
	// ถ้าจะใช้จริง: ย้าย struct ไปที่ entity แล้ว AutoMigrate
	UserID    uint
	Token     string
	ExpiresAt time.Time
	UsedAt    *time.Time
	RequestIP string
	UserAgent string
}

// ตัวอย่างสร้างโทเค็น (ไม่ได้บันทึก DB ในไฟล์นี้)
func generateResetToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}
*/
/*package users

import (
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"co-op-match.com/co-op-match/services"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Signup input
type SignUpInput struct {
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
	RoleName        string `json:"role" binding:"required"`
}

// Signin input
type SignInInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func SignUp(c *gin.Context) {
	var input SignUpInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB()

	var role entity.Role
	if err := db.Where("role_name = ?", input.RoleName).First(&role).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	hashedPassword, _ := config.HashPassword(input.Password)
	user := entity.User{
		Email:      input.Email,
		Password:   hashedPassword,
		RoleID:     role.ID,
		IsActive:   true,  // เปิดบัญชีทันที
		IsLoggedIn: false, // ยังไม่ได้ล็อกอิน
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ดึง StatusVerify ID ของ "ยังไม่ได้ส่งคำขอ"
	var status entity.StatusVerify
	if err := db.Where("status_verify = ?", "ยังไม่ได้ส่งคำขอ").First(&status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Default verify status not found"})
		return
	}

	// สร้าง Verify record ผูกกับ user
	verify := entity.Verify{
		StatusVerifyID: status.ID,
		UserID:         user.ID,
		VerificationDocument: "", // ตอนสมัครยังไม่มีเอกสาร
		Reason:               "",
		VerifiedAt:           nil,
		AdminID:              nil,
	}
	if err := db.Create(&verify).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create verification record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Signup successful"})
}

func SignIn(c *gin.Context) {
	var input SignInInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	db := config.DB()
	if err := db.Preload("Role").Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "บัญชีนี้ยังไม่ได้เปิดใช้งาน"})
		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"})
		return
	}

	// ตั้งสถานะออนไลน์
	db.Model(&user).Update("is_logged_in", true)

	loginLog := entity.LoginLog{
		IP:      c.ClientIP(),              // ได้ IP ของ client
		Device:  c.GetHeader("User-Agent"), // ได้ user-agent (browser/device info)
		LoginAt: time.Now(),
		UserID:  user.ID,
	}

	if err := db.Create(&loginLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลการเข้าสู่ระบบได้"})
		return
	}

	jwtWrapper := services.JwtWrapper{
		SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}
	signedToken, err := jwtWrapper.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
		return
	}
	c.SetCookie("auth_token", signedToken, 3600*24, "/", "localhost", false, true)
	c.JSON(http.StatusOK, gin.H{
		"message":    "Login successful",
		"token_type": "Bearer",
		"token":      signedToken,
		"role":       user.Role.RoleName,
		"roleId":     user.RoleID,
		"id":         user.ID,
	})
}

func Logout(c *gin.Context) {
	var request struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	db := config.DB()
	var user entity.User
	if err := db.Where("email = ?", request.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบัญชีผู้ใช้"})
		return
	}

	// ตั้งสถานะออนไลน์เป็น false
	db.Model(&user).Update("is_logged_in", false)

	// 🟢 อัปเดต LogoutAt ใน LoginLog ล่าสุด
	var latestLog entity.LoginLog
	if err := db.
		Where("user_id = ?", user.ID).
		Order("login_at desc").
		First(&latestLog).Error; err == nil {

		now := time.Now()
		db.Model(&latestLog).Update("logout_at", &now)
		c.JSON(http.StatusOK, gin.H{"success": "ผ่านนนน"})
	}

	c.JSON(http.StatusOK, gin.H{"message": "ออกจากระบบเรียบร้อยแล้ว"})
}

func SimpleResetPassword(c *gin.Context) {
	var request struct {
		Email       string
		NewPassword string
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	var user entity.User
	if err := config.DB().Where("email = ?", request.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบัญชีนี้"})
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}
	user.Password = string(hashedPassword)
	if err := config.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "เปลี่ยนรหัสผ่านสำเร็จ"})

}
*/
