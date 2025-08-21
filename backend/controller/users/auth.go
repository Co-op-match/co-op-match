package users

import (
	"net/http"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"co-op-match.com/co-op-match/services"
	"co-op-match.com/co-op-match/util"
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

	// สร้าง session id
	sid, err := util.NewSessionID(16)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create session id"})
		return
	}

	// สร้าง LoginEvent (success)
	ev := entity.LoginEvent{
		UserID:    user.ID,
		IsSuccess: true,
		IP:        c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
		LoggedAt:  time.Now(),
		SessionID: sid,
	}
	if err := db.Create(&ev).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกเหตุการณ์ล็อกอินได้"})
		return
	}

	jwtWrapper := services.JwtWrapper{
		SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}
	signedToken, err := jwtWrapper.GenerateToken(user.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
		return
	}

	c.SetCookie("auth_token", signedToken, 3600*24, "/", "localhost", false, true)
	c.SetCookie("session_id", sid, 3600*24, "/", "localhost", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message":    "Login successful",
		"token_type": "Bearer",
		"token":      signedToken,
		"role":       user.Role.RoleName,
		"roleId":     user.RoleID,
		"id":         user.ID,
		"session_id": sid,
	})
}

func Logout(c *gin.Context) {
	var request struct {
		Email string `json:"email" binding:"required,email"`
		SessionID string `json:"session_id"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		// ลองอ่านจาก cookie หาก body ว่าง
		request.Email = c.PostForm("email")
		request.SessionID, _ = c.Cookie("session_id")
		return
	}

	if request.Email == "" {
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
	
	// หา session_id จาก cookie ถ้า body ไม่มี
	if request.SessionID == "" {
		if sid, err := c.Cookie("session_id"); err == nil {
			request.SessionID = sid
		}
	}

	// อัปเดต LogoutAt ของ event ล่าสุดที่ยังไม่ปิด
	var ev entity.LoginEvent
	tx := db.Where("user_id = ? AND logout_at IS NULL", user.ID)
	if request.SessionID != "" {
		tx = tx.Where("session_id = ?", request.SessionID)
	}
	if err := tx.Order("logged_at desc").First(&ev).Error; err == nil {
		now := time.Now()
		db.Model(&ev).Update("logout_at", &now)
	}

	// ล้าง cookie (ถ้าต้องการ)
	c.SetCookie("auth_token", "", -1, "/", "localhost", false, true)
	c.SetCookie("session_id", "", -1, "/", "localhost", false, true)

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
